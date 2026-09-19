/**
 * A minimal MCP client over streamable HTTP — enough to talk to a Sanity Context
 * endpoint and nothing more.
 *
 * Sanity answers some calls as plain JSON and others as an SSE frame, so every
 * response goes through the same tolerant parse.
 */

export interface ToolDescriptor {
  name: string
  description?: string
  inputSchema?: unknown
}

interface RpcResponse {
  result?: unknown
  error?: {code: number; message: string}
}

const PROTOCOL_VERSION = '2025-06-18'

export class McpClient {
  readonly url: string
  private readonly token: string
  private session: string | null = null
  private nextId = 0
  private ready: Promise<void> | null = null

  constructor(endpoint: string, token: string) {
    this.url = endpoint
    this.token = token
  }

  /** Lazily initialises, so callers never have to remember the handshake. */
  private connect(): Promise<void> {
    this.ready ??= this.rpc('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {name: 'clausewatch-agent', version: '0.1.0'},
    }).then(() => undefined)
    return this.ready
  }

  private async rpc(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${this.token}`,
    }
    if (this.session) headers['mcp-session-id'] = this.session

    const response = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({jsonrpc: '2.0', id: ++this.nextId, method, params}),
    })

    const sessionId = response.headers.get('mcp-session-id')
    if (sessionId) this.session = sessionId

    const raw = await response.text()
    const payload = parse(raw)
    if (!payload) {
      throw new Error(`${this.label} ${method}: HTTP ${response.status} — ${raw.slice(0, 200)}`)
    }
    if (payload.error) {
      throw new Error(`${this.label} ${method}: ${payload.error.message} (${payload.error.code})`)
    }
    return payload.result
  }

  private get label(): string {
    return this.url.split('/').pop() ?? 'mcp'
  }

  async tools(): Promise<ToolDescriptor[]> {
    await this.connect()
    const result = (await this.rpc('tools/list')) as {tools?: ToolDescriptor[]}
    return result.tools ?? []
  }

  /** Calls a tool and flattens the content blocks into one string. */
  async call(name: string, args: Record<string, unknown> = {}): Promise<string> {
    await this.connect()
    const result = (await this.rpc('tools/call', {name, arguments: args})) as {
      content?: Array<{type: string; text?: string}>
    }
    return (result.content ?? [])
      .map((block) => block.text ?? '')
      .join('\n')
      .trim()
  }
}

function parse(raw: string): RpcResponse | null {
  try {
    return JSON.parse(raw) as RpcResponse
  } catch {
    // SSE: the payload rides in the last `data:` line of the frame.
    const frames = [...raw.matchAll(/^data: (.+)$/gm)]
    const last = frames.at(-1)?.[1]
    if (!last) return null
    try {
      return JSON.parse(last) as RpcResponse
    } catch {
      return null
    }
  }
}
