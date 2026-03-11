import { supabase } from './supabase.js'

const BASE = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function mutate(path, options = {}) {
  const authHeader = await getAuthHeader()
  return request(path, { ...options, headers: { ...authHeader, ...options.headers } })
}

// ── Packages ──────────────────────────────────────────
export const fetchPackages = () => request('/api/packages')

// ── Addons ────────────────────────────────────────────
export const fetchAddons = () => request('/api/addons')

// ── Cases ─────────────────────────────────────────────
export const fetchCases = () => request('/api/cases')
export const fetchCase = (id) => request(`/api/cases/${id}`)
export const createCase = (payload) =>
  mutate('/api/cases', { method: 'POST', body: JSON.stringify(payload) })
export const updateCaseStatus = (id, status) =>
  mutate(`/api/cases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const addCaseNote = (id, note) =>
  mutate(`/api/cases/${id}/notes`, { method: 'POST', body: JSON.stringify(note) })

// ── Crematoriums ──────────────────────────────────────
export const fetchCrematoriums = () => request('/api/crematoriums')

// ── Orders ────────────────────────────────────────────
export const fetchOrders = () => request('/api/orders')
export const advanceOrder = (id) =>
  mutate(`/api/orders/${id}/advance`, { method: 'PATCH' })
