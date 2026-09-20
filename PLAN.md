# ClauseWatch — Sanity Challenge, Path One

Working name. Submission: DEV Community "Sanity Challenge", tag `#sanitychallenge`.
Deadline: 2026-10-04 23:59 PDT = **2026-10-05 11:59 Almaty**. Target ship date: 2026-10-03.

## The pitch

An agent that answers "what must I actually log for my AI system, and by when" across
regulatory sources that **disagree with each other**. EU AI Act Art. 12, NIST AI RMF,
ISO/IEC 42001, Kazakhstan AI Law 230-VIII. The answer depends on a system profile
(risk class, jurisdictions, role) joined against provisions, and where sources conflict
the agent surfaces both claims with citations plus the recorded decision.

Why this needs structured content (the judging bar): keyword search over the same PDFs
returns the loudest paragraph. It cannot resolve "provider in KZ deploying a high-risk
system in the EU" into a per-obligation list, and it cannot tell you that two sources
contradict each other on retention period — because that fact lives in the *relationship*
between documents, not in any one of them.

## Gate 0 — access (BLOCKING, human-only)

Sanity Context requires an **organization admin** to enable it. Neither the Knowledge Base
nor the MCP endpoint exists until this is done. Checklist:

- [ ] Create a Sanity account (sanity.io) — this also creates an organization
- [ ] Manage -> your organization -> **Labs** -> enable **Context**
- [ ] Manage -> API -> create an **organization** token with **Context Viewer** permission
      (project tokens will not work; 403 on the MCP endpoint means this permission is missing)
- [ ] Dashboard -> **Context** -> **New knowledge base** -> confirm it is not blocked by a plan limit
- [ ] Record: organization ID, project ID, dataset name, KB id (`kb...`), token (in .env, never committed)

Only after a Knowledge Base builds to "Entries up to date" is Path One viable.
If the beta is not available on the free plan -> fall back to Path Two.

## Architecture

- **Dataset** (`production`, public) — the structured model: sources, provisions,
  requirements with per-source claims, conflicts with recorded decisions, system profiles.
  Served to the agent in **GROQ mode** (`initial_context`, `schema_explorer`, `groq_query`).
- **Knowledge Base** — the prose originals (official regulation pages, crawled). Served in
  **KB mode** (`initial_context`, `knowledge_base_read`) so the agent can quote source text
  verbatim and link back.
- Two endpoints, or one endpoint if Context allows both modes; agent reads structure first,
  prose second. That split is the whole point: GROQ answers *which* obligations apply,
  the KB proves *what the text actually says*.
- MCP endpoint: `https://api.sanity.io/v1/context/organizations/$ORG_ID/mcp/$ENDPOINT_NAME`,
  Bearer token.

## Milestones

| Day | Work |
|---|---|
| 1-2 (19-20 Sep) | Gate 0. Verify contradictions actually surface on 3 real questions. go/no-go |
| 3-5 (21-23 Sep) | Schema deploy, corpus load, GROQ queries that answer the profile question |
| 6-10 (24-28 Sep) | Agent + MCP wiring, minimal UI, evidence export |
| 11-13 (29 Sep-1 Oct) | DEV post, honest writeup, Claude Code session transcript (Make Public!) |
| 14-15 (2-3 Oct) | Buffer. Submit 3 Oct |

## Submission requirements (from the rules)

- Post on DEV using the Path One template, tag `#sanitychallenge`
- **Sanity project ID or public dataset URL is mandatory** — incomplete without it
- Test credentials / how-to-test instructions if login is required
- Optional: embedded agent session, uploaded via DEV Agent Sessions, set to **public**

## Project identifiers (created 2026-09-19)

- Project: `clausewatch` — project ID `4yzoidsq`
- Organization ID: `o7br4pucm`
- Dataset: `production`
- Plan: **Growth Trial, 30 days** — expires ~2026-10-19

## Risk: the trial expires during judging

