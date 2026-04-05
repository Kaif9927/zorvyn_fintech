import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

const roles = ['Admin', 'Analyst', 'Viewer']
const statuses = ['active', 'inactive']

const emptyCreate = {
  name: '',
  email: '',
  password: '',
  role: 'Viewer',
  status: 'active',
}

const field =
  'mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20'

export function Management() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [createError, setCreateError] = useState('')
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'Viewer',
    status: 'active',
    password: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/users', {
        params: { page, limit: 10, search: appliedSearch || undefined },
      })
      setItems(data.data.items)
      setPagination(data.data.pagination)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, appliedSearch])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    setSaving(true)
    try {
      await api.post('/api/auth/register', createForm)
      setCreateForm(emptyCreate)
      setCreateOpen(false)
      load()
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Could not create user')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(row) {
    setEditId(row.id)
    setEditForm({
      name: row.name,
      role: row.role,
      status: row.status,
      password: '',
    })
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: editForm.name,
        role: editForm.role,
        status: editForm.status,
      }
      if (editForm.password.trim()) {
        body.password = editForm.password
      }
      await api.patch(`/api/users/${editId}`, body)
      setEditId(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (
      !confirm(
        'Delete this user? This may remove related data depending on DB rules.'
      )
    ) {
      return
    }
    try {
      await api.delete(`/api/users/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            User management
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create staff accounts, deactivate users, reset access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateOpen(true)
            setCreateForm(emptyCreate)
            setCreateError('')
          }}
          className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400"
        >
          Add user
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search name or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1)
              setAppliedSearch(searchInput.trim())
            }
          }}
          className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
        <button
          type="button"
          onClick={() => {
            setPage(1)
            setAppliedSearch(searchInput.trim())
          }}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10"
        >
          Search
        </button>
      </div>

      <div className="zorvyn-glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((row) => (
                  <tr key={row.id} className="border-t border-white/10">
                    <td className="px-6 py-3 font-medium text-zinc-100">{row.name}</td>
                    <td className="px-6 py-3 text-zinc-500">{row.email}</td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-300">
                        {row.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 capitalize text-zinc-500">{row.status}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="mr-3 text-xs font-medium text-sky-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="text-xs font-medium text-pink-400 hover:underline"
                      >
                        Delete
                      </button>
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="zorvyn-glass w-full max-w-md rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white">Add user</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Assign role and status. New accounts are active by default.
            </p>
            {createError && (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-500">Name</label>
                <input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className={field}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Email</label>
                <input
                  required
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className={field}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Password</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  className={field}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500">Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, role: e.target.value })
                    }
                    className={field}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, status: e.target.value })
                    }
                    className={field}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEdit}
            className="zorvyn-glass w-full max-w-md rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white">Edit user</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-500">Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={field}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className={field}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className={field}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500">New password (optional)</label>
                <input
                  type="password"
                  minLength={6}
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className={field}
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
