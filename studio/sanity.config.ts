import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'clausewatch',
  title: 'ClauseWatch',

  projectId: '4yzoidsq',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool({defaultApiVersion: '2026-09-19'})],

  schema: {
    types: schemaTypes,
  },
})
