/**
 * Maps axios/network failures to actionable copy for deployed UIs.
 */
export function formatApiError(err) {
  const status = err.response?.status
  const body = err.response?.data

  if (typeof body === 'string' && body.includes('<!DOCTYPE')) {
    return 'Got HTML instead of JSON — the API URL is wrong. In Vercel → Settings → Environment Variables, set VITE_API_URL to your backend base URL (e.g. https://your-app.onrender.com), redeploy, and try again.'
  }

  if (status === 404) {
    return 'API not found (404). Set VITE_API_URL in Vercel to your Render (or other) API base URL with no trailing slash, redeploy the frontend, then try again.'
  }

  if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
    return 'Request timed out. If the API is on Render’s free tier it may be waking up — wait 1–2 minutes and retry. Also confirm VITE_API_URL in Vercel matches your live API URL.'
  }

  if (!err.response && err.request) {
    return 'No response from the API. Check VITE_API_URL, that the backend is running, and CORS allows your Vercel domain.'
  }

  if (body && typeof body === 'object' && body.error) {
    return typeof body.error === 'string' ? body.error : String(body.error)
  }

  return err.message || 'Request failed'
}