Submissions close 4 Oct, winners are announced 22 Oct. The Growth trial runs out ~19 Oct,
which lands **inside the judging window**. If the project drops to Free and Knowledge Bases
are a paid capability, judges open a dead demo three days before the decision.

Mitigations, in order of preference:

1. Ask the Sanity team directly (Discord `#mcp-server`) whether challenge entries keep
   Context access through judging. They are in there and this is their challenge.
2. Record a full walkthrough — video plus an embedded agent session — so the submission
   still demonstrates the thing when the endpoint is gone.
3. Keep the dataset public and the frontend readable without Context, so the structured
   model and the conflicts stay inspectable on the free plan even if MCP stops answering.
4. State the trial expiry plainly in the post. An honest limitation reads better to judges
   than a broken link they have to guess about.

## Build log — things that cost time (for the honest writeup)

**Dotted document IDs are invisible to anonymous readers.** The seed used ids like
`prov.aiact.art19`. The dataset was `aclMode: public`, the CLI reported 18 documents
imported, an authenticated `count(*)` returned 31 — and an anonymous one returned 0, with
`omitted: [{reason: "permission"}]` on a direct document fetch. Sanity treats `_id` as a
path, and public read applies to the root path only. Renaming every id to hyphens fixed it.

This matters beyond tidiness: the submission requires a publicly reachable dataset. Without
the anonymous probe we would have shipped a dataset that works for us and 403s for judges.
Worth stating in the post — an authenticated count is not evidence that a dataset is public.

**Sanity CLI login stores nothing until the browser callback completes.** `sanity login`
writes `~/.config/sanity/config.json` for telemetry consent before the browser flow, so the
file existing proves nothing. Checking for `authToken` specifically is the real test. We
switched to `SANITY_AUTH_TOKEN` with a project Editor token and skipped the browser entirely.

## Verified working (2026-09-19)

- Schema deployed: 1/1 workspace
- 18 documents imported, all readable anonymously at
  `https://4yzoidsq.api.sanity.io/v2026-09-19/data/query/production`
- Queries 1, 2 and 3 from `studio/queries.groq` return correct results without a token

## Open modeling question

Query 3 sorts GDPR Art. 5(1)(e) into `silentOnPeriod` because it names no number. That is
literally true and semantically wrong: it is a ceiling, not silence. The claim needs a
`direction` field (`floor` / `ceiling` / `none`) so the agent can say "one instrument sets a
floor of six months, another caps it by necessity, and a third imposes the duty without
touching duration" instead of lumping the last two together.

## Context MCP endpoint — live 2026-09-19

- Endpoint: `https://api.sanity.io/v1/context/organizations/o7br4pucm/mcp/clausewatch`
- Hosted Studio: https://clausewatch.sanity.studio/ (app id `uqta1o0y4td0im6skw1s2pcl`)
- `initialize`, `tools/list`, `initial_context` and `groq_query` all verified with the
  read-only Context Viewer token.

**GROQ mode requires a deployed Studio, not just a deployed schema.** The endpoint answered
`-32004: Only datasets with deployed Studio applications are supported`. `sanity schema
deploy` is not enough; `sanity deploy` is. Worth knowing before wiring an agent: the hosted
Studio is a dependency of the MCP endpoint, not a nice-to-have. It also gives judges
somewhere to click.

**Context rewrites the query before running it.** The `meta.executedQuery` came back as
`*[_type != "sanity.agentContext" && ...]` with `_id` coalesced from `_originalId`, and
`perspective: published`. Useful to know when debugging why a query behaves differently
through MCP than in Vision.

**Open:** `tools/list` returns only the four GROQ tools. `knowledge_base_read` is absent, so
the Knowledge Base is not attached to this endpoint even though the UI offers both tabs.
Either the KB selection was cleared when the dataset was added, or one endpoint serves one
mode and the KB needs its own endpoint.

## Both endpoints live and verified (2026-09-19)

