import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    streetAddress: row.street_address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    distance: row.distance,
    activeOrders: row.active_orders ?? row.active ?? 0,
    completedYTD: row.completed_ytd,
    avgTurnaround: row.avg_turnaround,
    avgFee: row.avg_fee,
    baseFee: row.base_fee,
    waypassRevenueShare: row.waypass_revenue_share,
    status: row.status,
    networkStatus: row.network_status ?? 'private',
    contactName: row.contact_name ?? row.contact,
    contactEmail: row.contact_email,
    phone: row.phone,
    website: row.website ?? null,
    rating: row.rating ?? null,
    userRatingCount: row.user_ratings_total ?? null,
    weekdayDescriptions: row.opening_hours?.weekday_text ?? null,
    partnerSince: row.partner_since ?? row.since,
    licenseNumber: row.license_number,
    vettingNotes: row.vetting_notes,
    connectedFuneralHomeIds: row.connected_funeral_home_ids ?? [],
  }
}

// GET / — returns only crematoriums connected to the current user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('crematoriums')
      .select('*')
      .is('deleted_at', null)
      .contains('connected_funeral_home_ids', [req.user.id])
      .order('name')
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// GET /nearby — discovery: Waypass DB (unconnected) + Google Places
router.get('/nearby', requireAuth, async (req, res, next) => {
  try {
    const { lat = 0, lng = 0, radius = 50, query = '' } = req.query

    // Waypass DB: non-deleted crematoriums the user is NOT already connected to
    // When a query is present, filter by name or location
    let dbQuery = supabase
      .from('crematoriums')
      .select('*')
      .is('deleted_at', null)
      .not('connected_funeral_home_ids', 'cs', `{${req.user.id}}`)

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,location.ilike.%${query}%,city.ilike.%${query}%`)
    }

    const { data: dbRows, error: dbError } = await dbQuery.order('name')
    if (dbError) throw dbError

    const waypassResults = dbRows.map(row => ({
      ...shapeRow(row),
      onWaypass: true,
    }))

    // Google Places is called client-side (browser key with referrer restrictions)
    res.json(waypassResults)
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const id = `CRM-${String(Date.now()).slice(-6)}`
    const partnerSince = new Date().getFullYear().toString()

    const { data, error } = await supabase
      .from('crematoriums')
      .insert({
        id,
        name: body.name,
        location: body.location,
        street_address: body.streetAddress ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zip: body.zip ?? null,
        distance: body.distance ?? null,
        contact_name: body.contactName ?? body.contact ?? null,
        contact: body.contactName ?? body.contact ?? null,
        contact_email: body.contactEmail ?? null,
        phone: body.phone ?? null,
        website: body.website ?? null,
        rating: body.rating ?? null,
        user_ratings_total: body.userRatingCount ?? null,
        opening_hours: body.weekdayDescriptions ? { weekday_text: body.weekdayDescriptions } : null,
        avg_turnaround: body.avgTurnaround ?? null,
        avg_fee: body.avgFee ?? null,
        base_fee: body.baseFee ?? null,
        waypass_revenue_share: body.waypassRevenueShare ?? null,
        network_status: body.networkStatus ?? 'private',
        status: 'active',
        active_orders: 0,
        active: 0,
        completed_ytd: 0,
        partner_since: partnerSince,
        since: partnerSince,
        license_number: body.licenseNumber ?? null,
        vetting_notes: body.vettingNotes ?? null,
        connected_funeral_home_ids: [req.user.id],
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// POST /:id/connect — add current user to connected_funeral_home_ids
router.post('/:id/connect', requireAuth, async (req, res, next) => {
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('crematoriums')
      .select('connected_funeral_home_ids')
      .eq('id', req.params.id)
      .is('deleted_at', null)
      .single()
    if (fetchErr) throw fetchErr
    if (!current) return res.status(404).json({ error: 'Crematorium not found' })

    const ids = current.connected_funeral_home_ids ?? []
    if (!ids.includes(req.user.id)) {
      ids.push(req.user.id)
    }

    const { data, error } = await supabase
      .from('crematoriums')
      .update({ connected_funeral_home_ids: ids })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// DELETE /:id/connect — remove current user from connected_funeral_home_ids
router.delete('/:id/connect', requireAuth, async (req, res, next) => {
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('crematoriums')
      .select('connected_funeral_home_ids')
      .eq('id', req.params.id)
      .is('deleted_at', null)
      .single()
    if (fetchErr) throw fetchErr
    if (!current) return res.status(404).json({ error: 'Crematorium not found' })

    const ids = (current.connected_funeral_home_ids ?? []).filter(id => id !== req.user.id)

    const { data, error } = await supabase
      .from('crematoriums')
      .update({ connected_funeral_home_ids: ids })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('crematoriums')
      .update({
        name: body.name,
        location: body.location,
        street_address: body.streetAddress,
        city: body.city,
        state: body.state,
        zip: body.zip,
        distance: body.distance,
        contact_name: body.contactName ?? body.contact,
        contact: body.contactName ?? body.contact,
        contact_email: body.contactEmail,
        phone: body.phone,
        website: body.website,
        rating: body.rating,
        user_ratings_total: body.userRatingCount,
        opening_hours: body.weekdayDescriptions ? { weekday_text: body.weekdayDescriptions } : undefined,
        avg_turnaround: body.avgTurnaround,
        avg_fee: body.avgFee,
        base_fee: body.baseFee,
        waypass_revenue_share: body.waypassRevenueShare,
        network_status: body.networkStatus,
        status: body.status,
        license_number: body.licenseNumber,
        vetting_notes: body.vettingNotes,
        modified_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Crematorium not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('crematoriums')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── crematoriums_db routes (canonical Google-sourced DB) ──────────────────────

// GET /api/crematoriums/db — query the crematoriums_db table (separate from legacy table)
router.get('/db', async (req, res, next) => {
  try {
    const { state, city, is_waypass_network, tier } = req.query
    let q = supabase.from('crematoriums_db').select('*').eq('needs_review', false)
    if (state) q = q.eq('state', state)
    if (city) q = q.ilike('city', `%${city}%`)
    if (is_waypass_network !== undefined) q = q.eq('is_waypass_network', is_waypass_network === 'true')
    if (tier) q = q.eq('waypass_tier', tier)
    const { data, error } = await q.order('name')
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// GET /api/crematoriums/nearby-db — PostGIS distance search
router.get('/nearby-db', async (req, res, next) => {
  try {
    const { lat, lng, radius_miles = 50 } = req.query
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' })
    const radiusMeters = Number(radius_miles) * 1609.34
    const { data, error } = await supabase.rpc('nearby_crematoriums', {
      user_lat: Number(lat),
      user_lng: Number(lng),
      radius_m: radiusMeters,
    })
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// GET /api/crematoriums/db/:id
router.get('/db/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('crematoriums_db').select('*').eq('id', req.params.id).single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Not found' })
    res.json(data)
  } catch (err) { next(err) }
})

// PATCH /api/crematoriums/db/:id/network — admin only
router.patch('/db/:id/network', async (req, res, next) => {
  try {
    if (req.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const { is_waypass_network, waypass_tier } = req.body
    const { data, error } = await supabase
      .from('crematoriums_db')
      .update({ is_waypass_network, waypass_tier })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

export default router
