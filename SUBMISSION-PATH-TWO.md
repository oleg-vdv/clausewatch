---
title: "The move the agent is not allowed to make"
published: false
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

## What I Built

A signing desk. One screen, one button, and the button does the single thing the agent in
this system is forbidden to do.

The project behind it answers compliance questions across regulations that contradict each
other — the EU AI Act says keep your AI system logs for at least six months, the GDPR says
keep personal data no longer than necessary, and the logs the AI Act mandates contain
personal data by construction. There is no single number that satisfies both. There is a
period someone has to choose and justify.

So the interesting question is not how the agent answers. It is **who is allowed to decide**,
and how you stop the machine from quietly deciding for you.

The answer here is a workflow stored as content beside the content it governs:

```
raised → gathering → review → decided
                             ↘ dismissed
```

Five states, five transitions, and every transition names the actor permitted to make it.
Two are open to an agent: start looking, attach the sources. Three are `human`. Ask the
dataset and it tells you:

```
{"name": "Deciding a conflict", "states": 5, "agentCan": 2, "humanOnly": 3}
```

The agent reads that same document. When it reaches the end of what it may do, it says so:

```
CANNOT Sign the decision (review → decided) — reserved for a person
       Only a person signs. The agent can prepare every part of this and still
       not make the move.
```

That is the strange part, and the part I actually care about. The boundary is not a sentence
in a system prompt that a model can reason its way around on a bad day. It is a row in the
dataset the model queries, rendered in the same Studio a person uses, enforced the same way
for both.

The signing desk is where the human side of that boundary lives.

**Who it is for:** whoever ends up holding the compliance file at a small company — usually a
founder or a lone engineer, not a legal department. They are the ones who get handed an
auditor's question and have nobody to escalate it to. The agent does the reading; they do the
deciding, and the point of the desk is that the split is visible rather than assumed.

## Demo

**The app:** https://www.sanity.io/@o7br4pucm/application/wpdwxiwyygohwmtn59yz92ap
Deployed to the organisation dashboard. It requires a Sanity login — deliberately, since it
writes signed decisions, and an anonymous signature is not one. If you are not logged in you
will get Sanity's login screen rather than the app.

**Everything else is public, no account needed:**

- Studio: https://clausewatch.sanity.studio/ — open conflicts on the first screen
- The workflow itself, straight from the API:
  `https://4yzoidsq.api.sanity.io/v2026-09-19/data/query/production?query=*[_type=="workflow"][0]`
- The repo runs with no credentials at all: `npm install && npm run ask -- --workflow`

The desk lists whatever the dataset says is in `review` — it holds no state of its own. For
each conflict it shows both clauses verbatim with their citations, the steps the agent
already took with timestamps and the actor on each, and then a form. If the list is empty
when you open it, nothing is waiting: see the note under Sanity Project Details.

The form asks for what was decided, why, and a name. The signature is **typed**. The App SDK
has no current-user hook, which turned out to be the right accident: a name that fills itself
in is not a signature, and the whole reason the field exists is that a person chose to put
their name against a reading of the law.

Signing writes the decision and its transition record in one edit, so the state cannot move
without the evidence of who moved it.

![The signing desk: a note saying only a person signs, the two conflicting clauses side by side with their citations, the two steps the agent already took, and a form with an empty signature line.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/9icb3896gf0j9e4ac4v2.png)

![The signing form: a dropdown for what was decided, a box for why, and a blank line labelled 'Signed by'.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/zfdl3spqrexsbkagmq0f.JPG)

## Code

**https://github.com/oleg-vdv/clausewatch**

```
studio/   schema, desk structure, seed dataset
app/      the signing desk — Sanity App SDK
agent/    MCP client, the agent, the workflow gate, a server-rendered viewer
demo/     saved agent runs with their tool calls attached
```

The workflow is four types: `workflow` holding states and transitions, `workflowState`,
`transition` (which carries `from`, `to`, `actor` and the fields a move requires), and
`transitionRecord` for what actually happened. A `conflict` carries its `state` and a
`history[]` of records.

