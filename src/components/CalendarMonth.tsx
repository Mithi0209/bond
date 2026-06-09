import clsx from 'clsx'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { ISODate } from '../lib/types'

export type DayBadges = {
  fundsIn?: number
  tradesPlaced?: number
  settlements?: number
  maturities?: number
}

function fmtMoneyShort(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`
  return `₹${Math.round(n)}`
}

export default function CalendarMonth({
  month,
  selectedDate,
  onSelectDate,
  badgesByDate,
}: {
  month: Date
  selectedDate: ISODate
  onSelectDate: (d: ISODate) => void
  badgesByDate: Record<ISODate, DayBadges>
}) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const selected = parseISO(selectedDate)

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-soft">
      <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-emerald-900/70">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-2 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-2">
        {days.map((d) => {
          const iso = format(d, 'yyyy-MM-dd') as ISODate
          const isSel = isSameDay(d, selected)
          const inMonth = isSameMonth(d, monthStart)
          const badges = badgesByDate[iso]

          const chips: { text: string; className: string }[] = []
          if (badges?.fundsIn)
            chips.push({
              text: `+${fmtMoneyShort(badges.fundsIn)}`,
              className: 'bg-emerald-50 text-emerald-900',
            })
          if (badges?.tradesPlaced)
            chips.push({
              text: `Buy ${fmtMoneyShort(badges.tradesPlaced)}`,
              className: 'bg-emerald-100 text-emerald-900',
            })
          if (badges?.settlements)
            chips.push({
              text: `Settle ${fmtMoneyShort(badges.settlements)}`,
              className: 'bg-amber-50 text-amber-900',
            })
          if (badges?.maturities)
            chips.push({
              text: `Mature −${fmtMoneyShort(badges.maturities)}`,
              className: 'bg-emerald-50 text-emerald-900 border border-emerald-100',
            })

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={clsx(
                'min-h-[86px] rounded-lg border p-2 text-left transition',
                isSel
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-emerald-100 hover:bg-emerald-50/60',
                !inMonth && 'opacity-50',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-emerald-900">
                  {format(d, 'd')}
                </div>
              </div>
              <div className="mt-1 space-y-1">
                {chips.slice(0, 3).map((c) => (
                  <div
                    key={c.text}
                    className={clsx(
                      'truncate rounded-md px-2 py-0.5 text-[11px]',
                      c.className,
                    )}
                  >
                    {c.text}
                  </div>
                ))}
                {chips.length > 3 && (
                  <div className="text-[11px] text-emerald-900/60">
                    +{chips.length - 3} more
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
