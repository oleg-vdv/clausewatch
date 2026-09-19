import {useState} from 'react'
import {useApplyDocumentActions, useDocument, useEditDocument, publishDocument} from '@sanity/sdk-react'

/**
 * One conflict, both clauses, and the form that makes the move the agent cannot.
 *
 * The signature is typed, not filled in from the session. A name that appears by
 * itself is not a signature, and the whole point of the field is that somebody
 * chose to put their name against a reading of the law.
 */

interface Props {
  conflict: {
    _id: string
    summary: string
    nature: string
    requirement: string | null
    sides: Array<{cite: string; heading: string | null; url: string | null; text: string | null}>
    history: Array<{at: string; to: string; actor: string; actorKind: string; note: string | null}>
  }
  onSigned: () => void
}

type Resolution = 'stricter' | 'per-jurisdiction' | 'not-a-conflict' | 'escalated' | 'corrected'

const RESOLUTIONS: Array<{value: Resolution; label: string}> = [
  {value: 'stricter', label: 'Apply the stricter claim'},
  {value: 'per-jurisdiction', label: 'Apply per jurisdiction, separately'},
  {value: 'not-a-conflict', label: 'Not a real conflict — scopes do not overlap'},
  {value: 'corrected', label: 'Corrected — one side was misread'},
  {value: 'escalated', label: 'Escalated to counsel'},
]

export function ConflictCard({conflict, onSigned}: Props) {
  const handle = {documentId: conflict._id, documentType: 'conflict'}
  // Subscribing here is not decoration: without it the edit store has no value for
  // this document yet and the updater is handed undefined on the first write.
  const {data: current} = useDocument(handle)
  const edit = useEditDocument(handle)
  const apply = useApplyDocumentActions()

  const [resolution, setResolution] = useState<Resolution>('stricter')
  const [rationale, setRationale] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = rationale.trim().length >= 20 && name.trim().length >= 2

  async function sign(event: React.FormEvent) {
    event.preventDefault()
    if (!ready || saving) return
    setSaving(true)
    setError(null)

    const at = new Date().toISOString()
    try {
      // One edit: the decision and the transition record, so the state never
      // moves without the evidence of who moved it.
      await edit((doc) => ({
        ...(doc ?? current ?? {}),
        state: 'decided',
        resolution,
        rationale: rationale.trim(),
        decidedBy: name.trim(),
        decidedAt: at,
        history: [
          ...(((doc ?? current)?.history as unknown[] | undefined) ?? []),
          {
            _key: `h-decided-${at}`,
            _type: 'transitionRecord',
            at,
            from: 'review',
            to: 'decided',
            actorKind: 'human',
            actor: name.trim(),
            note: 'Signed at the signing desk.',
          },
        ],
      }))
      await apply(publishDocument(handle))
      onSigned()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setSaving(false)
    }
  }

  return (
    <article>
      <p className="eyebrow">
        awaiting a signature · {conflict.nature}
        {conflict.requirement ? ` · ${conflict.requirement}` : ''}
      </p>
      <h2>{conflict.summary}</h2>

      <div className="sides">
        {conflict.sides.map((side) => (
          <div key={side.cite} className="side">
            <p className="cite">
              {side.url ? (
                <a href={side.url} target="_blank" rel="noreferrer">
                  {side.cite}
                </a>
              ) : (
                side.cite
              )}
            </p>
            {side.heading && <p className="heading">{side.heading}</p>}
            {side.text && <blockquote>{side.text}</blockquote>}
          </div>
        ))}
      </div>

      {conflict.history.length > 0 && (
        <ol className="history">
          {conflict.history.map((step) => (
            <li key={step.at}>
              <span className="when">{step.at.slice(0, 10)}</span> → {step.to} by {step.actor}{' '}
              <span className="kind">({step.actorKind})</span>
              {step.note && <span className="note">{step.note}</span>}
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={sign}>
        <label>
          <span>What was decided</span>
          <select value={resolution} onChange={(e) => setResolution(e.currentTarget.value as Resolution)}>
            {RESOLUTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Why — this is what the agent will quote back to the next person who asks</span>
          <textarea
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.currentTarget.value)}
            placeholder="State what you checked, what you are relying on, and what you are deliberately not claiming."
          />
        </label>

        <label className="sign">
          <span>Signed by</span>
          <input
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Type your name"
            autoComplete="off"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={!ready || saving}>
          {saving ? 'Signing…' : 'Sign the decision'}
        </button>
        {!ready && (
          <p className="hint">
            A reason of at least twenty characters and a name. Both are stored on the document;
            neither can be filled in by the agent.
          </p>
        )}
      </form>
    </article>
  )
}
