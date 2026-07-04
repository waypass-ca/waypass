import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router({ mergeParams: true })

// Confirms the case exists AND belongs to the caller's funeral home, so message
// reads/writes can't cross tenants via a guessed case id. Returns true/false.
async function callerOwnsCase(req) {
  const { data, error } = await supabase
    .from('cases')
    .select('id')
    .eq('id', req.params.caseId)
    .eq('funeral_home_id', req.user.funeralHomeId)
    .maybeSingle()
  return !error && !!data
}

function shapeRow(row) {
  return {
    id: row.id,
    caseId: row.case_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    senderName: row.sender_name,
    body: row.body,
    readByStaff: row.read_by_staff,
    readByFamily: row.read_by_family,
    createdAt: row.created_at,
  }
}

// GET /api/cases/:caseId/messages
router.get('/', requireAuth, async (req, res, next) => {
  try {
    if (!(await callerOwnsCase(req))) return res.status(404).json({ error: 'Case not found' })

    const { data, error } = await supabase
      .from('case_family_messages')
      .select('*')
      .eq('case_id', req.params.caseId)
      .order('created_at')
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// POST /api/cases/:caseId/messages
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    if (!body.body?.trim()) return res.status(400).json({ error: 'body is required' })
    if (body.body.length > 5000) return res.status(400).json({ error: 'Message exceeds maximum length of 5000 characters' })

    if (!(await callerOwnsCase(req))) return res.status(404).json({ error: 'Case not found' })

    // Sender is the authenticated staff user — never trust body-supplied identity.
    const { data, error } = await supabase
      .from('case_family_messages')
      .insert({
        case_id: req.params.caseId,
        sender_type: 'staff',
        sender_id: req.user.id,
        sender_name: req.user.email ?? null,
        body: body.body.trim(),
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/cases/:caseId/messages/:id/read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    if (!(await callerOwnsCase(req))) return res.status(404).json({ error: 'Case not found' })

    const { readByStaff, readByFamily } = req.body
    const { data, error } = await supabase
      .from('case_family_messages')
      .update({
        ...(readByStaff !== undefined && { read_by_staff: readByStaff }),
        ...(readByFamily !== undefined && { read_by_family: readByFamily }),
      })
      .eq('id', req.params.id)
      .eq('case_id', req.params.caseId)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Message not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

export default router
