import {existsSync} from 'node:fs'
import {resolve} from 'node:path'

/** Loads ../.env if it exists. Missing file is fine — the shell may supply everything. */
export function loadEnv(): void {
  const envPath = resolve(import.meta.dirname, '../../.env')
  if (existsSync(envPath)) process.loadEnvFile(envPath)
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`)
  return value
}

export interface Config {
  dataEndpoint: string
  docsEndpoint: string
  contextToken: string
  knowledgeBaseId: string
  anthropicKey: string | undefined
  model: string
}

export function readConfig(): Config {
  loadEnv()
  return {
    dataEndpoint: required('SANITY_CONTEXT_ENDPOINT_DATA'),
    docsEndpoint: required('SANITY_CONTEXT_ENDPOINT_DOCS'),
    contextToken: required('SANITY_CONTEXT_TOKEN'),
    knowledgeBaseId: required('SANITY_KNOWLEDGE_BASE_ID'),
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUSEWATCH_MODEL ?? 'claude-sonnet-5',
  }
}
