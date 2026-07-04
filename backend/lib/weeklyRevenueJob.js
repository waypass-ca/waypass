import { supabase } from './supabase.js'
import { sendPrefEmail } from './notifications.js'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function lastWeekWindow(now = new Date()) {
  const end = new Date(now)
  end.setUTCHours(0, 0, 0, 0)
  const start = new Date(end.getTime() - 7 * ONE_DAY_MS)
  return { start, end }
}

function fmt(d) {
  return d.toISOString().slice(0, 10)
}

function money(cents) {
  const n = Number(cents ?? 0)
  if (!Number.isFinite(n)) return '$0.00'
  return `$${(n / 100).toFixed(2)}`
}

async function sumRevenue(funeralHomeId, start, end) {
  const { data, error } = await supabase
    .from('cases')
    .select('id, amount_billed, amount, case_date, created_at')
    .eq('funeral_home_id', funeralHomeId)
    .is('deleted_at', null)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
  if (error) throw error
  const rows = data ?? []
  const total = rows.reduce((acc, r) => acc + Number(r.amount_billed ?? r.amount ?? 0), 0)
  return { count: rows.length, total }
}

function buildHtml({ start, end, count, total }) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <p style="font-size:14px;color:#666">Waypass · Weekly Revenue</p>
      <h2 style="margin:0 0 12px;font-size:18px">Week of ${fmt(start)} – ${fmt(end)}</h2>
      <table style="font-size:14px;color:#333;border-collapse:collapse;width:100%;margin-top:12px">
        <tr><td style="padding:6px 0;color:#666">New cases</td><td style="padding:6px 0;text-align:right"><strong>${count}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">Total billed</td><td style="padding:6px 0;text-align:right"><strong>${money(total)}</strong></td></tr>
      </table>
      <p style="font-size:12px;color:#999;margin-top:24px">
        You can adjust which notifications you receive in Waypass → Settings → Notifications.
      </p>
    </div>
  `
}

/**
 * Send the weekly revenue summary to every admin whose email pref is on.
 * Groups admins by funeral_home_id so revenue totals are per-tenant.
 * Returns a summary of what was sent so the caller can log/report.
 */
export async function runWeeklyRevenueJob({ now = new Date() } = {}) {
  const { start, end } = lastWeekWindow(now)

  const { data: admins, error } = await supabase
    .from('users')
    .select('id, funeral_home_id')
    .eq('role', 'admin')
    .eq('status', 'active')
    .is('deleted_at', null)
  if (error) throw error

  const byFh = new Map()
  for (const a of admins ?? []) {
    if (!a.funeral_home_id) continue
    if (!byFh.has(a.funeral_home_id)) byFh.set(a.funeral_home_id, [])
    byFh.get(a.funeral_home_id).push(a.id)
  }

  let sent = 0
  let skipped = 0
  for (const [funeralHomeId, adminIds] of byFh) {
    const summary = await sumRevenue(funeralHomeId, start, end).catch(err => {
      console.error(`weekly revenue: sum failed for ${funeralHomeId}:`, err.message)
      return null
    })
    if (!summary) { skipped += adminIds.length; continue }

    const html = buildHtml({ start, end, ...summary })
    const subject = `Waypass · Weekly revenue (${fmt(start)} – ${fmt(end)})`

    for (const adminId of adminIds) {
      const ok = await sendPrefEmail(adminId, 'weekly_revenue_summary', { subject, html })
      if (ok) sent++
      else skipped++
    }
  }

  return { sent, skipped, window: { start: fmt(start), end: fmt(end) } }
}
