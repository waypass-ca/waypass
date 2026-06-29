import { supabase } from './supabase.js'

/**
 * Insert a single inbox_items row. Awaited; throws on DB error so callers
 * can surface the failure instead of silently losing notifications.
 *
 * Accepts camelCase fields; maps to snake_case columns. Fields default
 * to safe values so call sites only have to pass what's interesting.
 */
export async function createInboxItem({
  userId,
  type,            // 'alert' | 'message' | 'schedule'
  sender,
  subject,
  preview,
  body,
  caseId = null,
  bookingId = null,
  bookingEventId = null, // FK to booking_events when inbox row derives from a lifecycle event
  severity = null, // 'danger' | 'warning' | 'info' | null
  scheduledFor = null, // timestamptz string or null
}) {
  if (!userId || !type || !sender || !subject || !preview || !body) {
    throw new Error('createInboxItem: missing required field')
  }
  const { error } = await supabase.from('inbox_items').insert({
    user_id: userId,
    type,
    sender,
    subject,
    preview,
    body,
    case_id: caseId,
    booking_id: bookingId,
    booking_event_id: bookingEventId,
    severity,
    scheduled_for: scheduledFor,
    read: false,
    starred: false,
  })
  if (error) throw error
}

/**
 * Look up a user's email preferences. Returns the row (snake_case) or null
 * if no row exists yet. Callers can treat null as "send everything".
 */
export async function getEmailPrefs(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Check whether a given pref flag is enabled for a user. Missing row or
 * missing column defaults to true (opt-out model).
 */
export async function shouldEmail(userId, flag) {
  const prefs = await getEmailPrefs(userId).catch(() => null)
  if (!prefs) return true
  return prefs[flag] !== false
}
