import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

function shapeRow(row) {
  return {
    id: row.id,
    type: row.type,
    from: row.sender,
    subject: row.subject,
    preview: row.preview,
    body: row.body,
    caseId: row.case_id,
    bookingId: row.booking_id,
    severity: row.severity,
    scheduledFor: row.scheduled_for,
    read: row.read,
    starred: row.starred,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  }
}

function parseLimit(raw) {
  const n = parseInt(raw, 10)
  if (isNaN(n) || n <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(n, MAX_PAGE_SIZE)
}

// GET /api/inbox?limit=50&before=<iso>&archived=true
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit)
    const showArchived = req.query.archived === 'true'

    let q = supabase
      .from('inbox_items')
      .select('*')
      .eq('user_id', req.user.id)

    q = showArchived ? q.not('archived_at', 'is', null) : q.is('archived_at', null)
    if (req.query.before) q = q.lt('created_at', req.query.before)

    const { data, error } = await q
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// GET /api/inbox/unread-count — must be registered before /:id routes
router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const { count, error } = await supabase
      .from('inbox_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('read', false)
      .is('archived_at', null)
    if (error) throw error
    res.json({ count: count ?? 0 })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/inbox/mark-all-read — must be registered before /:id routes
router.patch('/mark-all-read', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('inbox_items')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false)
      .is('archived_at', null)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/inbox/:id/read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const read = req.body?.read !== undefined ? !!req.body.read : true
    const { error } = await supabase
      .from('inbox_items')
      .update({ read })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/inbox/:id/star
router.patch('/:id/star', requireAuth, async (req, res, next) => {
  try {
    const { starred } = req.body
    const { error } = await supabase
      .from('inbox_items')
      .update({ starred: !!starred })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/inbox/:id/unarchive
router.post('/:id/unarchive', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('inbox_items')
      .update({ archived_at: null })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/inbox/:id — soft archive
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('inbox_items')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