`agent/src/gate.ts` computes the permitted moves for an actor by reading the workflow. The
same function serves both sides, and the same transition blocks them differently:

```
as the agent:  CANNOT Sign the decision — reserved for a person
as the human:  CANNOT Sign the decision — needs rationale, decidedBy, decidedAt
```

One table, two actors, no second set of rules to keep in sync.

## My Build Process

Claude Code, in the desktop app, in one sitting. The whole session is 485 messages and it is
public — including the parts I would rather it were not. What follows is the honest version.

### The prompts that worked were the ones that refused to guess

The single most useful instruction I gave, early, was to treat the dataset as the authority
and stop inventing:

> Never fill a gap from your own legal knowledge. If it is not in the dataset or the
> knowledge base, say that it is not there.

That went into the Sanity Context endpoint instructions rather than into my chat, so it
reaches the model before it sees any data. Everything good about the output traces back to
it. The agent's answers started saying "I cannot tell you" in the right places, and once that
happened the product's shape became obvious — if the machine will admit what it does not
know, the interesting design question is what to do with the gap. Hence the signing desk.

### Where it went wrong, in order

**It published my API token to a public GitHub repo.** I asked it to put the project on
GitHub; it created the repo, pushed, and *then* ran a secret scan — which found a live Sanity
token sitting in `.env.example`, where I had pasted it instead of into `.env`. The repo went
private within seconds, the token was revoked and replaced, and the history was rewritten to
a single clean commit. The order was the bug: the scan should have run before the push, and
the model said so itself afterwards. I am leaving this in the writeup because a build log
that only contains the parts that went well is not a build log.

**It confidently corrected Sanity, and was wrong.** Sanity Context flagged a real
contradiction while indexing: an entry claimed Annex I of the AI Act lists 21 harmonisation
instruments where the source shows 20. Context also proposed a Section A/B split of 12 and 8.
Claude told me that split was wrong. Then it checked the actual page, found its own reading
was the unverified one, and said so plainly. The decision recorded in the dataset now states
only the verified part and excludes the arithmetic neither of us could confirm, because
EUR-Lex blocks automated retrieval.

**A patch script reported success and had changed nothing.** It edited three files with a
Python script that did not verify its replacements; one silently missed, and `--check` kept
printing two empty lists. It was caught only because I ran the thing from a fresh clone. The
lesson is not "models are careless" — it is that an edit which cannot fail loudly will
eventually fail quietly.

**Three corpus rebuilds before the knowledge base was right.** `/article/*` as an include
pattern did not filter at all: 200 pages including Polish and French translations of the same
articles. Turning on "Sitemap only" made it worse — 691 documents, because that switch
overrides include patterns rather than narrowing them. Exact paths worked first time and
every time. The corpus is now 26 deliberately chosen documents.

**And the bug I would not have found by reading the code.** The role filter used
`count(appliesToRoles) == 0` to mean "binds everyone". In GROQ, `count()` of a missing field
is `null`, not `0` — so every GDPR claim silently vanished. The provider's report looked
perfect. Only the deployer's was wrong, and only because the two profiles differ.

### The course-correction that mattered most

Two-thirds of the way in I asked it to check the submission against the challenge rules. It
came back with something I had not asked about: a judge cannot hold our organisation token,
so cloning the repo and running it ended at `SANITY_CONTEXT_TOKEN is not set`.

We split the client. With a token it goes through the Context MCP endpoints; without one it
reads the same public dataset over the query API and says so in the footer and in `--check`,
rather than crediting a source it never touched. Then it cloned from GitHub into a temp
directory and ran it with no credentials to prove the fix, which is the check I would have
skipped.

### Reaching past the Studio

Both of the things the brief said it wanted to see, and they turned out to be one thing.

The **workflow** came first, because the process already existed and was hiding in an enum:
a conflict had a `resolution` field and nothing that said who was allowed to set it. Pulling
it out into states and transitions took an afternoon and immediately paid for itself — the
agent stopped needing to be told what it may not do, because it could query it.

