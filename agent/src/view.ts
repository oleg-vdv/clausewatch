import type {Claim, Conflict, Profile, Requirement} from './context.js'

/**
 * Server-rendered HTML. The visual language is borrowed from consolidated legal
 * texts rather than from dashboards: a marginal column for the things a lawyer
 * writes in the margin (who it binds, when it bites), citations set as monospace
 * because a citation is an address, and — the one loud element — an unsigned
 * decision line wherever a conflict has no name against it.
 */

export const escape = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const STYLE = `
:root {
  --paper: #eceff3;
  --paper-sunk: #e3e7ed;
  --ink: #12161c;
  --ink-soft: #4a5464;
  --rule: #c3cad4;
  --floor: #14504a;
  --ceiling: #8c2f39;
  --open: #9a6410;
  --measure: 34rem;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #141821;
    --paper-sunk: #1b202b;
    --ink: #e7eaef;
    --ink-soft: #97a1b2;
    --rule: #2f3846;
    --floor: #5fbfae;
    --ceiling: #e08a92;
    --open: #d8a23f;
  }
}
:root[data-theme="dark"] {
  --paper: #141821;
  --paper-sunk: #1b202b;
  --ink: #e7eaef;
  --ink-soft: #97a1b2;
  --rule: #2f3846;
  --floor: #5fbfae;
  --ceiling: #e08a92;
  --open: #d8a23f;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: Newsreader, Georgia, serif;
  font-size: 1.0625rem;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, .eyebrow, .masthead a {
  font-family: "Familjen Grotesk", system-ui, sans-serif;
  font-weight: 600;
  letter-spacing: -0.015em;
}

code, .cite, .stamp { font-family: "JetBrains Mono", ui-monospace, monospace; }

.wrap { max-width: 68rem; margin: 0 auto; padding: 0 16px 6rem; }

.masthead {
  display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; align-items: baseline;
  border-bottom: 2px solid var(--ink);
  padding: 1.75rem 0 .75rem;
  margin-bottom: 2.5rem;
}
.masthead a { color: inherit; text-decoration: none; font-size: 1.25rem; }
.masthead .sub { color: var(--ink-soft); font-size: .8125rem; font-family: "JetBrains Mono", monospace; }

.eyebrow {
  font-size: .6875rem; text-transform: uppercase; letter-spacing: .14em;
  color: var(--ink-soft); font-weight: 600;
}

/* The two-column grid is the page: margin notes left, text right. */
.entry { display: grid; grid-template-columns: 11rem minmax(0, var(--measure)); gap: 0 2.5rem; margin-bottom: 3.25rem; }
.margin { grid-column: 1; text-align: right; padding-top: .3rem; }
.margin p { margin: 0 0 .5rem; font-size: .75rem; line-height: 1.4; color: var(--ink-soft); font-family: "JetBrains Mono", monospace; }
.body { grid-column: 2; }

h1 { font-size: clamp(1.9rem, 4.5vw, 2.9rem); line-height: 1.08; margin: 0 0 .4rem; }
h2 { font-size: 1.4rem; margin: 0 0 .9rem; }
p { margin: 0 0 .85rem; }
.lede { color: var(--ink-soft); max-width: var(--measure); }

.cite { font-size: .8125rem; color: var(--ink-soft); }
.cite a { color: inherit; }
.note { font-size: .875rem; line-height: 1.5; color: var(--ink-soft); max-width: 30rem; }
.note strong { color: var(--ink); font-weight: 500; }

.duty { border-top: 1px solid var(--rule); padding: .9rem 0; }
.duty .strength { font-size: .6875rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); }
.duty .when { font-size: .875rem; color: var(--ink-soft); margin: .35rem 0 0; }

/* Signature element, part one: the pressure bar. The floor is a number, the
   ceiling is not, so the right-hand side is hatched rather than measured. */
.pressure { margin: 1.25rem 0 1.5rem; }
.pressure-bar {
  position: relative; height: 3.25rem;
  border-left: 3px solid var(--floor);
  border-right: 3px solid var(--ceiling);
  background:
    repeating-linear-gradient(135deg, transparent 0 7px, color-mix(in srgb, var(--ceiling) 16%, transparent) 7px 8px)
      right / 45% 100% no-repeat,
    var(--paper-sunk);
}
.pressure-bar::after {
  content: attr(data-middle);
  position: absolute; inset: 0; display: grid; place-items: center;
  font-family: "Familjen Grotesk", sans-serif; font-size: .8125rem; color: var(--ink-soft);
  padding: 0 1rem; text-align: center;
}
.pressure-ends { display: flex; justify-content: space-between; gap: 1rem; margin-top: .45rem; }
.pressure-ends span { font-size: .6875rem; line-height: 1.35; font-family: "JetBrains Mono", monospace; flex: 0 1 48%; }
.pressure-ends .lo { color: var(--floor); }
.pressure-ends .hi { color: var(--ceiling); text-align: right; }

@media (prefers-reduced-motion: no-preference) {
  .pressure-bar { animation: widen .5s cubic-bezier(.2,.7,.3,1) both; }
  @keyframes widen { from { clip-path: inset(0 50% 0 50%); } to { clip-path: inset(0 0 0 0); } }
}

/* Signature element, part two: the unsigned line. */
.decision { border: 1px solid var(--rule); background: var(--paper-sunk); padding: 1.1rem 1.25rem; margin: 1.25rem 0; }
.decision h3 { font-size: 1rem; margin: 0 0 .5rem; }
.decision .sides { font-family: "JetBrains Mono", monospace; font-size: .8125rem; color: var(--ink-soft); margin-bottom: .75rem; }
.decision.open { border-left: 3px solid var(--open); }
.decision.signed { border-left: 3px solid var(--floor); }

.signature { margin-top: 1.1rem; display: grid; grid-template-columns: 1fr 9rem; gap: 0 1.25rem; align-items: end; }
.signature .line { border-bottom: 1px solid var(--ink); height: 1.6rem; }
.signature .line.filled { font-family: Newsreader, serif; font-style: italic; font-size: 1.05rem; padding-bottom: .15rem; }
.signature .label { font-size: .6875rem; text-transform: uppercase; letter-spacing: .12em; color: var(--ink-soft); padding-top: .35rem; }
.rationale { margin: .9rem 0 0; font-size: .9375rem; color: var(--ink-soft); border-left: 2px solid var(--rule); padding-left: .9rem; }

.stamp { font-size: .75rem; color: var(--ink-soft); }

.profiles { list-style: none; padding: 0; margin: 0; }
.profiles li { border-top: 1px solid var(--rule); }
.profiles a { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: .5rem 1.5rem; padding: 1.1rem 0; text-decoration: none; color: inherit; }
.profiles a:hover .name, .profiles a:focus-visible .name { text-decoration: underline; text-underline-offset: 3px; }
.profiles .name { font-family: "Familjen Grotesk", sans-serif; font-size: 1.2rem; font-weight: 600; }
.profiles .desc { color: var(--ink-soft); font-size: .9375rem; grid-column: 1; }
.profiles .facts { font-family: "JetBrains Mono", monospace; font-size: .75rem; color: var(--ink-soft); text-align: right; }

a:focus-visible, :focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

footer { border-top: 1px solid var(--rule); margin-top: 3rem; padding-top: 1rem; }
footer p { font-size: .8125rem; color: var(--ink-soft); }

/* A printed page of this is evidence, so it has to survive the printer: the hatched
   end must still be hatched, and a citation has to carry its address. */
@media print {
  :root { --paper: #fff; --paper-sunk: #f4f5f7; --ink: #000; --ink-soft: #444; --rule: #999; }
  .pressure-bar, .decision { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .entry, .decision, .duty { break-inside: avoid; }
  .cite a[href^="http"]::after { content: " " attr(href); font-size: .6875rem; word-break: break-all; }
  .masthead { border-bottom-width: 1px; }
  footer { break-before: avoid; }
}

@media (max-width: 46rem) {
  .entry { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .margin { grid-column: 1; text-align: left; padding: 0 0 .75rem; }
  .margin p { display: inline; margin-right: 1rem; }
  .body { grid-column: 1; }
  .profiles a { grid-template-columns: minmax(0,1fr); }
  .profiles .facts { text-align: left; }
}
`

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<header class="masthead">
  <a href="/">ClauseWatch</a>
  <span class="sub">obligations, their sources, and who decided</span>
