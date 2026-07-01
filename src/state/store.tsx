import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { addDaysISO, todayISO } from '../lib/date'
import { isEmptyAppData, pullRemoteData, pushRemoteData } from '../lib/remoteStorage'
import { loadData, saveData } from '../lib/storage'
import { supabaseConfigured } from '../lib/supabase'
import type {
  AppData,
  FundEntry,
  ISODate,
  MaturityEntry,
  SyncState,
  Trade,
} from '../lib/types'

type AppState = {
  data: AppData
  selectedDate: ISODate
  syncState: SyncState
}

type Action =
  | { type: 'SET_SELECTED_DATE'; date: ISODate }
  | { type: 'REPLACE_DATA'; data: AppData }
  | { type: 'SET_SYNC_STATE'; syncState: SyncState }
  | { type: 'ADD_FUND'; entry: FundEntry }
  | { type: 'UPDATE_FUND'; entry: FundEntry }
  | { type: 'DELETE_FUND'; id: string }
  | { type: 'ADD_TRADE'; trade: Trade }
  | { type: 'UPDATE_TRADE'; trade: Trade }
  | { type: 'DELETE_TRADE'; id: string }
  | { type: 'ADD_MATURITY'; entry: MaturityEntry }
  | { type: 'UPDATE_MATURITY'; entry: MaturityEntry }
  | { type: 'DELETE_MATURITY'; id: string }

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const idx = items.findIndex((x) => x.id === item.id)
  if (idx === -1) return [item, ...items]
  const copy = items.slice()
  copy[idx] = item
  return copy
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date }
    case 'REPLACE_DATA':
      return { ...state, data: action.data }
    case 'SET_SYNC_STATE':
      return { ...state, syncState: action.syncState }
    case 'ADD_FUND':
    case 'UPDATE_FUND': {
      return {
        ...state,
        data: { ...state.data, funds: upsert(state.data.funds, action.entry) },
      }
    }
    case 'DELETE_FUND':
      return {
        ...state,
        data: {
          ...state.data,
          funds: state.data.funds.filter((f) => f.id !== action.id),
        },
      }
    case 'ADD_TRADE':
    case 'UPDATE_TRADE':
      return {
        ...state,
        data: {
          ...state.data,
          trades: upsert(state.data.trades, action.trade),
        },
      }
    case 'DELETE_TRADE':
      return {
        ...state,
        data: {
          ...state.data,
          trades: state.data.trades.filter((t) => t.id !== action.id),
        },
      }
    case 'ADD_MATURITY':
    case 'UPDATE_MATURITY':
      return {
        ...state,
        data: {
          ...state.data,
          maturities: upsert(state.data.maturities, action.entry),
        },
      }
    case 'DELETE_MATURITY':
      return {
        ...state,
        data: {
          ...state.data,
          maturities: state.data.maturities.filter((m) => m.id !== action.id),
        },
      }
    default:
      return state
  }
}

type Store = {
  state: AppState
  setSelectedDate: (date: ISODate) => void
  replaceData: (data: AppData) => void
  pushToDatabase: () => Promise<void>
  pullFromDatabase: () => Promise<void>
  clearSyncMessage: () => void

  addFund: (input: { date: ISODate; amountInr: number; note?: string }) => void
  updateFund: (entry: FundEntry) => void
  deleteFund: (id: string) => void

  addBuyTrade: (input: {
    tradeDate: ISODate
    bondName: string
    isin?: string
    amountInr: number
    note?: string
    settlementDate?: ISODate
  }) => void
  updateTrade: (trade: Trade) => void
  deleteTrade: (id: string) => void

  addMaturity: (input: {
    date: ISODate
    bondName: string
    isin?: string
    maturedAmountInr: number
    note?: string
  }) => void
  updateMaturity: (entry: MaturityEntry) => void
  deleteMaturity: (id: string) => void

  seedExample: () => void
  clearAll: () => void
}

