import Anthropic from '@anthropic-ai/sdk'

import {McpClient, type ToolDescriptor} from './mcp.js'
import type {Config} from './config.js'

/**
 * The LLM path: a tool-use loop where every tool is a real Context MCP tool.
 *
 * Nothing is pre-fetched for the model. It gets the endpoints and has to go and
 * look — which is the point of the exercise, and the only way the transcript is
 * worth reading afterwards.
 */

const SYSTEM = `You answer questions about AI-regulation obligations using two Sanity Context
endpoints, and only those.

- The DATASET tools (initial_context, groq_query, schema_explorer) hold the structured model:
  requirements, the claims each instrument makes about them, conflicts with their recorded
  decisions, and system profiles. Call initial_context there first to get the schema.
- The KNOWLEDGE BASE tools (kb_initial_context, kb_read) hold the prose of the instruments.
  Use them to quote what a clause actually says.

Hard rules:

1. Never state an obligation, a period or a deadline without the citation it came from.
   If you cannot cite it, say you cannot.
2. When claims disagree, show every side with its citation. Never pick one silently, never
   average two numbers, never present a range as if a text had stated it.
3. A conflict with resolution "open" is undecided: say so, and say who would have to decide.
   A resolved one carries a rationale and a decidedBy — quote the rationale and name the person.
4. Silence is an answer. A clause that imposes a duty but sets no period says exactly that.
5. Obligations depend on the system profile. If it is unknown, ask rather than assume.
6. State the effective date every time. An obligation starting in 2027 is not current.
7. The knowledge base is built from authoritative reproductions, not official journals. For
   anything actionable, give the officialUrl from the dataset.
8. Never fill a gap from your own legal knowledge. If it is not in these two sources, say so.

Today is ${new Date().toISOString().slice(0, 10)}.`

/** KB tools are prefixed so the model can tell the two endpoints apart. */
const KB_PREFIX = 'kb_'

export interface AgentResult {
  answer: string
  toolCalls: Array<{tool: string; input: unknown}>
}

export async function ask(config: Config, question: string, onStep?: (note: string) => void): Promise<AgentResult> {
  if (!config.anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Use --no-llm for the deterministic report instead.')
  }

  const data = new McpClient(config.dataEndpoint, config.contextToken)
  const docs = new McpClient(config.docsEndpoint, config.contextToken)

  const [dataTools, docsTools] = await Promise.all([data.tools(), docs.tools()])
  const tools = [
    ...dataTools.map((tool) => toAnthropicTool(tool, '')),
    ...docsTools.map((tool) => toAnthropicTool(tool, KB_PREFIX)),
  ]

  const client = new Anthropic({apiKey: config.anthropicKey})
  const messages: Anthropic.MessageParam[] = [{role: 'user', content: question}]
  const toolCalls: AgentResult['toolCalls'] = []

  // Generous but bounded: a real question takes three or four calls, and a loop
  // that wants twelve has usually lost the thread.
  for (let turn = 0; turn < 12; turn++) {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: 4096,
      system: SYSTEM,
      tools,
      messages,
    })

    const toolUses = response.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')

    if (toolUses.length === 0) {
      const answer = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim()
      return {answer, toolCalls}
    }

    messages.push({role: 'assistant', content: response.content})

    const results: Anthropic.ToolResultBlockParam[] = []
    for (const use of toolUses) {
      const isKb = use.name.startsWith(KB_PREFIX)
      const realName = isKb ? use.name.slice(KB_PREFIX.length) : use.name
      const target = isKb ? docs : data

      onStep?.(`${isKb ? 'docs' : 'data'} · ${realName}`)
      toolCalls.push({tool: use.name, input: use.input})

      try {
        const output = await target.call(realName, use.input as Record<string, unknown>)
        results.push({type: 'tool_result', tool_use_id: use.id, content: output || '(empty)'})
      } catch (error) {
        // Hand the failure back rather than throwing: a bad GROQ query is something
        // the model can see and fix, and watching it do so is half the transcript.
        results.push({
          type: 'tool_result',
          tool_use_id: use.id,
          content: error instanceof Error ? error.message : String(error),
          is_error: true,
        })
      }
    }

    messages.push({role: 'user', content: results})
  }

  throw new Error('The agent used twelve turns without producing an answer.')
}

function toAnthropicTool(tool: ToolDescriptor, prefix: string): Anthropic.Tool {
  return {
    name: prefix + tool.name,
    description: tool.description ?? '',
    input_schema: (tool.inputSchema as Anthropic.Tool['input_schema']) ?? {type: 'object', properties: {}},
  }
}