| Endpoint | Tools | Serves |
|---|---|---|
| `clausewatch` | `initial_context`, `knowledge_base_read` | Knowledge Base `kbUe23mmKTBM`, 47 entries |
| `clausewatch-data` | `initial_context`, `groq_query`, `schema_explorer`, `array_field_reader` | dataset `production` |

**One endpoint serves one mode.** The UI lets you tick a Knowledge Base and a dataset on the
same endpoint, but attaching a KB replaced the GROQ tools entirely — `tools/list` went from
four GROQ tools to two KB tools. Two endpoints is the working setup, and the split is honest:
one answers "what does the text say", the other "what follows for your system".

**The Knowledge Base indexes better than expected.** Entries are topic nodes, not text chunks:
each carries an article range, a topic list, cross-references (`excludes: … see <other entry>`)
and a numbered Sources block with a URL per citation. `documentation_logging` covers Arts. 11,
12, 18, 19 and Annex IV, states the six-month minimum, and independently reports both
application dates — 2 Dec 2027 (Annex III) and 2 Aug 2028 (Annex I) — which is the same
deadline conflict we modelled by hand.

## Next

1. Add `direction` (`floor` / `ceiling` / `none`) to `claim`; redeploy schema, re-import.
2. Model the Annex I amendment discrepancy as a `conflict` with `nature: "version"`, resolved,
   with the rationale recording that Context found it and a human corrected its arithmetic.
3. Build the agent: question + system profile -> query `clausewatch-data` for applicable
   claims and conflicts -> `clausewatch` for verbatim text -> answer with citations, both
   sides of every conflict, and silence reported as silence.
4. Minimal UI, then the DEV post.

## Still on the human

- Entries cleanup: indexed documents sit at 159 of 150. Dismissing an issue keeps the entry;
  stale entries have to be deleted from the Entries view. Rebuilds stay blocked until then.
- Resolve the Annex I conflict in the Issues view with the verified wording.
- Ask in the Sanity Discord `#mcp-server` whether challenge entries keep Context access
  through judging on 22 Oct — the Growth trial expires ~19 Oct.

## Corpus rebuilt and verified (2026-09-19, second pass)

Knowledge base `kboZJwjuj070` — "AI regulation corpus", **10 entries from 26 documents**,
zero dead citations. Endpoints: `clausewatch-data` (GROQ) and `clausewatch-docs` (KB).

**Wildcard include patterns do not filter; exact paths do.** `/article/*` let the crawler
walk the whole site — 200 documents, including Polish and French translations of the same
articles. `/art-5-gdpr/` style exact paths hit exactly 5 documents, three builds running.
The AI Act source is now 21 exact paths: Arts. 3, 6, 9, 11–14, 16–21, 26, 27, 72, 73, 99 and
Annexes I, III, IV.

**"Sitemap only" ignores include patterns.** Turning it on pulled 691 documents — the entire
sitemap index, recitals and section pages included. Worth knowing: it is a scope switch, not
a filter, and it overrides the filter you already set.

**Translations are a correctness hazard, not just noise.** A legal agent quoting the Polish
rendering of Art. 12 instead of the English one is wrong in a way that looks right. The
site's sitemaps are English-only, which is the tell: if a crawl returns more pages than the
sitemap has, it followed in-page language links.

**An entry outlives its sources.** After the first GDPR source was removed, all 20 GDPR
entries kept their prose and every citation turned into `_source no longer available_`. They
still appeared in `initial_context`, so an agent would have read them and cited a dead
reference. Dismissing the issue does not remove the entry, and `Remove entry` was greyed out
once dismissed — the only way out was rebuilding the knowledge base.

**A stale knowledge-base reference wedges the endpoint.** After the rebuild, endpoint
`clausewatch` kept pointing at the deleted `kbUe23mmKTBM`; saving a new selection silently
did nothing and `initialize` returned `-32005: Mode is set to "knowledge_base" but no
knowledge bases are configured`. Deleting the endpoint and creating `clausewatch-docs` fixed
it in a minute.

