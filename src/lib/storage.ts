import type { AppData, GitHubSyncConfig } from './types'

const STORAGE_KEY = 'investment-diary:v1'
const GITHUB_SYNC_KEY = 'investment-diary:github-sync:v1'

export function emptyData(): AppData {
  return { version: 1, funds: [], trades: [], maturities: [] }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || parsed.version !== 1) return emptyData()
    return {
      version: 1,
      funds: Array.isArray(parsed.funds) ? parsed.funds : [],
      trades: Array.isArray(parsed.trades) ? parsed.trades : [],
      maturities: Array.isArray(parsed.maturities) ? parsed.maturities : [],
    }
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportDataJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

export function defaultGitHubSyncConfig(): GitHubSyncConfig {
  return {
    owner: 'Mithi0209',
    repo: 'bond',
    branch: 'main',
    path: 'data/investment-diary.json',
    token: '',
    autoSync: false,
  }
}

export function loadGitHubSyncConfig(): GitHubSyncConfig {
  try {
    const raw = localStorage.getItem(GITHUB_SYNC_KEY)
    if (!raw) return defaultGitHubSyncConfig()
    const parsed = JSON.parse(raw) as Partial<GitHubSyncConfig>
    const defaults = defaultGitHubSyncConfig()
    return {
      owner: parsed.owner ?? defaults.owner,
      repo: parsed.repo ?? defaults.repo,
      branch: parsed.branch ?? defaults.branch,
      path: parsed.path ?? defaults.path,
      token: parsed.token ?? defaults.token,
      autoSync: Boolean(parsed.autoSync),
    }
  } catch {
    return defaultGitHubSyncConfig()
  }
}

export function saveGitHubSyncConfig(config: GitHubSyncConfig) {
  localStorage.setItem(GITHUB_SYNC_KEY, JSON.stringify(config))
}
