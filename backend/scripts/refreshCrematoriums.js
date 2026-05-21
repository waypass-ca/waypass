/**
 * refreshCrematoriums.js
 *
 * Re-crawls tiles for Canadian provinces where Passage funeral homes exist.
 * Inserts new records, updates last_verified_at for existing ones,
 * and flags records not seen in the crawl as needs_review=true.
 *
 * IMPORTANT: Requires SUPABASE_SERVICE_ROLE_KEY (service role key, NOT anon key).
 *
 * Usage: npm run refresh:crematoriums
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const DELAY_MS = 200
const PAGE_TOKEN_DELAY_MS = 3000
const TILE_DEG = 2

// Canadian province/territory bounding boxes (approximate)
const PROVINCE_BOUNDS = {
  AB: { latMin: 49.0, latMax: 60.0, lngMin: -120.0, lngMax: -110.0 },
  BC: { latMin: 49.0, latMax: 60.0, lngMin: -139.0, lngMax: -114.0 },
  MB: { latMin: 49.0, latMax: 60.0, lngMin: -102.0, lngMax:  -89.0 },
  NB: { latMin: 45.0, latMax: 48.1, lngMin:  -69.0, lngMax:  -63.8 },
  NL: { latMin: 46.6, latMax: 60.4, lngMin:  -68.0, lngMax:  -52.6 },
  NS: { latMin: 43.4, latMax: 47.0, lngMin:  -66.4, lngMax:  -59.7 },
  NT: { latMin: 60.0, latMax: 70.0, lngMin: -136.5, lngMax: -102.0 },
  NU: { latMin: 61.0, latMax: 70.0, lngMin: -120.0, lngMax:  -61.0 },
  ON: { latMin: 42.0, latMax: 57.0, lngMin:  -95.2, lngMax:  -74.3 },
  PE: { latMin: 45.9, latMax: 47.1, lngMin:  -64.5, lngMax:  -62.0 },
  QC: { latMin: 45.0, latMax: 62.6, lngMin:  -79.8, lngMax:  -57.1 },
  SK: { latMin: 49.0, latMax: 60.0, lngMin: -110.0, lngMax: -101.4 },
  YT: { latMin: 60.0, latMax: 70.0, lngMin: -141.0, lngMax: -124.0 },
}

const ALL_PROVINCES = Object.keys(PROVINCE_BOUNDS)

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

async function getActiveProvinces() {
  try {
    const { data } = await supabase
      .from('funeral_homes')
      .select('state')           // "state" column stores province code
      .not('state', 'is', null)
    if (data?.length) {
      const provinces = [...new Set(data.map(r => r.state?.toUpperCase()).filter(Boolean))]
      if (provinces.length) return provinces
    }
  } catch {}
  console.log('funeral_homes table not found — refreshing all provinces')
  return ALL_PROVINCES
}

async function searchPlaces(lat, lng, radius, pageToken = null) {
  const url = pageToken
    ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_KEY}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=crematorium+OR+cremation+services&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_KEY}`
  const res = await fetch(url)
  return res.json()
}

async function fetchDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website&key=${GOOGLE_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK') return {}
  return {
    phone:   data.result?.formatted_phone_number ?? null,
    website: data.result?.website ?? null,
  }
}

async function main() {
  if (!GOOGLE_KEY) { console.error('Missing GOOGLE_MAPS_API_KEY'); process.exit(1) }

  const provinces = await getActiveProvinces()
  console.log(`Refreshing ${provinces.length} provinces: ${provinces.join(', ')}`)

  const seenPlaceIds = new Set()
  let added = 0, updated = 0, flagged = 0

  for (const province of provinces) {
    const bounds = PROVINCE_BOUNDS[province]
    if (!bounds) { console.warn(`No bounds for province: ${province}`); continue }

    const tiles = tilesForBounds(bounds)
    console.log(`  ${province}: ${tiles.length} tiles`)

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
            // New record — fetch phone + website from Place Details
            await sleep(DELAY_MS)
            const details = await fetchDetails(place.place_id)
            await supabase.from('crematoriums_db').insert({
              google_place_id: place.place_id,
              name:    place.name,
              address: place.formatted_address ?? null,
              state:   province,
              lat:     loc.lat,
              lng:     loc.lng,
              phone:   details.phone ?? null,
              website: details.website ?? null,
              last_verified_at: new Date().toISOString(),
            })
            added++
          }
        }

        pageToken = data.next_page_token ?? null
        page++
        await sleep(DELAY_MS)
      } while (pageToken && page < 3)
    }

    // Flag records in this province not seen in the crawl
    if (seenPlaceIds.size > 0) {
      const ids = [...seenPlaceIds].map(id => `'${id}'`).join(',')
      const { count } = await supabase
        .from('crematoriums_db')
        .update({ needs_review: true })
        .eq('state', province)
        .not('google_place_id', 'in', `(${ids})`)
      flagged += count ?? 0
    }
  }

  console.log(`\nRefresh complete — added: ${added}, updated: ${updated}, flagged for review: ${flagged}`)
}

main().catch(err => { console.error(err); process.exit(1) })
