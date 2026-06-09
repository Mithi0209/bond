import { useRef, useState } from 'react'
import { Button, Card } from '../components/ui'
import { exportDataJson } from '../lib/storage'
import type { AppData } from '../lib/types'
import { useAppStore } from '../state/store'

export default function SettingsPage() {
  const {
    state: { data },
    replaceData,
    seedExample,
    clearAll,
  } = useAppStore()

  const [msg, setMsg] = useState<string>('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  function downloadJson() {
    const blob = new Blob([exportDataJson(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `investment-diary-backup.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as AppData
      if (!parsed || parsed.version !== 1) {
        setMsg('Invalid backup file (version mismatch).')
        return
      }
      replaceData({
        version: 1,
        funds: Array.isArray(parsed.funds) ? parsed.funds : [],
        trades: Array.isArray(parsed.trades) ? parsed.trades : [],
        maturities: Array.isArray(parsed.maturities) ? parsed.maturities : [],
      })
      setMsg('Imported successfully.')
    } catch (e: any) {
      setMsg(`Import failed: ${String(e?.message ?? e)}`)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Settings</div>
        <div className="mt-1 text-xs text-emerald-900/60">
          Backup/restore your diary data (stored locally in the browser).
        </div>
        {msg ? (
          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900/80">
            {msg}
          </div>
        ) : null}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Backup</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={downloadJson}>Export JSON</Button>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Utilities</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              seedExample()
              setMsg('Seeded example data.')
            }}
          >
            Seed Example Data
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!confirm('Clear all diary data? This cannot be undone.')) return
              clearAll()
              setMsg('Cleared.')
            }}
          >
            Clear All Data
          </Button>
        </div>
      </Card>
    </div>
  )
}

