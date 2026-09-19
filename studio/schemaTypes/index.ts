import {claim} from './claim'
import {conflict} from './conflict'
import {jurisdiction} from './jurisdiction'
import {provision} from './provision'
import {requirement} from './requirement'
import {role} from './role'
import {source} from './source'
import {systemProfile} from './systemProfile'

export const schemaTypes = [
  // documents
  source,
  provision,
  requirement,
  conflict,
  systemProfile,
  role,
  jurisdiction,
  // objects
  claim,
]
