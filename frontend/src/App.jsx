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
        <Route path="analytics" element={<Analytics />} />
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
