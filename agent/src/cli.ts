import {writeFile} from 'node:fs/promises'

import {readConfig} from './config.js'
import {ContextClient} from './context.js'
import {renderReport} from './report.js'
import {ask} from './agent.js'
import {describeMoves} from './gate.js'

/**
 * clausewatch — ask what a system actually has to do, and where the sources disagree.
 *
 *   npm run ask -- --profile biometric-access
 *   npm run ask -- --profile biometric-access --no-llm
 *   npm run ask -- "how long must I keep logs for a high-risk biometric system in the EU?"
 *   npm run ask -- --profiles
 *   npm run ask -- --check
 */

const HELP = `clausewatch

  --profile <slug>    compile the obligations for one system profile
  --topic <topic>     narrow to one topic (logging, classification, risk, oversight, …)
  --no-llm            deterministic report straight from the dataset, no API key needed
  --profiles          list the system profiles in the dataset
  --check             verify both MCP endpoints answer
  --workflow          the decision process, and what each actor may do next
  --as <agent|human>  which actor to show the workflow for (default: agent)
  --out <file>        save the run, with its tool calls, as markdown
  "<question>"        free-form question, answered by the agent over both endpoints
`

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.length === 0) {
    process.stdout.write(HELP)
    return
  }

  const config = readConfig()
  // Flags that take a value, so their value is not mistaken for part of the question.
  const valued = new Set(['profile', 'topic', 'out', 'as'])

  const flag = (name: string): string | undefined => {
    const index = argv.indexOf(`--${name}`)
    return index >= 0 ? argv[index + 1] : undefined
  }
  const has = (name: string): boolean => argv.includes(`--${name}`)

  const words = argv.filter((arg, index) => {
    if (arg.startsWith('--')) return false
    const previous = argv[index - 1]
    return !(previous?.startsWith('--') && valued.has(previous.slice(2)))
  })

  const context = new ContextClient(config)

  if (has('check')) {
    if (context.access === 'public') {
      const profiles = await context.profiles()
      process.stdout.write(
        'access: public dataset — no SANITY_CONTEXT_TOKEN set\n' +
          `  dataset reads: yes, ${profiles.length} system profiles\n` +
          '  knowledge base: no — it is served only through Sanity Context\n' +
          '  agent: no — use --no-llm, which needs no credentials\n',
      )
      return
    }
    const {data, docs} = await context.toolNames()
    process.stdout.write(
      `access: Sanity Context MCP\n  data endpoint: ${data.join(', ')}\n  docs endpoint: ${docs.join(', ')}\n`,
    )
    return
  }

  if (has('profiles')) {
    const profiles = await context.profiles()
    for (const profile of profiles) {
      process.stdout.write(
        `${profile.slug}\n  ${profile.name}\n  ${profile.roles.join(', ')} · ${profile.riskClass} · ${profile.jurisdictions.join(', ')}\n`,
      )
    }
    return
  }

  if (has('workflow')) {
    const [workflow, progress] = await Promise.all([context.workflow(), context.progress()])
    if (!workflow) throw new Error('No workflow document governs conflicts in this dataset.')

    const actor = flag('as') === 'human' ? 'human' : 'agent'
    const states = workflow.states.map((s) => `  ${s.key.padEnd(11)} ${s.title}`).join('\n')
    const bodies = progress.map((conflict) => describeMoves(workflow, conflict, actor))

    process.stdout.write([`${workflow.name} — as the ${actor}`, states, ...bodies].join('\n\n') + '\n')
    return
  }

  const profileSlug = flag('profile')

  if (profileSlug && (has('no-llm') || !config.anthropicKey)) {
    const profile = await context.profile(profileSlug)
    if (!profile) throw new Error(`No profile "${profileSlug}". Run --profiles to see them.`)

    if (!config.anthropicKey && !has('no-llm')) {
      process.stderr.write('ANTHROPIC_API_KEY not set — falling back to the deterministic report.\n\n')
    }

    const requirements = await context.obligations(profile.jurisdictions, profile.roles, flag('topic') ?? '*')
    process.stdout.write(renderReport(profile, requirements) + '\n')
    return
  }

  const question = profileSlug
    ? `What must the system profile "${profileSlug}" actually do? Look it up, then walk through every applicable obligation, its citations, its dates, and any conflict between sources.`
    : words.join(' ')

  if (!question) throw new Error('Nothing to ask. Pass a question, or --profile <slug>.')

  const result = await ask(config, question, (note) => process.stderr.write(`  → ${note}\n`))
  process.stdout.write('\n' + result.answer + '\n')
  process.stderr.write(`\n(${result.toolCalls.length} tool calls)\n`)

  const out = flag('out')
  if (out) {
    // A run is worth keeping only with its tool calls attached: the answer alone
    // cannot show that every number came from the endpoints rather than the model.
    const record = [
      `# ${question}`,
      '',
      `Model: ${config.model} · ${new Date().toISOString()}`,
      '',
      '## Tool calls',
      '',
      ...result.toolCalls.map((call, i) => `${i + 1}. \`${call.tool}\` — ${JSON.stringify(call.input).slice(0, 400)}`),
      '',
      '## Answer',
      '',
      result.answer,
      '',
    ].join('\n')
    await writeFile(out, record, 'utf8')
    process.stderr.write(`written to ${out}\n`)
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
