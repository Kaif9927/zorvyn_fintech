import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Analytics } from './pages/Analytics'
import { Management } from './pages/Management'
import { Budgets } from './pages/Budgets'

function LoginGate({ children }) {
  const { user, booting } = useAuth()
  if (booting) {
    return (
      <div className="zorvyn-canvas flex min-h-screen items-center justify-center text-zinc-500">
        Loading…
      </div>
    )
  }
  if (user) {
    return <Navigate to="/" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginGate>
            <Login />
          </LoginGate>
        }
      />
      <Route
        path="/signup"
        element={
          <LoginGate>
            <Signup />
          </LoginGate>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="management"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Management />
            </ProtectedRoute>
          }
        />
        <Route
          path="transactions"
          element={
            <ProtectedRoute roles={['Admin', 'Analyst']}>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="budgets"
          element={
            <ProtectedRoute roles={['Admin', 'Analyst']}>
              <Budgets />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute roles={['Admin', 'Analyst']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
