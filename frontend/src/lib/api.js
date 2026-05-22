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

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// Compute whether a business is currently open from stored Places periods.
// periods format: [{open: {day: 0-6, time: "HHMM"}, close: {day: 0-6, time: "HHMM"}}]
function isOpenNow(periods) {
  if (!periods?.length) return null
  const now = new Date()
  const day = now.getDay()
  const time = now.getHours() * 100 + now.getMinutes()

  for (const p of periods) {
    if (!p.close) return true // 24/7
    const openDay = p.open.day
    const closeDay = p.close.day
    const openTime = parseInt(p.open.time, 10)
    const closeTime = parseInt(p.close.time, 10)

    if (openDay === closeDay) {
      if (day === openDay && time >= openTime && time < closeTime) return true
    } else {
      // Spans midnight
      if (day === openDay && time >= openTime) return true
      if (day === closeDay && time < closeTime) return true
    }
  }
  return false
}

function normalizeDbRecord(row) {
  const distKm = row.distance_miles != null ? row.distance_miles * 1.60934 : null
  const periods = row.opening_hours?.periods ?? null
  return {
    id: row.id,
    googlePlaceId: row.google_place_id,
    name: row.name,
    location: row.address ?? [row.city, row.state].filter(Boolean).join(', '),
    streetAddress: row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zip: row.zip ?? null,
    lat: row.lat,
    lng: row.lng,
    distance: distKm != null ? formatDistance(distKm) : null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    rating: row.rating ?? null,
    userRatingCount: row.user_ratings_total ?? null,
    primaryType: null,
    openNow: periods ? isOpenNow(periods) : null,
    weekdayDescriptions: row.opening_hours?.weekday_text ?? null,
    photos: [],
    onPassage: row.is_passage_network ?? false,
    passageTier: row.passage_tier ?? null,
    status: 'active',
    contactName: null,
  }
}

export async function fetchNearbyCrematoriums(lat, lng) {
  const hasCoords = lat !== 0 || lng !== 0
  const rows = hasCoords
    ? await request(`/api/crematoriums/nearby-db?lat=${lat}&lng=${lng}&radius_miles=100`)
    : await request('/api/crematoriums/db')
  return (rows ?? []).map(normalizeDbRecord)
}

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
