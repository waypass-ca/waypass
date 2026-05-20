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

// Bootstrap the Maps JS SDK once using the async+callback pattern
let placesLibPromise = null
function loadPlacesLib() {
  if (placesLibPromise) return placesLibPromise
  placesLibPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places?.Place) {
      resolve(window.google.maps.places)
      return
    }
    window.__mapsReady = () => {
      delete window.__mapsReady
      resolve(window.google.maps.places)
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&loading=async&callback=__mapsReady`
    script.async = true
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
  return placesLibPromise
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

async function fetchGooglePlaces(lat, lng, query, passageNames) {
  if (!GOOGLE_KEY) {
    console.warn('[Places] VITE_GOOGLE_MAPS_API_KEY not set')
    return []
  }
  const { Place } = await loadPlacesLib()
  const hasCoords = lat !== 0 || lng !== 0

  const request = {
    textQuery: query ? `${query} crematorium` : 'crematorium',
    fields: [
      'id', 'displayName', 'formattedAddress', 'location',
      'nationalPhoneNumber', 'internationalPhoneNumber',
      'websiteURI', 'regularOpeningHours', 'businessStatus',
      'rating', 'userRatingCount', 'primaryType', 'photos',
    ],
    maxResultCount: 20,
    ...(hasCoords ? {
      locationBias: {
        center: new window.google.maps.LatLng(lat, lng),
        radius: 50000,
      },
    } : {}),
  }

  const { places } = await Place.searchByText(request)

  function extractCoord(loc, key) {
    if (!loc) return null
    const val = loc[key]
    return typeof val === 'function' ? val() : (typeof val === 'number' ? val : null)
  }

  function formatType(type) {
    if (!type) return null
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (places ?? [])
    .filter(p => !passageNames.has((p.displayName ?? '').toLowerCase()))
    .map(p => {
      const placeLat = extractCoord(p.location, 'lat')
      const placeLng = extractCoord(p.location, 'lng')
      const distance = (hasCoords && placeLat && placeLng)
        ? formatDistance(haversineKm(lat, lng, placeLat, placeLng))
        : null

      let openNow = null
      try { openNow = p.regularOpeningHours?.isOpen() ?? null } catch {}

      const photos = (p.photos ?? []).slice(0, 6).map(photo => {
        try { return photo.getURI({ maxWidth: 800, maxHeight: 500 }) } catch { return null }
      }).filter(Boolean)

      return {
        id: p.id,
        name: p.displayName ?? '',
        location: p.formattedAddress ?? '',
        streetAddress: p.formattedAddress ?? null,
        lat: placeLat,
        lng: placeLng,
        distance,
        phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
        website: p.websiteURI ?? null,
        rating: p.rating ?? null,
        userRatingCount: p.userRatingCount ?? null,
        primaryType: formatType(p.primaryType),
        weekdayDescriptions: p.regularOpeningHours?.weekdayDescriptions ?? null,
        openNow,
        photos,
        status: 'active',
        contactName: null,
        onPassage: false,
      }
    })
}

export async function fetchNearbyCrematoriums(lat, lng, query = '') {
  const passageResults = await mutate(`/api/crematoriums/nearby?lat=${lat}&lng=${lng}&radius=50&query=${encodeURIComponent(query)}`)
  const passageNames = new Set(passageResults.map(r => r.name.toLowerCase()))
  const googleResults = await fetchGooglePlaces(lat, lng, query, passageNames).catch(err => {
    console.error('[Places] failed:', err.message)
    return []
  })
  return [...passageResults, ...googleResults]
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
