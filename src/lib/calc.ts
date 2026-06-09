import {
  eachDayOfInterval,
  isAfter,
  isBefore,
  max as maxDate,
  min as minDate,
} from 'date-fns'
import { parseISODate, toISODate } from './date'
import type { AppData, DaySnapshot, ISODate, DayTimelineItem } from './types'

export type DerivedKPIs = {
  walletAvailable: number
  reserved: number
  portfolioValue: number
}

function sumByDate<T>(
  items: T[],
  dateKey: (t: T) => ISODate,
  amountKey: (t: T) => number,
): Map<ISODate, number> {
  const m = new Map<ISODate, number>()
  for (const it of items) {
    const d = dateKey(it)
    m.set(d, (m.get(d) ?? 0) + amountKey(it))
  }
  return m
}

export function getDateBounds(data: AppData): { from: ISODate; to: ISODate } {
  const allDates: Date[] = []
  for (const f of data.funds) allDates.push(parseISODate(f.date))
  for (const t of data.trades) {
    allDates.push(parseISODate(t.tradeDate))
    allDates.push(parseISODate(t.settlementDate))
  }
  for (const m of data.maturities) allDates.push(parseISODate(m.date))

  const today = new Date()
  if (allDates.length === 0) {
    const iso = toISODate(today)
    return { from: iso, to: iso }
  }

  const from = toISODate(minDate(allDates)!)
  const to = toISODate(maxDate([maxDate(allDates)!, today])!)
  return { from, to }
}

export function computeDailySnapshots(
  data: AppData,
  from: ISODate,
  to: ISODate,
): DaySnapshot[] {
  const fundsByDate = sumByDate(data.funds, (f) => f.date, (f) => f.amountInr)
  const tradesByTradeDate = sumByDate(
    data.trades,
    (t) => t.tradeDate,
    (t) => t.amountInr,
  )
  const tradesBySettleDate = sumByDate(
    data.trades,
    (t) => t.settlementDate,
    (t) => t.amountInr,
  )
  const maturityByDate = sumByDate(
    data.maturities,
    (m) => m.date,
    (m) => m.maturedAmountInr,
  )

  let wallet = 0
  let reserved = 0
  let portfolio = 0
  const out: DaySnapshot[] = []

  const days = eachDayOfInterval({
    start: parseISODate(from),
    end: parseISODate(to),
  })

  for (const d of days) {
    const iso = toISODate(d)
    const openingWallet = wallet

    wallet += fundsByDate.get(iso) ?? 0

    const tradePlaced = tradesByTradeDate.get(iso) ?? 0
    wallet -= tradePlaced
    reserved += tradePlaced

    const settle = tradesBySettleDate.get(iso) ?? 0
    reserved -= settle
    portfolio += settle

    const mature = maturityByDate.get(iso) ?? 0
    portfolio -= mature

    out.push({
      date: iso,
      openingWallet,
      closingWallet: wallet,
      reservedEod: reserved,
      portfolioEod: portfolio,
    })
  }

  return out
}

export function getKPIsOnDate(
  data: AppData,
  date: ISODate,
): DerivedKPIs {
  const { from, to } = getDateBounds(data)
  const end = isBefore(parseISODate(date), parseISODate(from)) ? from : date
  const snaps = computeDailySnapshots(data, from, isAfter(parseISODate(end), parseISODate(to)) ? to : end)
  const last = snaps[snaps.length - 1]
  return {
    walletAvailable: last?.closingWallet ?? 0,
    reserved: last?.reservedEod ?? 0,
    portfolioValue: last?.portfolioEod ?? 0,
  }
}

export function getDaySnapshot(
  snapshots: DaySnapshot[],
  date: ISODate,
): DaySnapshot | undefined {
  return snapshots.find((s) => s.date === date)
}

export function buildDayTimeline(
  data: AppData,
  date: ISODate,
): DayTimelineItem[] {
  const funds = data.funds
    .filter((f) => f.date === date)
    .map((entry) => ({ kind: 'FUND' as const, entry }))
  const placed = data.trades
    .filter((t) => t.tradeDate === date)
    .map((trade) => ({ kind: 'TRADE_PLACED' as const, trade }))
  const settled = data.trades
    .filter((t) => t.settlementDate === date)
    .map((trade) => ({ kind: 'SETTLEMENT' as const, trade }))
  const maturities = data.maturities
    .filter((m) => m.date === date)
    .map((entry) => ({ kind: 'MATURITY' as const, entry }))

  // order: Funds → Trade placed → Settlement → Maturity
  return [...funds, ...placed, ...settled, ...maturities]
}
