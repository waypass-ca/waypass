/**
 * refreshCrematoriums.js
 *
 * Re-crawls tiles for states where Passage funeral homes exist.
 * Inserts new records, updates last_verified_at for existing ones,
 * and flags records not seen in the crawl as needs_review=true.
 *
 * IMPORTANT: Requires SUPABASE_SERVICE_KEY (service role key, NOT anon key).
 *
 * Usage: npm run refresh:crematoriums
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const DELAY_MS = 200
const PAGE_TOKEN_DELAY_MS = 2000
const TILE_DEG = 2

// State bounding boxes (approximate)
const STATE_BOUNDS = {
  AL: { latMin: 30.2, latMax: 35.0, lngMin: -88.5, lngMax: -84.9 },
  AK: { latMin: 54.5, latMax: 71.5, lngMin: -168.0, lngMax: -130.0 },
  AZ: { latMin: 31.3, latMax: 37.0, lngMin: -114.8, lngMax: -109.0 },
  AR: { latMin: 33.0, latMax: 36.5, lngMin: -94.6, lngMax: -89.6 },
  CA: { latMin: 32.5, latMax: 42.0, lngMin: -124.5, lngMax: -114.1 },
  CO: { latMin: 37.0, latMax: 41.0, lngMin: -109.1, lngMax: -102.0 },
  CT: { latMin: 40.9, latMax: 42.1, lngMin: -73.7, lngMax: -71.8 },
  DE: { latMin: 38.4, latMax: 39.8, lngMin: -75.8, lngMax: -75.0 },
  FL: { latMin: 24.5, latMax: 31.0, lngMin: -87.6, lngMax: -80.0 },
  GA: { latMin: 30.4, latMax: 35.0, lngMin: -85.6, lngMax: -80.8 },
  HI: { latMin: 18.9, latMax: 22.2, lngMin: -160.3, lngMax: -154.8 },
  ID: { latMin: 42.0, latMax: 49.0, lngMin: -117.2, lngMax: -111.0 },
  IL: { latMin: 36.9, latMax: 42.5, lngMin: -91.5, lngMax: -87.5 },
  IN: { latMin: 37.8, latMax: 41.8, lngMin: -88.1, lngMax: -84.8 },
  IA: { latMin: 40.4, latMax: 43.5, lngMin: -96.6, lngMax: -90.1 },
  KS: { latMin: 37.0, latMax: 40.0, lngMin: -102.1, lngMax: -94.6 },
  KY: { latMin: 36.5, latMax: 39.1, lngMin: -89.6, lngMax: -81.9 },
  LA: { latMin: 28.9, latMax: 33.0, lngMin: -94.1, lngMax: -88.8 },
  ME: { latMin: 43.1, latMax: 47.5, lngMin: -71.1, lngMax: -66.9 },
  MD: { latMin: 37.9, latMax: 39.7, lngMin: -79.5, lngMax: -75.0 },
  MA: { latMin: 41.2, latMax: 42.9, lngMin: -73.5, lngMax: -69.9 },
  MI: { latMin: 41.7, latMax: 48.3, lngMin: -90.4, lngMax: -82.4 },
  MN: { latMin: 43.5, latMax: 49.4, lngMin: -97.2, lngMax: -89.5 },
  MS: { latMin: 30.2, latMax: 35.0, lngMin: -91.7, lngMax: -88.1 },
  MO: { latMin: 36.0, latMax: 40.6, lngMin: -95.8, lngMax: -89.1 },
  MT: { latMin: 44.4, latMax: 49.0, lngMin: -116.1, lngMax: -104.0 },
  NE: { latMin: 40.0, latMax: 43.0, lngMin: -104.1, lngMax: -95.3 },
  NV: { latMin: 35.0, latMax: 42.0, lngMin: -120.0, lngMax: -114.0 },
  NH: { latMin: 42.7, latMax: 45.3, lngMin: -72.6, lngMax: -70.6 },
  NJ: { latMin: 38.9, latMax: 41.4, lngMin: -75.6, lngMax: -73.9 },
  NM: { latMin: 31.3, latMax: 37.0, lngMin: -109.1, lngMax: -103.0 },
  NY: { latMin: 40.5, latMax: 45.0, lngMin: -79.8, lngMax: -71.9 },
  NC: { latMin: 33.8, latMax: 36.6, lngMin: -84.3, lngMax: -75.5 },
  ND: { latMin: 45.9, latMax: 49.0, lngMin: -104.1, lngMax: -96.6 },
  OH: { latMin: 38.4, latMax: 42.3, lngMin: -84.8, lngMax: -80.5 },
  OK: { latMin: 33.6, latMax: 37.0, lngMin: -103.0, lngMax: -94.4 },
  OR: { latMin: 42.0, latMax: 46.3, lngMin: -124.6, lngMax: -116.5 },
  PA: { latMin: 39.7, latMax: 42.3, lngMin: -80.5, lngMax: -74.7 },
  RI: { latMin: 41.1, latMax: 42.0, lngMin: -71.9, lngMax: -71.1 },
  SC: { latMin: 32.0, latMax: 35.2, lngMin: -83.4, lngMax: -78.5 },
  SD: { latMin: 42.5, latMax: 45.9, lngMin: -104.1, lngMax: -96.4 },
  TN: { latMin: 35.0, latMax: 36.7, lngMin: -90.3, lngMax: -81.6 },
  TX: { latMin: 25.8, latMax: 36.5, lngMin: -106.7, lngMax: -93.5 },
  UT: { latMin: 37.0, latMax: 42.0, lngMin: -114.1, lngMax: -109.0 },
  VT: { latMin: 42.7, latMax: 45.0, lngMin: -73.4, lngMax: -71.5 },
  VA: { latMin: 36.5, latMax: 39.5, lngMin: -83.7, lngMax: -75.2 },
  WA: { latMin: 45.5, latMax: 49.0, lngMin: -124.8, lngMax: -116.9 },
  WV: { latMin: 37.2, latMax: 40.6, lngMin: -82.6, lngMax: -77.7 },
  WI: { latMin: 42.5, latMax: 47.1, lngMin: -92.9, lngMax: -86.8 },
  WY: { latMin: 41.0, latMax: 45.0, lngMin: -111.1, lngMax: -104.1 },
  DC: { latMin: 38.8, latMax: 39.0, lngMin: -77.1, lngMax: -76.9 },
}

const ALL_STATES = Object.keys(STATE_BOUNDS)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function tilesForBounds({ latMin, latMax, lngMin, lngMax }) {
  const tiles = []
  for (let lat = latMin; lat < latMax; lat += TILE_DEG) {
    for (let lng = lngMin; lng < lngMax; lng += TILE_DEG) {
      tiles.push({ centerLat: lat + TILE_DEG / 2, centerLng: lng + TILE_DEG / 2, radius: 157000 })
    }
  }
  return tiles
}

async function getActiveStates() {
  try {
    const { data } = await supabase.from('funeral_homes').select('state').not('state', 'is', null)
    if (data?.length) return [...new Set(data.map(r => r.state?.toUpperCase()).filter(Boolean))]
  } catch {}
  console.log('funeral_homes table not found — refreshing all states')
  return ALL_STATES
}

async function searchPlaces(lat, lng, radius, pageToken = null) {
  const url = pageToken
    ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_KEY}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=crematorium+OR+cremation+services&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_KEY}`
  const res = await fetch(url)
  return res.json()
}

async function main() {
  if (!GOOGLE_KEY) { console.error('Missing GOOGLE_PLACES_API_KEY'); process.exit(1) }

  const states = await getActiveStates()
  console.log(`Refreshing ${states.length} states: ${states.join(', ')}`)

  const seenPlaceIds = new Set()
  let added = 0, updated = 0

  for (const state of states) {
    const bounds = STATE_BOUNDS[state]
    if (!bounds) continue
    const tiles = tilesForBounds(bounds)

    for (const tile of tiles) {
      let pageToken = null
      let page = 0
      do {
        if (pageToken) await sleep(PAGE_TOKEN_DELAY_MS)
        const data = await searchPlaces(tile.centerLat, tile.centerLng, tile.radius, pageToken)
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') { break }

        for (const place of data.results ?? []) {
          const loc = place.geometry?.location
          if (!loc) continue
          seenPlaceIds.add(place.place_id)

          const { data: existing } = await supabase
            .from('crematoriums_db')
            .select('id')
            .eq('google_place_id', place.place_id)
            .single()

          if (existing) {
            await supabase.from('crematoriums_db')
              .update({ last_verified_at: new Date().toISOString(), needs_review: false })
              .eq('google_place_id', place.place_id)
            updated++
          } else {
            const row = {
              google_place_id: place.place_id,
              name: place.name,
              address: place.formatted_address ?? null,
              lat: loc.lat,
              lng: loc.lng,
              last_verified_at: new Date().toISOString(),
            }
            if (place.formatted_address) {
              const parts = place.formatted_address.split(',').map(s => s.trim())
              if (parts.length >= 3) {
                row.city = parts[parts.length - 3] ?? null
                const stateZip = parts[parts.length - 2]?.trim().split(' ')
                row.state = stateZip?.[0] ?? null
                row.zip = stateZip?.[1] ?? null
              }
            }
            await supabase.from('crematoriums_db').insert(row)
            added++
          }
        }

        pageToken = data.next_page_token ?? null
        page++
        await sleep(DELAY_MS)
      } while (pageToken && page < 3)
    }

    // Flag records in this state not seen in the crawl
    const { error } = await supabase
      .from('crematoriums_db')
      .update({ needs_review: true })
      .eq('state', state)
      .not('google_place_id', 'in', `(${[...seenPlaceIds].map(id => `'${id}'`).join(',')})`)
    if (error) console.warn(`Flag error for ${state}:`, error.message)
  }

  console.log(`\nRefresh complete — added: ${added}, updated: ${updated}`)
}

main().catch(err => { console.error(err); process.exit(1) })
