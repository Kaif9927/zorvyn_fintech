import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    localStorage.setItem('zorvyn_token', token)
  } else {
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem('zorvyn_token')
  }
}

export function loadStoredToken() {
  const t = localStorage.getItem('zorvyn_token')
  if (t) setAuthToken(t)
  return t
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      setAuthToken(null)
      localStorage.removeItem('zorvyn_user')
      const p = window.location.pathname
      if (!p.startsWith('/login') && !p.startsWith('/signup')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)
