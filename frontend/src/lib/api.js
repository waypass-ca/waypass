import { supabase } from './supabase.js'

const BASE = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return null
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
export const fetchCustody = (id) => request(`/api/cases/${id}/custody`)
export const updateCustodyStage = (id, stage, payload) =>
  mutate(`/api/cases/${id}/custody/${stage}`, { method: 'PUT', body: JSON.stringify(payload) })

export const addCaseDocument = (id, doc) =>
  mutate(`/api/cases/${id}/documents`, { method: 'POST', body: JSON.stringify(doc) })

// ── Crematoriums ──────────────────────────────────────
export const fetchCrematoriums = () => request('/api/crematoriums')
export const createCrematorium = (payload) =>
  mutate('/api/crematoriums', { method: 'POST', body: JSON.stringify(payload) })
export const updateCrematorium = (id, payload) =>
  mutate(`/api/crematoriums/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteCrematorium = (id) =>
  mutate(`/api/crematoriums/${id}`, { method: 'DELETE' })

// ── Orders ────────────────────────────────────────────
export const fetchOrders = () => request('/api/orders')
export const advanceOrder = (id) =>
  mutate(`/api/orders/${id}/advance`, { method: 'PATCH' })

// ── Portal settings ───────────────────────────────────
export const fetchPortalSettings = () => request('/api/portal-settings')
export const savePortalSettings = (payload) =>
  mutate('/api/portal-settings', { method: 'PUT', body: JSON.stringify(payload) })
