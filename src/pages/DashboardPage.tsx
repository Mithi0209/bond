import { useMemo, useState } from 'react'
import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import CalendarMonth from '../components/CalendarMonth'
import { Button, Card, Modal, NumberInput, TextArea, TextInput } from '../components/ui'
import { buildDayTimeline, computeDailySnapshots, getDateBounds } from '../lib/calc'
import { addDaysISO, fmtHuman, parseISODate, todayISO, toISODate } from '../lib/date'
import type { FundEntry, ISODate, MaturityEntry, Trade } from '../lib/types'
import { useAppStore } from '../state/store'

function money(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function DashboardPage() {
  const {
    state: { data, selectedDate },
    setSelectedDate,
    addFund,
    addBuyTrade,
    addMaturity,
    updateFund,
    deleteFund,
    updateTrade,
    deleteTrade,
    updateMaturity,
    deleteMaturity,
  } = useAppStore()

  const [month, setMonth] = useState<Date>(() => startOfMonth(parseISO(selectedDate)))

  // Keep month in sync if selected date goes outside current month (common on mobile).
  const selectedD = parseISO(selectedDate)
  if (!isSameMonthSafe(month, selectedD)) {
    // avoid setState during render loops by only syncing when far off
    const m = startOfMonth(selectedD)
    if (format(m, 'yyyy-MM') !== format(month, 'yyyy-MM')) setMonth(m)
  }

  const bounds = useMemo(() => getDateBounds(data), [data])

  const snapshots = useMemo(() => {
    const monthEnd = endOfMonth(month)
    const from = toISODate(minDate([parseISODate(bounds.from), startOfMonth(month)])!)
    const to = toISODate(maxDate([parseISODate(bounds.to), monthEnd, parseISODate(selectedDate)])!)
    return computeDailySnapshots(data, from, to)
  }, [data, bounds.from, bounds.to, month, selectedDate])

  const snapshotByDate = useMemo(() => {
    const m = new Map<ISODate, (typeof snapshots)[number]>()
    for (const s of snapshots) m.set(s.date, s)
    return m
  }, [snapshots])

  const daySnap = snapshotByDate.get(selectedDate)

  const daySums = useMemo(() => {
    const funds = data.funds.filter((f) => f.date === selectedDate)
    const placed = data.trades.filter((t) => t.tradeDate === selectedDate)
    const settling = data.trades.filter((t) => t.settlementDate === selectedDate)
    const mats = data.maturities.filter((m) => m.date === selectedDate)
    return {
      fundsIn: funds.reduce((a, b) => a + b.amountInr, 0),
      tradesPlaced: placed.reduce((a, b) => a + b.amountInr, 0),
      settlements: settling.reduce((a, b) => a + b.amountInr, 0),
      maturities: mats.reduce((a, b) => a + b.maturedAmountInr, 0),
    }
  }, [data, selectedDate])

  const badgesByDate = useMemo(() => {
    const by: Record<ISODate, any> = {}
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    for (const f of data.funds) {
      const d = parseISODate(f.date)
      if (isBefore(d, monthStart) || isAfter(d, monthEnd)) continue
      by[f.date] = by[f.date] ?? {}
      by[f.date].fundsIn = (by[f.date].fundsIn ?? 0) + f.amountInr
    }
    for (const t of data.trades) {
      const dt = parseISODate(t.tradeDate)
      if (!(isBefore(dt, monthStart) || isAfter(dt, monthEnd))) {
        by[t.tradeDate] = by[t.tradeDate] ?? {}
        by[t.tradeDate].tradesPlaced = (by[t.tradeDate].tradesPlaced ?? 0) + t.amountInr
      }
      const ds = parseISODate(t.settlementDate)
      if (!(isBefore(ds, monthStart) || isAfter(ds, monthEnd))) {
        by[t.settlementDate] = by[t.settlementDate] ?? {}
        by[t.settlementDate].settlements = (by[t.settlementDate].settlements ?? 0) + t.amountInr
      }
    }
    for (const m of data.maturities) {
      const d = parseISODate(m.date)
      if (isBefore(d, monthStart) || isAfter(d, monthEnd)) continue
      by[m.date] = by[m.date] ?? {}
      by[m.date].maturities = (by[m.date].maturities ?? 0) + m.maturedAmountInr
    }
    return by as Record<ISODate, any>
  }, [data, month])

  const timeline = useMemo(() => buildDayTimeline(data, selectedDate), [data, selectedDate])

  // Modals
  const [openFund, setOpenFund] = useState(false)
  const [openTrade, setOpenTrade] = useState(false)
  const [openMaturity, setOpenMaturity] = useState(false)
  const [editingFund, setEditingFund] = useState<FundEntry | null>(null)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [editingMaturity, setEditingMaturity] = useState<MaturityEntry | null>(null)

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-emerald-900">
              {format(month, 'MMMM yyyy')}
            </div>
            <div className="text-xs text-emerald-900/60">
              Selected: {fmtHuman(selectedDate)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setMonth((m) => subMonths(m, 1))}>
              ←
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedDate(todayISO())
                setMonth(startOfMonth(new Date()))
              }}
            >
              Today
            </Button>
            <Button variant="secondary" onClick={() => setMonth((m) => addMonths(m, 1))}>
              →
            </Button>
            <div className="w-px self-stretch bg-emerald-100" />
            <Button onClick={() => { setEditingFund(null); setOpenFund(true) }}>
              + Add Funds
            </Button>
            <Button onClick={() => { setEditingTrade(null); setOpenTrade(true) }}>
              + Add Trade
            </Button>
            <Button onClick={() => { setEditingMaturity(null); setOpenMaturity(true) }}>
              + Add Maturity
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard title="Wallet Available" value={money(daySnap?.closingWallet ?? 0)} />
        <KpiCard title="Reserved (T+1 pending)" value={money(daySnap?.reservedEod ?? 0)} accent="amber" />
        <KpiCard title="Portfolio Value" value={money(daySnap?.portfolioEod ?? 0)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <CalendarMonth
          month={month}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          badgesByDate={badgesByDate}
        />

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-emerald-900">Day Detail</div>
              <div className="text-xs text-emerald-900/60">{fmtHuman(selectedDate)}</div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedDate(todayISO())
              }}
            >
              Jump to Today
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <MiniStat label="Opening Wallet" value={money(daySnap?.openingWallet ?? 0)} />
            <MiniStat label="Closing Wallet" value={money(daySnap?.closingWallet ?? 0)} />
            <MiniStat label="Funds Added" value={money(daySums.fundsIn)} />
            <MiniStat label="Trades Placed (T)" value={money(daySums.tradesPlaced)} />
            <MiniStat label="Settling Today (T+1)" value={money(daySums.settlements)} />
            <MiniStat label="Maturities" value={money(daySums.maturities)} />
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-emerald-900/80">Timeline</div>
            <div className="mt-2 space-y-2">
              {timeline.length === 0 ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900/70">
                  No entries for this date.
                </div>
              ) : (
                timeline.map((item) => {
                  if (item.kind === 'FUND') {
                    const e = item.entry
                    return (
                      <TimelineRow
                        key={e.id}
                        badge="Funds"
                        title={e.note ? e.note : 'Wallet load'}
                        amount={money(e.amountInr)}
                        status=""
                        onEdit={() => { setEditingFund(e); setOpenFund(true) }}
                        onDelete={() => deleteFund(e.id)}
                      />
                    )
                  }
                  if (item.kind === 'TRADE_PLACED') {
                    const t = item.trade
                    return (
                      <TimelineRow
                        key={t.id + '_placed'}
                        badge="Trade"
                        title={`Buy: ${t.bondName}`}
                        amount={money(t.amountInr)}
                        status={`Pending → settles ${t.settlementDate}`}
                        onEdit={() => { setEditingTrade(t); setOpenTrade(true) }}
                        onDelete={() => deleteTrade(t.id)}
                      />
                    )
                  }
                  if (item.kind === 'SETTLEMENT') {
                    const t = item.trade
                    return (
                      <TimelineRow
                        key={t.id + '_settle'}
                        badge="Settlement"
                        title={`Settled: ${t.bondName}`}
                        amount={money(t.amountInr)}
                        status="Settled"
                        onEdit={() => { setEditingTrade(t); setOpenTrade(true) }}
                        onDelete={() => deleteTrade(t.id)}
                        accent="amber"
                      />
                    )
                  }
                  const m = item.entry
                  return (
                    <TimelineRow
                      key={m.id}
                      badge="Maturity"
                      title={`Matured: ${m.bondName}`}
                      amount={`−${money(m.maturedAmountInr)}`}
                      status="Portfolio only"
                      onEdit={() => { setEditingMaturity(m); setOpenMaturity(true) }}
                      onDelete={() => deleteMaturity(m.id)}
                    />
                  )
                })
              )}
            </div>
          </div>
        </Card>
      </div>

      <FundModal
        open={openFund}
        onClose={() => { setOpenFund(false); setEditingFund(null) }}
        defaultDate={selectedDate}
        editing={editingFund}
        onSave={(payload) => {
          if (editingFund) updateFund({ ...editingFund, ...payload })
          else addFund(payload)
          setOpenFund(false)
          setEditingFund(null)
        }}
      />
      <TradeModal
        open={openTrade}
        onClose={() => { setOpenTrade(false); setEditingTrade(null) }}
        defaultDate={selectedDate}
        editing={editingTrade}
        onSave={(payload) => {
          if (editingTrade) updateTrade({ ...editingTrade, ...payload })
          else addBuyTrade(payload)
          setOpenTrade(false)
          setEditingTrade(null)
        }}
      />
      <MaturityModal
        open={openMaturity}
        onClose={() => { setOpenMaturity(false); setEditingMaturity(null) }}
        defaultDate={selectedDate}
        editing={editingMaturity}
        onSave={(payload) => {
          if (editingMaturity) updateMaturity({ ...editingMaturity, ...payload })
          else addMaturity(payload)
          setOpenMaturity(false)
          setEditingMaturity(null)
        }}
      />
    </div>
  )
}

