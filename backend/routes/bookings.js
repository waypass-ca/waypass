import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { createInboxItem, shouldEmail } from '../lib/notifications.js'
import { recordBookingEvent } from '../lib/bookingEvents.js'

// Audit-log writes shouldn't fail the user-facing request. Log + swallow.
async function safeRecordBookingEvent(args) {
  try {
    return await recordBookingEvent(args)
  } catch (err) {
    console.error(`booking_events insert failed (${args.eventType}):`, err.message)
    return null
  }
}

const withLastName = (name, subject) => {
  if (!name) return subject
  const parts = name.trim().split(/\s+/)
  return `${parts[parts.length - 1]} ${subject}`
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => HTML_ESCAPES[c])

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    caseId: row.case_id,
    crematoriumId: row.crematorium_id,
    crematoriumEmail: row.crematorium_email,
    crematoriumName: row.crematorium_name,
    shippingPartnerId: row.shipping_partner_id ?? null,
    shippingPartnerEmail: row.shipping_partner_email ?? null,
    shippingPartnerName: row.shipping_partner_name ?? null,
    shippingSlots: row.shipping_slots ?? null,
    shippingResponseToken: row.shipping_response_token ?? null,
    shippingRespondedAt: row.shipping_responded_at ?? null,
    deceasedName: row.deceased_name ?? null,
    funeralHomeId: row.funeral_home_id,
    status: row.status,
    proposedSlots: row.proposed_slots ?? [],
    crematoriumSlots: row.crematorium_slots ?? null,
    confirmedSlot: row.confirmed_slot ?? null,
    responseToken: row.response_token,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
    confirmedAt: row.confirmed_at,
    rescheduledAt: row.rescheduled_at ?? null,
  }
}

function slotKeyOf(s) {
  return `${s.date}T${s.start}`
}

function slotsToKeys(slots) {
  return new Set((slots ?? []).map(slotKeyOf))
}

