import { supabase } from './supabase.js'

const VALID_EVENT_TYPES = new Set([
  'booking_created',
  'crematorium_invited',
  'crematorium_responded',
  'shipping_invited',
  'shipping_responded',
  'booking_confirmed',
  'booking_rescheduled',
  'booking_cancelled',
])

const VALID_ACTOR_TYPES = new Set(['user', 'crematorium', 'shipping_partner', 'system'])

/**
 * Record one booking lifecycle event. Returns the inserted row (shaped) so
 * callers can pass `id` to createInboxItem as `bookingEventId`.
 *
 * Throws on validation errors. DB errors are logged and re-thrown — callers
 * decide whether to swallow (e.g. don't block the user response on audit log
 * failure) or propagate.
 */
export async function recordBookingEvent({
  bookingId,
  caseId,
  funeralHomeId,
  eventType,
  actorType,
  actorId = null,
  actorLabel = null,
  payload = {},
}) {
  if (!bookingId || !caseId || !funeralHomeId) {
    throw new Error('recordBookingEvent: bookingId, caseId, funeralHomeId required')
  }
  if (!VALID_EVENT_TYPES.has(eventType)) {
    throw new Error(`recordBookingEvent: invalid eventType "${eventType}"`)
  }
  if (!VALID_ACTOR_TYPES.has(actorType)) {
    throw new Error(`recordBookingEvent: invalid actorType "${actorType}"`)
  }

  const { data, error } = await supabase
    .from('booking_events')
    .insert({
      booking_id: bookingId,
      case_id: caseId,
      funeral_home_id: funeralHomeId,
      event_type: eventType,
      actor_type: actorType,
      actor_id: actorId,
      actor_label: actorLabel,
      payload,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
