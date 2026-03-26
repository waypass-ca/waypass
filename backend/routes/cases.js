import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Transform DB row (snake_case) → frontend shape (camelCase, matching original mockData)
function shapeRow(row) {
  return {
    id: row.id,
    deceased: row.deceased,
    family: row.family,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    relationship: row.relationship,
    dob: row.dob,
    dop: row.dop,
    location: row.location,
    package: row.package_name,
    packagePrice: row.package_price,
    addons: row.addon_names ?? [],
    status: row.status,
    date: row.date,
    amount: row.amount,
    crematorium: row.crematorium_name,
    timeOfDeath: row.time_of_death,
    removalStaff: row.removal_staff,
    removalTime: row.removal_time,
    wristbandId: row.wristband_id,
    documents: row.documents ?? [],
    notes: (row.case_notes ?? [])
      .sort((a, b) => a.id - b.id)
      .map(n => ({ author: n.author, text: n.text, time: n.time })),
  }
}

// ── GET /api/cases ──────────────────────────────
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*, case_notes(*)')
      .order('id', { ascending: false })
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// ── GET /api/cases/:id ──────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*, case_notes(*)')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Case not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/cases ─────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const id = `PSG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

    const { data, error } = await supabase
      .from('cases')
      .insert({
        id,
        deceased: body.deceased,
        family: body.family,
        contact_name: body.contact_name,
        contact_phone: body.contact_phone,
        contact_email: body.contact_email,
        relationship: body.relationship,
        dob: body.dob,
        dop: body.dop,
        location: body.location,
        package_id: body.package_id ?? null,
        package_name: body.package_name,
        package_price: body.package_price,
        addon_names: body.addon_names ?? [],
        is_deceased: body.is_deceased ?? true,
        status: body.status ?? 'pending',
        date: body.date,
        amount: body.amount,
        crematorium_id: body.crematorium_id ?? null,
        crematorium_name: body.crematorium_name ?? null,
        time_of_death: body.time_of_death ?? null,
        removal_staff: body.removal_staff ?? null,
        removal_time: body.removal_time ?? null,
        wristband_id: body.wristband_id ?? null,
        documents: body.documents ?? [],
      })
      .select('*, case_notes(*)')
      .single()

    if (error) throw error
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/cases/:id/status ─────────────────
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body
    const allowed = ['pending', 'transit', 'cremation', 'complete']
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` })
    }

    const { data, error } = await supabase
      .from('cases')
      .update({ status })
      .eq('id', req.params.id)
      .select('*, case_notes(*)')
      .single()

    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/cases/:id/notes ───────────────────
router.post('/:id/notes', requireAuth, async (req, res, next) => {
  try {
    const { author, text, time } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'text is required' })

    const { data, error } = await supabase
      .from('case_notes')
      .insert({
        case_id: req.params.id,
        author: author ?? 'You',
        text: text.trim(),
        time: time ?? new Date().toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        }),
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ author: data.author, text: data.text, time: data.time })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/cases/:id/documents ───────────────
router.post('/:id/documents', requireAuth, async (req, res, next) => {
  try {
    const { type, path, name } = req.body
    if (!path || !name) return res.status(400).json({ error: 'path and name are required' })

    // Fetch current documents array then append
    const { data: existing, error: fetchError } = await supabase
      .from('cases')
      .select('documents')
      .eq('id', req.params.id)
      .single()
    if (fetchError) throw fetchError

    const current = existing.documents ?? []
    const updated = [...current, { type: type ?? null, path, name }]

    const { error } = await supabase
      .from('cases')
      .update({ documents: updated })
      .eq('id', req.params.id)
    if (error) throw error

    res.status(201).json({ type: type ?? null, path, name })
  } catch (err) {
    next(err)
  }
})

export default router
