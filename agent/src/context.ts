import {McpClient} from './mcp.js'
import type {Config} from './config.js'

/**
 * The domain layer. Everything the agent knows about regulation comes through
 * here, and every field it can state out loud arrives with the citation attached —
 * there is deliberately no method that returns an obligation without one.
 */

export interface Claim {
  assertion: string
  strength: 'must' | 'should' | 'may'
  direction: 'floor' | 'ceiling' | 'none'
  retentionMonths: number | null
  conditionalOn: string | null
  cite: string
  url: string | null
  effectiveFrom: string | null
  anchor: string | null
  binds: Array<{name: string}> | null
}

export interface Conflict {
  summary: string
  nature: string
  resolution: string
  rationale: string | null
  decidedBy: string | null
  decidedAt: string | null
  sides: Array<{cite: string; url: string | null}>
}

export interface Requirement {
  obligation: string
  topic: string
  evidenceHint: string | null
  claims: Claim[]
  conflicts: Conflict[]
}

export interface Profile {
  name: string
  slug: string
  description: string | null
  riskClass: string
  agentic: boolean
  isGpai: boolean
  roles: string[]
  jurisdictions: string[]
}

const CLAIM_PROJECTION = `{
  assertion, strength, direction, retentionMonths, conditionalOn,
  "cite": provision->source->shortName + " " + provision->citation,
  "url": coalesce(provision->sourceUrl, provision->source->officialUrl),
  "effectiveFrom": provision->effectiveFrom,
  "anchor": verbatimAnchor,
  "binds": provision->appliesToRoles[]->{name}
}`

const CONFLICT_PROJECTION = `{
  summary, nature, resolution, rationale, decidedBy, decidedAt,
  "sides": sides[]->{
    "cite": source->shortName + " " + citation,
    "url": coalesce(sourceUrl, source->officialUrl)
  }
}`

/**
 * Two ways in, and the difference matters.
 *
 * With a Context Viewer token this goes through the Sanity Context MCP endpoints — the
 * real path, and the only one that can reach the Knowledge Base.
 *
 * Without one it reads the same dataset over the public query API, because the dataset
 * is public and a project nobody outside the organisation can run is not much of a
 * submission. The prose side is unavailable there, and says so rather than degrading
 * quietly into an answer with no source behind it.
 */
export type Access = 'context' | 'public'

export class ContextClient {
  private readonly data: McpClient | null
  private readonly docs: McpClient | null
  private readonly knowledgeBaseId: string
  private readonly publicQueryUrl: string
  readonly access: Access

  constructor(config: Config) {
    this.access = config.contextToken ? 'context' : 'public'
    this.data = config.contextToken ? new McpClient(config.dataEndpoint, config.contextToken) : null
    this.docs = config.contextToken ? new McpClient(config.docsEndpoint, config.contextToken) : null
    this.knowledgeBaseId = config.knowledgeBaseId
    this.publicQueryUrl = `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}`
  }

  /** Runs GROQ, through Context when we have a token and over the public API when we do not. */
  private async query<T>(groq: string): Promise<T> {
    if (this.data) {
      const raw = await this.data.call('groq_query', {query: groq})
      try {
        return (JSON.parse(raw) as {result?: T}).result as T
      } catch {
        throw new Error(`groq_query returned something unparseable: ${raw.slice(0, 200)}`)
      }
    }

    const url = new URL(this.publicQueryUrl)
    url.searchParams.set('query', groq)
    const response = await fetch(url)
    const payload = (await response.json()) as {result?: T; error?: {description?: string}}
    if (payload.error) {
      throw new Error(`public query API: ${payload.error.description ?? JSON.stringify(payload.error)}`)
    }
    return payload.result as T
  }

  private requireDocs(): McpClient {
    if (!this.docs) {
      throw new Error(
        'The knowledge base is served only through Sanity Context, which needs an organisation ' +
          'token with Context Viewer permission. Set SANITY_CONTEXT_TOKEN in .env. The structured ' +
          'dataset works without one.',
      )
    }
    return this.docs
  }

