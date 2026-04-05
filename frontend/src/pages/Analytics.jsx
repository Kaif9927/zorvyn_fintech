import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { MonthlyTrendsChart } from '../components/MonthlyTrendsChart'
import { CategoryDoughnuts } from '../components/CategoryDoughnuts'

function money(n) {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function Analytics() {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [s, c, t] = await Promise.all([
          api.get('/api/dashboard/summary'),
          api.get('/api/dashboard/category-summary'),
          api.get('/api/dashboard/monthly-trends', { params: { months: 14 } }),
        ])
        if (!cancelled) {
          setSummary(s.data.data)
          setCategories(c.data.data)
          setTrends(t.data.data)
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
  }, [])

  const income = summary ? Number(summary.totalIncome) : 0
  const expense = summary ? Number(summary.totalExpense) : 0
  const net = summary ? Number(summary.netBalance) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Trends and category mix (scoped to your role).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="zorvyn-glass rounded-2xl p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total income
          </div>
          <div className="mt-1 text-2xl font-semibold text-cyan-400">
            ${loading ? '—' : money(income)}
          </div>
        </div>
        <div className="zorvyn-glass rounded-2xl p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total expense
          </div>
          <div className="mt-1 text-2xl font-semibold text-pink-400">
            ${loading ? '—' : money(expense)}
          </div>
        </div>
        <div className="zorvyn-glass rounded-2xl p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Net balance
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">
            ${loading ? '—' : money(net)}
          </div>
        </div>
      </div>

      <div className="zorvyn-glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Income vs spend over time</h2>
        <p className="text-sm text-zinc-500">Monthly trends</p>
        <div className="mt-4">
          <MonthlyTrendsChart data={trends} loading={loading} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Category mix</h2>
        <CategoryDoughnuts data={categories} loading={loading} />
      </div>
    </div>
  )
}
