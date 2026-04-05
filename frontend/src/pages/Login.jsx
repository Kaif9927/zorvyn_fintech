import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Play, ShieldPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'

const fieldClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20'

export function Login() {
  const { login, bootstrapAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /** From API: true = no Admin in DB yet. false = admin exists or request failed. */
  const [bootstrapAllowed, setBootstrapAllowed] = useState(false)
  const [bootstrapChecked, setBootstrapChecked] = useState(false)
  const [bootstrapStatusError, setBootstrapStatusError] = useState(false)
  const [showBootstrap, setShowBootstrap] = useState(false)
  const [bName, setBName] = useState('')
  const [bEmail, setBEmail] = useState('')
  const [bPassword, setBPassword] = useState('')
  const [bConfirm, setBConfirm] = useState('')
  const [bError, setBError] = useState('')
  const [bLoading, setBLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/auth/bootstrap-status')
      .then((res) => {
        if (!cancelled) setBootstrapAllowed(!!res.data?.data?.allowed)
      })
      .catch(() => {
        if (!cancelled) {
          setBootstrapAllowed(false)
          setBootstrapStatusError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setBootstrapChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || 'Could not sign in'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleBootstrap(e) {
    e.preventDefault()
    setBError('')
    if (bPassword !== bConfirm) {
      setBError('Passwords do not match')
      return
    }
    setBLoading(true)
    try {
      await bootstrapAdmin(bName, bEmail, bPassword)
      navigate(from, { replace: true })
    } catch (err) {
      setBError(err.response?.data?.error || err.message || 'Could not create admin')
    } finally {
      setBLoading(false)
    }
  }

  return (
    <div className="zorvyn-canvas flex min-h-screen flex-col items-center px-4 pb-16 pt-10 sm:pt-16">
      <div className="mb-10 w-full max-w-3xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm">
          <span className="text-emerald-400">✓</span>
          Trusted by teams shipping secure finance products
          <span className="text-zinc-500">→</span>
        </div>
        <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          Building{' '}
          <span className="zorvyn-text-grad-a">Secure</span>,{' '}
          <span className="zorvyn-text-grad-b">Compliant</span>, and{' '}
          <span className="zorvyn-text-grad-c">Intelligent</span>
          <br />
          financial systems
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
          Enterprise-grade infrastructure that scales with you. Sign in to access your Zorvyn
          dashboard — same login for admins and team members.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => document.getElementById('signin-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="#signin-form"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-transparent px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
          >
            <Play className="h-4 w-4 fill-current" />
            See how it works
          </a>
        </div>
      </div>

      <div
        id="signin-form"
        className="zorvyn-glass w-full max-w-md rounded-2xl p-8 sm:p-10"
      >
        <div className="mb-8 text-center">
          <h2 className="text-lg font-semibold text-white">Sign in</h2>
          <p className="mt-1 text-sm text-zinc-500">Access your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-sky-500/0 transition placeholder:text-zinc-600 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          New here?{' '}
          <Link to="/signup" className="font-medium text-sky-400 hover:text-sky-300">
            Create an account
          </Link>{' '}
          (viewer)
        </p>

        <div className="mt-8 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => {
              setShowBootstrap((v) => !v)
              setBError('')
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-500/15"
          >
            <ShieldPlus className="h-4 w-4" />
            {showBootstrap ? 'Hide first-time admin setup' : 'Create administrator account'}
          </button>
          <p className="mt-2 text-center text-xs text-zinc-500">
            {bootstrapStatusError && (
              <span className="block text-amber-200/80">
                Could not reach the server for status — you can still try below if this is a fresh
                database.
              </span>
            )}
            {bootstrapChecked && bootstrapAllowed && (
              <span className="block text-emerald-400/90">
                First-time setup: no administrator in the database yet — you can create one.
              </span>
            )}
            {bootstrapChecked && !bootstrapAllowed && !bootstrapStatusError && (
              <span className="block">
                Server reports an admin already exists. This form will only work if you reset the DB
                or remove all Admin users.
              </span>
            )}
            {!bootstrapChecked && !bootstrapStatusError && (
              <span className="block">Checking server…</span>
            )}
          </p>
          {showBootstrap && (
              <form onSubmit={handleBootstrap} className="mt-4 space-y-3 text-left">
                {bError && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {bError}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Full name</label>
                  <input
                    required
                    className={fieldClass}
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Admin email</label>
                  <input
                    type="email"
                    required
                    className={fieldClass}
                    value={bEmail}
                    onChange={(e) => setBEmail(e.target.value)}
                    placeholder="admin@yourcompany.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={fieldClass}
                    value={bPassword}
                    onChange={(e) => setBPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Confirm password</label>
                  <input
                    type="password"
                    required
                    className={fieldClass}
                    value={bConfirm}
                    onChange={(e) => setBConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={bLoading}
                  className="w-full rounded-lg bg-amber-500/90 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-60"
                >
                  {bLoading ? 'Creating…' : 'Create admin & sign in'}
                </button>
              </form>
          )}
        </div>
      </div>
    </div>
  )
}