function formatSlotLines(slots) {
  return slots.map(s => {
    const date = new Date(s.date + 'T12:00:00')
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const startH = parseInt(s.start.split(':')[0], 10)
    const endH = parseInt(s.end.split(':')[0], 10)
    const fmt = h => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`
    return `<li>${esc(dayLabel)} · ${esc(fmt(startH))} – ${esc(fmt(endH))}</li>`
  }).join('\n')
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

  const slotLines = formatSlotLines(booking.proposedSlots)
  const isReschedule = Boolean(booking.rescheduledAt)
  const subjectPrefix = isReschedule ? 'Rescheduled — ' : ''
  const rescheduleNote = isReschedule
    ? '<p style="font-size:14px;color:#8a4500;background:#fff7ed;border-left:3px solid #f59e0b;padding:8px 12px;margin:0 0 16px;border-radius:4px">This replaces an earlier request — please use the updated times below.</p>'
    : ''

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'theoleone@waypass.ca',
    to: booking.crematoriumEmail,
    subject: `${subjectPrefix}Pickup Request — ${deceasedName} (Case ${booking.caseId})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:14px;color:#666">Passage Funeral Management</p>
        <h2 style="margin:0 0 8px">Pickup Request: ${esc(deceasedName)}</h2>
        <p style="font-size:14px;color:#444">Case ID: ${esc(booking.caseId)}</p>
        ${rescheduleNote}
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

async function sendShippingInvite(booking, deceasedName) {
  if (process.env.ENABLE_RESEND === 'false') {
    console.warn('Resend disabled (ENABLE_RESEND=false) — skipping shipping email')
    return false
  }
  if (!booking.shippingPartnerEmail) {
    console.warn('No shipping partner email — skipping invite')
    return false
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping shipping email')
    return false
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173'
  const responseUrl = `${baseUrl}/respond-shipping/${booking.shippingResponseToken}`
  const cremName = booking.crematoriumName ?? 'the crematorium'
  const slotLines = formatSlotLines(booking.crematoriumSlots ?? [])
  const isReschedule = Boolean(booking.rescheduledAt)
  const subjectPrefix = isReschedule ? 'Rescheduled — ' : ''
  const rescheduleNote = isReschedule
    ? '<p style="font-size:14px;color:#8a4500;background:#fff7ed;border-left:3px solid #f59e0b;padding:8px 12px;margin:0 0 16px;border-radius:4px">This replaces an earlier request — the funeral home has rescheduled and the crematorium has re-confirmed availability below.</p>'
    : ''

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'theoleone@waypass.ca',
    to: booking.shippingPartnerEmail,
    subject: `${subjectPrefix}Transport Request — ${deceasedName} (Case ${booking.caseId})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:14px;color:#666">Passage Funeral Management</p>
        <h2 style="margin:0 0 8px">Transport Request: ${esc(deceasedName)}</h2>
        <p style="font-size:14px;color:#444">Case ID: ${esc(booking.caseId)}</p>
        ${rescheduleNote}
        <p style="font-size:14px;margin:20px 0 8px">${esc(cremName)} has confirmed availability for these windows. Please select the times that work for your transport team:</p>
        <ul style="font-size:14px;color:#444;padding-left:20px;line-height:1.8">
          ${slotLines}
        </ul>
        <a href="${responseUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
          View &amp; Respond →
        </a>
        <p style="font-size:12px;color:#999;margin-top:24px">This link does not require a login.</p>
      </div>
    `,
  })
  return true
}

async function sendShippingCancellation(booking, deceasedName) {
  if (process.env.ENABLE_RESEND === 'false') {
    console.warn('Resend disabled (ENABLE_RESEND=false) — skipping shipping cancellation email')
    return false
  }
  if (!booking.shippingPartnerEmail) {
    console.warn('No shipping partner email — skipping cancellation')
    return false
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping shipping cancellation email')
    return false
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'theoleone@waypass.ca',
    to: booking.shippingPartnerEmail,
    subject: `Transport Request Cancelled — ${deceasedName} (Case ${booking.caseId})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:14px;color:#666">Passage Funeral Management</p>
        <h2 style="margin:0 0 8px">Transport Request Cancelled: ${esc(deceasedName)}</h2>
        <p style="font-size:14px;color:#444">Case ID: ${esc(booking.caseId)}</p>
        <p style="font-size:14px;color:#444;margin:20px 0 8px">The funeral home has cancelled this booking. No transport is required.</p>
        <p style="font-size:12px;color:#999;margin-top:24px">No action is required.</p>
      </div>
    `,
  })
  return true
}

async function sendBookingConfirmation({ to, recipientLabel, deceasedName, booking, slot }) {
  if (process.env.ENABLE_RESEND === 'false') {
    console.warn('Resend disabled (ENABLE_RESEND=false) — skipping confirmation email')
    return false
  }
  if (!to) {
    console.warn(`No ${recipientLabel} email — skipping confirmation`)
    return false
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping confirmation email')
    return false
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const date = new Date(slot.date + 'T12:00:00')
  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const startH = parseInt(slot.start.split(':')[0], 10)
  const endH = parseInt(slot.end.split(':')[0], 10)
  const fmt = h => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`
  const whenLabel = `${dayLabel} · ${fmt(startH)} – ${fmt(endH)}`

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'theoleone@waypass.ca',
    to,
    subject: `Pickup Confirmed — ${deceasedName} (Case ${booking.caseId})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:14px;color:#666">Passage Funeral Management</p>
        <h2 style="margin:0 0 8px">Pickup Confirmed: ${esc(deceasedName)}</h2>
        <p style="font-size:14px;color:#444">Case ID: ${esc(booking.caseId)}</p>
        <p style="font-size:14px;margin:20px 0 8px"><strong>Confirmed time:</strong></p>
        <p style="font-size:15px;color:#1a1a1a;margin:0 0 20px"><strong>${esc(whenLabel)}</strong></p>
        <p style="font-size:14px;color:#444;margin:0">The funeral home has confirmed this pickup window with all parties.</p>
        <p style="font-size:12px;color:#999;margin-top:24px">No action is required.</p>
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
    if (data.response_token_invalidated_at) {
      return res.status(410).json({ error: 'This link is no longer active. The crematorium has already responded.' })
    }
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
    if (existing.response_token_invalidated_at) {
      return res.status(410).json({ error: 'This link is no longer active.' })
    }

    const crematoriumSlots = slots.map(key => {
      const [date, timePart] = key.split('T')
      const hour = parseInt(timePart.split(':')[0], 10)
      return { date, start: `${String(hour).padStart(2, '0')}:00`, end: `${String(hour + 1).padStart(2, '0')}:00` }
    })

    const hasShipping = Boolean(existing.shipping_partner_id)
    const nextStatus = hasShipping ? 'awaiting_shipping' : 'responded'

    const { data, error } = await supabase
      .from('cremation_bookings')
      .update({
        crematorium_slots: crematoriumSlots,
        status: nextStatus,
        responded_at: new Date().toISOString(),
        response_token_invalidated_at: new Date().toISOString(),
      })
      .eq('response_token', req.params.token)
      .select()
      .single()
    if (error) throw error

    const shaped = shapeRow(data)
    const cremName = shaped.crematoriumName ?? 'Crematorium'
    const deceased = shaped.deceasedName ?? shaped.caseId
    const slotCount = crematoriumSlots.length

    const cremRespondedEvent = await safeRecordBookingEvent({
      bookingId: shaped.id,
      caseId: shaped.caseId,
      funeralHomeId: shaped.funeralHomeId,
      eventType: 'crematorium_responded',
      actorType: 'crematorium',
      actorLabel: cremName,
      payload: {
        crematorium_name: cremName,
        crematorium_slots: crematoriumSlots,
        proposed_slots: shaped.proposedSlots,
      },
    })

    if (hasShipping) {
      let shippingSent = false
      if (await shouldEmail(shaped.funeralHomeId, 'new_shipping_request')) {
        try {
          shippingSent = await sendShippingInvite(shaped, deceased)
        } catch (emailErr) {
          console.error('Shipping email send failed:', emailErr.message)
        }
      }

      const shippingInvitedEvent = await safeRecordBookingEvent({
        bookingId: shaped.id,
        caseId: shaped.caseId,
        funeralHomeId: shaped.funeralHomeId,
        eventType: 'shipping_invited',
        actorType: 'system',
        actorLabel: shaped.shippingPartnerName ?? null,
        payload: {
          shipping_partner_name: shaped.shippingPartnerName,
          shipping_partner_email: shaped.shippingPartnerEmail,
          crematorium_slots: crematoriumSlots,
          email_sent: shippingSent,
        },
      })

      await createInboxItem({
        userId: shaped.funeralHomeId,
        type: 'schedule',
        sender: cremName,
        subject: withLastName(deceased, 'Awaiting shipping availability'),
        preview: `${deceased} · ${cremName} responded — request sent to ${shaped.shippingPartnerName ?? 'shipping partner'}.`,
        body: [
          `${cremName} confirmed ${slotCount} available time${slotCount === 1 ? '' : 's'} for ${deceased}.`,
          ``,
          shippingSent
            ? `Transport request was sent to ${shaped.shippingPartnerName ?? 'the shipping partner'}.`
            : `Transport request to ${shaped.shippingPartnerName ?? 'the shipping partner'} was not delivered — check email settings.`,
          ``,
          `You'll be notified when they respond.`,
        ].join('\n'),
        caseId: shaped.caseId,
        bookingId: shaped.id,
        bookingEventId: shippingInvitedEvent?.id ?? cremRespondedEvent?.id ?? null,
        severity: 'info',
      })
    } else {
      const preview = `${deceased} · ${cremName} responded with ${slotCount} available time${slotCount === 1 ? '' : 's'}.`
      await createInboxItem({
        userId: shaped.funeralHomeId,
        type: 'schedule',
        sender: cremName,
        subject: withLastName(deceased, 'Availability received'),
        preview,
        body: [
          `${cremName} submitted their available times for ${deceased}.`,
          ``,
          `Available slots:`,
          ...crematoriumSlots.map(s => `  • ${s.date}  ${s.start} – ${s.end}`),
          ``,
          `Review and confirm a slot in Passage.`,
        ].join('\n'),
        caseId: shaped.caseId,
        bookingId: shaped.id,
        bookingEventId: cremRespondedEvent?.id ?? null,
        severity: 'info',
      })
    }

    res.json(shaped)
  } catch (err) {
    next(err)
  }
})

