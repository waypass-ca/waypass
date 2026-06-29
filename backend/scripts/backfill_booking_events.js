// One-off backfill: synthesize booking_events rows from existing cremation_bookings.
// Idempotent via the (booking_id, event_type, created_at) unique index — re-runs
// produce no new rows. Pre-fix history is coarse (2-4 events per booking); new
// bookings emit a complete trace.
//
// Usage: node backend/scripts/backfill_booking_events.js
import { supabase } from '../lib/supabase.js'

async function backfill() {
  const { data: bookings, error } = await supabase
    .from('cremation_bookings')
    .select('*')
  if (error) throw error

  console.log(`Backfilling ${bookings.length} bookings…`)

  let inserted = 0
  let skipped = 0

  for (const b of bookings) {
    const events = []

    events.push({
      booking_id: b.id,
      case_id: b.case_id,
      funeral_home_id: b.funeral_home_id,
      event_type: 'booking_created',
      actor_type: 'user',
      actor_label: null,
      payload: {
        crematorium_name: b.crematorium_name,
        crematorium_id: b.crematorium_id,
        shipping_partner_name: b.shipping_partner_name ?? null,
        shipping_partner_id: b.shipping_partner_id ?? null,
        proposed_slots: b.proposed_slots ?? [],
        deceased_name: b.deceased_name ?? null,
      },
      created_at: b.created_at,
    })

    if (b.responded_at && b.crematorium_slots) {
      events.push({
        booking_id: b.id,
        case_id: b.case_id,
        funeral_home_id: b.funeral_home_id,
        event_type: 'crematorium_responded',
        actor_type: 'crematorium',
        actor_label: b.crematorium_name,
        payload: {
          crematorium_name: b.crematorium_name,
          crematorium_slots: b.crematorium_slots,
          proposed_slots: b.proposed_slots ?? [],
        },
        created_at: b.responded_at,
      })
    }

    if (b.shipping_responded_at && b.shipping_slots) {
      events.push({
        booking_id: b.id,
        case_id: b.case_id,
        funeral_home_id: b.funeral_home_id,
        event_type: 'shipping_responded',
        actor_type: 'shipping_partner',
        actor_label: b.shipping_partner_name ?? null,
        payload: {
          shipping_partner_name: b.shipping_partner_name ?? null,
          shipping_slots: b.shipping_slots,
        },
        created_at: b.shipping_responded_at,
      })
    }

    if (b.confirmed_at && b.confirmed_slot) {
      events.push({
        booking_id: b.id,
        case_id: b.case_id,
        funeral_home_id: b.funeral_home_id,
        event_type: 'booking_confirmed',
        actor_type: 'user',
        actor_label: null,
        payload: {
          confirmed_slot: b.confirmed_slot,
          crematorium_name: b.crematorium_name,
          shipping_partner_name: b.shipping_partner_name ?? null,
        },
        created_at: b.confirmed_at,
      })
    }

    if (b.status === 'cancelled') {
      // No cancelled_at column on legacy bookings — use the booking row's last-
      // touched timestamp if present, else now() so cancelled bookings still
      // surface in the activity feed.
      const ts = b.updated_at ?? b.confirmed_at ?? b.responded_at ?? b.created_at
      events.push({
        booking_id: b.id,
        case_id: b.case_id,
        funeral_home_id: b.funeral_home_id,
        event_type: 'booking_cancelled',
        actor_type: 'user',
        actor_label: null,
        payload: {
          crematorium_name: b.crematorium_name,
          shipping_partner_name: b.shipping_partner_name ?? null,
        },
        created_at: ts,
      })
    }

    for (const ev of events) {
      const { error: insertErr } = await supabase
        .from('booking_events')
        .insert(ev)
      if (insertErr) {
        // Idempotency: dedupe index causes 23505 on re-runs — skip silently.
        if (insertErr.code === '23505') {
          skipped++
        } else {
          console.error(`Insert failed for booking ${b.id} (${ev.event_type}):`, insertErr.message)
        }
      } else {
        inserted++
      }
    }
  }

  console.log(`Done. Inserted ${inserted}, skipped (already present) ${skipped}.`)
}

backfill().catch(err => {
  console.error(err)
  process.exit(1)
})
