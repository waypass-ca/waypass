import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const CASE_SELECT =
  '*, case_notes(*), deceased_record:deceased(*), case_contacts(*), case_addons(*), case_documents(*)'

function shapeRow(row) {
  const d = row.deceased_record
  const primaryContact = (row.case_contacts ?? []).find(c => c.is_primary)

  const deceasedName = d
    ? `${d.first_name} ${d.last_name}`.trim()
    : (row.deceased ?? null)

  return {
    id: row.id,
    deceased: deceasedName,
    family: primaryContact?.name ?? row.family,
    contactName: primaryContact?.name ?? row.contact_name,
    contactPhone: primaryContact?.phone ?? row.contact_phone,
    contactEmail: primaryContact?.email ?? row.contact_email,
    relationship: primaryContact?.relationship ?? row.relationship,
    dob: d?.date_of_birth ?? row.dob,
    dop: d?.date_of_passing ?? row.dop,
    location: d?.place_of_death ?? row.location,
    timeOfDeath: d?.time_of_death ?? row.time_of_death,
    wristbandId: d?.wristband_id ?? row.wristband_id,
    package: row.package_name,
    packagePrice: row.package_price,
    addons: row.case_addons?.length
      ? row.case_addons.map(a => a.addon_id)
      : (row.addon_names ?? []),
    status: row.status,
    date: row.case_date ?? row.date,
    amount: row.amount_billed ?? row.amount,
    crematorium: row.crematorium_name,
    removalStaff: row.removal_staff,
    removalTime: row.removal_time,
    documents: row.case_documents?.length
      ? row.case_documents
      : (row.documents ?? []),
    notes: (row.case_notes ?? [])
      .sort((a, b) => a.id - b.id)
      .map(n => ({
        author: n.author_label ?? n.author ?? 'Staff',
        text: n.text,
        time: n.time ?? new Date(n.created_at).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        }),
      })),
  }
}

// ── GET /api/cases ──────────────────────────────
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(CASE_SELECT)
      .is('deleted_at', null)
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
      .select(CASE_SELECT)
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

    // 1. Create deceased record
    let deceasedId = null
    const fullName = (body.deceased ?? '').trim()
    if (fullName) {
      const spaceIdx = fullName.indexOf(' ')
      const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName
      const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : fullName

      const { data: deceasedRow, error: deceasedErr } = await supabase
        .from('deceased')
        .insert({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: body.dob ?? null,
          date_of_passing: body.dop ?? null,
          time_of_death: body.time_of_death ?? null,
          place_of_death: body.location ?? null,
          wristband_id: body.wristband_id ?? null,
        })
        .select()
        .single()
      if (deceasedErr) throw deceasedErr
      deceasedId = deceasedRow.id
    }

    // 2. Insert case (writes both normalized + legacy columns)
    const { error: caseErr } = await supabase
      .from('cases')
      .insert({
        id,
        deceased_id: deceasedId,
        amount_billed: body.amount ?? body.amount_billed ?? 0,
        case_date: body.date ?? body.case_date ?? null,
        // Legacy columns kept for backward compat
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
    if (caseErr) throw caseErr

    // 3. Create primary contact record
    if (body.contact_name) {
      await supabase.from('case_contacts').insert({
        case_id: id,
        name: body.contact_name,
        relationship: body.relationship ?? null,
        phone: body.contact_phone ?? null,
        email: body.contact_email ?? null,
        is_primary: true,
      })
    }

    const { data, error } = await supabase
      .from('cases')
      .select(CASE_SELECT)
      .eq('id', id)
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
    const allowed = ['pending', 'transit', 'cremation', 'complete', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` })
    }

    const { data, error } = await supabase
      .from('cases')
      .update({ status, modified_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select(CASE_SELECT)
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

    const displayTime = time ?? new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })

    const { data, error } = await supabase
      .from('case_notes')
      .insert({
        case_id: req.params.id,
        author: author ?? 'You',
        author_label: author ?? 'You',
        text: text.trim(),
        time: displayTime,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({
      author: data.author_label ?? data.author,
      text: data.text,
      time: data.time,
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/cases/:id/documents (legacy JSONB) ─
router.post('/:id/documents', requireAuth, async (req, res, next) => {
  try {
    const { type, path, name } = req.body
    if (!path || !name) return res.status(400).json({ error: 'path and name are required' })

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

// ── GET /api/cases/:id/custody ───────────────────
router.get('/:id/custody', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('case_custody')
      .select('stage, completed, staff_label, staff, timestamp')
      .eq('case_id', req.params.id)
      .order('stage')
    if (error) throw error

    const stages = Array.from({ length: 9 }, (_, i) => {
      const row = data.find(r => r.stage === i)
      return row
        ? {
            completed: row.completed,
            staff: row.staff_label ?? row.staff ?? null,
            timestamp: row.timestamp ?? null,
          }
        : { completed: false, staff: null, timestamp: null }
    })
    res.json(stages)
  } catch (err) {
    next(err)
  }
})

// ── PUT /api/cases/:id/custody/:stage ────────────
router.put('/:id/custody/:stage', requireAuth, async (req, res, next) => {
  try {
    const stage = parseInt(req.params.stage, 10)
    if (isNaN(stage) || stage < 0 || stage > 8) {
      return res.status(400).json({ error: 'stage must be 0–8' })
    }

    const { completed, staff, timestamp } = req.body

    const { data, error } = await supabase
      .from('case_custody')
      .upsert(
        {
          case_id: req.params.id,
          stage,
          completed: !!completed,
          staff: staff ?? null,
          staff_label: staff ?? null,
          timestamp: timestamp ?? null,
        },
        { onConflict: 'case_id,stage' }
      )
      .select()
      .single()

    if (error) throw error
    res.json({
      completed: data.completed,
      staff: data.staff_label ?? data.staff,
      timestamp: data.timestamp,
    })
  } catch (err) {
    next(err)
  }
})

export default router
