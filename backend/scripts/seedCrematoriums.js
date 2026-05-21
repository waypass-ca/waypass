/**
 * seedCrematoriums.js
 *
 * Tiles the continental US into 2°×2° cells and calls the Google Places
 * Text Search API for each tile, upserting results into the crematoriums_db
 * table in Supabase.
 *
 * IMPORTANT: Requires SUPABASE_SERVICE_KEY (service role key, NOT anon key)
 * because the seed script writes directly and may need to bypass RLS.
 *
 * Usage: npm run seed:crematoriums
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

// Continental US bounds
const US_BOUNDS = { latMin: 24.5, latMax: 49.5, lngMin: -125, lngMax: -66 }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function tileBounds() {
  const tiles = []
  for (let lat = US_BOUNDS.latMin; lat < US_BOUNDS.latMax; lat += TILE_DEG) {
    for (let lng = US_BOUNDS.lngMin; lng < US_BOUNDS.lngMax; lng += TILE_DEG) {
      const centerLat = lat + TILE_DEG / 2
      const centerLng = lng + TILE_DEG / 2
      // radius in meters to cover the tile diagonal (~157km for 2°×2°)
      tiles.push({ centerLat, centerLng, radius: 157000 })
    }
  }
  return tiles
}

async function searchPlaces(lat, lng, radius, pageToken = null) {
  let url = pageToken
    ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_KEY}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=crematorium+OR+cremation+services&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_KEY}`

  const res = await fetch(url)
  return res.json()
}

async function upsertResults(results) {
  let upserted = 0
  for (const place of results) {
    const loc = place.geometry?.location
    if (!loc) continue
    const row = {
      google_place_id: place.place_id,
      name: place.name,
      address: place.formatted_address ?? null,
      city: null,
      state: null,
      zip: null,
      lat: loc.lat,
      lng: loc.lng,
    }
    // Parse city/state/zip from formatted_address
    if (place.formatted_address) {
      const parts = place.formatted_address.split(',').map(s => s.trim())
      if (parts.length >= 3) {
        row.city = parts[parts.length - 3] ?? null
        const stateZip = parts[parts.length - 2]?.trim().split(' ')
        row.state = stateZip?.[0] ?? null
        row.zip = stateZip?.[1] ?? null
      }
    }
    const { error } = await supabase
      .from('crematoriums_db')
      .upsert(row, { onConflict: 'google_place_id', ignoreDuplicates: true })
    if (!error) upserted++
  }
  return upserted
}

async function main() {
  if (!GOOGLE_KEY) { console.error('Missing GOOGLE_PLACES_API_KEY'); process.exit(1) }

  const tiles = tileBounds()
  console.log(`Seeding ${tiles.length} tiles…`)

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
