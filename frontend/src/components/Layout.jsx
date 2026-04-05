import { NavLink, Outlet } from 'react-router-dom'
import {
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-white/10 text-white'
      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'Admin'

  return (
    <div className="zorvyn-canvas flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0c0d14]/90 px-4 py-6 backdrop-blur-md">
        <div className="mb-10 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-sky-500/25">
            z
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">zorvyn</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              fintech
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard className="h-4 w-4 opacity-80" />
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={navClass}>
            <Wallet className="h-4 w-4 opacity-80" />
            Transactions
          </NavLink>
          <NavLink to="/budgets" className={navClass}>
            <PiggyBank className="h-4 w-4 opacity-80" />
            Budgets
          </NavLink>
          <NavLink to="/analytics" className={navClass}>
            <TrendingUp className="h-4 w-4 opacity-80" />
            Analytics
          </NavLink>
          {isAdmin && (
            <NavLink to="/management" className={navClass}>
              <Users className="h-4 w-4 opacity-80" />
              Management
            </NavLink>
          )}
          <span className="pointer-events-none flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600">
            <CreditCard className="h-4 w-4" />
            Cards
          </span>
        </nav>

        <div className="mt-auto space-y-0.5 border-t border-white/10 pt-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          >
            <HelpCircle className="h-4 w-4" />
            Help Center
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-rose-400/90 hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#0a0b14]/80 px-6 py-4 backdrop-blur-md sm:px-8">
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Console
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-zinc-100">{user?.name}</div>
              <div className="text-xs text-zinc-500">{user?.email}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-500/40 bg-gradient-to-br from-sky-600/40 to-cyan-600/30 text-sm font-semibold text-sky-100">
              {user?.name?.charAt(0) ?? '?'}
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
