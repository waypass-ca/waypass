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
 * Look up a user's notification preferences. Returns the row (snake_case) or
 * null if no row exists yet. Callers can treat null as "send everything".
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
 * Check whether a given email pref flag is enabled for a user. Missing row or
 * missing column defaults to true (opt-out model).
 */
export async function shouldEmail(userId, flag) {
  const prefs = await getEmailPrefs(userId).catch(() => null)
  if (!prefs) return true
  return prefs[flag] !== false
}

/**
 * Check whether the in-app channel is enabled for a given event. Reads
 * `${flag}_in_app`. Missing row or column defaults to true.
 */
export async function shouldNotifyInApp(userId, flag) {
  const prefs = await getEmailPrefs(userId).catch(() => null)
  if (!prefs) return true
  const col = `${flag}_in_app`
  return prefs[col] !== false
}

// event key (camelCase used in code) → base column name (snake_case in DB)
const EVENT_COLUMNS = {
  newCaseSubmitted:      'new_case_submitted',
  caseStatusUpdated:     'case_status_updated',
  documentUploaded:      'document_uploaded',
  caseMarkedComplete:    'case_marked_complete',
  weeklyRevenueSummary:  'weekly_revenue_summary',
  familyMessageReceived: 'family_message_received',
}

async function getUserEmail(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.email ?? null
}

function buildEmailHtml({ subject, body }) {
  const safeBody = String(body ?? '')
    .split('\n')
    .map(line => line || '&nbsp;')
    .join('<br/>')
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <p style="font-size:14px;color:#666">Waypass</p>
      <h2 style="margin:0 0 12px;font-size:18px">${subject}</h2>
      <div style="font-size:14px;color:#333;line-height:1.6">${safeBody}</div>
      <p style="font-size:12px;color:#999;margin-top:24px">
        You can adjust which notifications you receive in Waypass → Settings → Notifications.
      </p>
    </div>
  `
}

async function sendEmailViaResend({ to, subject, html }) {
  if (process.env.ENABLE_RESEND === 'false') {
    console.warn('Resend disabled (ENABLE_RESEND=false) — skipping notification email')
    return false
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping notification email')
    return false
  }
  if (!to) return false
  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'theoleone@waypass.ca',
    to,
    subject,
    html,
  })
  return true
}

/**
 * Emit a notification for a specific event to a specific user, honouring
 * their per-channel preferences.
 *
 * - `eventKey` is one of the camelCase keys in EVENT_COLUMNS.
 * - `type/sender/subject/preview/body/...` are the same fields consumed by
 *   `createInboxItem`; if in-app is enabled the item is inserted verbatim.
 * - If email is enabled AND we can find the recipient's email, an email
 *   is sent using the subject/body. Email failures are logged, never thrown.
 *
 * Inbox insert errors DO throw (matches `createInboxItem` semantics) so a
 * DB outage surfaces to the caller as before. Callers that already wrapped
 * `createInboxItem` in a try/catch remain safe.
 */
export async function notifyUser(userId, eventKey, args) {
  const base = EVENT_COLUMNS[eventKey]
  if (!base) throw new Error(`notifyUser: unknown eventKey "${eventKey}"`)

  // Read prefs once so we don't hit the DB twice per event.
  const prefs = await getEmailPrefs(userId).catch(() => null)
  const inAppEnabled = prefs ? prefs[`${base}_in_app`] !== false : true
  const emailEnabled = prefs ? prefs[base] !== false : true

  if (inAppEnabled) {
    await createInboxItem({ userId, ...args })
  }

  if (emailEnabled) {
    try {
      const to = await getUserEmail(userId)
      if (to) {
        await sendEmailViaResend({
          to,
          subject: args.subject,
          html: buildEmailHtml({ subject: args.subject, body: args.body }),
        })
      }
    } catch (err) {
      console.error(`notifyUser email failed (${eventKey}, ${userId}):`, err.message)
    }
  }
}

/**
 * Email-only variant for events that don't produce inbox items (e.g. the
 * weekly revenue summary). Honours the email pref for the given flag.
 */
export async function sendPrefEmail(userId, flag, { subject, html }) {
  const prefs = await getEmailPrefs(userId).catch(() => null)
  if (prefs && prefs[flag] === false) return false
  try {
    const to = await getUserEmail(userId)
    if (!to) return false
    return await sendEmailViaResend({ to, subject, html })
  } catch (err) {
    console.error(`sendPrefEmail failed (${flag}, ${userId}):`, err.message)
    return false
  }
}
