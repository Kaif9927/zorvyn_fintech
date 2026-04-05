import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../hooks/useAuth'
function money(n) {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const field =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20'

export function Budgets() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [budgets, setBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    category: '',
    amount: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const params = { year, month }

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get('/api/budgets', { params }),
        api.get('/api/budgets/summary', { params }),
      ])
      setBudgets(listRes.data.data)
      setSummary(sumRes.data.data)
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not load budgets')
      setBudgets([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setErr('')
    try {
      await api.post('/api/budgets', {
        category: form.category.trim(),
        amount: Number(form.amount),
        year,
        month,
      })
      setForm({ category: '', amount: '' })
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function updateAmount(id, amount) {
    try {
      await api.patch(`/api/budgets/${id}`, { amount: Number(amount) })
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Update failed')
    }
  }

  async function remove(id) {
    if (!confirm('Remove this budget?')) return
    try {
      await api.delete(`/api/budgets/${id}`)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Budgets</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set monthly expense caps per category and compare spending (same category names as in
          transactions).
        </p>
      </div>

      {err && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {err}
        </div>
      )}

      <div className="zorvyn-glass flex flex-wrap items-end gap-4 rounded-2xl p-6">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Year</label>
          <input
            type="number"
            className={field + ' w-28'}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Month</label>
          <select
            className={field + ' w-36'}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isAdmin && (
        <form onSubmit={handleAdd} className="zorvyn-glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white">Add or update budget (upserts by category)</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs text-zinc-500">Category (e.g. Groceries)</label>
              <input
                required
                className={field}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Matches expense category"
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs text-zinc-500">Monthly cap ($)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={field}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save budget'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="zorvyn-glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">Spent vs budget ({month}/{year})</h2>
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        ) : summary?.lines?.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-zinc-500">
                  <th className="py-2 font-medium">Category</th>
                  <th className="py-2 font-medium text-right">Budget</th>
                  <th className="py-2 font-medium text-right">Spent</th>
                  <th className="py-2 font-medium text-right">Left</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.lines.map((line) => (
                  <tr key={line.category} className="border-t border-white/10">
                    <td className="py-3 font-medium text-zinc-100">{line.category}</td>
                    <td className="py-3 text-right text-zinc-300">${money(line.budget)}</td>
                    <td className="py-3 text-right text-pink-300">${money(line.spent)}</td>
                    <td
                      className={`py-3 text-right ${
                        line.over ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ${money(line.remaining)}
                    </td>
                    <td className="py-3 text-xs">
                      {line.over ? (
                        <span className="rounded bg-rose-500/20 px-2 py-0.5 text-rose-200">
                          Over budget
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            {isAdmin
              ? 'No budgets for this month — add one above.'
              : 'No budgets for this month.'}
          </p>
        )}
      </div>

      <div className="zorvyn-glass overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 px-6 py-3 text-sm font-semibold text-white">
          {isAdmin ? 'Your budgets (edit amount or remove)' : 'Budget caps (read-only)'}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-zinc-500">
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium text-right">Cap ($)</th>
                {isAdmin && <th className="px-6 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!loading &&
                budgets.map((b) => (
                  <tr key={b.id} className="border-t border-white/10">
                    <td className="px-6 py-3 font-medium text-zinc-100">{b.category}</td>
                    <td className="px-6 py-3 text-right">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={b.amount}
                          className={field + ' inline-block w-28 text-right'}
                          onBlur={(e) => {
                            const v = e.target.value
                            if (v && Number(v) !== Number(b.amount)) updateAmount(b.id, v)
                          }}
                        />
                      ) : (
                        <span className="text-zinc-300">${money(b.amount)}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs text-rose-400 hover:underline"
                          onClick={() => remove(b.id)}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