The **App SDK** app followed from that. Once `review → decided` was marked `human`, there had
to be somewhere a human makes that move, and the Studio was the wrong place: the Studio is
where you edit a document, not where you sign one. The app is 200 lines, reads the workflow
and the conflicts with `useQuery`, and writes with `useEditDocument` and
`useApplyDocumentActions`. It holds no state of its own, which is the property I wanted —
close the tab mid-decision and nothing is half-saved.

### One undocumented thing, for whoever hits it next

`sanity dev` for an App SDK app binds IPv6 only. The port listens on `[::1]:3333` and
anything resolving localhost to `127.0.0.1` — curl, most preview tooling — sees a dead port
and a blank page with no error. `server: {hostname: '127.0.0.1'}` in `sanity.cli.ts` fixes it.

Also worth knowing: token permissions cannot be edited after creation. Deploying an App SDK
app needs **Manage SDK Apps**, so if your deploy token lacks it, you are making a new token.

## Sanity Project Details

- **Project ID:** `4yzoidsq`
- **Dataset:** `production` (public)
- **Studio:** https://clausewatch.sanity.studio/
- **App:** https://www.sanity.io/@o7br4pucm/application/wpdwxiwyygohwmtn59yz92ap

The workflow and the conflicts it governs, no token required:

```
https://4yzoidsq.api.sanity.io/v2026-09-19/data/query/production?query=*[_type=="workflow"][0]{name,states,transitions}
```

```
https://4yzoidsq.api.sanity.io/v2026-09-19/data/query/production?query=*[_type=="conflict"]{summary,state,decidedBy,"moves":history[]{to,actor,actorKind}}
```

Two of the three conflicts are decided, and the second one was signed through the app in
this post rather than seeded that way. Its history reads:

```
raised    → gathering   clausewatch-agent (agent)
gathering → review      clausewatch-agent (agent)
review    → decided     Oleg Vdovin (human)   2026-09-19 15:25
```

Which means that if you open the signing desk now it will tell you nothing is waiting for a
signature. That is the desk working, not the desk broken: the conflict in the screenshots
above is the one that was signed. The third conflict is still `raised` and untouched, so the
agent has somewhere to go next.

## Agent Session

The whole build, 485 messages. I work in Russian, so the conversation is Russian; the tool
calls, the queries, the terminal output and the model's own English prose are not, and the
slices below are made of those. Each card opens collapsed — click the ▸ for the output.

### The bug that only showed up for one profile

Terminal output. An import reports success, a document fetch comes back
`{"documents":[],"omitted":[{"reason":"permission"}]}`, a one-document probe proves the
document ids are the cause, and an anonymous `count(*)` of 18 confirms the fix. This is the
moment the project stopped being provably public and started being actually public.

{% agent_session building-clausewatch-an-agent-over-contradictory-ai-regulation-omcvgj 114..114 %}

### Checking a citation against the source

Thirty seconds that decided how the whole content model works. A script pulls Article 26 and
prints its numbered paragraphs: paragraph 5 is the duty to monitor, paragraph 6 is the duty
to keep logs. The knowledge base had attributed the log duty to 26(5) — its own section
numbering read as paragraph numbering — and the structured layer is where the verified
citation now lives.

{% agent_session building-clausewatch-an-agent-over-contradictory-ai-regulation-omcvgj 313..313 %}

## Honest limits

The brief suggested Next.js or Astro on the front. I used neither: the app is built on the
Sanity App SDK, which the brief named as a bonus, and the public viewer is a small
server-rendered Node app with no framework at all. If that is a miss against the prompt, it
is a deliberate one — the App SDK is what puts the signing screen next to the content it
signs.

The dataset is small: 2 instruments, 9 provisions, 2 requirements, 3 conflicts, 2 system
profiles, 1 workflow. It is a working core that demonstrates the model, not a compliance
product. Nothing here is legal advice.
