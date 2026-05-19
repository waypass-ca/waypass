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
    passageRevenueShare: row.passage_revenue_share,
    status: row.status,
    networkStatus: row.network_status ?? 'private',
    contactName: row.contact_name ?? row.contact,
    contactEmail: row.contact_email,
    phone: row.phone,
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

// GET /nearby — discovery: Passage DB (unconnected) + Google Places
router.get('/nearby', requireAuth, async (req, res, next) => {
  try {
    const { lat = 0, lng = 0, radius = 50, query = '' } = req.query

    // Passage DB: non-deleted crematoriums the user is NOT already connected to
    const { data: dbRows, error: dbError } = await supabase
      .from('crematoriums')
      .select('*')
      .is('deleted_at', null)
      .not('connected_funeral_home_ids', 'cs', `{${req.user.id}}`)
      .order('name')
    if (dbError) throw dbError

    const passageResults = dbRows.map(row => ({
      ...shapeRow(row),
      onPassage: true,
    }))

    // Google Places is called client-side (browser key with referrer restrictions)
    res.json(passageResults)
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
        avg_turnaround: body.avgTurnaround ?? null,
        avg_fee: body.avgFee ?? null,
        base_fee: body.baseFee ?? null,
        passage_revenue_share: body.passageRevenueShare ?? null,
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
        avg_turnaround: body.avgTurnaround,
        avg_fee: body.avgFee,
        base_fee: body.baseFee,
        passage_revenue_share: body.passageRevenueShare,
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

export default router