</header>
${body}
<footer><p>Every line on this page came from a Sanity Context endpoint: the structured dataset for what applies, the knowledge base for what the text says. Nothing here is the model&rsquo;s own recollection of the law.</p></footer>
</div>
</body>
</html>`
}

export function renderIndex(profiles: Profile[]): string {
  const rows = profiles
    .map(
      (profile) => `<li><a href="/p/${escape(profile.slug)}">
      <span class="name">${escape(profile.name)}</span>
      <span class="facts">${escape(profile.roles.join(' / ') || 'role unset')} · ${escape(profile.riskClass)} · ${escape(profile.jurisdictions.join(' '))}</span>
      <span class="desc">${escape(profile.description)}</span>
    </a></li>`,
    )
    .join('\n')

  return shell(
    'ClauseWatch',
    `<div class="entry">
      <div class="margin"><p class="eyebrow">Systems on file</p></div>
      <div class="body">
        <h1>What binds this system, and who decided the parts the texts disagree on.</h1>
        <p class="lede">Pick a system. Its obligations are assembled from the instruments that bind its role
        in the jurisdictions it touches — each with the clause it came from and the date it starts to bite.
        Where two instruments pull in opposite directions, both are shown, and the decision between them
        is a signature, not an inference.</p>
      </div>
    </div>
    <div class="entry">
      <div class="margin"><p>${profiles.length} profile${profiles.length === 1 ? '' : 's'}</p></div>
      <div class="body"><ul class="profiles">${rows}</ul></div>
    </div>`,
  )
}

export function renderProfile(profile: Profile, requirements: Requirement[]): string {
  const facts = [
    `role: ${profile.roles.join(', ') || 'unset'}`,
    `risk: ${profile.riskClass}`,
    `reaches: ${profile.jurisdictions.join(', ')}`,
    profile.agentic ? 'takes actions' : null,
    profile.isGpai ? 'general-purpose model' : null,
  ].filter(Boolean) as string[]

  const head = `<div class="entry">
    <div class="margin">${facts.map((f) => `<p>${escape(f)}</p>`).join('')}</div>
    <div class="body">
      <h1>${escape(profile.name)}</h1>
      <p class="lede">${escape(profile.description)}</p>
      ${
        profile.riskClass === 'unknown'
          ? `<p class="lede"><strong>Risk class is not set.</strong> Most duties below turn on
             a high-risk classification that nobody has made for this system yet, so read them
             as conditional.</p>`
          : ''
      }
    </div>
  </div>`

  const body = requirements.length
    ? requirements.map(renderRequirement).join('\n')
    : `<div class="entry"><div class="margin"><p class="eyebrow">Nothing found</p></div>
       <div class="body"><p>No instrument in this dataset binds ${escape(profile.roles.join(' or ') || 'this role')}
       in ${escape(profile.jurisdictions.join(', '))}. That is a fact about the dataset, not about the law.</p></div></div>`

  return shell(`${profile.name} — ClauseWatch`, head + body)
}

function renderRequirement(requirement: Requirement): string {
  const floors = requirement.claims.filter((c) => c.direction === 'floor')
  const ceilings = requirement.claims.filter((c) => c.direction === 'ceiling')
  const duties = requirement.claims.filter((c) => c.direction === 'none')

  const parties = new Set(requirement.claims.flatMap((c) => (c.binds ?? []).map((r) => r.name)))
  const dates = new Set(requirement.claims.map((c) => c.effectiveFrom).filter(Boolean) as string[])

  const margin = [
    `<p class="eyebrow">${escape(requirement.topic)}</p>`,
    parties.size ? `<p>binds: ${escape([...parties].join(', '))}</p>` : '',
    dates.size ? `<p>in force: ${escape([...dates].sort().join(', '))}</p>` : '',
    `<p>${requirement.claims.length} clause${requirement.claims.length === 1 ? '' : 's'}</p>`,
  ].join('')

  return `<div class="entry">
    <div class="margin">${margin}</div>
    <div class="body">
      <h2>${escape(requirement.obligation)}</h2>
      ${floors.length || ceilings.length ? renderPressure(floors, ceilings) : ''}
      ${duties.map(renderDuty).join('')}
      ${requirement.conflicts.map(renderDecision).join('')}
      ${
        requirement.evidenceHint
          ? `<p class="note" style="margin-top:1.25rem"><strong>What an auditor asks for.</strong> ${escape(requirement.evidenceHint)}</p>`
          : ''
      }
    </div>
  </div>`
}

function renderPressure(floors: Claim[], ceilings: Claim[]): string {
  const floor = floors[0]
  const ceiling = ceilings[0]

  const low = floor
    ? `at least ${floor.retentionMonths ?? '—'} months · ${floor.cite}`
    : 'no minimum in these sources'
  const high = ceiling
    ? `${ceiling.retentionMonths === null ? 'no stated number' : `at most ${ceiling.retentionMonths} months`} · ${ceiling.cite}`
    : 'no cap in these sources'

  const middle =
    floor && ceiling
      ? 'you choose a period in here, and justify it against both'
      : floor
        ? 'nothing in these sources caps it'
        : 'nothing in these sources sets a minimum'

  return `<div class="pressure">
    <p class="eyebrow">How long</p>
    <div class="pressure-bar" data-middle="${escape(middle)}"></div>
    <div class="pressure-ends">
      <span class="lo">${escape(low)}</span>
      <span class="hi">${escape(high)}</span>
    </div>
    ${floor && ceiling ? `<p class="note" style="margin-top:.6rem">The hatched end has no edge because no text draws one. ${escape(ceiling.cite)} caps the period by necessity without naming a number.</p>` : ''}
  </div>`
}

function renderDuty(claim: Claim): string {
  return `<div class="duty">
    <span class="strength">${escape(claim.strength)}</span>
    <p style="margin:.2rem 0 .4rem">${escape(claim.assertion)}</p>
    <p class="cite">${link(claim)}${claim.effectiveFrom ? ` · in force ${escape(claim.effectiveFrom)}` : ''}${claim.binds?.length ? ` · binds the ${escape(claim.binds.map((r) => r.name).join(' and '))}` : ''}</p>
    ${claim.conditionalOn ? `<p class="when">Applies when: ${escape(claim.conditionalOn)}</p>` : ''}
  </div>`
}

function link(claim: Claim): string {
  return claim.url
    ? `<a href="${escape(claim.url)}" rel="noreferrer">${escape(claim.cite)}</a>`
    : escape(claim.cite)
}

function renderDecision(conflict: Conflict): string {
  const open = conflict.resolution === 'open'
  const sides = conflict.sides.map((s) => escape(s.cite)).join('  ×  ')

  return `<div class="decision ${open ? 'open' : 'signed'}">
    <p class="eyebrow">${open ? 'Undecided' : 'Decided'} · ${escape(conflict.nature)}</p>
    <h3>${escape(conflict.summary)}</h3>
    <p class="sides">${sides}</p>
    ${conflict.rationale ? `<p class="rationale">${escape(conflict.rationale)}</p>` : ''}
    <div class="signature">
      <div class="line${open ? '' : ' filled'}">${open ? '' : escape(conflict.decidedBy ?? '')}</div>
      <div class="line${open ? '' : ' filled'}">${open ? '' : escape((conflict.decidedAt ?? '').slice(0, 10))}</div>
      <div class="label">Decided by</div>
      <div class="label">Date</div>
    </div>
    ${open ? `<p class="note" style="margin-top:.9rem">Both clauses stand until someone signs. The dataset keeps these two fields for exactly that, and they are empty.</p>` : ''}
  </div>`
}