Verified after rebuild: `gdpr/principles_and_accountability` carries live links to Arts. 5,
25 and 30; `eu_ai_act/provider_obligations/design_documentation` reproduces the Art. 12(3)
minimum log content including the human-verifier identity, and cross-references the six-month
retention rule to `post_market_obligations`.

## Agent built (2026-09-19)

`agent/` — TypeScript, run with tsx, no build step.

```
npm run ask -- --check                              both endpoints answer
npm run ask -- --profiles                           system profiles in the dataset
npm run ask -- --profile biometric-access --no-llm  deterministic report, no API key
npm run ask -- "how long must I keep logs…"         LLM agent over both endpoints
```

Two paths on purpose. The LLM path (`src/agent.ts`) is a real tool-use loop: every tool is
a live Context MCP tool, nothing is pre-fetched, and the model has to go and look — which is
what makes the transcript worth embedding in the post. The deterministic path
(`src/report.ts`) composes the same answer straight from the dataset with no model at all, so
a judge without an Anthropic key can still run it, and so the LLM path has something to be
checked against: if the model says six months with the same citation the report gives, it
did not invent the number.

**Context rewrites your GROQ and it changes result shapes.** `roles[]->name` came back as
`[{name, _id}]`, not `["Provider"]` — the rewriter folds `_id` into every projection it
touches. Printing `[object Object]` in the first run was the tell. Ask for objects explicitly
and flatten in code rather than writing a query whose shape depends on the rewriter.
The same rewrite adds `_type != "sanity.agentContext"` and pins `perspective: published`.

Verified output for `biometric-access` (provider, high-risk, KZ → EU): both requirements,
the floor/ceiling split with citations and in-force dates, the open conflict named as
undecided, and the Annex I conflict carrying its rationale, decider and date.

## LLM path verified live (2026-09-19)

Three runs saved in `demo/`:

| File | What it shows |
|---|---|
| `01-retention-conflict.md` | 7 tool calls across both endpoints. Refuses to give one number: floor from Art. 19, ceiling from GDPR Art. 5(1)(e), conflict reported as open with no decider, and the obligation flagged as not yet in force |
| `02-agentic-silence.md` | 10 tool calls. Finds the matching profile unprompted, treats `riskClass: unknown` as load-bearing, separates provider from deployer duties, and ends with a "What I can't answer from these sources" section |
| `03-deterministic-report.md` | The same ground, composed with no model at all |

The saved runs carry their tool calls, because the answer alone cannot show that a number
came from the endpoints rather than from the model.

**The agent found a gap in our own model.** In run 02 it cited AI Act Art. 26(5) — the
deployer's duty to keep logs for at least six months — from the knowledge base, and noted it
is "not yet a separate dataset provision". It is right: the structured layer models the
provider duty (Art. 19) and not the deployer one, so a deployer asking the dataset alone gets
an incomplete answer. Next change to the seed.

## Next

1. Model Art. 26(5) as a provision with a deployer claim on `req-retain-logs`.
2. Minimal UI — judges need something to click besides the Studio.
3. The DEV post, plus a Claude Code session uploaded to DEV Agent Sessions (public, not unlisted).

## Role filtering (2026-09-19)

The agent's second run cited AI Act Art. 26(5) for the deployer log duty, taken from the
knowledge base. Checked against the source: the duty is **Art. 26(6)**; 26(5) is the
monitoring and incident-notification duty. The knowledge base was one paragraph off and the
agent repeated it — a one-digit citation error that reads as correct. Art. 26(6) is now a
provision in the dataset with the verified citation and a deployer claim on `req-retain-logs`.

That exposed a second bug, in our own query: obligations were filtered by jurisdiction only,
so a deployer profile was shown Art. 19 — the provider's duty. Claims are now filtered by
the roles the profile actually holds, and each citation prints the party it binds:

```
support-agent    (Deployer) → Art. 26(6) [binds the Deployer] + GDPR Art. 5(1)(e)
biometric-access (Provider) → Art. 19    [binds the Provider] + GDPR Art. 5(1)(e)
```

