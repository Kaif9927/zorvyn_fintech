import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Loader2, LogIn } from 'lucide-react'
import { isProductionMissingApiUrl } from '../api/client'
import { formatApiError } from '../lib/apiErrors'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
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
          Enterprise-grade infrastructure that scales with you. New users get a{' '}
          <span className="text-zinc-300">Viewer</span> account via Create viewer account; admins
          promote Analysts and other roles from Management.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
          >
            Create viewer account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => document.getElementById('signin-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-transparent px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
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
          {isProductionMissingApiUrl && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              <strong className="font-semibold">API URL not configured.</strong> In Vercel → Project →
              Settings → Environment Variables, add{' '}
              <code className="rounded bg-black/30 px-1">VITE_API_URL</code> = your backend origin
              (e.g. <code className="rounded bg-black/30 px-1">https://your-api.onrender.com</code>,
              no trailing slash), then redeploy.
            </div>
          )}
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
            aria-busy={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:opacity-60"
          >
            {loading && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            )}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          New here?{' '}
          <Link to="/signup" className="font-medium text-sky-400 hover:text-sky-300">
            Create viewer account
          </Link>
          {' — '}
          <span className="text-zinc-600">Viewer role only</span>
        </p>
      </div>
    </div>
  )
}
