import { useMemo, useState } from 'react'
import { Button, Card, Modal, NumberInput, TextArea, TextInput } from '../components/ui'
import { addDaysISO } from '../lib/date'
import type { FundEntry, ISODate, MaturityEntry, Trade } from '../lib/types'
import { useAppStore } from '../state/store'

function money(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function TradebookPage() {
  const {
    state: { data, selectedDate },
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

  const [q, setQ] = useState('')
  const qLower = q.trim().toLowerCase()

  const trades = useMemo(() => {
    const list = [...data.trades].sort((a, b) => (a.tradeDate < b.tradeDate ? 1 : -1))
    if (!qLower) return list
    return list.filter(
      (t) =>
        t.bondName.toLowerCase().includes(qLower) ||
        (t.isin ?? '').toLowerCase().includes(qLower),
    )
  }, [data.trades, qLower])

  const maturities = useMemo(() => {
    const list = [...data.maturities].sort((a, b) => (a.date < b.date ? 1 : -1))
    if (!qLower) return list
    return list.filter(
      (m) =>
        m.bondName.toLowerCase().includes(qLower) ||
        (m.isin ?? '').toLowerCase().includes(qLower),
    )
  }, [data.maturities, qLower])

  const funds = useMemo(() => {
    const list = [...data.funds].sort((a, b) => (a.date < b.date ? 1 : -1))
    return qLower
      ? list.filter((f) => (f.note ?? '').toLowerCase().includes(qLower))
      : list
  }, [data.funds, qLower])

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
            <div className="text-sm font-semibold text-emerald-900">Tradebook</div>
            <div className="text-xs text-emerald-900/60">
              Search by bond name / ISIN / notes.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              label="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Example Bond / IN..."
            />
            <div className="flex gap-2">
              <Button onClick={() => { setEditingFund(null); setOpenFund(true) }}>
                + Funds
              </Button>
              <Button onClick={() => { setEditingTrade(null); setOpenTrade(true) }}>
                + Trade
              </Button>
              <Button onClick={() => { setEditingMaturity(null); setOpenMaturity(true) }}>
                + Maturity
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Trades (Buy)</div>
        <div className="mt-3 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-emerald-900/70">
              <tr>
                <th className="py-2">Trade Date</th>
                <th>Settle Date</th>
                <th>Bond</th>
                <th>ISIN</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-emerald-900/60">
                    No trades yet.
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id} className="border-t border-emerald-100">
                    <td className="py-2">{t.tradeDate}</td>
                    <td>{t.settlementDate}</td>
                    <td className="font-medium text-emerald-900">{t.bondName}</td>
                    <td className="text-emerald-900/70">{t.isin ?? '—'}</td>
                    <td className="text-right font-semibold">{money(t.amountInr)}</td>
                    <td className="text-right">
                      <button
                        className="rounded-lg px-2 py-1 text-xs text-emerald-900/70 hover:bg-emerald-50"
                        onClick={() => { setEditingTrade(t); setOpenTrade(true) }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="ml-2 rounded-lg px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => deleteTrade(t.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Maturities</div>
        <div className="mt-3 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-emerald-900/70">
              <tr>
                <th className="py-2">Maturity Date</th>
                <th>Bond</th>
                <th>ISIN</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {maturities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-emerald-900/60">
                    No maturities yet.
                  </td>
                </tr>
              ) : (
                maturities.map((m) => (
                  <tr key={m.id} className="border-t border-emerald-100">
                    <td className="py-2">{m.date}</td>
                    <td className="font-medium text-emerald-900">{m.bondName}</td>
                    <td className="text-emerald-900/70">{m.isin ?? '—'}</td>
                    <td className="text-right font-semibold">−{money(m.maturedAmountInr)}</td>
                    <td className="text-right">
                      <button
                        className="rounded-lg px-2 py-1 text-xs text-emerald-900/70 hover:bg-emerald-50"
                        onClick={() => { setEditingMaturity(m); setOpenMaturity(true) }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="ml-2 rounded-lg px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => deleteMaturity(m.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Funds</div>
        <div className="mt-3 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-emerald-900/70">
              <tr>
                <th className="py-2">Date</th>
                <th>Note</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {funds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-emerald-900/60">
                    No funds added yet.
                  </td>
                </tr>
              ) : (
                funds.map((f) => (
                  <tr key={f.id} className="border-t border-emerald-100">
                    <td className="py-2">{f.date}</td>
                    <td className="text-emerald-900/70">{f.note ?? '—'}</td>
                    <td className="text-right font-semibold">{money(f.amountInr)}</td>
                    <td className="text-right">
                      <button
                        className="rounded-lg px-2 py-1 text-xs text-emerald-900/70 hover:bg-emerald-50"
                        onClick={() => { setEditingFund(f); setOpenFund(true) }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="ml-2 rounded-lg px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => deleteFund(f.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
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
          if (!editing) setSettlementDate(addDaysISO(v, 1))
        }} />
        <TextInput label="Settlement Date (T+1)" type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value as ISODate)} />
        <TextInput label="Bond Name" value={bondName} onChange={(e) => setBondName(e.target.value)} />
        <TextInput label="ISIN (optional)" value={isin} onChange={(e) => setIsin(e.target.value)} />
        <NumberInput label="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextArea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
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
        <NumberInput label="Matured Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextArea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
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

