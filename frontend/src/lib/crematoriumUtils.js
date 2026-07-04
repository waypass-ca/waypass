// Pure utility functions for crematoriums_db records.
// Kept separate from api.js so they can be unit-tested without browser/Supabase deps.

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/**
 * Returns true/false if the business is open at `now`, or null if no hours stored.
 * periods format: [{open: {day: 0-6, time: "HHMM"}, close: {day: 0-6, time: "HHMM"}}]
 * Accepts an optional `now` Date for testability; defaults to current time.
 */
export function isOpenNow(periods, now = new Date()) {
  if (!periods?.length) return null
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

export function normalizeDbRecord(row) {
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
    onWaypass: row.is_waypass_network ?? false,
    waypassTier: row.waypass_tier ?? null,
    status: 'active',
    contactName: null,
  }
}
