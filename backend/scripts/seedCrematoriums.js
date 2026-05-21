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

const CANADA_BOUNDS = { latMin: 42.0, latMax: 70.0, lngMin: -141.0, lngMax: -52.0 }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function tileBounds() {
  const tiles = []
  for (let lat = CANADA_BOUNDS.latMin; lat < CANADA_BOUNDS.latMax; lat += TILE_DEG) {
    for (let lng = CANADA_BOUNDS.lngMin; lng < CANADA_BOUNDS.lngMax; lng += TILE_DEG) {
      tiles.push({ centerLat: lat + TILE_DEG / 2, centerLng: lng + TILE_DEG / 2, radius: 157000 })
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

  const tiles = tileBounds()
  console.log(`Seeding Canada — ${tiles.length} tiles…`)

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
