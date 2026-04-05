import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../hooks/useAuth'

function money(n) {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const emptyForm = {
  amount: '',
  type: 'expense',
  category: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
}

const field =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20'

export function Transactions() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const canManageOwn = user?.role === 'Viewer' || user?.role === 'Analyst' || isAdmin
  const canDeleteRow = (row) =>
    isAdmin || (row.user?.id != null && row.user.id === user?.id)

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  })
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/financial-records', {
        params: {
          page: filters.page,
          limit: 10,
          search: filters.search || undefined,
          category: filters.category || undefined,
          type: filters.type || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      })
      setItems(data.data.items)
      setPagination(data.data.pagination)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    if (!canManageOwn) return
    setFormError('')
    setSaving(true)
    try {
      await api.post('/api/financial-records', {
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        date: new Date(form.date).toISOString(),
        note: form.note || undefined,
      })
      setForm(emptyForm)
      load()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Transactions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isAdmin
            ? 'View and manage all users’ records.'
            : 'Your income & expenses — add, filter, and remove your own rows.'}
        </p>
      </div>

      {canManageOwn && (
        <form onSubmit={handleCreate} className="zorvyn-glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white">Add transaction</h2>
          {formError && (
            <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {formError}
            </div>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Amount</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={field}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Category</label>
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={field}
                placeholder="e.g. Groceries"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={field}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-sky-500 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Add'}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-zinc-500">Note (optional)</label>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className={field}
            />
          </div>
        </form>
      )}

      <div className="zorvyn-glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">Filters</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            placeholder="Search category or note"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
            }
            className={field}
          />
          <input
            placeholder="Category"
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))
            }
            className={field}
          />
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))
            }
            className={field}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))
            }
            className={field}
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))
            }
            className={field}
          />
        </div>
      </div>

      <div className="zorvyn-glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-zinc-500">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Owner</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((row) => (
                  <tr key={row.id} className="border-t border-white/10">
                    <td className="px-6 py-3 text-zinc-400">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 font-medium text-zinc-100">{row.category}</td>
                    <td className="px-6 py-3 text-zinc-500">{row.user?.name}</td>
                    <td className="px-6 py-3 capitalize text-zinc-500">{row.type}</td>
                    <td
                      className={`px-6 py-3 text-right font-medium ${
                        row.type === 'income' ? 'text-cyan-400' : 'text-pink-400'
                      }`}
                    >
                      {row.type === 'expense' ? '-' : '+'}${money(row.amount)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {canDeleteRow(row) ? (
                        <button
                          type="button"
                          className="text-xs font-medium text-pink-400 hover:underline"
                          onClick={async () => {
                            if (!confirm('Soft-delete this record?')) return
                            await api.delete(`/api/financial-records/${row.id}`)
                            load()
                          }}
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-sm text-zinc-500">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
