import {claim} from './claim'
import {conflict} from './conflict'
import {jurisdiction} from './jurisdiction'
import {provision} from './provision'
import {requirement} from './requirement'
import {role} from './role'
import {source} from './source'
import {systemProfile} from './systemProfile'
import {transition} from './transition'
import {transitionRecord} from './transitionRecord'
import {workflow} from './workflow'
import {workflowState} from './workflowState'

export const schemaTypes = [
  // documents
  source,
  provision,
  requirement,
  conflict,
  systemProfile,
  role,
  jurisdiction,
  workflow,
  // objects
  claim,
  workflowState,
  transition,
  transitionRecord,
]
