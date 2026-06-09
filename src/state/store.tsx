import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { addDaysISO, todayISO } from '../lib/date'
import { loadData, saveData } from '../lib/storage'
import type { AppData, FundEntry, ISODate, MaturityEntry, Trade } from '../lib/types'

type AppState = {
  data: AppData
  selectedDate: ISODate
}

type Action =
  | { type: 'SET_SELECTED_DATE'; date: ISODate }
  | { type: 'REPLACE_DATA'; data: AppData }
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
  })

  useEffect(() => {
    saveData(state.data)
  }, [state.data])

  const store: Store = useMemo(() => {
    return {
      state,
      setSelectedDate: (date) => dispatch({ type: 'SET_SELECTED_DATE', date }),
      replaceData: (data) => dispatch({ type: 'REPLACE_DATA', data }),

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
  }, [state])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useAppStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppStoreProvider missing')
  return v
}

