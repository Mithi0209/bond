import { NavLink, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import TradebookPage from './pages/TradebookPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'

function NavItem({
  to,
  label,
}: {
  to: string
  label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'block rounded-lg px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-emerald-700 text-white'
            : 'text-emerald-900 hover:bg-emerald-50',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-3 py-4 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-emerald-900">
              Investment Diary
            </h1>
            <p className="text-sm text-emerald-900/70">
              Calendar-based logbook for Bondbazaar-style trades (INR, T+1).
            </p>
          </div>
          <div className="hidden md:block text-right text-xs text-emerald-900/70">
            Local browser copy + optional free database sync.
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <aside className="md:sticky md:top-4 h-fit rounded-xl border border-emerald-100 bg-white p-3 shadow-soft">
            <nav className="space-y-1">
              <NavItem to="/" label="Dashboard" />
              <NavItem to="/tradebook" label="Tradebook" />
              <NavItem to="/analytics" label="Analytics" />
              <NavItem to="/settings" label="Settings" />
            </nav>
            <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900/80">
              <div className="font-semibold">MVP rules</div>
              <ul className="mt-1 list-disc pl-4">
                <li>Funds added manually</li>
                <li>Buy trades: wallet decreases on T, settle on T+1</li>
                <li>Maturity reduces portfolio only</li>
                <li>No sell trades, no fees</li>
              </ul>
            </div>
          </aside>

          <main className="min-w-0">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tradebook" element={<TradebookPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-emerald-100 bg-white px-3 py-2 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm">
          <NavLink to="/" className="px-2 py-1 text-emerald-900">
            Dashboard
          </NavLink>
          <NavLink to="/tradebook" className="px-2 py-1 text-emerald-900">
            Tradebook
          </NavLink>
          <NavLink to="/analytics" className="px-2 py-1 text-emerald-900">
            Analytics
          </NavLink>
          <NavLink to="/settings" className="px-2 py-1 text-emerald-900">
            Settings
          </NavLink>
        </div>
      </nav>

      <div className="h-16 md:hidden" />
    </div>
  )
}
