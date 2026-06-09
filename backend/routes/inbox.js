import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

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
    createdAt: row.created_at,
  }
}

// GET /api/inbox
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('inbox_items')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data.map(shapeRow))
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

// DELETE /api/inbox/:id — archive (hard delete for now)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('inbox_items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
