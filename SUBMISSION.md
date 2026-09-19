---
title: "ClauseWatch: an agent that refuses to give you one number"
published: false
tags: sanitychallenge, devchallenge, agents, ai
---

*This is a submission for the [Sanity Challenge](https://dev.to/devteam/join-the-sanity-challenge-2500-in-prizes-for-five-winners-514m): Ship an agent that queries real content.*

## What I Built

Ask any model how long you must keep AI system logs under the EU AI Act. It will say six
months. That is true, and it is not the answer.

**AI Act Art. 19** makes the *provider* keep logs at least six months. **Art. 26(6)** puts the
same floor on the *deployer* — a separate duty on a separate party. **GDPR Art. 5(1)(e)** says
personal data may be kept no longer than necessary, and names no number at all. And **Art.
12(3)** guarantees the two will collide: for biometric systems the log is *required* to record
the identity of the humans who verified a match, so the log the AI Act mandates is personal
data by construction.

One instrument sets a floor. Another sets a ceiling. Neither says where the other one sits.
The honest answer is a period you can justify against both — plus a record of who decided it.

ClauseWatch is an agent that gives that answer. It reads a structured model of obligations and
the prose of the instruments behind them, and when two sources pull in opposite directions it
shows both with their citations and reports that the decision is **unmade**:

> Both clauses stand until someone signs. The dataset keeps a `decidedBy` and a `decidedAt`
> field for exactly that, and they are empty.

This is the part that needed structured content. A keyword search over the same texts returns
Art. 19 and stops. It cannot know that a clause in a *different regulation* constrains the
same artifact from the opposite direction, because that fact does not live in either document.
It lives in the relationship between them — which is to say, in the schema.

## Demo

The viewer is server-rendered from the two Context endpoints; nothing is cached, so the page
changes when the dataset does.

```bash
git clone <repo> && cd clausewatch/agent
cp ../.env.example ../.env    # add an org token with Context Viewer permission
npm install && npm run web    # http://localhost:4173
```

No login. No API key needed for the viewer or for `--no-llm`.

The layout borrows from consolidated legal texts rather than dashboards: a marginal column
carries what a lawyer writes in the margin — which party the duty binds, when it starts to
bite — and citations are set in monospace because a citation is an address.

Two elements do the arguing:

**The pressure bar.** A solid edge on the left where Art. 19 states six months; a hatched,
edgeless right where the GDPR caps the period without naming one. Drawing a tidy range there
would be a lie about the law.

**The signature block.** Every conflict prints a *decided by* and a *date* rule. Resolved,
they carry a name and a date. Open, they are two empty lines in a compliance report. That is
the whole thesis rendered as a form field instead of argued in a paragraph.

The Studio is deployed at **https://clausewatch.sanity.studio/** — open conflicts first,
because that is the one thing an editor of this dataset actually does.

## Code

`<repo link>`

Two Sanity Context MCP endpoints, doing different jobs:

| Endpoint | Mode | Answers |
|---|---|---|
| `clausewatch-data` | GROQ over the dataset | *which* obligations bind this system |
| `clausewatch-docs` | Knowledge Base | *what the clause says*, with its source link |

The agent (`agent/src/agent.ts`) is a tool-use loop where every tool is a live Context MCP
tool. Nothing is pre-fetched: the model calls `initial_context`, writes its own GROQ, and
reads knowledge-base entries. There is also a deterministic path (`--no-llm`) that composes
the same answer from the dataset with no model involved — so the project can be checked
without an API key, and so the LLM path has something to be measured against. If the model
says six months with the same citation the deterministic report gives, it did not invent it.

### The content model

```
source        an instrument: binding status, official URL, version label
provision     one citable unit: "Art. 19", verbatim text, effective date, roles bound
requirement   a normalised obligation: "retain automatically generated logs"
  └ claim[]   what each instrument asserts — direction (floor/ceiling/none), period if
              stated, condition, and a reference to its provision
conflict      two clauses that cannot both be satisfied, plus resolution, rationale,
              decidedBy, decidedAt
systemProfile roles, jurisdictions, risk class, agentic or not
```

Three decisions carry the weight.

**Claims sit apart from requirements.** One obligation, many instruments, and disagreement
between them is content — not a data-quality problem to be cleaned up.

**`direction` on a claim.** An earlier version bucketed claims by "does it state a number",
which filed GDPR Art. 5(1)(e) under *silence*. It is not silent: it caps the period without
naming one. Floor, ceiling and duty-only are three different answers, and the field is what
makes the agent able to say so.

**A conflict holds a decision, not a resolution rule.** An agent that silently picks the
stricter number is guessing on your behalf. One that shows both sides and cites a named,
dated decision produces something an auditor can accept.

## How I Used Sanity

**Knowledge Bases.** A curated corpus of 26 documents: the AI Act articles and annexes that
bear on the modelled obligations, plus five GDPR articles, indexed into 10 entries. The
indexing was better than I expected — entries are topic nodes, not chunks, each with an
article range, a topic list, cross-references (`excludes: … see <other entry>`) and a numbered
Sources block with a URL per statement.

**Context found a real contradiction I had not.** While indexing, it flagged that an entry
claimed Annex I lists 21 harmonisation instruments while the source shows 20 — item 1 deleted
by amendment, item 21 added. I verified it: true. It also proposed a Section A/B split that I
could *not* verify, because EUR-Lex blocks automated retrieval. So the decision recorded in
the dataset says the detection was right, states only the verified part, and explicitly
excludes the unverified arithmetic — and carries a name, because someone chose that.

That is the whole product in one incident: automated detection is good at *finding*
disagreement and not authoritative about *resolving* it.

**Instructions closed the loop the other way.** In one run the agent cited Art. 26(5) for the
deployer log duty, taken from the knowledge base. The source says Art. 26(6); 26(5) is the
monitoring duty. A one-digit citation error that reads as correct. The fix was a Context
Instruction correcting the fact at the source, not a patch in my code — and Art. 26(6) is now
a provision in the dataset with a verified citation.

**GROQ mode does the reasoning.** Claims are filtered by the jurisdictions a system touches
*and* the roles it holds, so a deployer is shown Art. 26(6) and a provider Art. 19. Telling a
deployer that Art. 19 is their duty is not a rounding error; it is the wrong party.

### Five things that cost me hours

- **Document ids containing dots are invisible to anonymous readers**, even in a public
  dataset. The CLI said 18 imported, an authenticated `count(*)` said 31, and an anonymous one
  said 0. Sanity treats `_id` as a path and public read covers the root path only. An
  authenticated count is not evidence that your dataset is public.
- **Wildcard include patterns do not filter a website source; exact paths do.** `/article/*`
  pulled 200 pages including Polish and French translations. For a legal agent a translation
  is a correctness hazard, not noise. The tell: the site's sitemaps are English-only, so a
  crawl returning more pages than the sitemap has followed in-page language links.
- **"Sitemap only" overrides include patterns** rather than narrowing them — 691 documents.
- **An entry outlives its sources.** Delete a source and the prose stays while every citation
  becomes `_source no longer available` — and the entry is still listed in `initial_context`
  for the agent to read and cite. Dismissing the issue keeps the entry.
- **Context rewrites your GROQ**, which changes result shapes: `roles[]->name` comes back as
  `[{name, _id}]`. It also injects `_type != "sanity.agentContext"` and pins
  `perspective: published`.

## Sanity Project Details

- **Project ID:** `4yzoidsq`
- **Dataset:** `production` (public)
- **Public dataset URL:** https://4yzoidsq.api.sanity.io/v2026-09-19/data/query/production?query=*%5B_type%3D%3D%22conflict%22%5D
- **Studio:** https://clausewatch.sanity.studio/

Try the conflicts straight from the API, no token:

```
*[_type=="conflict"]{summary, nature, resolution, decidedBy,
  "sides": sides[]->{"cite": source->shortName + " " + citation}}
```

## Agent Session

`<embed the uploaded Claude Code session here>`

## Honest limits

The knowledge base is built from authoritative reproductions, not the Official Journal —
EUR-Lex blocks automated retrieval. Every `source` carries an `officialUrl` and the agent is
instructed to give that one for anything actionable.

The corpus is deliberately small, and also capped: the Context beta allows 150 indexed
documents on this plan, which I hit twice before curating properly.

Two instruments, two profiles, three conflicts. A working core, not a compliance product.
Nothing here is legal advice.