const Ctx = createContext<Store | null>(null)

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    data: loadData(),
    selectedDate: todayISO(),
    syncState: { status: 'idle', message: '' },
  })
  const initializedRemoteRef = useRef(false)
  const skipNextSyncRef = useRef(false)

  useEffect(() => {
    saveData(state.data)
  }, [state.data])

  const pushNow = useCallback(
    async (data: AppData = state.data) => {
      if (!supabaseConfigured) {
        const message =
          'Database is not configured yet. Add Supabase URL and anon key in your .env file.'
        dispatch({
          type: 'SET_SYNC_STATE',
          syncState: {
            status: 'error',
            message,
            syncedAt: new Date().toISOString(),
          },
        })
        throw new Error(message)
      }

      dispatch({
        type: 'SET_SYNC_STATE',
        syncState: { status: 'syncing', message: 'Saving to database…' },
      })
      try {
        await pushRemoteData(data)
        dispatch({
          type: 'SET_SYNC_STATE',
          syncState: {
            status: 'success',
            message: 'Saved to Supabase database.',
            syncedAt: new Date().toISOString(),
          },
        })
      } catch (e: any) {
        dispatch({
          type: 'SET_SYNC_STATE',
          syncState: {
            status: 'error',
            message: String(e?.message ?? e),
            syncedAt: new Date().toISOString(),
          },
        })
        throw e
      }
    },
    [state.data],
  )

  const pullNow = useCallback(async () => {
    if (!supabaseConfigured) {
      const message =
        'Database is not configured yet. Add Supabase URL and anon key in your .env file.'
      dispatch({
        type: 'SET_SYNC_STATE',
        syncState: {
          status: 'error',
          message,
          syncedAt: new Date().toISOString(),
        },
      })
      throw new Error(message)
    }

    dispatch({
      type: 'SET_SYNC_STATE',
      syncState: { status: 'syncing', message: 'Loading latest data from database…' },
    })
    try {
      const data = await pullRemoteData()
      if (!data) {
        dispatch({
          type: 'SET_SYNC_STATE',
          syncState: {
            status: 'success',
            message: 'Database is connected, but no remote diary exists yet.',
            syncedAt: new Date().toISOString(),
          },
        })
        return
      }
      skipNextSyncRef.current = true
      dispatch({ type: 'REPLACE_DATA', data })
      dispatch({
        type: 'SET_SYNC_STATE',
        syncState: {
          status: 'success',
          message: 'Loaded latest data from Supabase.',
          syncedAt: new Date().toISOString(),
        },
      })
    } catch (e: any) {
      dispatch({
        type: 'SET_SYNC_STATE',
        syncState: {
          status: 'error',
          message: String(e?.message ?? e),
          syncedAt: new Date().toISOString(),
        },
      })
      throw e
    }
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) {
      dispatch({
        type: 'SET_SYNC_STATE',
        syncState: {
          status: 'idle',
          message:
            'Database not configured yet. Add your Supabase URL and anon key to use cloud save.',
        },
      })
      initializedRemoteRef.current = true
      return
    }

    let cancelled = false

    const boot = async () => {
      dispatch({
        type: 'SET_SYNC_STATE',
        syncState: { status: 'syncing', message: 'Connecting to Supabase database…' },
      })

      try {
        const remote = await pullRemoteData()
        if (cancelled) return

        if (remote) {
          skipNextSyncRef.current = true
          dispatch({ type: 'REPLACE_DATA', data: remote })
          dispatch({
            type: 'SET_SYNC_STATE',
            syncState: {
              status: 'success',
              message: 'Connected to Supabase and loaded your diary.',
              syncedAt: new Date().toISOString(),
            },
          })
        } else if (!isEmptyAppData(state.data)) {
          await pushRemoteData(state.data)
          if (cancelled) return
          dispatch({
            type: 'SET_SYNC_STATE',
            syncState: {
              status: 'success',
              message: 'Created the first diary record in Supabase.',
              syncedAt: new Date().toISOString(),
            },
          })
        } else {
          dispatch({
            type: 'SET_SYNC_STATE',
            syncState: {
              status: 'success',
              message: 'Supabase is connected. Your first save will create the diary record.',
              syncedAt: new Date().toISOString(),
            },
          })
        }
      } catch (e: any) {
        if (cancelled) return
        dispatch({
          type: 'SET_SYNC_STATE',
          syncState: {
            status: 'error',
            message: String(e?.message ?? e),
            syncedAt: new Date().toISOString(),
          },
        })
      } finally {
        initializedRemoteRef.current = true
      }
    }

    void boot()

    return () => {
      cancelled = true
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!supabaseConfigured || !initializedRemoteRef.current) return
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false
      return
    }

    const timer = window.setTimeout(() => {
      void pushNow(state.data)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [state.data, pushNow])

  const store: Store = useMemo(() => {
    return {
      state,
      setSelectedDate: (date) => dispatch({ type: 'SET_SELECTED_DATE', date }),
      replaceData: (data) => dispatch({ type: 'REPLACE_DATA', data }),
      pushToDatabase: () => pushNow(state.data),
      pullFromDatabase: () => pullNow(),
      clearSyncMessage: () =>
        dispatch({
          type: 'SET_SYNC_STATE',
          syncState: { status: 'idle', message: '' },
        }),

      addFund: ({ date, amountInr, note }) => {
        const entry: FundEntry = {
          id: uid('fund'),
          type: 'FUND',
          date,
          amountInr,
          note,
          createdAt: new Date().toISOString(),
        }
        dispatch({ type: 'ADD_FUND', entry })
      },
      updateFund: (entry) => dispatch({ type: 'UPDATE_FUND', entry }),
      deleteFund: (id) => dispatch({ type: 'DELETE_FUND', id }),

      addBuyTrade: ({
        tradeDate,
        bondName,
        isin,
        amountInr,
        note,
        settlementDate,
      }) => {
        const trade: Trade = {
          id: uid('trade'),
          type: 'TRADE',
          side: 'BUY',
          tradeDate,
          settlementDate: settlementDate ?? addDaysISO(tradeDate, 1),
          bondName,
          isin,
          amountInr,
          note,
          createdAt: new Date().toISOString(),
        }
        dispatch({ type: 'ADD_TRADE', trade })
      },
      updateTrade: (trade) => dispatch({ type: 'UPDATE_TRADE', trade }),
      deleteTrade: (id) => dispatch({ type: 'DELETE_TRADE', id }),

      addMaturity: ({ date, bondName, isin, maturedAmountInr, note }) => {
        const entry: MaturityEntry = {
          id: uid('mat'),
          type: 'MATURITY',
          date,
          bondName,
          isin,
          maturedAmountInr,
          note,
          createdAt: new Date().toISOString(),
        }
        dispatch({ type: 'ADD_MATURITY', entry })
      },
      updateMaturity: (entry) => dispatch({ type: 'UPDATE_MATURITY', entry }),
      deleteMaturity: (id) => dispatch({ type: 'DELETE_MATURITY', id }),

      seedExample: () => {
        const d0 = todayISO()
        const d1 = addDaysISO(d0, -3)
        const d2 = addDaysISO(d0, -2)
        const d3 = addDaysISO(d0, 10)
        const data: AppData = {
          version: 1,
          funds: [
            {
              id: uid('fund'),
              type: 'FUND',
              date: d1,
              amountInr: 100000,
              note: 'Wallet load',
              createdAt: new Date().toISOString(),
            },
          ],
          trades: [
            {
              id: uid('trade'),
              type: 'TRADE',
              side: 'BUY',
              tradeDate: d2,
              settlementDate: addDaysISO(d2, 1),
              bondName: 'Example Bond 2030',
              isin: 'IN0000000000',
              amountInr: 8500,
              note: '',
              createdAt: new Date().toISOString(),
            },
          ],
          maturities: [
            {
              id: uid('mat'),
              type: 'MATURITY',
              date: d3,
              bondName: 'Example Bond 2030',
              isin: 'IN0000000000',
              maturedAmountInr: 8500,
              note: 'Matures (portfolio only)',
              createdAt: new Date().toISOString(),
            },
          ],
        }
        dispatch({ type: 'REPLACE_DATA', data })
      },
      clearAll: () =>
        dispatch({
          type: 'REPLACE_DATA',
          data: { version: 1, funds: [], trades: [], maturities: [] },
        }),
    }
  }, [state, pullNow, pushNow])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useAppStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppStoreProvider missing')
  return v
}
