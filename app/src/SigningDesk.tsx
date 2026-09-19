import {Suspense, useState} from 'react'
import {useQuery} from '@sanity/sdk-react'

import {ConflictCard} from './ConflictCard'

/**
 * Lists exactly the conflicts the workflow says a person has to act on, and says
 * plainly why they are here rather than handled automatically.
 */

interface WorkflowRow {
  name: string
  humanMoves: Array<{label: string; from: string; to: string; note: string | null}>
}

interface ConflictRow {
  _id: string
  summary: string
  nature: string
  requirement: string | null
  sides: Array<{cite: string; heading: string | null; url: string | null; text: string | null}>
  history: Array<{at: string; to: string; actor: string; actorKind: string; note: string | null}>
}

const WORKFLOW_QUERY = `*[_type == "workflow" && appliesTo == "conflict"][0]{
  name,
  "humanMoves": transitions[actor == "human"]{label, from, to, note}
}`

const AWAITING_QUERY = `*[_type == "conflict" && state == "review"] | order(_createdAt) {
  _id, summary, nature,
  "requirement": requirement->obligation,
  "sides": sides[]->{
    "cite": source->shortName + " " + citation,
    heading,
    "url": coalesce(sourceUrl, source->officialUrl),
    "text": pt::text(text)
  },
  "history": coalesce(history[]{at, to, actor, actorKind, note}, [])
}`

export function SigningDesk() {
  const {data: workflow} = useQuery<WorkflowRow>({query: WORKFLOW_QUERY})
  const {data: awaiting} = useQuery<ConflictRow[]>({query: AWAITING_QUERY})
  const [justSigned, setJustSigned] = useState<string[]>([])

  const signing = workflow?.humanMoves?.find((m) => m.to === 'decided')
  const open = (awaiting ?? []).filter((c) => !justSigned.includes(c._id))

  return (
    <main>
      <header>
        <h1>Signing desk</h1>
        <p className="lede">
          {workflow?.name ?? 'The decision workflow'} keeps{' '}
          <strong>{workflow?.humanMoves?.length ?? 0} moves</strong> for a person. This screen is
          the one that matters: <code>review → decided</code>.
        </p>
        {signing?.note && <p className="rule-note">{signing.note}</p>}
      </header>

      {open.length === 0 ? (
        <p className="empty">
          Nothing is waiting for a signature. When the agent finishes gathering sources for a
          conflict it moves here, and this list fills up.
        </p>
      ) : (
        open.map((conflict) => (
          <Suspense key={conflict._id} fallback={<p className="muted">Loading…</p>}>
            <ConflictCard conflict={conflict} onSigned={() => setJustSigned((s) => [...s, conflict._id])} />
          </Suspense>
        ))
      )}

      <footer>
        Read from project <code>4yzoidsq</code>, dataset <code>production</code>. The list is
        whatever the dataset says is in <code>review</code> — this app has no state of its own.
      </footer>
    </main>
  )
}