function isSameMonthSafe(a: Date, b: Date) {
  return format(a, 'yyyy-MM') === format(b, 'yyyy-MM')
}

function KpiCard({
  title,
  value,
  accent,
}: {
  title: string
  value: string
  accent?: 'amber'
}) {
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold text-emerald-900/70">{title}</div>
      <div className={`mt-1 text-xl font-semibold ${accent === 'amber' ? 'text-amber-800' : 'text-emerald-900'}`}>
        {value}
      </div>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-100 bg-white p-2">
      <div className="text-[11px] font-semibold text-emerald-900/70">{label}</div>
      <div className="text-sm font-semibold text-emerald-900">{value}</div>
    </div>
  )
}

function TimelineRow({
  badge,
  title,
  amount,
  status,
  onEdit,
  onDelete,
  accent,
}: {
  badge: string
  title: string
  amount: string
  status: string
  onEdit: () => void
  onDelete: () => void
  accent?: 'amber'
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-100 bg-white p-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
              accent === 'amber'
                ? 'bg-amber-50 text-amber-900'
                : 'bg-emerald-50 text-emerald-900'
            }`}
          >
            {badge}
          </span>
          <div className="truncate text-sm font-semibold text-emerald-900">
            {title}
          </div>
        </div>
        {status ? (
          <div className="mt-1 text-xs text-emerald-900/60">{status}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="text-sm font-semibold text-emerald-900">{amount}</div>
        <div className="flex gap-2">
          <button
            className="rounded-lg px-2 py-1 text-xs text-emerald-900/70 hover:bg-emerald-50"
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
          <button
            className="rounded-lg px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
            onClick={onDelete}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function FundModal({
  open,
  onClose,
  defaultDate,
  editing,
  onSave,
}: {
  open: boolean
  onClose: () => void
  defaultDate: ISODate
  editing: FundEntry | null
  onSave: (payload: { date: ISODate; amountInr: number; note?: string }) => void
}) {
  const [date, setDate] = useState<ISODate>(defaultDate)
  const [amount, setAmount] = useState<string>('0')
  const [note, setNote] = useState('')

  useMemo(() => {
    if (!open) return
    setDate(editing?.date ?? defaultDate)
    setAmount(String(editing?.amountInr ?? 0))
    setNote(editing?.note ?? '')
  }, [open, defaultDate, editing])

  return (
    <Modal open={open} title={editing ? 'Edit Funds' : 'Add Funds'} onClose={onClose}>
      <div className="space-y-3">
        <TextInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value as ISODate)} />
        <NumberInput label="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextArea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={() => {
              const amt = Number(amount)
              if (!date || !isFinite(amt) || amt <= 0) return
              onSave({ date, amountInr: amt, note: note.trim() || undefined })
            }}
            type="button"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function TradeModal({
  open,
  onClose,
  defaultDate,
  editing,
  onSave,
}: {
  open: boolean
  onClose: () => void
  defaultDate: ISODate
  editing: Trade | null
  onSave: (payload: {
    tradeDate: ISODate
    settlementDate?: ISODate
    bondName: string
    isin?: string
    amountInr: number
    note?: string
  }) => void
}) {
  const [tradeDate, setTradeDate] = useState<ISODate>(defaultDate)
  const [settlementDate, setSettlementDate] = useState<ISODate>(addDaysISO(defaultDate, 1))
  const [bondName, setBondName] = useState('')
  const [isin, setIsin] = useState('')
  const [amount, setAmount] = useState<string>('0')
  const [note, setNote] = useState('')

  useMemo(() => {
    if (!open) return
    const td = editing?.tradeDate ?? defaultDate
    setTradeDate(td)
    setSettlementDate(editing?.settlementDate ?? addDaysISO(td, 1))
    setBondName(editing?.bondName ?? '')
    setIsin(editing?.isin ?? '')
    setAmount(String(editing?.amountInr ?? 0))
    setNote(editing?.note ?? '')
  }, [open, defaultDate, editing])

  return (
    <Modal open={open} title={editing ? 'Edit Trade (Buy)' : 'Add Trade (Buy)'} onClose={onClose}>
      <div className="space-y-3">
        <TextInput label="Trade Date (T)" type="date" value={tradeDate} onChange={(e) => {
          const v = e.target.value as ISODate
          setTradeDate(v)
          // auto adjust settle when user changes trade date
          if (!editing) setSettlementDate(addDaysISO(v, 1))
        }} />
        <TextInput label="Settlement Date (T+1)" type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value as ISODate)} />
        <TextInput label="Bond Name" value={bondName} onChange={(e) => setBondName(e.target.value)} placeholder="e.g., SBI 2030" />
        <TextInput label="ISIN (optional)" value={isin} onChange={(e) => setIsin(e.target.value)} placeholder="IN..." />
        <NumberInput label="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextArea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={() => {
              const amt = Number(amount)
              if (!tradeDate || !settlementDate || !bondName.trim() || !isFinite(amt) || amt <= 0) return
              onSave({
                tradeDate,
                settlementDate,
                bondName: bondName.trim(),
                isin: isin.trim() || undefined,
                amountInr: amt,
                note: note.trim() || undefined,
              })
            }}
            type="button"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function MaturityModal({
  open,
  onClose,
  defaultDate,
  editing,
  onSave,
}: {
  open: boolean
  onClose: () => void
  defaultDate: ISODate
  editing: MaturityEntry | null
  onSave: (payload: {
    date: ISODate
    bondName: string
    isin?: string
    maturedAmountInr: number
    note?: string
  }) => void
}) {
  const [date, setDate] = useState<ISODate>(defaultDate)
  const [bondName, setBondName] = useState('')
  const [isin, setIsin] = useState('')
  const [amount, setAmount] = useState<string>('0')
  const [note, setNote] = useState('')

  useMemo(() => {
    if (!open) return
    setDate(editing?.date ?? defaultDate)
    setBondName(editing?.bondName ?? '')
    setIsin(editing?.isin ?? '')
    setAmount(String(editing?.maturedAmountInr ?? 0))
    setNote(editing?.note ?? '')
  }, [open, defaultDate, editing])

  return (
    <Modal open={open} title={editing ? 'Edit Maturity' : 'Add Maturity'} onClose={onClose}>
      <div className="space-y-3">
        <TextInput label="Maturity Date" type="date" value={date} onChange={(e) => setDate(e.target.value as ISODate)} />
        <TextInput label="Bond Name" value={bondName} onChange={(e) => setBondName(e.target.value)} />
        <TextInput label="ISIN (optional)" value={isin} onChange={(e) => setIsin(e.target.value)} />
        <NumberInput label="Matured Amount (₹) (subtract from portfolio)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextArea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={() => {
              const amt = Number(amount)
              if (!date || !bondName.trim() || !isFinite(amt) || amt <= 0) return
              onSave({
                date,
                bondName: bondName.trim(),
                isin: isin.trim() || undefined,
                maturedAmountInr: amt,
                note: note.trim() || undefined,
              })
            }}
            type="button"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

