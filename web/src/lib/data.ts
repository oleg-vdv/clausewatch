import {readConfig} from '../../../agent/src/config.js'
import {ContextClient} from '../../../agent/src/context.js'

/**
 * The viewer shares the agent's domain layer rather than keeping its own copy.
 * One definition of what an obligation is, one place where the queries live, and
 * no chance of the page and the agent disagreeing about the law.
 */
const config = readConfig()

export const context = new ContextClient(config)
export const access = context.access

export const accessNote =
  access === 'context'
    ? 'Read live through the two Sanity Context MCP endpoints: the structured dataset for what applies, the knowledge base for what the text says.'
    : 'Read over the public Sanity query API. No Context token is set here, so this page is built entirely from the structured dataset — the knowledge base and the agent are not reachable without one.'

export type {Claim, Conflict, Profile, Requirement} from '../../../agent/src/context.js'
