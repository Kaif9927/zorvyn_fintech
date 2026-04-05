import { useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { MonthlyTrendsChart } from '../components/MonthlyTrendsChart'

function money(n) {
  const v = Number(n)
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const card = 'zorvyn-glass rounded-2xl p-6'

export function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState([])
  const [recent, setRecent] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('6M')

  const monthsParam = useMemo(() => {
    if (range === '1W') return 1
    if (range === '1M') return 2
    if (range === '6M') return 8
    return 14
  }, [range])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [s, t, r, c] = await Promise.all([
          api.get('/api/dashboard/summary'),
          api.get('/api/dashboard/monthly-trends', { params: { months: monthsParam } }),
          api.get('/api/dashboard/recent-transactions', { params: { limit: 6 } }),
          api.get('/api/dashboard/category-summary'),
        ])
        if (!cancelled) {
          setSummary(s.data.data)
          setTrends(t.data.data)
          setRecent(r.data.data)
          setCategories(c.data.data)
        }
      } catch {
        if (!cancelled) {
          setSummary(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [monthsParam])

  const net = summary ? Number(summary.netBalance) : 0
  const income = summary ? Number(summary.totalIncome) : 0
  const expense = summary ? Number(summary.totalExpense) : 0
  const cashflow = income + expense > 0 ? income - expense : net

  const topCats = [...categories]
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 3)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {greeting()}, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Snapshot of your finances</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className={`${card} lg:col-span-5`}>
          <div className="text-sm font-medium text-zinc-500">Net position</div>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-white">
            ${loading ? '—' : money(net)}
          </div>
          <p className="mt-2 text-sm text-cyan-400/90">
            Income ${money(income)} · Expense ${money(expense)}
          </p>
        </div>

        <div className={`${card} lg:col-span-4`}>
          <div className="text-sm font-medium text-zinc-500">Cash flow (approx.)</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            ${loading ? '—' : money(Math.abs(cashflow))}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all"
              style={{
                width: `${income + expense > 0 ? (income / (income + expense)) * 100 : 50}%`,
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            <span className="text-cyan-400/90">In</span>
            <span className="text-pink-400/90">Out</span>
          </div>
        </div>

        <div className={`${card} lg:col-span-3`}>
          <div className="text-sm font-medium text-zinc-500">Top categories</div>
          <ul className="mt-3 space-y-2 text-sm">
            {topCats.length === 0 && !loading && (
              <li className="text-zinc-600">No data yet</li>
            )}
            {topCats.map((c) => (
              <li key={`${c.category}-${c.type}`} className="flex justify-between gap-2">
                <span className="truncate text-zinc-300">{c.category}</span>
                <span
                  className={
                    c.type === 'income' ? 'text-cyan-400' : 'text-pink-400'
                  }
                >
                  ${money(c.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="zorvyn-glass rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Spend activity</h2>
            <p className="text-sm text-zinc-500">Income vs spend over time</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['1W', '1M', '6M', '1Y'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  range === r
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                }`}
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/10"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
        </div>
        <MonthlyTrendsChart data={trends} loading={loading} />
      </div>

      <div className="zorvyn-glass overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recent transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-zinc-500">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                recent.map((row) => (
                  <tr key={row.id} className="border-t border-white/10">
                    <td className="px-6 py-3 text-zinc-400">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-zinc-100">{row.category}</td>
                    <td className="px-6 py-3 capitalize text-zinc-500">{row.type}</td>
                    <td
                      className={`px-6 py-3 text-right font-medium ${
                        row.type === 'income' ? 'text-cyan-400' : 'text-pink-400'
                      }`}
                    >
                      {row.type === 'expense' ? '-' : '+'}${money(row.amount)}
                    </td>
                  </tr>
                ))}
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No transactions yet. Add some as an admin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
