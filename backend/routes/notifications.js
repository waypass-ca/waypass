import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Camel-case keys used by the frontend, in the order they appear in the UI.
const KEYS = [
  'newCaseSubmitted',
  'caseStatusUpdated',
  'documentUploaded',
  'caseMarkedComplete',
  'weeklyRevenueSummary',
  'familyMessageReceived',
]

// camelCase key → snake_case column base
const COL = {
  newCaseSubmitted:      'new_case_submitted',
  caseStatusUpdated:     'case_status_updated',
  documentUploaded:      'document_uploaded',
  caseMarkedComplete:    'case_marked_complete',
  weeklyRevenueSummary:  'weekly_revenue_summary',
  familyMessageReceived: 'family_message_received',
}

function shapeRow(row) {
  const email = {}
  const inApp = {}
  for (const key of KEYS) {
    email[key] = row[COL[key]] !== false
    inApp[key] = row[`${COL[key]}_in_app`] !== false
  }
  return { id: row.id, userId: row.user_id, email, inApp }
}

function buildUpsertRow(userId, body) {
  const row = { user_id: userId, updated_at: new Date().toISOString() }
  const email = body?.email ?? {}
  const inApp = body?.inApp ?? {}
  for (const key of KEYS) {
    if (typeof email[key] === 'boolean') row[COL[key]] = email[key]
    if (typeof inApp[key] === 'boolean') row[`${COL[key]}_in_app`] = inApp[key]
  }
  return row
}

// GET /api/notifications — current user's email + in-app prefs
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle()
    if (error) throw error
    res.json(data ? shapeRow(data) : null)
  } catch (err) {
    next(err)
  }
})

// PUT /api/notifications — upsert current user's prefs.
// Accepts { email: { key: bool, ... }, inApp: { key: bool, ... } }.
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .upsert(buildUpsertRow(req.user.id, req.body), { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

export default router
