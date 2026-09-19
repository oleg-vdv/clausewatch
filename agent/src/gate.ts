import type {ConflictProgress, Transition, Workflow} from './context.js'

/**
 * What an actor is allowed to do next, decided by reading the workflow rather than
 * by trusting a rule in a prompt.
 *
 * The agent asks this before it tries to move anything. It can gather and cite; the
 * transition that signs a decision is marked `human`, so the agent is refused by the
 * data itself — the same data a person sees in the Studio.
 */

export type Actor = 'agent' | 'human'

export interface Move {
  transition: Transition
  allowed: boolean
  reason: string
}

export function movesFor(workflow: Workflow, conflict: ConflictProgress, actor: Actor): Move[] {
  return workflow.transitions
    .filter((t) => t.from === conflict.state)
    .map((transition) => {
      const missing = (transition.requires ?? []).filter((field) => !conflict.filled.includes(field))

      if (transition.actor !== 'either' && transition.actor !== actor) {
        return {
          transition,
          allowed: false,
          reason: `reserved for ${transition.actor === 'human' ? 'a person' : 'the agent'}`,
        }
      }
      if (missing.length > 0) {
        return {transition, allowed: false, reason: `needs ${missing.join(', ')}`}
      }
      return {transition, allowed: true, reason: 'open'}
    })
}

/** Renders the gate as text, for the CLI and for anything the agent prints. */
export function describeMoves(workflow: Workflow, conflict: ConflictProgress, actor: Actor): string {
  const state = workflow.states.find((s) => s.key === conflict.state)
  const lines: string[] = [
    `${conflict.summary}`,
    `  state: ${state?.title ?? conflict.state}${state?.isTerminal ? ' (terminal)' : ''}`,
  ]

  if (conflict.history.length) {
    lines.push('  how it got here:')
    for (const step of conflict.history) {
      lines.push(`    ${step.at.slice(0, 10)}  ${step.from ?? '—'} → ${step.to}  by ${step.actor} (${step.actorKind})`)
    }
  }

  const moves = movesFor(workflow, conflict, actor)
  if (moves.length === 0) {
    lines.push(`  nothing leaves ${conflict.state}`)
    return lines.join('\n')
  }

  lines.push(`  as the ${actor}:`)
  for (const {transition, allowed, reason} of moves) {
    lines.push(`    ${allowed ? 'CAN   ' : 'CANNOT'} ${transition.label} (${transition.from} → ${transition.to}) — ${reason}`)
    if (!allowed && transition.note) lines.push(`           ${transition.note}`)
  }
  return lines.join('\n')
}
