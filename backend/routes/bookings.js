import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    caseId: row.case_id,
    crematoriumId: row.crematorium_id,
    crematoriumEmail: row.crematorium_email,
    crematoriumName: row.crematorium_name,
    funeralHomeId: row.funeral_home_id,
    status: row.status,
    proposedSlots: row.proposed_slots ?? [],
    crematoriumSlots: row.crematorium_slots ?? null,
    confirmedSlot: row.confirmed_slot ?? null,
    responseToken: row.response_token,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
    confirmedAt: row.confirmed_at,
  }
}

async function sendBookingInvite(booking, deceasedName) {
  if (process.env.ENABLE_RESEND === 'false') {
    console.warn('Resend disabled (ENABLE_RESEND=false) — skipping email')
    return false
  }
  if (!booking.crematoriumEmail) {
    console.warn('No crematorium email — skipping invite')
    return false
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email')
    return false
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173'
  const responseUrl = `${baseUrl}/respond/${booking.responseToken}`

  const slotLines = booking.proposedSlots.map(s => {
    const date = new Date(s.date + 'T12:00:00')
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const startH = parseInt(s.start.split(':')[0], 10)
    const endH = parseInt(s.end.split(':')[0], 10)
    const fmt = h => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`
    return `<li>${dayLabel} · ${fmt(startH)} – ${fmt(endH)}</li>`
  }).join('\n')

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'bookings@passagefunerals.com',
    to: booking.crematoriumEmail,
    subject: `Pickup Request — ${deceasedName} (Case ${booking.caseId})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:14px;color:#666">Passage Funeral Management</p>
        <h2 style="margin:0 0 8px">Pickup Request: ${deceasedName}</h2>
        <p style="font-size:14px;color:#444">Case ID: ${booking.caseId}</p>
        <p style="font-size:14px;margin:20px 0 8px"><strong>Proposed pickup times:</strong></p>
        <ul style="font-size:14px;color:#444;padding-left:20px;line-height:1.8">
          ${slotLines}
        </ul>
        <p style="font-size:14px;margin:24px 0 16px">Please click the link below to select which times work for your crematorium:</p>
        <a href="${responseUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
          View &amp; Respond →
        </a>
        <p style="font-size:12px;color:#999;margin-top:24px">This link does not require a login.</p>
      </div>
    `,
  })
  return true
}

// ── Public: GET /api/bookings/respond/:token ─────
router.get('/respond/:token', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cremation_bookings')
      .select('*')
      .eq('response_token', req.params.token)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Booking not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── Public: POST /api/bookings/respond/:token ────
router.post('/respond/:token', async (req, res, next) => {
  try {
    const { slots } = req.body
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'slots must be a non-empty array' })
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('cremation_bookings')
      .select('*')
      .eq('response_token', req.params.token)
      .single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Booking not found' })
    if (existing.status === 'cancelled') return res.status(410).json({ error: 'Booking was cancelled' })

    const crematoriumSlots = slots.map(key => {
      const [date, timePart] = key.split('T')
      const hour = parseInt(timePart.split(':')[0], 10)
      return { date, start: `${String(hour).padStart(2, '0')}:00`, end: `${String(hour + 1).padStart(2, '0')}:00` }
    })

    const { data, error } = await supabase
      .from('cremation_bookings')
      .update({
        crematorium_slots: crematoriumSlots,
        status: 'responded',
        responded_at: new Date().toISOString(),
      })
      .eq('response_token', req.params.token)
      .select()
      .single()
    if (error) throw error

    // Notify the funeral home in their inbox
    const shaped = shapeRow(data)
    const cremName = shaped.crematoriumName ?? 'Crematorium'
    const slotCount = crematoriumSlots.length
    const preview = `${cremName} has responded with ${slotCount} available time${slotCount === 1 ? '' : 's'}. Review and confirm a slot.`

    supabase.from('inbox_items').insert({
      user_id: shaped.funeralHomeId,
      type: 'schedule',
      sender: cremName,
      subject: `Availability received`,
      preview,
      body: [
        `${cremName} has reviewed your pickup request for case ${shaped.caseId} and submitted their available times.`,
        ``,
        `Available slots:`,
        ...crematoriumSlots.map(s => `  • ${s.date}  ${s.start} – ${s.end}`),
        ``,
        `Please log in to Passage to confirm a time slot.`,
      ].join('\n'),
      case_id: shaped.caseId,
      booking_id: shaped.id,
      severity: 'info',
      scheduled_for: null,
      read: false,
      starred: false,
    }).then(({ error: inboxErr }) => {
      if (inboxErr) console.error('inbox_items insert failed:', inboxErr.message)
    })

    res.json(shaped)
  } catch (err) {
    next(err)
  }
})

// All routes below require auth
router.use(requireAuth)

// ── GET /api/bookings ────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cremation_bookings')
      .select('*')
      .eq('funeral_home_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// ── GET /api/bookings/:id ────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cremation_bookings')
      .select('*')
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.id)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/bookings ───────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { caseId, crematoriumId, crematoriumEmail, crematoriumName, proposedSlots, deceasedName } = req.body
    if (!caseId || !crematoriumId || !proposedSlots?.length) {
      return res.status(400).json({ error: 'caseId, crematoriumId, and proposedSlots are required' })
    }

    const { data, error } = await supabase
      .from('cremation_bookings')
      .insert({
        case_id: caseId,
        crematorium_id: crematoriumId,
        crematorium_email: crematoriumEmail,
        crematorium_name: crematoriumName,
        funeral_home_id: req.user.id,
        proposed_slots: proposedSlots,
      })
      .select()
      .single()
    if (error) throw error

    const shaped = shapeRow(data)
    const nameForDisplay = deceasedName ?? 'Unknown'
    sendBookingInvite(shaped, nameForDisplay)
      .then(sent => {
        if (!sent) return
        supabase.from('inbox_items').insert({
          user_id: req.user.id,
          type: 'schedule',
          sender: shaped.crematoriumName ?? 'Crematorium',
          subject: `Booking request sent`,
          preview: `Availability request emailed to ${shaped.crematoriumName ?? 'the crematorium'} for ${nameForDisplay}.`,
          body: [
            `A pickup request for ${nameForDisplay} (case ${shaped.caseId}) has been sent to ${shaped.crematoriumName ?? 'the crematorium'}.`,
            ``,
            `Proposed slots:`,
            ...shaped.proposedSlots.map(s => `  • ${s.date}  ${s.start} – ${s.end}`),
            ``,
            `You will be notified when they respond.`,
          ].join('\n'),
          case_id: shaped.caseId,
          booking_id: shaped.id,
          severity: 'info',
          scheduled_for: null,
          read: false,
          starred: false,
        }).then(({ error: inboxErr }) => {
          if (inboxErr) console.error('inbox_items insert failed:', inboxErr.message)
        })
      })
      .catch(err => console.error('Email send failed:', err.message))

    res.status(201).json(shaped)
  } catch (err) {
    next(err)
  }
})

// ── POST /api/bookings/:id/confirm ───────────────
router.post('/:id/confirm', async (req, res, next) => {
  try {
    const { slot } = req.body // { date, start, end }
    if (!slot?.date || !slot?.start) return res.status(400).json({ error: 'slot required' })

    const { data: existing, error: fetchErr } = await supabase
      .from('cremation_bookings')
      .select('*')
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.id)
      .single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Not found' })
    if (existing.status !== 'responded') return res.status(400).json({ error: 'Booking must be in responded status to confirm' })

    // Validate slot is in both proposed and crematorium slots
    const key = `${slot.date}T${slot.start}`
    const inProposed = (existing.proposed_slots ?? []).some(s => `${s.date}T${s.start}` === key)
    const inCrematorium = (existing.crematorium_slots ?? []).some(s => `${s.date}T${s.start}` === key)
    if (!inProposed || !inCrematorium) {
      return res.status(400).json({ error: 'Slot is not in the overlap of proposed and crematorium availability' })
    }

    const { data, error } = await supabase
      .from('cremation_bookings')
      .update({ confirmed_slot: slot, status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error

    const shaped = shapeRow(data)
    const cremName = shaped.crematoriumName ?? 'Crematorium'
    const fmt = h => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`
    const slotStart = parseInt(slot.start.split(':')[0], 10)
    const slotEnd = parseInt(slot.end.split(':')[0], 10)
    const scheduledFor = `${slot.date} · ${fmt(slotStart)} – ${fmt(slotEnd)}`

    supabase.from('inbox_items').insert({
      user_id: req.user.id,
      type: 'schedule',
      sender: cremName,
      subject: `Cremation scheduled`,
      preview: `Cremation confirmed at ${cremName} for ${scheduledFor}.`,
      body: [
        `Dear Passage,`,
        ``,
        `This is to confirm that cremation services for case ${shaped.caseId} have been scheduled at ${cremName}.`,
        ``,
        `Date & Time: ${scheduledFor}`,
        ``,
        `Please ensure all required documentation has been submitted prior to this date. Ashes will be available for collection within 3–5 business days after completion.`,
        ``,
        cremName,
      ].join('\n'),
      case_id: shaped.caseId,
      booking_id: shaped.id,
      severity: 'info',
      scheduled_for: scheduledFor,
      read: false,
      starred: false,
    }).then(({ error: inboxErr }) => {
      if (inboxErr) console.error('inbox_items insert failed:', inboxErr.message)
    })

    res.json(shaped)
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/bookings/:id ─────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('cremation_bookings')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.id)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
