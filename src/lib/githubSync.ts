import type { AppData, GitHubSyncConfig } from './types'

type GitHubContentResponse = {
  sha: string
  content?: string
  encoding?: string
}

function assertConfig(config: GitHubSyncConfig) {
  if (!config.owner.trim()) throw new Error('GitHub owner is required.')
  if (!config.repo.trim()) throw new Error('GitHub repo is required.')
  if (!config.branch.trim()) throw new Error('GitHub branch is required.')
  if (!config.path.trim()) throw new Error('GitHub file path is required.')
  if (!config.token.trim()) throw new Error('GitHub token is required.')
}

function encodePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function apiUrl(config: GitHubSyncConfig): string {
  return `https://api.github.com/repos/${encodeURIComponent(
    config.owner,
  )}/${encodeURIComponent(config.repo)}/contents/${encodePath(config.path)}?ref=${encodeURIComponent(config.branch)}`
}

function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToUtf8(input: string): string {
  const binary = atob(input.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function githubFetch(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}

export async function pullDataFromGitHub(
  config: GitHubSyncConfig,
): Promise<AppData> {
  assertConfig(config)
  const res = await githubFetch(apiUrl(config), config.token, { method: 'GET' })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub pull failed (${res.status}): ${body || res.statusText}`)
  }

  const json = (await res.json()) as GitHubContentResponse
  if (!json.content || json.encoding !== 'base64') {
    throw new Error('GitHub file content missing or unsupported.')
  }

  const parsed = JSON.parse(base64ToUtf8(json.content)) as AppData
  if (!parsed || parsed.version !== 1) {
    throw new Error('GitHub data file is not a valid Investment Diary backup.')
  }

  return {
    version: 1,
    funds: Array.isArray(parsed.funds) ? parsed.funds : [],
    trades: Array.isArray(parsed.trades) ? parsed.trades : [],
    maturities: Array.isArray(parsed.maturities) ? parsed.maturities : [],
  }
}

export async function pushDataToGitHub(
  config: GitHubSyncConfig,
  data: AppData,
): Promise<void> {
  assertConfig(config)
  const url = apiUrl(config)

  let sha: string | undefined
  const existing = await githubFetch(url, config.token, { method: 'GET' })
  if (existing.ok) {
    const current = (await existing.json()) as GitHubContentResponse
    sha = current.sha
  } else if (existing.status !== 404) {
    const body = await existing.text()
    throw new Error(`GitHub read failed (${existing.status}): ${body || existing.statusText}`)
  }

  const res = await githubFetch(url, config.token, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update investment diary data',
      branch: config.branch,
      content: utf8ToBase64(JSON.stringify(data, null, 2)),
      sha,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub push failed (${res.status}): ${body || res.statusText}`)
  }
}
