import { useRef, useState } from 'react'
import { Button, Card } from '../components/ui'
import { exportDataJson } from '../lib/storage'
import { supabaseConfigured } from '../lib/supabase'
import type { AppData } from '../lib/types'
import { useAppStore } from '../state/store'

export default function SettingsPage() {
  const {
    state: { data, syncState },
    replaceData,
    pushToDatabase,
    pullFromDatabase,
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
          This app keeps a local browser copy and can also save to a free
          Supabase database when configured.
        </div>
        {msg ? (
          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900/80">
            {msg}
          </div>
        ) : null}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Database</div>
        <div className="mt-1 text-xs text-emerald-900/60">
          For the free database setup, create a Supabase project, run the SQL in
          `supabase-schema.sql`, then add your `VITE_SUPABASE_URL` and
          `VITE_SUPABASE_ANON_KEY` to a local `.env` file.
        </div>

        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
          <div className="font-semibold">
            {supabaseConfigured ? 'Supabase config detected' : 'Supabase config missing'}
          </div>
          <div className="mt-1 text-sm text-emerald-900/80">
            {supabaseConfigured
              ? 'The app can now read and write diary data to the database.'
              : 'Add your Supabase values to `.env` and restart the app to enable cloud save.'}
          </div>
        </div>

        {syncState.message ? (
          <div
            className={`mt-3 rounded-lg border p-3 text-sm ${
              syncState.status === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : syncState.status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {syncState.message}
            {syncState.syncedAt ? (
              <span className="block text-xs opacity-75">
                {new Date(syncState.syncedAt).toLocaleString()}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={syncState.status === 'syncing'}
            onClick={async () => {
              try {
                await pushToDatabase()
                setMsg('Saved current diary to the database.')
              } catch {
                setMsg('Database save failed. See the sync message above.')
              }
            }}
          >
            Save to Database
          </Button>
          <Button
            variant="secondary"
            disabled={syncState.status === 'syncing'}
            onClick={async () => {
              try {
                await pullFromDatabase()
                setMsg('Loaded the latest diary from the database.')
              } catch {
                setMsg('Database load failed. See the sync message above.')
              }
            }}
          >
            Load from Database
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">Backup</div>
        <div className="mt-1 text-xs text-emerald-900/60">
          Manual export/import is still available if you want an offline copy.
        </div>
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