// ── Public: GET /api/bookings/respond-shipping/:token ─────
router.get('/respond-shipping/:token', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cremation_bookings')
      .select('*')
      .eq('shipping_response_token', req.params.token)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Booking not found' })
    if (data.shipping_response_token_invalidated_at) {
      return res.status(410).json({ error: 'This link is no longer active. The shipping partner has already responded.' })
    }
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── Public: POST /api/bookings/respond-shipping/:token ────
router.post('/respond-shipping/:token', async (req, res, next) => {
  try {
    const { slots } = req.body
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'slots must be a non-empty array' })
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('cremation_bookings')
      .select('*')
      .eq('shipping_response_token', req.params.token)
      .single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Booking not found' })
    if (existing.shipping_response_token_invalidated_at) {
      return res.status(410).json({ error: 'This link is no longer active.' })
    }
    if (existing.status !== 'awaiting_shipping') {
      return res.status(409).json({ error: 'Shipping response is no longer accepted for this booking' })
    }

    const shippingSlots = slots.map(key => {
      const [date, timePart] = key.split('T')
      const hour = parseInt(timePart.split(':')[0], 10)
      return { date, start: `${String(hour).padStart(2, '0')}:00`, end: `${String(hour + 1).padStart(2, '0')}:00` }
    })

    // Shipping availability must fit within the crematorium's confirmed window.
    const crematoriumKeys = slotsToKeys(existing.crematorium_slots ?? [])
    const outOfRange = shippingSlots.filter(s => !crematoriumKeys.has(slotKeyOf(s)))
    if (outOfRange.length) {
      return res.status(400).json({ error: 'One or more slots are not within the crematorium\'s available window' })
    }

    const { data, error } = await supabase
      .from('cremation_bookings')
      .update({
        shipping_slots: shippingSlots,
        status: 'responded',
        shipping_responded_at: new Date().toISOString(),
        shipping_response_token_invalidated_at: new Date().toISOString(),
      })
      .eq('shipping_response_token', req.params.token)
      .select()
      .single()
    if (error) throw error

    const shaped = shapeRow(data)
    const shipName = shaped.shippingPartnerName ?? 'Shipping partner'
    const deceased = shaped.deceasedName ?? shaped.caseId
    const slotCount = shippingSlots.length

    const shippingRespondedEvent = await safeRecordBookingEvent({
      bookingId: shaped.id,
      caseId: shaped.caseId,
      funeralHomeId: shaped.funeralHomeId,
      eventType: 'shipping_responded',
      actorType: 'shipping_partner',
      actorLabel: shipName,
      payload: {
        shipping_partner_name: shipName,
        shipping_slots: shippingSlots,
        crematorium_slots: shaped.crematoriumSlots ?? [],
      },
    })

    await createInboxItem({
      userId: shaped.funeralHomeId,
      type: 'schedule',
      sender: shipName,
      subject: withLastName(deceased, 'Shipping availability received'),
      preview: `${deceased} · ${shipName} responded with ${slotCount} available time${slotCount === 1 ? '' : 's'}.`,
      body: [
        `${shipName} submitted their available times for ${deceased}.`,
        ``,
        `Available slots:`,
        ...shippingSlots.map(s => `  • ${s.date}  ${s.start} – ${s.end}`),
        ``,
        `Review and confirm a slot in Passage.`,
      ].join('\n'),
      caseId: shaped.caseId,
      bookingId: shaped.id,
      bookingEventId: shippingRespondedEvent?.id ?? null,
      severity: 'info',
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
    const {
      caseId,
      crematoriumId,
      crematoriumEmail,
      crematoriumName,
      shippingPartnerId,
      shippingPartnerEmail,
      shippingPartnerName,
      proposedSlots,
      deceasedName,
    } = req.body
    if (!caseId || !crematoriumId || !proposedSlots?.length) {
      return res.status(400).json({ error: 'caseId, crematoriumId, and proposedSlots are required' })
    }

    const { data: existingActive } = await supabase
      .from('cremation_bookings')
      .select('id')
      .eq('case_id', caseId)
      .eq('funeral_home_id', req.user.id)
      .neq('status', 'cancelled')
      .maybeSingle()
    if (existingActive) {
      return res.status(409).json({
        error: 'This case already has an active booking. Change or cancel it before booking a new one.',
        bookingId: existingActive.id,
      })
    }

    if (shippingPartnerId) {
      const { data: partner } = await supabase
        .from('shipping_partners')
        .select('connected_funeral_home_ids')
        .eq('id', shippingPartnerId)
        .is('deleted_at', null)
        .single()
      if (!partner?.connected_funeral_home_ids?.includes(req.user.id)) {
        return res.status(400).json({ error: 'Shipping partner is not connected to your account' })
      }
    }

    const { data, error } = await supabase
      .from('cremation_bookings')
      .insert({
        case_id: caseId,
        crematorium_id: crematoriumId,
        crematorium_email: crematoriumEmail,
        crematorium_name: crematoriumName,
        shipping_partner_id: shippingPartnerId ?? null,
        shipping_partner_email: shippingPartnerEmail ?? null,
        shipping_partner_name: shippingPartnerName ?? null,
        deceased_name: deceasedName ?? null,
        funeral_home_id: req.user.id,
        proposed_slots: proposedSlots,
      })
      .select()
      .single()
    if (error) throw error

    // Denormalize the chosen shipping partner onto the case so the
    // shipping-partner detail page can list this case under "Recent Cases".
    // Tolerate failures — the booking row is the source of truth.
    if (shippingPartnerId) {
      await supabase
        .from('cases')
        .update({ shipping_partner_id: shippingPartnerId })
        .eq('id', caseId)
        .then(({ error: updateErr }) => {
          if (updateErr) console.error('Failed to denormalize shipping_partner_id onto case:', updateErr.message)
        })
    }

    const shaped = shapeRow(data)
    const nameForDisplay = deceasedName ?? 'Unknown'

    await safeRecordBookingEvent({
      bookingId: shaped.id,
      caseId: shaped.caseId,
      funeralHomeId: shaped.funeralHomeId,
      eventType: 'booking_created',
      actorType: 'user',
      actorId: req.user.id,
      actorLabel: req.user.label ?? req.user.email ?? null,
      payload: {
        crematorium_name: shaped.crematoriumName,
        crematorium_id: shaped.crematoriumId,
        shipping_partner_name: shaped.shippingPartnerName,
        shipping_partner_id: shaped.shippingPartnerId,
        proposed_slots: shaped.proposedSlots,
        deceased_name: nameForDisplay,
      },
    })

    let sent = false
    if (await shouldEmail(req.user.id, 'new_crematorium_request')) {
      try {
        sent = await sendBookingInvite(shaped, nameForDisplay)
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message)
      }
    }

    const cremInvitedEvent = await safeRecordBookingEvent({
      bookingId: shaped.id,
      caseId: shaped.caseId,
      funeralHomeId: shaped.funeralHomeId,
      eventType: 'crematorium_invited',
      actorType: 'system',
      actorLabel: shaped.crematoriumName ?? null,
      payload: {
        crematorium_name: shaped.crematoriumName,
        crematorium_email: shaped.crematoriumEmail,
        proposed_slots: shaped.proposedSlots,
        email_sent: sent,
      },
    })

    if (sent) {
      await createInboxItem({
        userId: req.user.id,
        type: 'schedule',
        sender: shaped.crematoriumName ?? 'Crematorium',
        subject: withLastName(nameForDisplay, 'Booking request sent'),
        preview: `${nameForDisplay} · Request sent to ${shaped.crematoriumName ?? 'the crematorium'}.`,
        body: [
          `A pickup request for ${nameForDisplay} has been sent to ${shaped.crematoriumName ?? 'the crematorium'}.`,
          ``,
          `Proposed slots:`,
          ...shaped.proposedSlots.map(s => `  • ${s.date}  ${s.start} – ${s.end}`),
          ``,
          `You'll be notified when they respond.`,
        ].join('\n'),
        caseId: shaped.caseId,
        bookingId: shaped.id,
        bookingEventId: cremInvitedEvent?.id ?? null,
        severity: 'info',
      })
    }

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

    // Validate slot is in the intersection of all available windows.
    const key = `${slot.date}T${slot.start}`
    const inProposed = (existing.proposed_slots ?? []).some(s => slotKeyOf(s) === key)
    const inCrematorium = (existing.crematorium_slots ?? []).some(s => slotKeyOf(s) === key)
    if (!inProposed || !inCrematorium) {
      return res.status(400).json({ error: 'Slot is not in the overlap of proposed and crematorium availability' })
    }
    if (existing.shipping_partner_id) {
      const inShipping = (existing.shipping_slots ?? []).some(s => slotKeyOf(s) === key)
      if (!inShipping) {
        return res.status(400).json({ error: 'Slot is not in the shipping partner\'s available window' })
      }
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
    const deceased = shaped.deceasedName ?? shaped.caseId
    const fmt = h => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`
    const slotStart = parseInt(slot.start.split(':')[0], 10)
    const slotEnd = parseInt(slot.end.split(':')[0], 10)
    const displayWhen = `${slot.date} · ${fmt(slotStart)} – ${fmt(slotEnd)}`
    const scheduledFor = new Date(`${slot.date}T${slot.start}:00`).toISOString()

    const confirmedEvent = await safeRecordBookingEvent({
      bookingId: shaped.id,
      caseId: shaped.caseId,
      funeralHomeId: shaped.funeralHomeId,
      eventType: 'booking_confirmed',
      actorType: 'user',
      actorId: req.user.id,
      actorLabel: req.user.label ?? req.user.email ?? null,
      payload: {
        confirmed_slot: slot,
        crematorium_name: cremName,
        shipping_partner_name: shaped.shippingPartnerName,
        scheduled_for: scheduledFor,
      },
    })

    await createInboxItem({
      userId: req.user.id,
      type: 'schedule',
      sender: cremName,
      subject: withLastName(deceased, 'Cremation scheduled'),
      preview: `${deceased} · ${displayWhen} at ${cremName}.`,
      body: [
        `Cremation for ${deceased} has been confirmed at ${cremName}.`,
        ``,
        `Date & Time: ${displayWhen}`,
      ].join('\n'),
      caseId: shaped.caseId,
      bookingId: shaped.id,
      bookingEventId: confirmedEvent?.id ?? null,
      severity: 'info',
      scheduledFor,
    })

    // Notify both vendors that the time is locked in.
    try {
      await sendBookingConfirmation({
        to: shaped.crematoriumEmail,
        recipientLabel: 'crematorium',
        deceasedName: deceased,
        booking: shaped,
        slot,
      })
    } catch (emailErr) {
      console.error('Crematorium confirmation email failed:', emailErr.message)
    }
    if (shaped.shippingPartnerId) {
      try {
        await sendBookingConfirmation({
          to: shaped.shippingPartnerEmail,
          recipientLabel: 'shipping partner',
          deceasedName: deceased,
          booking: shaped,
          slot,
        })
      } catch (emailErr) {
        console.error('Shipping confirmation email failed:', emailErr.message)
      }
    }

    res.json(shaped)
  } catch (err) {
    next(err)
  }
})

// ── POST /api/bookings/:id/reschedule ────────────
router.post('/:id/reschedule', async (req, res, next) => {
  try {
    const { proposedSlots } = req.body
    if (!Array.isArray(proposedSlots) || proposedSlots.length === 0) {
      return res.status(400).json({ error: 'proposedSlots must be a non-empty array' })
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('cremation_bookings').select('*')
      .eq('id', req.params.id).eq('funeral_home_id', req.user.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Booking not found' })

    const hasShipping = Boolean(existing.shipping_partner_id)
    const nowIso = new Date().toISOString()
    const updates = {
      proposed_slots: proposedSlots,
      crematorium_slots: null,
      shipping_slots: null,
      confirmed_slot: null,
      responded_at: null,
      confirmed_at: null,
      shipping_responded_at: null,
      response_token: crypto.randomUUID(),
      response_token_invalidated_at: null,
      shipping_response_token_invalidated_at: null,
      rescheduled_at: nowIso,
      status: 'pending',
    }
    if (hasShipping) updates.shipping_response_token = crypto.randomUUID()

    const { data, error } = await supabase
      .from('cremation_bookings')
      .update(updates)
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.id)
      .select()
      .single()
    if (error) throw error

    const shaped = shapeRow(data)
    const deceased = shaped.deceasedName ?? 'Unknown'

    const previousProposed = existing.proposed_slots ?? []
    const previousConfirmed = existing.confirmed_slot ?? null

    const rescheduledEvent = await safeRecordBookingEvent({
      bookingId: shaped.id,
      caseId: shaped.caseId,
      funeralHomeId: shaped.funeralHomeId,
      eventType: 'booking_rescheduled',
      actorType: 'user',
      actorId: req.user.id,
      actorLabel: req.user.label ?? req.user.email ?? null,
      payload: {
        from: { proposed_slots: previousProposed, confirmed_slot: previousConfirmed },
        to: { proposed_slots: shaped.proposedSlots },
        previous_status: existing.status,
      },
    })

    let sent = false
    if (await shouldEmail(req.user.id, 'new_crematorium_request')) {
      try {
        sent = await sendBookingInvite(shaped, deceased)
      } catch (emailErr) {
        console.error('Reschedule email send failed:', emailErr.message)
      }
    }

    await safeRecordBookingEvent({
      bookingId: shaped.id,
      caseId: shaped.caseId,
      funeralHomeId: shaped.funeralHomeId,
      eventType: 'crematorium_invited',
      actorType: 'system',
      actorLabel: shaped.crematoriumName ?? null,
      payload: {
        crematorium_name: shaped.crematoriumName,
        crematorium_email: shaped.crematoriumEmail,
        proposed_slots: shaped.proposedSlots,
        email_sent: sent,
        reason: 'reschedule',
      },
    })

    const cremName = shaped.crematoriumName ?? 'Crematorium'
    await createInboxItem({
      userId: req.user.id,
      type: 'schedule',
      sender: cremName,
      subject: withLastName(deceased, 'Booking rescheduled'),
      preview: `${deceased} · New request sent to ${cremName}.`,
      body: [
        `The pickup request for ${deceased} has been rescheduled and resent to ${cremName}.`,
        ``,
        `New proposed slots:`,
        ...shaped.proposedSlots.map(s => `  • ${s.date}  ${s.start} – ${s.end}`),
        ``,
        sent ? `You'll be notified when they respond.` : `Email delivery is disabled — share the new link manually.`,
      ].join('\n'),
      caseId: shaped.caseId,
      bookingId: shaped.id,
      bookingEventId: rescheduledEvent?.id ?? null,
      severity: 'info',
    })

    res.json(shaped)
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/bookings/:id ─────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('cremation_bookings').select('*')
      .eq('id', req.params.id).eq('funeral_home_id', req.user.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Booking not found' })
    if (existing.status === 'cancelled') return res.status(204).send()

    const { error } = await supabase
      .from('cremation_bookings')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.id)
    if (error) throw error

    const shaped = shapeRow(existing)
    const cremName = shaped.crematoriumName ?? 'Crematorium'
    const deceased = shaped.deceasedName ?? shaped.caseId

    // Clear the case-level shipping partner denormalization if the booking
    // we're cancelling owns it. shipping_partner_detail's "Recent Cases" list
    // uses this column; leaving it would show the case under a partner the
    // funeral home has un-booked.
    if (existing.shipping_partner_id) {
      await supabase
        .from('cases')
        .update({ shipping_partner_id: null })
        .eq('id', existing.case_id)
        .eq('shipping_partner_id', existing.shipping_partner_id)
        .then(({ error: clearErr }) => {
          if (clearErr) console.error('Failed to clear cases.shipping_partner_id:', clearErr.message)
        })
    }

    let shippingNotified = false
    if (existing.shipping_partner_id && await shouldEmail(req.user.id, 'new_shipping_request')) {
      try {
        shippingNotified = await sendShippingCancellation(shaped, deceased)
      } catch (emailErr) {
        console.error('Shipping cancellation email failed:', emailErr.message)
      }
    }

    const cancelledEvent = await safeRecordBookingEvent({
      bookingId: shaped.id,
      caseId: shaped.caseId,
      funeralHomeId: shaped.funeralHomeId,
      eventType: 'booking_cancelled',
      actorType: 'user',
      actorId: req.user.id,
      actorLabel: req.user.label ?? req.user.email ?? null,
      payload: {
        previous_status: existing.status,
        crematorium_name: cremName,
        shipping_partner_name: shaped.shippingPartnerName,
        shipping_notified: shippingNotified,
        cancel_reason: req.body?.reason ?? null,
      },
    })

    await createInboxItem({
      userId: req.user.id,
      type: 'schedule',
      sender: cremName,
      subject: withLastName(deceased, 'Booking cancelled'),
      preview: `${deceased} · Booking with ${cremName} cancelled.`,
      body: [
        `The cremation booking for ${deceased} with ${cremName} has been cancelled.`,
        shaped.shippingPartnerName
          ? (shippingNotified
              ? `${shaped.shippingPartnerName} was notified by email.`
              : `${shaped.shippingPartnerName} was not notified — check email settings.`)
          : null,
      ].filter(Boolean).join('\n\n'),
      caseId: shaped.caseId,
      bookingId: shaped.id,
      bookingEventId: cancelledEvent?.id ?? null,
      severity: 'warning',
    })

    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
