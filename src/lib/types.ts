export type ISODate = `${number}-${number}-${number}` // YYYY-MM-DD

export type FundEntry = {
  id: string
  type: 'FUND'
  date: ISODate
  amountInr: number
  note?: string
  createdAt: string
}

export type Trade = {
  id: string
  type: 'TRADE'
  side: 'BUY'
  tradeDate: ISODate
  settlementDate: ISODate
  bondName: string
  isin?: string
  amountInr: number
  note?: string
  createdAt: string
}

export type MaturityEntry = {
  id: string
  type: 'MATURITY'
  date: ISODate
  maturedAmountInr: number
  bondName: string
  isin?: string
  note?: string
  createdAt: string
}

export type AppData = {
  version: 1
  funds: FundEntry[]
  trades: Trade[]
  maturities: MaturityEntry[]
}

export type SyncState = {
  status: 'idle' | 'syncing' | 'success' | 'error'
  message: string
  syncedAt?: string
}

export type DaySnapshot = {
  date: ISODate
  openingWallet: number
  closingWallet: number
  reservedEod: number
  portfolioEod: number
}

export type DayTimelineItem =
  | { kind: 'FUND'; entry: FundEntry }
  | { kind: 'TRADE_PLACED'; trade: Trade }
  | { kind: 'SETTLEMENT'; trade: Trade }
  | { kind: 'MATURITY'; entry: MaturityEntry }
