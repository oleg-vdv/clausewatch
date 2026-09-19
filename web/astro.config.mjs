import {defineConfig} from 'astro/config'
import node from '@astrojs/node'

// Server-rendered on purpose. Every page is a live read of the dataset, so there is
// nothing here worth building ahead of time: if the content changes, the page changes.
export default defineConfig({
  output: 'server',
  adapter: node({mode: 'standalone'}),
  server: {host: '127.0.0.1', port: 4173},
  vite: {
    // The domain layer lives next to the agent and is shared with it rather than copied.
    server: {fs: {allow: ['..']}},
  },
})