  /**
   * Context rewrites every projection it runs and folds an `_id` into it, so a
   * scalar projection like `roles[]->name` comes back as `[{name, _id}]` rather
   * than `["Provider"]`. Ask for objects and flatten them here, instead of
   * writing a query whose result shape depends on the rewriter.
   */
  async profiles(): Promise<Profile[]> {
    const rows = await this.query<
      Array<
        Omit<Profile, 'roles' | 'jurisdictions'> & {
          roles: Array<{name: string}> | null
          operatesIn: Array<{code: string}> | null
          outputUsedIn: Array<{code: string}> | null
        }
      >
    >(`*[_type == "systemProfile"] | order(name) {
      name, "slug": slug.current, description, riskClass, agentic, isGpai,
      "roles": roles[]->{name},
      "operatesIn": operatesIn[]->{code},
      "outputUsedIn": outputUsedIn[]->{code}
    }`)

    return rows.map((row) => ({
      name: row.name,
      slug: row.slug,
      description: row.description,
      riskClass: row.riskClass,
      agentic: row.agentic,
      isGpai: row.isGpai,
      roles: (row.roles ?? []).map((role) => role.name),
      jurisdictions: [
        ...new Set([...(row.operatesIn ?? []), ...(row.outputUsedIn ?? [])].map((j) => j.code)),
      ],
    }))
  }

  async profile(slug: string): Promise<Profile | null> {
    const found = await this.profiles()
    return found.find((p) => p.slug === slug) ?? null
  }

  /**
   * Obligations that touch the jurisdictions this system operates in or sends output
   * into, and that bind the roles this system actually holds.
   *
   * Both filters matter, and the role one is the easy thing to forget: Art. 19 binds
   * the provider and Art. 26(6) the deployer with the same six-month floor. Telling a
   * deployer that Art. 19 is their duty is not a rounding error, it is the wrong party.
   * A provision that names no role (most of the GDPR here) binds everyone and stays in.
   */
  async obligations(jurisdictions: string[], roles: string[], topic = '*'): Promise<Requirement[]> {
    const codes = JSON.stringify(jurisdictions)
    const roleNames = JSON.stringify(roles)
    // `count()` of a missing field is null, not 0, so an undefined appliesToRoles has to
    // be checked with defined() first — otherwise every GDPR claim silently drops out.
    const claimFilter = `provision->source->jurisdiction->code in ${codes}
      && (
        !defined(provision->appliesToRoles)
        || count(provision->appliesToRoles) == 0
        || count(provision->appliesToRoles[@->name in ${roleNames}]) > 0
      )`

    return this.query<Requirement[]>(`*[_type == "requirement" && ("${topic}" == "*" || topic == "${topic}")]{
      obligation, topic, evidenceHint,
      "claims": claims[${claimFilter}]${CLAIM_PROJECTION},
      "conflicts": conflicts[]->${CONFLICT_PROJECTION}
    }[count(claims) > 0]`)
  }

  async conflicts(): Promise<Conflict[]> {
    return this.query<Conflict[]>(
      `*[_type == "conflict"] | order(select(resolution == "open" => 0, 1), nature) ${CONFLICT_PROJECTION}`,
    )
  }

  /** The knowledge-base table of contents, as the agent sees it. */
  async outline(): Promise<string> {
    return this.requireDocs().call('initial_context')
  }

  /** Verbatim prose for one or more entries, with their own Sources blocks intact. */
  async read(paths: string[]): Promise<string> {
    if (paths.length === 0) return ''
    return this.requireDocs().call('knowledge_base_read', {
      knowledgeBase: this.knowledgeBaseId,
      paths: paths.slice(0, 20),
    })
  }

  /** Entry paths whose outline line mentions any of these words. */
  async findEntries(terms: string[]): Promise<string[]> {
    const outline = await this.outline()
    const paths = [...outline.matchAll(/^((?:[a-z0-9_]+\/)+[a-z0-9_]+)(?:\s+\[core\])?$/gm)]
      .flatMap((match) => (match[1] ? [match[1]] : []))
      .filter((path, index, all) => all.indexOf(path) === index)

    const wanted = terms.map((term) => term.toLowerCase())
    const lines = outline.split('\n')

    return paths.filter((path) => {
      const start = lines.findIndex((line) => line.trimEnd().startsWith(path))
      if (start < 0) return false
      const block = lines.slice(start, start + 4).join(' ').toLowerCase()
      return wanted.some((term) => block.includes(term))
    })
  }

  async toolNames(): Promise<{data: string[]; docs: string[]}> {
    if (!this.data || !this.docs) return {data: [], docs: []}
    const [data, docs] = await Promise.all([this.data.tools(), this.docs.tools()])
    return {data: data.map((t) => t.name), docs: docs.map((t) => t.name)}
  }
}
