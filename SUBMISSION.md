---
title: "ClauseWatch: an agent that refuses to give you one number"
published: false
tags: sanitychallenge, devchallenge, agents, ai
---

*This is a submission for the [Sanity Challenge, Path One: Ship an Agent That Queries Real Content](https://dev.to/challenges/sanity-2026-09-16)*

## What I Built

Ask any model how long you must keep AI system logs under the EU AI Act. It will say six
months. That is true, and it is not the answer.

- **AI Act Art. 19** makes the **provider** keep logs at least six months.
- **AI Act Art. 26(6)** puts the same floor on the **deployer** — a separate duty on a
  separate party.
- **GDPR Art. 5(1)(e)** says personal data may be kept **no longer than necessary**, and
  names no number at all.
- **AI Act Art. 12(3)** guarantees the collision: for biometric systems the log is *required*
  to record the identity of the humans who verified a match. The log the AI Act mandates is
  personal data by construction.

One instrument sets a floor. Another sets a ceiling. Neither says where the other one sits.
The honest answer is a period you can justify against both — plus a record of who decided it.

ClauseWatch gives that answer. It reads a structured model of obligations and the prose of the
instruments behind them, and when two sources pull in opposite directions it shows both with
their citations and reports that the decision is **unmade**:

> Both clauses stand until someone signs. The dataset keeps a `decidedBy` and a `decidedAt`
> field for exactly that, and they are empty.

This is the part that needed structured content. A keyword search over the same texts returns
Art. 19 and stops. It cannot know that a clause in a *different regulation* constrains the
same artifact from the opposite direction, because that fact is not inside either document.
It is in the relationship between them — which is to say, in the schema.

## Demo

```bash
git clone https://github.com/oleg-vdv/clausewatch && cd clausewatch/agent
npm install && npm run web       # http://localhost:4173
```

**No credentials.** No login, no token, no API key. The dataset is public, so a fresh clone
reads it over the public query API and renders the full report. The knowledge base and the
LLM agent do need a Context token, which you cannot have — so `--check` and the page footer
say which of the two sources the answer came from, rather than crediting one they never
touched.

It also runs with no model at all:

```bash
npm run ask -- --profile biometric-access --no-llm   # provider, high-risk, KZ → EU
npm run ask -- --profile support-agent --no-llm      # deployer, risk class unset
```

Two elements of the viewer do the arguing.

**The pressure bar** — a solid edge on the left where Art. 19 states six months, and a
hatched, edgeless right where the GDPR caps the period without naming one. Drawing a tidy
range there would be a lie about the law.

**The signature block** — every conflict prints a *decided by* and a *date* rule. Resolved,
they carry a name and a date. Open, they are two empty lines in a compliance report. The
thesis as a form field rather than a paragraph.

The Studio is live at **https://clausewatch.sanity.studio/**, with open conflicts on the first
screen, because that is the one thing an editor of this dataset actually does.

## Code

**https://github.com/oleg-vdv/clausewatch**

```
studio/   schema, desk structure, seed dataset
agent/    MCP client, domain layer, LLM agent, deterministic report, viewer
demo/     saved runs with their tool calls attached
```

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

**`direction` on a claim.** An earlier version bucketed claims by *does it state a number*,
which filed GDPR Art. 5(1)(e) under silence. It is not silent: it caps the period without
naming one. Floor, ceiling and duty-only are three different answers.

**A conflict holds a decision, not a resolution rule.** An agent that silently picks the
stricter number is guessing on your behalf. One that shows both sides and cites a named,
dated decision produces something an auditor can accept.

## How I Used Sanity

### What I pointed Sanity Context at

Two website sources, both crawled to exact paths rather than wildcards:

| Source | Paths | Documents |
|---|---|---|
| artificialintelligenceact.eu | Arts. 3, 6, 9, 11–14, 16–21, 26, 27, 72, 73, 99 and Annexes I, III, IV | 21 |
| gdpr-info.eu | Arts. 5, 17, 25, 30, 32 | 5 |

26 documents, indexed into **10 entries**. Curated on purpose — and also capped, because the
Context beta allows 150 indexed documents on this plan and I hit that twice before narrowing
properly.

The indexing surprised me. Entries are topic nodes rather than chunks: each carries an article
range, a topic list, cross-references (`excludes: … see <other entry>`) and a numbered Sources
block with a URL behind every statement.

### Which Context tools I used

Two endpoints, because **one endpoint serves one mode**. Attaching a Knowledge Base to an
endpoint that already served a dataset replaced the GROQ tools entirely.

| Endpoint | Tools | Job |
|---|---|---|
| `clausewatch-data` | `initial_context`, `groq_query`, `schema_explorer`, `array_field_reader` | *which* obligations bind this system |
| `clausewatch-docs` | `initial_context`, `knowledge_base_read` | *what the clause says*, with its source link |

Both carry the same endpoint Instructions — the citation discipline the agent must follow,
delivered before it sees any data. The rule that matters most:

> Never fill a gap from your own legal knowledge. If it is not in the dataset or the knowledge
> base, say that it is not there.

Beyond the tools I leaned on two Context features: **Issues**, which surfaced a contradiction
in the corpus, and **Instructions**, which corrected a fact at the source instead of in my
code. Both stories are below.

### What the agent actually did with it

A real tool-use loop. Nothing is pre-fetched: the model gets the two endpoints and has to go
and look. A typical run:

```
1. initial_context         (dataset — schema and the citation rules)
2. kb_initial_context      (knowledge base — the outline of 10 entries)
3. groq_query              (the logging requirement, its claims, its conflicts)
4. kb_knowledge_base_read  (design_documentation, post_market_obligations)
5. groq_query              (jurisdictions, extraterritoriality)
6. kb_knowledge_base_read  (high_risk_categories)
7. groq_query              (system profiles)
```

Seven calls across both endpoints. The answer states it cannot give one number, shows the
floor and the ceiling with citations and effective dates, reports the conflict as open with
nobody named, and notes the obligation does not bite until 2 December 2027. In a second run
the agent found the matching system profile unprompted, treated `riskClass: unknown` as
load-bearing, separated provider duties from deployer ones, and closed with a section titled
*What I can't answer from these sources*.

Saved runs with their tool calls are in
[`demo/`](https://github.com/oleg-vdv/clausewatch/tree/main/demo). The answer alone cannot
show that a number came from the endpoints rather than from the model, so the tool calls
travel with it.

The dataset side does the reasoning that a prose search cannot: claims are filtered by the
jurisdictions a system touches **and** the roles it holds, so a deployer is shown Art. 26(6)
and a provider Art. 19. Telling a deployer that Art. 19 is their duty is not a rounding error,
it is the wrong party.

### Context found a contradiction I had not

While indexing, Context flagged that an entry claimed Annex I lists 21 harmonisation
instruments while the source shows 20 — item 1 deleted by amendment, item 21 added. I checked
against the source: true. It also proposed a Section A/B split that I could **not** verify,
because EUR-Lex blocks automated retrieval.

So the decision recorded in the dataset says the detection was right, states only the verified
part, explicitly excludes the unverified arithmetic, and carries a name and a date.

That is the whole product in one incident. Automated detection is good at *finding*
disagreement and is not authoritative about *resolving* it.

### Where prose alone gets a citation wrong

In one run the agent cited **Art. 26(5)** for the deployer's log-retention duty, from the
knowledge base. The source says **Art. 26(6)**; 26(5) is the monitoring duty. A one-digit
error that reads as correct.

Chasing it was the most useful hour of the build. The knowledge-base entry for Article 26
numbers its own sections, and the fifth one is headed `### 5. Log retention`. Section five of
an entry about Article 26 — and a model reading it produced "Art. 26(5)". The entry states the
rule itself correctly, and **gives no paragraph number at all**:

> Deployers shall keep automatically generated logs for a period appropriate to the intended
> purpose, with a minimum of six months, unless applicable Union or national law … provides
> otherwise.

That is the argument for two layers rather than one. Prose is right about the *rule* and
silent on the *address*; the dataset carries the address, verified by a human against the
source. Art. 26(6) is now a provision with the checked citation, its own claim on the
retention requirement, and the role it binds — which is why a deployer profile is shown
Art. 26(6) and a provider Art. 19.

I also added a Context **Instruction**, which is *honored on every build, over the raw
sources*, so a future rebuild cannot reintroduce the wrong number. Being precise about what
I have and have not verified: that Instruction has not been exercised yet. The corpus has not
changed since, so Context reports entries up to date and no rebuild has run.

The layers check each other in both directions. In another run the agent found a duty present
in the prose that my dataset had not modelled at all, and said so.

### Five things that cost me hours

- **Document ids containing dots are invisible to anonymous readers**, even in a public
  dataset. The CLI said 18 imported, an authenticated `count(*)` said 31, an anonymous one
  said 0. Sanity treats `_id` as a path and public read covers the root path only. An
  authenticated count is not evidence that your dataset is public.

  Worth watching this one happen, because the numbers are the whole story. The slice below is
  terminal output: an import that reports success, a document fetch that comes back
  `{"documents":[],"omitted":[{"reason":"permission"}]}`, a one-document probe with a plain id
  that proves the ids are the cause, and a final anonymous `count(*)` of 18 after renaming
  everything to hyphens.

  {% agent_session SLICE_TAG_PUBLIC_DATASET %}
- **Wildcard include patterns do not filter a website source; exact paths do.** `/article/*`
  pulled 200 pages including Polish and French translations of the same articles. For a legal
  agent a translation is a correctness hazard, not noise — and the sitemap is the tell: if a
  crawl returns more pages than the sitemap lists, it followed in-page language links.
- **"Sitemap only" overrides include patterns** rather than narrowing them. 691 documents.
- **An entry outlives its sources.** Delete a source and the prose stays while every citation
  becomes `_source no longer available` — and the entry is still listed in `initial_context`
  for the agent to read and cite. Dismissing the issue keeps the entry; only a rebuild cleared
  them.
- **Context rewrites your GROQ**, which changes result shapes: `roles[]->name` comes back as
  `[{name, _id}]`. It also injects `_type != "sanity.agentContext"` and pins
  `perspective: published`. Worth knowing when a query behaves differently in Vision.

And one that is nobody's fault but mine: `count()` of a missing field is **null, not 0**, so a
role filter written as `count(appliesToRoles) == 0` for *binds everyone* silently dropped every
GDPR claim. It looked fine in the provider's report and only broke for the deployer.

## Sanity Project Details

- **Project ID:** `4yzoidsq`
- **Dataset:** `production` (public)
- **Studio:** https://clausewatch.sanity.studio/

Public dataset, no token — every conflict, both sides, with its decision:

```
https://4yzoidsq.api.sanity.io/v2026-09-19/data/query/production?query=*[_type=="conflict"]{summary,nature,resolution,decidedBy,"sides":sides[]->{"cite":source->shortName+" "+citation}}
```

## Agent Session

The whole build is on record — 485 messages in one Claude Code session. A note before you
open it: I work in Russian, so the conversation is in Russian. Everything that matters here
is not. The tool calls, the GROQ queries, the MCP traces, the terminal output and the agent's
own answers are all English, and that is what each slice below is made of. I have said what
to look for in front of each one.

### The agent refuses to give one number

The question is how long a provider must keep logs for a high-risk biometric system. Watch
the trace: `initial_context` on the dataset, then on the knowledge base, then a GROQ query it
writes itself, then two knowledge-base entries, then jurisdictions, then profiles. Seven
calls across both Context endpoints before it says anything.

Then read the answer. It gives a floor with a citation, a ceiling with a citation, states
that the conflict between them is unresolved and that nobody is recorded as having decided
it, and points out that the obligation does not apply until December 2027. It never produces
the single number the question was fishing for.

{% agent_session SLICE_TAG_AGENT_RUN %}

### Context found a contradiction I had not

This one starts with a Sanity Context issue: an entry says Annex I lists 21 harmonisation
instruments, the source shows 20. You will see me go to the source rather than take it on
trust — the `curl` that pulls the annex, the numbered paragraphs it prints, and the moment
the amendment shows up: item 1 struck, item 21 added.

The end of the slice is the part I would point a judge at. Context also proposed a Section
A / Section B split, and I could not verify it, because EUR-Lex blocks automated retrieval.
So the decision recorded in the dataset states the verified part and explicitly excludes the
rest. Finding disagreement and settling it are different jobs.

{% agent_session SLICE_TAG_ANNEX_I %}

## Honest limits

The knowledge base is built from authoritative reproductions, not the Official Journal —
EUR-Lex blocks automated retrieval. Every `source` carries an `officialUrl` and the agent is
instructed to give that one for anything the reader will act on.

The dataset is small and deliberately so: 2 instruments, 9 provisions, 2 requirements,
3 conflicts, 2 system profiles. A working core that demonstrates the model, not a compliance
product. Nothing here is legal advice.
