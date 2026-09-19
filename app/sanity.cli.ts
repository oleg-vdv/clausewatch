import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: 'o7br4pucm',
    entry: './src/App.tsx',
    title: 'Signing desk',
  },
  // Without an explicit hostname the dev server binds IPv6 only, and anything that
  // resolves localhost to 127.0.0.1 — curl, most preview tooling — sees nothing there.
  server: {
    hostname: '127.0.0.1',
    port: 3333,
  },
})
