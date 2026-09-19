# ClauseWatch

An agent that answers *how long must I keep this, and from when* across regulations that
contradict each other — and refuses to pick a side that no human has picked.

Built for the [DEV Sanity Challenge](https://dev.to/devteam/join-the-sanity-challenge-2500-in-prizes-for-five-winners-514m),
Path One.

**Repository:** https://github.com/oleg-vdv/clausewatch
**Sanity project ID:** `4yzoidsq` · **dataset:** `production` (public)
**Public dataset URL:** https://4yzoidsq.api.sanity.io/v2026-09-19/data/query/production?query=*%5B_type%3D%3D%22conflict%22%5D
**Studio:** https://clausewatch.sanity.studio/

## The problem

Ask any model how long you must retain AI system logs under the EU AI Act and it will tell
you six months. That is true and it is not the answer.

- **AI Act Art. 19** makes the provider keep logs **at least six months**.
- **AI Act Art. 26(6)** makes the deployer do the same — a separate duty on a separate party.
- **GDPR Art. 5(1)(e)** says personal data may be kept **no longer than necessary**, and
  names no number.
- **AI Act Art. 12(3)** guarantees the collision for biometric systems: the log is *required*
  to contain the identity of the humans who verified a match, so it is personal data by
  construction.

One instrument sets a floor, another sets a ceiling, and nothing in either text says where
the other one sits. The honest answer is a period you can justify against both — and a record
of who decided it.

A keyword search returns Art. 19 and stops. It has no way to know that a clause in a different
regulation constrains the same artifact from the opposite direction, because that fact lives
in the relationship between documents, not inside either one.

## How it is built

Two Sanity Context MCP endpoints, doing different jobs.

| Endpoint | Mode | Tools | Answers |
|---|---|---|---|
| `clausewatch-data` | GROQ over the dataset | `initial_context`, `groq_query`, `schema_explorer`, `array_field_reader` | *which* obligations bind this system |
| `clausewatch-docs` | Knowledge Base | `initial_context`, `knowledge_base_read` | *what the clause actually says*, with its source link |

The split is the architecture. The dataset holds the structured model — obligations,
per-instrument claims, conflicts, decisions, system profiles. The Knowledge Base holds the
prose of the instruments, indexed from the published texts with a source URL behind every
statement. The agent reads structure first and prose second, and the two check each other:
in one run the agent caught a duty present in the prose that our dataset had not modelled yet.

### The content model

```
source        an instrument: AI Act, GDPR. Binding status, official URL, version label
provision     one citable unit: "Art. 19", its verbatim text, effective date, roles bound
requirement   a normalised obligation: "retain automatically generated logs"
  └ claim[]   what each instrument asserts about it — with direction (floor/ceiling/none),
              a period where one is stated, the condition, and a reference to its provision
conflict      two clauses that cannot both be satisfied, plus the decision: resolution,
              rationale, decidedBy, decidedAt
systemProfile the thing being regulated: roles, jurisdictions, risk class, agentic or not
```

Three choices carry the weight:

**Claims are separate from requirements.** One obligation, many instruments, and disagreement
between them is content rather than a data-quality problem.

**`direction` on a claim.** Without it, a clause that caps retention and a clause that never
mentions duration both look like silence. GDPR Art. 5(1)(e) sets a ceiling with no number —
that is not a missing field.

**A conflict holds a decision, not a resolution rule.** `decidedBy` and `decidedAt` are the
artifact. An agent that silently picks the stricter number is guessing on your behalf; one
that shows both sides and cites a named, dated decision produces something an auditor accepts.

## Run it

No credentials required. The dataset is public, so this works on a fresh clone:

```bash
cd agent && npm install

npm run ask -- --check                              # what this clone can reach
npm run ask -- --profiles                           # system profiles in the dataset
npm run ask -- --profile biometric-access --no-llm  # the full report
npm run ask -- --profile support-agent --no-llm     # the same ground for a deployer
npm run ask -- --workflow                           # the decision process, and who may move it
```

The viewer is a separate Astro app:

```bash
cd ../web && npm install && npm run dev             # http://localhost:4173
```

The viewer and the agent share one domain layer: `web/` imports `agent/src/context.ts`
rather than keeping its own copy, so a page and an answer cannot disagree about the law.

`--no-llm` composes the answer straight from the dataset with no model involved. It exists so
the project can be checked by anyone, and so the LLM path has something to be measured
against: if the model says six months with the same citation the report gives, it did not
invent the number.

### With credentials

Two capabilities need them, and the project says so rather than degrading quietly.

| | Needs | Why |
|---|---|---|
| Structured dataset | nothing | the dataset is public; read over the public query API |
| Knowledge base | `SANITY_CONTEXT_TOKEN` | served only through Sanity Context |
| The agent | that, plus `ANTHROPIC_API_KEY` | it is a tool-use loop over both MCP endpoints |

```bash
cp .env.example .env    # org token with Context Viewer permission, not a project token
npm run ask -- "how long must I keep logs for a high-risk biometric system?"
```

With a token the same commands run through the Context MCP endpoints instead — `--check`
and the viewer's footer both say which way the data came in. That distinction is not
decoration: a page that credits a source it never read is the failure this project is about.

Saved runs, with their tool calls attached, are in [`demo/`](demo).

## The Studio

`studio/` is a Sanity Studio with a structure built around the one thing an editor of this
dataset actually does: work through unresolved conflicts. Open conflicts come first; requirements
are grouped by topic. `sanity deploy` publishes it — which is also a hard dependency of the
Context GROQ endpoint, not a nicety.

## What the build taught us

Collected in [`PLAN.md`](PLAN.md), including the things that cost hours:

- Document ids containing dots are invisible to anonymous readers, even in a public dataset —
  an authenticated `count(*)` is not evidence that your dataset is public.
- Wildcard include patterns do not filter a website source; exact paths do. A `/article/*`
  crawl pulled in Polish and French translations of the same articles, which for a legal agent
  is a correctness hazard rather than noise.
- A knowledge-base entry outlives its sources: delete the source and the prose stays while
  every citation turns into `_source no longer available` — still listed for the agent to read.
- Context rewrites your GROQ before running it, which changes result shapes: `roles[]->name`
  comes back as `[{name, _id}]`.
- `count()` of a missing field is null, not 0. A role filter written as `count(...) == 0`
  silently dropped every GDPR claim.

## Honest limits

- The Knowledge Base is indexed from [artificialintelligenceact.eu](https://artificialintelligenceact.eu)
  and [gdpr-info.eu](https://gdpr-info.eu) — authoritative reproductions, not the Official
  Journal. EUR-Lex blocks automated retrieval. Every `source` in the dataset therefore carries
  an `officialUrl`, and the agent is instructed to give that one for anything actionable.
- The corpus is 26 documents: the AI Act articles and annexes that bear on the modelled
  obligations, plus five GDPR articles. Curated on purpose, and also capped by the Context beta
  plan limit of 150 indexed documents.
- The dataset is small and deliberately so: 2 instruments, 9 provisions, 2 requirements,
  3 conflicts, 2 system profiles — 23 documents. It is a working core that demonstrates the
  model, not a compliance product. Nothing here is legal advice.
