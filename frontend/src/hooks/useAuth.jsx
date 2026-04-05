import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api, loadStoredToken, setAuthToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    loadStoredToken()
    try {
      const raw = localStorage.getItem('zorvyn_user')
      if (raw) setUser(JSON.parse(raw))
    } catch {
      localStorage.removeItem('zorvyn_user')
    }
    setBooting(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    const token = data.data.token
    const u = data.data.user
    setAuthToken(token)
    setUser(u)
    localStorage.setItem('zorvyn_user', JSON.stringify(u))
    return u
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
    localStorage.removeItem('zorvyn_user')
  }, [])

  const signup = useCallback(
    async (name, email, password) => {
      await api.post('/api/auth/signup', { name, email, password })
      await login(email, password)
    },
    [login]
  )

  /** First-time setup only — API returns 403 if an admin already exists. */
  const bootstrapAdmin = useCallback(async (name, email, password) => {
    const { data } = await api.post('/api/auth/bootstrap-admin', {
      name,
      email,
      password,
    })
    const token = data.data.token
    const u = data.data.user
    setAuthToken(token)
    setUser(u)
    localStorage.setItem('zorvyn_user', JSON.stringify(u))
    return u
  }, [])

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      logout,
      signup,
      bootstrapAdmin,
      isAuthenticated: !!user,
      setUser,
    }),
    [user, booting, login, logout, signup, bootstrapAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
