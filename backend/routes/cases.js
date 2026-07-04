import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireWrite } from '../middleware/requireRole.js'
import { notifyUser } from '../lib/notifications.js'

// Case IDs are shown to staff, so keep the recognizable PSG-YEAR-XXXXXX shape,
// but use a random suffix (not a slice of Date.now()) so IDs can't be enumerated.
const newCaseId = () =>
  `PSG-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`

const lastName = (name) => {
  if (!name) return null
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1]
}
const withLastName = (name, subject) => {
  const ln = lastName(name)
  return ln ? `${ln} ${subject}` : subject
}

const router = Router()

const CASE_SELECT =
  '*, case_notes(*), deceased_record:deceased(*), case_contacts(*), case_addons(*), case_documents(*), folder:folders(*)'

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
    crematoriumId: row.crematorium_id ?? null,
    shippingPartnerId: row.shipping_partner_id ?? null,
    removalStaff: row.removal_staff,
    removalTime: row.removal_time,
    folderId: row.folder?.id ?? row.folder_id ?? null,
    folderName: row.folder?.name ?? null,
    documents: (row.case_documents ?? []).filter(d => !d.deleted_at),
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
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(CASE_SELECT)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .is('deleted_at', null)
      .order('id', { ascending: false })
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// ── GET /api/cases/:id ──────────────────────────
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(CASE_SELECT)
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Case not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/cases ─────────────────────────────
router.post('/', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const body = req.body
    const id = newCaseId()

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
        funeral_home_id: req.user.funeralHomeId,
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

// ── PATCH /api/cases/:id ────────────────────────
// Top-level case fields. Whitelisted; unknown columns rejected.
router.patch('/:id', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const ALLOWED = new Set([
      'status', 'folder_id', 'case_type',
      'package_id', 'package_name', 'package_price',
      'amount_billed', 'case_date', 'crematorium_id', 'crematorium_name',
      'removal_staff', 'removal_time',
    ])
    const STATUS_ENUM = ['pending', 'transit', 'cremation', 'complete', 'cancelled']

    const patch = {}
    for (const [k, v] of Object.entries(req.body ?? {})) {
      if (!ALLOWED.has(k)) return res.status(400).json({ error: `Field "${k}" is not editable` })
      patch[k] = v
    }
    if ('status' in patch && !STATUS_ENUM.includes(patch.status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUS_ENUM.join(', ')}` })
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' })
    }
    patch.modified_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('cases')
      .update(patch)
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .select(CASE_SELECT)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Case not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/cases/:id/deceased ───────────────
router.patch('/:id/deceased', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const ALLOWED = new Set([
      'first_name', 'last_name',
      'date_of_birth', 'date_of_passing', 'time_of_death',
      'place_of_death', 'wristband_id',
    ])
    const patch = {}
    for (const [k, v] of Object.entries(req.body ?? {})) {
      if (!ALLOWED.has(k)) return res.status(400).json({ error: `Field "${k}" is not editable` })
      patch[k] = v === '' ? null : v
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' })
    }

    const { data: caseRow, error: caseErr } = await supabase
      .from('cases').select('deceased_id').eq('id', req.params.id).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr) throw caseErr
    if (!caseRow) return res.status(404).json({ error: 'Case not found' })

    let deceasedId = caseRow.deceased_id
    if (!deceasedId) {
      // Create row on first edit if the case predates the deceased normalization.
      const { data: created, error: createErr } = await supabase
        .from('deceased').insert(patch).select().single()
      if (createErr) throw createErr
      deceasedId = created.id
      const { error: linkErr } = await supabase
        .from('cases').update({ deceased_id: deceasedId, modified_at: new Date().toISOString() })
        .eq('id', req.params.id)
      if (linkErr) throw linkErr
    } else {
      const { error: updErr } = await supabase
        .from('deceased').update(patch).eq('id', deceasedId)
      if (updErr) throw updErr
      await supabase.from('cases')
        .update({ modified_at: new Date().toISOString() })
        .eq('id', req.params.id)
    }

    const { data: fresh, error: freshErr } = await supabase
      .from('cases').select(CASE_SELECT).eq('id', req.params.id).single()
    if (freshErr) throw freshErr
    res.json(shapeRow(fresh))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/cases/:id/addons ──────────────────
router.post('/:id/addons', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const { addonId } = req.body
    if (!addonId) return res.status(400).json({ error: 'addonId is required' })

    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.id).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

    const { error } = await supabase
      .from('case_addons')
      .insert({ case_id: req.params.id, addon_id: addonId })
    if (error) throw error

    const { data, error: fetchErr } = await supabase
      .from('cases').select(CASE_SELECT).eq('id', req.params.id).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (fetchErr) throw fetchErr
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/cases/:id/addons/:addonId ───────
router.delete('/:id/addons/:addonId', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.id).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

    const { error } = await supabase
      .from('case_addons')
      .delete()
      .eq('case_id', req.params.id)
      .eq('addon_id', req.params.addonId)
    if (error) throw error

    const { data, error: fetchErr } = await supabase
      .from('cases').select(CASE_SELECT).eq('id', req.params.id).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (fetchErr) throw fetchErr
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/cases/:id/financials ─────────────
router.patch('/:id/financials', requireAuth, async (req, res, next) => {
  try {
    const ALLOWED = new Set(['amount_billed', 'package_price', 'payment_status', 'payment_method'])
    const patch = {}
    for (const [k, v] of Object.entries(req.body ?? {})) {
      if (!ALLOWED.has(k)) return res.status(400).json({ error: `Field "${k}" is not editable` })
      patch[k] = v
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' })
    }
    patch.modified_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('cases')
      .update(patch)
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .select(CASE_SELECT)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Case not found' })
    res.json(shapeRow(data))
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
      .eq('funeral_home_id', req.user.funeralHomeId)
      .select(CASE_SELECT)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Case not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/cases/:id/folder ─────────────────
router.patch('/:id/folder', requireAuth, async (req, res, next) => {
  try {
    const { folderId } = req.body
    const { data, error } = await supabase
      .from('cases')
      .update({ folder_id: folderId ?? null, modified_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .select(CASE_SELECT)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Case not found' })
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

    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.id).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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
      .eq('funeral_home_id', req.user.funeralHomeId)
      .single()
    if (fetchError) throw fetchError
    if (!existing) return res.status(404).json({ error: 'Case not found' })

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
router.get('/:id/custody', requireAuth, async (req, res, next) => {
  try {
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.id).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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

    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.id).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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

    const NOTIFY_STAGES = {
      2: 'Transported to Crematory',
      4: 'Cremation Started',
      5: 'Cremation Completed',
      7: 'Returned to Funeral Home',
      8: 'Delivered to Family',
    }

    if (completed && NOTIFY_STAGES[stage]) {
      const stageLabel = NOTIFY_STAGES[stage]
      const staffName = staff ?? 'Staff'
      const caseId = req.params.id
      const { data: caseRow } = await supabase
        .from('cases').select('deceased').eq('id', caseId).single()
      const deceasedName = caseRow?.deceased ?? caseId
      // Stage 8 = "Delivered to Family" is the terminal milestone, so route
      // it through the caseMarkedComplete pref; earlier stages are treated
      // as ordinary status updates.
      const eventKey = stage === 8 ? 'caseMarkedComplete' : 'caseStatusUpdated'
      await notifyUser(req.user.id, eventKey, {
        type: 'alert',
        sender: staffName,
        subject: withLastName(deceasedName, stageLabel),
        preview: `${staffName} marked ${deceasedName} as ${stageLabel}.`,
        body: `${staffName} logged the following custody milestone for ${deceasedName}:\n\n${stageLabel}`,
        caseId,
        severity: 'info',
      })
    }

    res.json({
      completed: data.completed,
      staff: data.staff_label ?? data.staff,
      timestamp: data.timestamp,
    })
  } catch (err) {
    next(err)
  }
})

const CUSTODY_STAGE_LABELS = {
  0: 'Case Created',
  1: 'Removal from Place of Death',
  2: 'Transported to Crematory',
  3: 'Identification & Prep',
  4: 'Cremation Started',
  5: 'Cremation Completed',
  6: 'Urn Prepared',
  7: 'Returned to Funeral Home',
  8: 'Delivered to Family',
}

const BOOKING_EVENT_TITLES = {
  booking_created: 'Cremation booking created',
  crematorium_invited: 'Crematorium invited',
  crematorium_responded: 'Crematorium responded',
  shipping_invited: 'Shipping partner invited',
  shipping_responded: 'Shipping partner responded',
  booking_confirmed: 'Cremation slot confirmed',
  booking_rescheduled: 'Cremation booking rescheduled',
  booking_cancelled: 'Cremation booking cancelled',
}

// ── GET /api/cases/:id/activity ─────────────────
// Unified, typed event stream merging notes / documents / custody / booking_events.
// Sorted newest-first, capped at 200. Drives the activity tab + drawer.
router.get('/:id/activity', requireAuth, async (req, res, next) => {
  try {
    const caseId = req.params.id

    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

    const [
      { data: notes, error: notesErr },
      { data: docs, error: docsErr },
      { data: custody, error: custodyErr },
      { data: bookingEvents, error: bookingErr },
    ] = await Promise.all([
      supabase.from('case_notes').select('*').eq('case_id', caseId),
      supabase.from('case_documents').select('*, folder:folders(*)').eq('case_id', caseId).is('deleted_at', null),
      supabase.from('case_custody').select('*').eq('case_id', caseId).eq('completed', true),
      supabase.from('booking_events').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
    ])
    if (notesErr) throw notesErr
    if (docsErr) throw docsErr
    if (custodyErr) throw custodyErr
    if (bookingErr) throw bookingErr

    const events = []

    for (const n of notes ?? []) {
      events.push({
        id: `note:${n.id}`,
        type: 'note',
        ts: n.created_at ?? null,
        actor: n.author_label ?? n.author ?? 'Staff',
        summary: (n.text ?? '').slice(0, 140),
        payload: { id: n.id, text: n.text, author: n.author_label ?? n.author, displayTime: n.time },
      })
    }

    for (const d of docs ?? []) {
      events.push({
        id: `document:${d.id}`,
        type: 'document',
        ts: d.uploaded_at ?? null,
        actor: d.uploaded_by ?? 'Staff',
        summary: d.file_name,
        payload: {
          id: d.id,
          fileName: d.file_name,
          fileUrl: d.file_url,
          storagePath: d.storage_path,
          documentType: d.document_type,
          status: d.status,
          visibleToFamily: d.visible_to_family,
          folderName: d.folder?.name ?? null,
        },
      })
    }

    for (const c of custody ?? []) {
      events.push({
        id: `custody:${c.case_id}:${c.stage}`,
        type: 'custody',
        ts: c.timestamp ?? null,
        actor: c.staff_label ?? c.staff ?? 'Staff',
        summary: CUSTODY_STAGE_LABELS[c.stage] ?? `Stage ${c.stage}`,
        payload: {
          stage: c.stage,
          stageLabel: CUSTODY_STAGE_LABELS[c.stage] ?? `Stage ${c.stage}`,
          staff: c.staff_label ?? c.staff ?? null,
        },
      })
    }

    for (const e of bookingEvents ?? []) {
      events.push({
        id: `booking_event:${e.id}`,
        type: e.event_type,
        ts: e.created_at,
        actor: e.actor_label ?? (e.actor_type === 'system' ? 'System' : e.actor_type),
        summary: BOOKING_EVENT_TITLES[e.event_type] ?? e.event_type,
        payload: {
          bookingEventId: e.id,
          bookingId: e.booking_id,
          actorType: e.actor_type,
          ...e.payload,
        },
      })
    }

    events.sort((a, b) => {
      const ta = a.ts ? Date.parse(a.ts) : 0
      const tb = b.ts ? Date.parse(b.ts) : 0
      return tb - ta
    })

    res.json(events.slice(0, 200))
  } catch (err) {
    next(err)
  }
})

export default router
