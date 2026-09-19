import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '4yzoidsq',
    dataset: 'production',
  },
  // Context's GROQ mode refuses a dataset with no deployed Studio, so hosting the Studio
  // is not cosmetic here — it is a hard dependency of the MCP endpoint.
  studioHost: 'clausewatch',
  deployment: {
    appId: 'uqta1o0y4td0im6skw1s2pcl',
  },
})
