import type {Claim, Conflict, Profile, Requirement} from './context.js'

/**
 * The deterministic answer. No model involved: it states only what the dataset
 * holds, in the shape the endpoint instructions demand — every number cited,
 * both sides of every conflict, and silence named as silence.
 *
 * It exists for two reasons. Judges can run it without an API key of their own,
 * and it gives the LLM path something to be checked against: if the model says
 * six months and this says six months with the same citation, the model did not
 * invent the number.
 */

export function renderReport(profile: Profile, requirements: Requirement[]): string {
  const out: string[] = []

  out.push(`# ${profile.name}`)
  if (profile.description) out.push(profile.description)
  out.push(
    [
      `Role: ${profile.roles.join(', ') || 'unspecified'}`,
      `Risk class: ${profile.riskClass}`,
      `Jurisdictions in scope: ${profile.jurisdictions.join(', ')}`,
      profile.agentic ? 'Agentic: takes actions, not only predictions' : null,
    ]
      .filter(Boolean)
      .join(' · '),
  )

  if (requirements.length === 0) {
    out.push(
      '\nNo requirement in this dataset has a claim from any instrument binding in those ' +
        'jurisdictions. That is a statement about the dataset, not about the law.',
    )
    return out.join('\n')
  }

  for (const requirement of requirements) {
    out.push(`\n## ${requirement.obligation}`)

    const floors = requirement.claims.filter((c) => c.direction === 'floor')
    const ceilings = requirement.claims.filter((c) => c.direction === 'ceiling')
    const duties = requirement.claims.filter((c) => c.direction === 'none')

    // Only a requirement that someone has put a period on has a duration question,
    // and only there does a clause's silence about duration mean anything.
    const durationIsAtIssue = floors.length > 0 || ceilings.length > 0

    if (durationIsAtIssue) out.push(renderDuration(floors, ceilings))

    for (const claim of duties) out.push(renderClaim(claim, durationIsAtIssue))

    const open = requirement.conflicts.filter((c) => c.resolution === 'open')
    const decided = requirement.conflicts.filter((c) => c.resolution !== 'open')

    for (const conflict of open) {
      out.push(
        `\n**Unresolved conflict.** ${conflict.summary}` +
          `\nSides: ${conflict.sides.map((s) => s.cite).join('  |  ')}` +
          `\nNo one has decided this yet. It needs a named decision from whoever owns ` +
          `compliance for this system — the dataset records who and when, and this field is empty.`,
      )
    }

    for (const conflict of decided) {
      out.push(
        `\n**Decided.** ${conflict.summary}` +
          `\nSides: ${conflict.sides.map((s) => s.cite).join('  |  ')}` +
          `\nResolution: ${conflict.resolution}` +
          (conflict.decidedBy ? ` — ${conflict.decidedBy}` : '') +
          (conflict.decidedAt ? ` on ${conflict.decidedAt.slice(0, 10)}` : '') +
          (conflict.rationale ? `\n> ${conflict.rationale}` : ''),
      )
    }

    if (requirement.evidenceHint) out.push(`\nEvidence an auditor asks for: ${requirement.evidenceHint}`)
  }

  return out.join('\n')
}

function renderDuration(floors: Claim[], ceilings: Claim[]): string {
  const lines: string[] = ['\nHow long:']

  for (const claim of floors) {
    const period = claim.retentionMonths === null ? 'a minimum it does not quantify' : `${claim.retentionMonths} months`
    lines.push(`- Floor: at least ${period} — ${cite(claim)}`)
    if (claim.conditionalOn) lines.push(`  Applies when: ${claim.conditionalOn}`)
  }

  for (const claim of ceilings) {
    const period =
      claim.retentionMonths === null
        ? 'no fixed number; it caps the period by necessity'
        : `at most ${claim.retentionMonths} months`
    lines.push(`- Ceiling: ${period} — ${cite(claim)}`)
    if (claim.conditionalOn) lines.push(`  Applies when: ${claim.conditionalOn}`)
  }

  if (floors.length && ceilings.length) {
    lines.push(
      '- These push in opposite directions. The answer is a retention period you can justify ' +
        'against both, not a single number either text states.',
    )
  }

  return lines.join('\n')
}

function renderClaim(claim: Claim, durationIsAtIssue: boolean): string {
  const lines = [`\n- ${claim.strength.toUpperCase()}: ${claim.assertion} — ${cite(claim)}`]
  if (claim.conditionalOn) lines.push(`  Applies when: ${claim.conditionalOn}`)
  if (durationIsAtIssue && claim.direction === 'none' && claim.retentionMonths === null) {
    lines.push(
      '  This clause imposes the duty and says nothing about how long. That silence is the clause, not a gap in the data.',
    )
  }
  return lines.join('\n')
}

function cite(claim: Claim): string {
  const binds = claim.binds?.length ? ` [binds the ${claim.binds.map((r) => r.name).join(' and ')}]` : ''
  const date = claim.effectiveFrom ? `, in force from ${claim.effectiveFrom}` : ''
  const url = claim.url ? ` <${claim.url}>` : ''
  return `${claim.cite}${binds}${date}${url}`
}
