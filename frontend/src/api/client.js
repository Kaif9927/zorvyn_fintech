import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? ''

/** True when the production build has no API base URL (Vercel env missing). */
export const isProductionMissingApiUrl =
  import.meta.env.PROD && !String(import.meta.env.VITE_API_URL || '').trim()

if (isProductionMissingApiUrl) {
  // eslint-disable-next-line no-console
  console.error(
    '[Zorvyn] VITE_API_URL is not set. Add it in Vercel → Settings → Environment Variables ' +
      '(your Render API origin, e.g. https://zorvyn-api.onrender.com), then redeploy.'
  )
}

export const api = axios.create({
  baseURL,
  /** Render free tier cold starts can exceed 30s */
  timeout: 90_000,
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