**`count()` of a missing field is null, not 0.** The first version of the role filter used
`count(provision->appliesToRoles) == 0` for "binds everyone", which silently dropped every
GDPR claim — GDPR provisions have no `appliesToRoles` at all. `!defined(...)` has to come
first. The failure was invisible in the provider report and only showed up for the deployer.

## To do on the platform

Add a Context **Instruction** correcting the knowledge base: the deployer log-retention duty
is Art. 26(6), not Art. 26(5). That is exactly what Instructions are for — "use it to
correct a specific fact" — and it fixes the source of the agent's mis-citation rather than
patching around it.

## Viewer (2026-09-19)

`agent/src/web.ts` + `agent/src/view.ts` — server-rendered HTML, no client framework, no
build step. `npm run web` in `agent/`, then http://localhost:4173.

Two pages: the systems on file, and one system's obligations. Every request goes to Context
MCP; nothing is cached and there is no local copy of the law, so the page changes when the
dataset does.

Design notes, so a later pass does not undo them on purpose:

- The layout is a consolidated legal text, not a dashboard. A marginal column carries what a
  lawyer writes in the margin — which party the duty binds, when it starts to bite, how many
  clauses feed it — and the text column holds the reading.
- Citations are monospace because a citation is an address. Prose is not: an early version
  set the auditor note in mono too, and it read like a log line.
- **The signature block is the point of the page.** Every conflict prints a "decided by" and
  a "date" rule. When the conflict is resolved they carry a name and a date; when it is open
  they are two empty lines in a compliance report. That is the whole thesis rendered as a
  form field rather than argued in a paragraph.
- **The pressure bar** shows the retention question as two opposing forces: a solid edge on
  the left where Art. 19 states six months, and a hatched, edgeless right where GDPR caps the
  period without naming a number. Drawing a tidy range there would be a lie about the law.

Checked: light and dark (lowest contrast ratio 6.8:1), 375px through desktop, keyboard focus
visible, reduced motion respected.

## Print stylesheet (2026-09-19)

Printed the three pages to PDF and found two things a screen test cannot show. Browsers drop
background colours when printing, so the hatched end of the pressure bar disappeared while the
sentence explaining it stayed — the page described something no longer on it. And a citation
printed as text alone loses its address.

`@media print` now forces colour on the bar and the decision panels, prints the URL after each
citation, keeps a decision block from splitting across pages, and drops to black on white.

A printed report is the form this work ends up in when someone hands it to an auditor. It has
to survive the printer.

## Correction: the Art. 26(5) story (2026-09-19)

Verified after the corpus rebuild, and the earlier account in this file was wrong.

The agent's mis-citation came from the **old** knowledge base (`kbUe23mmKTBM`), which we
deleted. The rebuilt one (`kboZJwjuj070`) does not make that claim: its only mention of
Art. 26(5) is correct — the cross-reference from Art. 12(2)(c) to deployer monitoring.

The likely cause is now visible. The entry for Article 26 numbers its own sections, and the
fifth is headed `### 5. Log retention`. Section five of an entry about Article 26 reads, to a
model, as Art. 26(5). The entry states the rule correctly and gives **no paragraph number**,
so there was nothing in the prose to contradict the inference.

So the Instruction did not fix anything: it guards against the wrong number returning on a
future build. `Check for changes` reports "Entries up to date" — the sources have not changed,
no rebuild has run, and the Instruction is therefore untested.

What actually fixed the answer is the dataset: Art. 26(6) is a provision with a human-verified
citation and a deployer claim. The prose layer is right about the rule and silent on the
address; the structured layer carries the address. That is a better argument for the two-layer
design than the one we thought we had.

`SUBMISSION.md` has been rewritten to say this rather than the earlier version.

## Path Two groundwork: the process as data (2026-09-19)

The challenge names this as a bonus it especially wants to see — "model a process as data
next to the content, so an agent can move a draft forward and a person can approve it through
the same transitions". Our conflict resolution already *was* such a process; it was just
implicit in a `resolution` enum.

