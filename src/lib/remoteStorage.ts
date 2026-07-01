import { emptyData } from './storage'
import { DIARY_STATE_ID, DIARY_STATE_TABLE, supabase, supabaseConfigured } from './supabase'
import type { AppData } from './types'

function normalizeData(parsed: AppData | null | undefined): AppData {
  if (!parsed || parsed.version !== 1) return emptyData()
  return {
    version: 1,
    funds: Array.isArray(parsed.funds) ? parsed.funds : [],
    trades: Array.isArray(parsed.trades) ? parsed.trades : [],
    maturities: Array.isArray(parsed.maturities) ? parsed.maturities : [],
  }
}

export function isEmptyAppData(data: AppData): boolean {
  return data.funds.length === 0 && data.trades.length === 0 && data.maturities.length === 0
}

export async function pullRemoteData(): Promise<AppData | null> {
  if (!supabaseConfigured || !supabase) return null

  const { data, error } = await supabase
    .from(DIARY_STATE_TABLE)
    .select('data')
    .eq('id', DIARY_STATE_ID)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.data) return null
  return normalizeData(data.data as AppData)
}

export async function pushRemoteData(appData: AppData): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.from(DIARY_STATE_TABLE).upsert(
    {
      id: DIARY_STATE_ID,
      data: appData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (error) {
    throw new Error(error.message)
  }
}

