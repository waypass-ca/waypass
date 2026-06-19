import { supabase } from './supabase.js'
import { normalizeDbRecord } from './crematoriumUtils.js'
import { FEATURES } from './features.js'

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
export const fetchCrematoriums = () => mutate('/api/crematoriums')
export const createCrematorium = (payload) =>
  mutate('/api/crematoriums', { method: 'POST', body: JSON.stringify(payload) })
export const updateCrematorium = (id, payload) =>
  mutate(`/api/crematoriums/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteCrematorium = (id) =>
  mutate(`/api/crematoriums/${id}`, { method: 'DELETE' })
export const connectCrematorium = (id) =>
  mutate(`/api/crematoriums/${id}/connect`, { method: 'POST' })
export const disconnectCrematorium = (id) =>
  mutate(`/api/crematoriums/${id}/connect`, { method: 'DELETE' })

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Bootstrap the Maps JS SDK once (no Places library needed — discovery is DB-backed)
let mapsLibPromise = null
export function loadMapsLib() {
  if (!FEATURES.googleMaps) return Promise.reject(new Error('Google Maps is disabled'))
  if (mapsLibPromise) return mapsLibPromise
  mapsLibPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps)
      return
    }
    window.__mapsReady = () => {
      delete window.__mapsReady
      resolve(window.google.maps)
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&loading=async&callback=__mapsReady`
    script.async = true
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
  return mapsLibPromise
}

export async function fetchNearbyCrematoriums(lat, lng) {
  if (!FEATURES.googleMaps) return []
  const hasCoords = lat !== 0 || lng !== 0
  const rows = hasCoords
    ? await request(`/api/crematoriums/nearby-db?lat=${lat}&lng=${lng}&radius_miles=100`)
    : await request('/api/crematoriums/db')
  return (rows ?? []).map(normalizeDbRecord)
}

// ── Shipping Partners ─────────────────────────────────
export const fetchShippingPartners = () => mutate('/api/shipping-partners')
export const createShippingPartner = (payload) =>
  mutate('/api/shipping-partners', { method: 'POST', body: JSON.stringify(payload) })
export const updateShippingPartner = (id, payload) =>
  mutate(`/api/shipping-partners/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteShippingPartner = (id) =>
  mutate(`/api/shipping-partners/${id}`, { method: 'DELETE' })
export const connectShippingPartner = (id) =>
  mutate(`/api/shipping-partners/${id}/connect`, { method: 'POST' })
export const disconnectShippingPartner = (id) =>
  mutate(`/api/shipping-partners/${id}/connect`, { method: 'DELETE' })

export async function fetchNearbyShippingPartners(lat, lng) {
  if (!FEATURES.googleMaps) return []
  const hasCoords = lat !== 0 || lng !== 0
  const rows = hasCoords
    ? await request(`/api/shipping-partners/nearby-db?lat=${lat}&lng=${lng}&radius_miles=100`)
    : await request('/api/shipping-partners/db')
  return (rows ?? []).map(normalizeDbRecord)
}

// ── Bookings ──────────────────────────────────────────
export const fetchBookings = () => mutate('/api/bookings')
export const fetchBooking = (id) => mutate(`/api/bookings/${id}`)
export const createBooking = (payload) =>
  mutate('/api/bookings', { method: 'POST', body: JSON.stringify(payload) })
export const confirmBooking = (id, slot) =>
  mutate(`/api/bookings/${id}/confirm`, { method: 'POST', body: JSON.stringify({ slot }) })
export const cancelBooking = (id) =>
  mutate(`/api/bookings/${id}`, { method: 'DELETE' })
export const rescheduleBooking = (id, proposedSlots) =>
  mutate(`/api/bookings/${id}/reschedule`, { method: 'POST', body: JSON.stringify({ proposedSlots }) })
// Public — no auth header
export const fetchBookingByToken = (token) =>
  request(`/api/bookings/respond/${token}`)
export const respondToBooking = (token, slots) =>
  request(`/api/bookings/respond/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots }),
  })
export const fetchShippingBookingByToken = (token) =>
  request(`/api/bookings/respond-shipping/${token}`)
export const respondToShippingBooking = (token, slots) =>
  request(`/api/bookings/respond-shipping/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots }),
  })

// ── Inbox ─────────────────────────────────────────────
export const fetchInbox = ({ limit = 50, before, archived = false } = {}) => {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (before) params.set('before', before)
  if (archived) params.set('archived', 'true')
  return mutate(`/api/inbox?${params.toString()}`)
}
export const fetchInboxUnreadCount = () => mutate('/api/inbox/unread-count')
export const markInboxItemRead = (id) => mutate(`/api/inbox/${id}/read`, { method: 'PATCH' })
export const markInboxItemUnread = (id) => mutate(`/api/inbox/${id}/read`, { method: 'PATCH', body: JSON.stringify({ read: false }) })
export const markAllInboxRead = () => mutate('/api/inbox/mark-all-read', { method: 'PATCH' })
export const starInboxItem = (id, starred) =>
  mutate(`/api/inbox/${id}/star`, { method: 'PATCH', body: JSON.stringify({ starred }) })
export const archiveInboxItem = (id) => mutate(`/api/inbox/${id}`, { method: 'DELETE' })
export const unarchiveInboxItem = (id) => mutate(`/api/inbox/${id}/unarchive`, { method: 'POST' })
// Back-compat alias — InboxPage used to call this.
export const deleteInboxItem = archiveInboxItem

// ── Notification preferences (email) ─────────────────
export const fetchNotificationPrefs = () => mutate('/api/notifications')
export const saveNotificationPrefs = (prefs) =>
  mutate('/api/notifications', { method: 'PUT', body: JSON.stringify(prefs) })

// ── Orders ────────────────────────────────────────────
export const fetchOrders = () => request('/api/orders')
export const advanceOrder = (id) =>
  mutate(`/api/orders/${id}/advance`, { method: 'PATCH' })

// ── Portal settings ───────────────────────────────────
export const fetchPortalSettings = () => request('/api/portal-settings')
export const savePortalSettings = (payload) =>
  mutate('/api/portal-settings', { method: 'PUT', body: JSON.stringify(payload) })

// ── Folders ───────────────────────────────────────────
export const fetchFolders = (type) => mutate(`/api/folders?type=${type}`)
export const createFolder = (payload) => mutate('/api/folders', { method: 'POST', body: JSON.stringify(payload) })
export const renameFolder = (id, name) => mutate(`/api/folders/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
export const deleteFolder = (id, { withContents = false, type = '' } = {}) =>
  mutate(`/api/folders/${id}?type=${encodeURIComponent(type)}&withContents=${withContents}`, { method: 'DELETE' })
export const assignCaseFolder = (caseId, folderId) =>
  mutate(`/api/cases/${caseId}/folder`, { method: 'PATCH', body: JSON.stringify({ folderId }) })
export const assignDocFolder = (caseId, docId, folderId) =>
  mutate(`/api/cases/${caseId}/documents/structured/${docId}/folder`, { method: 'PATCH', body: JSON.stringify({ folderId }) })
