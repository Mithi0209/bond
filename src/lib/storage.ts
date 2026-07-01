import type { AppData } from './types'

const STORAGE_KEY = 'investment-diary:v1'

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
