import { useRef, useState } from 'react'
import { Button, Card, TextInput } from '../components/ui'
import { exportDataJson } from '../lib/storage'
import type { AppData } from '../lib/types'
import { useAppStore } from '../state/store'

export default function SettingsPage() {
  const {
    state: { data, githubSyncConfig, syncState },
    replaceData,
    updateGitHubSyncConfig,
    pushToGitHub,
    pullFromGitHub,
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
          Your diary still keeps a local browser copy, but you can now sync the
          JSON file to GitHub from here.
        </div>
        {msg ? (
          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900/80">
            {msg}
          </div>
        ) : null}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-emerald-900">GitHub Sync</div>
        <div className="mt-1 text-xs text-emerald-900/60">
          Store your diary JSON in a repo file like
          `data/investment-diary.json`. The token is saved only in this browser.
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            label="Owner"
            value={githubSyncConfig.owner}
            onChange={(e) =>
              updateGitHubSyncConfig({ owner: e.target.value.trim() })
            }
            placeholder="Mithi0209"
          />
          <TextInput
            label="Repo"
            value={githubSyncConfig.repo}
            onChange={(e) =>
              updateGitHubSyncConfig({ repo: e.target.value.trim() })
            }
            placeholder="bond"
          />
          <TextInput
            label="Branch"
            value={githubSyncConfig.branch}
            onChange={(e) =>
              updateGitHubSyncConfig({ branch: e.target.value.trim() })
            }
            placeholder="main"
          />
          <TextInput
            label="File Path in Repo"
            value={githubSyncConfig.path}
            onChange={(e) =>
              updateGitHubSyncConfig({ path: e.target.value.trim() })
            }
            placeholder="data/investment-diary.json"
          />
        </div>

        <div className="mt-3">
          <TextInput
            label="GitHub Token"
            type="password"
            value={githubSyncConfig.token}
            onChange={(e) => updateGitHubSyncConfig({ token: e.target.value })}
            placeholder="Fine-grained PAT with Contents: Read & Write"
          />
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
          <input
            type="checkbox"
            checked={githubSyncConfig.autoSync}
            onChange={(e) =>
              updateGitHubSyncConfig({ autoSync: e.target.checked })
            }
          />
          Auto-sync to GitHub whenever diary data changes
        </label>

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
                await pushToGitHub()
                setMsg('Pushed current diary JSON to GitHub.')
              } catch {
                setMsg('Push failed. See the sync message above.')
              }
            }}
          >
            Push to GitHub
          </Button>
          <Button
            variant="secondary"
            disabled={syncState.status === 'syncing'}
            onClick={async () => {
              try {
                await pullFromGitHub()
                setMsg('Pulled the latest diary JSON from GitHub.')
              } catch {
                setMsg('Pull failed. See the sync message above.')
              }
            }}
          >
            Pull from GitHub
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
