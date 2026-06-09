import { addDays, format, isValid, parseISO } from 'date-fns'
import type { ISODate } from './types'

export function toISODate(d: Date): ISODate {
  return format(d, 'yyyy-MM-dd') as ISODate
}

export function parseISODate(s: string): Date {
  const d = parseISO(s)
  if (!isValid(d)) throw new Error(`Invalid date: ${s}`)
  return d
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function addDaysISO(date: ISODate, days: number): ISODate {
  return toISODate(addDays(parseISODate(date), days))
}

export function fmtHuman(date: ISODate): string {
  return format(parseISODate(date), 'EEE, dd MMM yyyy')
}

