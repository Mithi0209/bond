import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { subDays } from 'date-fns'
import { Card } from '../components/ui'
import { computeDailySnapshots, getDateBounds } from '../lib/calc'
import { parseISODate, toISODate } from '../lib/date'
import { useAppStore } from '../state/store'

function money(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function AnalyticsPage() {
  const {
    state: { data, selectedDate },
  } = useAppStore()

  const series = useMemo(() => {
    const { from: earliest } = getDateBounds(data)
    const to = parseISODate(selectedDate)
    const toIso = toISODate(to)
    const snapsAll = computeDailySnapshots(data, earliest, toIso)
    const fromCutoff = subDays(to, 90)
    const snaps = snapsAll.filter((s) => parseISODate(s.date) >= fromCutoff)
    return snaps.map((s) => ({
      date: s.date.slice(5), // MM-DD
      wallet: s.closingWallet,
      reserved: s.reservedEod,
      portfolio: s.portfolioEod,
    }))
  }, [data, selectedDate])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Analytics</div>
        <div className="mt-1 text-xs text-emerald-900/60">
          Last 90 days (based on your diary data). No market pricing.
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold text-emerald-900">
          Wallet / Reserved / Portfolio (trend)
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => (v >= 100000 ? `${Math.round(v / 1000)}k` : `${v}`)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => money(Number(value))} />
              <Line type="monotone" dataKey="wallet" stroke="#0f7a3d" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="reserved" stroke="#f4b740" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="portfolio" stroke="#0b5f2f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
