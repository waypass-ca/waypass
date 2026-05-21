/**
 * seedCrematoriums.js
 *
 * Tiles Canada into 2°×2° cells, calls the Google Places Text Search API
 * for each tile, then fetches Place Details (phone + website) for each result.
 * Upserts everything into crematoriums_db in Supabase.
 *
 * IMPORTANT: Requires SUPABASE_SERVICE_ROLE_KEY (service role key, NOT anon key)
 * because the seed script writes directly and may need to bypass RLS.
 *
 * Usage: npm run seed:crematoriums
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

// Configure which provinces to seed.
// Set SEED_PROVINCES=ALL to seed all of Canada, or a comma-separated list e.g. ON,BC,QC
// Defaults to ON.
const SEED_PROVINCES_ENV = process.env.SEED_PROVINCES ?? 'ON'

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

function getTargetProvinces() {
  if (SEED_PROVINCES_ENV.toUpperCase() === 'ALL') return ALL_PROVINCES
  return SEED_PROVINCES_ENV.split(',').map(p => p.trim().toUpperCase()).filter(p => PROVINCE_BOUNDS[p])
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function tileBounds(provinces) {
  const tiles = []
  for (const province of provinces) {
    const b = PROVINCE_BOUNDS[province]
    for (let lat = b.latMin; lat < b.latMax; lat += TILE_DEG) {
      for (let lng = b.lngMin; lng < b.lngMax; lng += TILE_DEG) {
        tiles.push({ centerLat: lat + TILE_DEG / 2, centerLng: lng + TILE_DEG / 2, radius: 157000, province })
      }
    }
  }
  return tiles
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

// Canadian address format: "Street, City, Province Postal, Canada"
function parseCanadianAddress(formatted) {
  const parts = formatted.split(',').map(s => s.trim())
  if (parts.length < 3) return {}
  const provPostal = parts[parts.length - 2]?.trim().split(' ')
  return {
    city:     parts[parts.length - 3] ?? null,
    province: provPostal?.[0] ?? null,
    postal:   provPostal?.slice(1).join(' ') ?? null,
  }
}

async function upsertResults(results) {
  let upserted = 0
  for (const place of results) {
    const loc = place.geometry?.location
    if (!loc) continue

    // Fetch phone + website from Place Details
    await sleep(DELAY_MS)
    const details = await fetchDetails(place.place_id)

    const parsed = place.formatted_address ? parseCanadianAddress(place.formatted_address) : {}
    const row = {
      google_place_id: place.place_id,
      name:    place.name,
      address: place.formatted_address ?? null,
      city:    parsed.city ?? null,
      state:   parsed.province ?? null,
      zip:     parsed.postal ?? null,
      lat:     loc.lat,
      lng:     loc.lng,
      phone:   details.phone ?? null,
      website: details.website ?? null,
    }

    // ignoreDuplicates: false so re-runs fill in phone/website for existing records
    const { error } = await supabase
      .from('crematoriums_db')
      .upsert(row, { onConflict: 'google_place_id', ignoreDuplicates: false })
    if (!error) upserted++
  }
  return upserted
}

async function main() {
  if (!GOOGLE_KEY) { console.error('Missing GOOGLE_MAPS_API_KEY'); process.exit(1) }

  const provinces = getTargetProvinces()
  if (!provinces.length) { console.error('No valid provinces specified in SEED_PROVINCES'); process.exit(1) }

  const tiles = tileBounds(provinces)
  const label = provinces.length === ALL_PROVINCES.length ? 'all of Canada' : provinces.join(', ')
  console.log(`Seeding ${label} — ${provinces.length} province(s), ${tiles.length} tiles…`)
  console.log('To change scope: SEED_PROVINCES=BC,QC npm run seed:crematoriums')

  let totalUpserted = 0
  let tilesCompleted = 0

  for (const tile of tiles) {
    let pageToken = null
    let page = 0

    do {
      if (pageToken) await sleep(PAGE_TOKEN_DELAY_MS)
      const data = await searchPlaces(tile.centerLat, tile.centerLng, tile.radius, pageToken)
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn(`  Tile (${tile.centerLat.toFixed(1)},${tile.centerLng.toFixed(1)}) page ${page}: ${data.status}`)
        break
      }
      const count = await upsertResults(data.results ?? [])
      totalUpserted += count
      pageToken = data.next_page_token ?? null
      page++
      await sleep(DELAY_MS)
    } while (pageToken && page < 3)

    tilesCompleted++
    if (tilesCompleted % 10 === 0) {
      console.log(`  ${tilesCompleted}/${tiles.length} tiles — ${totalUpserted} records upserted`)
    }
  }

  console.log(`\nDone. ${tilesCompleted} tiles, ${totalUpserted} total records upserted.`)
}

main().catch(err => { console.error(err); process.exit(1) })
