import {createServer} from 'node:http'

import {readConfig} from './config.js'
import {ContextClient} from './context.js'
import {renderIndex, renderProfile, escape, setAccessNote} from './view.js'

/**
 * The read-only viewer. It exists so a judge — or an auditor — can see the same
 * answer the agent gives without running a terminal or holding an API key.
 *
 * Everything is fetched per request through Context MCP. No cache, no local copy
 * of the law: if the dataset changes, this page changes with it.
 */

const config = readConfig()
const context = new ContextClient(config)
const port = Number(process.env.PORT ?? 4173)

setAccessNote(context.access)

const server = createServer((req, res) => {
  void handle(req.url ?? '/')
    .then(({status, html}) => {
      res.writeHead(status, {'Content-Type': 'text/html; charset=utf-8'})
      res.end(html)
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      res.writeHead(502, {'Content-Type': 'text/html; charset=utf-8'})
      res.end(
        `<!doctype html><meta charset="utf-8"><title>Context did not answer</title>` +
          `<body style="font:16px/1.5 system-ui;max-width:34rem;margin:4rem auto;padding:0 1rem">` +
          `<h1 style="font-size:1.3rem">Context did not answer</h1>` +
          `<p>${escape(message)}</p>` +
          `<p>The endpoints are the two Sanity Context MCP URLs in <code>.env</code>. ` +
          `Check the token has Context Viewer permission and that the dataset still has a deployed Studio.</p>`,
      )
    })
})

async function handle(url: string): Promise<{status: number; html: string}> {
  const path = url.split('?')[0] ?? '/'

  if (path === '/' || path === '') {
    return {status: 200, html: renderIndex(await context.profiles())}
  }

  const match = /^\/p\/([a-z0-9-]+)\/?$/.exec(path)
  if (match?.[1]) {
    const profile = await context.profile(match[1])
    if (!profile) return notFound(`No system profile called “${match[1]}”.`)
    const requirements = await context.obligations(profile.jurisdictions, profile.roles)
    return {status: 200, html: renderProfile(profile, requirements)}
  }

  if (path === '/favicon.ico') return {status: 404, html: ''}
  return notFound('No page at that address.')
}

function notFound(message: string): {status: number; html: string} {
  return {
    status: 404,
    html:
      `<!doctype html><meta charset="utf-8"><title>Not found</title>` +
      `<body style="font:16px/1.5 system-ui;max-width:34rem;margin:4rem auto;padding:0 1rem">` +
      `<h1 style="font-size:1.3rem">Not found</h1><p>${escape(message)}</p>` +
      `<p><a href="/">Back to the systems on file</a></p>`,
  }
}

server.listen(port, () => {
  process.stdout.write(`clausewatch viewer on http://localhost:${port}\n`)
})