New types: `workflow` (states + transitions), `workflowState`, `transition`, and
`transitionRecord`. A conflict now carries `state` and a `history[]` of moves with the actor
who made each one.

The field the design rests on is `transition.actor`. Two of five moves are open to an agent —
start looking, attach the sources. Three are `human`, including the one that matters:

```
CANNOT Sign the decision (review → decided) — reserved for a person
       Only a person signs. The agent can prepare every part of this and still not
       make the move.
```

The agent is refused **by the dataset it queries**, not by a sentence in its prompt. Same
data a person reads in the Studio, same transitions, different permissions — and the
difference is queryable: `count(transitions[actor=="human"])` returns 3 over the public API.

`agent/src/gate.ts` computes the allowed moves; `npm run ask -- --workflow [--as human]`
prints them. The same transition blocks the two actors for different reasons: the agent is
told it is reserved for a person, the person is told which fields are still empty.

Three conflicts sit at three points on purpose: one raised, one awaiting a signature, one
decided with its full history.

## Next for Path Two

An App SDK app where a person makes the `review → decided` move: `npx sanity@latest init
--template app-quickstart`, then `sanity deploy`. Deploying needs org admin or a token with
**Manage SDK Apps** — the current deploy token has Deploy Studios only, so that permission
has to be added before the app can ship.

## The signing desk is live (2026-09-19)

App SDK app deployed to the organisation dashboard:
**https://www.sanity.io/@o7br4pucm/application/wpdwxiwyygohwmtn59yz92ap** — app id
`wpdwxiwyygohwmtn59yz92ap`, recorded in `app/sanity.cli.ts` so later deploys update it.

It does one thing: the `review → decided` move the workflow reserves for a person. The list
is whatever the dataset says is in `review`; the app holds no state of its own. Both clauses
are shown verbatim with citations, the agent's own steps are listed above the form, and the
decision plus its transition record are written in a single edit so the state cannot move
without evidence of who moved it.

**`sanity dev` binds IPv6 only.** The port listens on `[::1]:3333` and nothing resolving
localhost to 127.0.0.1 can reach it — the page just never loads. `server.hostname:
'127.0.0.1'` in `sanity.cli.ts` fixes it. Not in the docs.

**The app requires a Sanity login**, which is correct for a signing tool: it redirects to
sanity.io rather than rendering anything to an anonymous visitor. Judges will need to be
logged in to open it, so the post should say so and lead with the public artefacts instead.

Deploying needed a token with **Manage SDK Apps**; token permissions cannot be edited after
creation, so this took a second token (`clausewatch-deploy-v2`, also carrying Deploy Studios
and project Editor). The old `clausewatch-cli-deploy` can be deleted.

## The viewer moved to Astro (2026-09-20)

Path Two's brief named Next.js or Astro on the front. The viewer was a hand-rolled Node
server writing HTML strings, and the post admitted the miss rather than closing it. Astro
with the Node adapter suits it exactly: `output: 'server'`, rendered per request, because
every page is a live read of the dataset and there is nothing worth building ahead of time.

`agent/src/web.ts` and `agent/src/view.ts` are gone. The pages are `.astro` components and
the stylesheet is a real CSS file rather than a template literal.

**The domain layer is shared, not copied.** `web/src/lib/data.ts` imports
`agent/src/context.ts` directly, so one definition of an obligation serves both the page and
the agent, and they cannot drift apart. Vite resolves the agent's NodeNext `.js` specifiers
to their `.ts` sources across the package boundary with `vite.server.fs.allow: ['..']`.

Verified from a fresh GitHub clone, running exactly the commands the post now gives: install,
build, serve, all three routes 200, and the bundled stylesheet still carries the print rules,
the dark theme, the reduced-motion guard and the pressure bar.

Both posts were edited to match: Path One's Demo commands pointed at a script that no longer
exists, and Path Two's "Honest limits" claimed a deviation that is no longer true.
