import {existsSync} from 'node:fs'
import {resolve} from 'node:path'

/** Loads ../.env if it exists. Missing file is fine — the public path needs no secrets. */
export function loadEnv(): void {
  const envPath = resolve(import.meta.dirname, '../../.env')
  if (existsSync(envPath)) process.loadEnvFile(envPath)
}

export interface Config {
  projectId: string
  dataset: string
  apiVersion: string
  dataEndpoint: string
  docsEndpoint: string
  /** Absent for anyone outside this organisation. The dataset still reads without it. */
  contextToken: string | undefined
  knowledgeBaseId: string
  anthropicKey: string | undefined
  model: string
}

const ORG = 'o7br4pucm'
const endpoint = (name: string) => `https://api.sanity.io/v1/context/organizations/${ORG}/mcp/${name}`

/**
 * Defaults point at the published project on purpose. Cloning this repo and running it
 * should work with no .env at all — the dataset is public, and a submission a judge
 * cannot run is not a submission.
 */
export function readConfig(): Config {
  loadEnv()
  return {
    projectId: process.env.SANITY_PROJECT_ID ?? '4yzoidsq',
    dataset: process.env.SANITY_DATASET ?? 'production',
    apiVersion: process.env.SANITY_API_VERSION ?? '2026-09-19',
    dataEndpoint: process.env.SANITY_CONTEXT_ENDPOINT_DATA ?? endpoint('clausewatch-data'),
    docsEndpoint: process.env.SANITY_CONTEXT_ENDPOINT_DOCS ?? endpoint('clausewatch-docs'),
    contextToken: process.env.SANITY_CONTEXT_TOKEN || undefined,
    knowledgeBaseId: process.env.SANITY_KNOWLEDGE_BASE_ID ?? 'kboZJwjuj070',
    anthropicKey: process.env.ANTHROPIC_API_KEY || undefined,
    model: process.env.CLAUSEWATCH_MODEL ?? 'claude-sonnet-5',
  }
}
