import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: false,
      },
    })
  : null

export const DIARY_STATE_TABLE = 'diary_state'
export const DIARY_STATE_ID = 'primary'
