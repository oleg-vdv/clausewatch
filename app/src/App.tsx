import {Suspense} from 'react'
import {SanityApp, type SanityConfig} from '@sanity/sdk-react'

import {SigningDesk} from './SigningDesk'
import {styles} from './styles'

/**
 * The signing desk.
 *
 * The agent can raise a conflict, pull both clauses, cite them and classify the
 * disagreement. The workflow stored beside the content marks the last move —
 * review → decided — as `human`, so the agent stops there and this is where a
 * person picks it up.
 *
 * One app, one move. Everything else about a conflict is edited in the Studio.
 */
const config: SanityConfig[] = [{projectId: '4yzoidsq', dataset: 'production'}]

export function App() {
  return (
    <>
      <style>{styles}</style>
      <SanityApp config={config} fallback={<p className="muted">Connecting to the dataset…</p>}>
        <Suspense fallback={<p className="muted">Reading the workflow…</p>}>
          <SigningDesk />
        </Suspense>
      </SanityApp>
    </>
  )
}

export default App
