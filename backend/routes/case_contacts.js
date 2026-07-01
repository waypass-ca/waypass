import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router({ mergeParams: true })

function shapeRow(row) {
  return {
    id: row.id,
    caseId: row.case_id,
    name: row.name,
    relationship: row.relationship,
    phone: row.phone,
    email: row.email,
    isPrimary: row.is_primary,
    isAuthorizingNok: row.is_authorizing_nok,
    createdAt: row.created_at,
  }
}

// GET /api/cases/:caseId/contacts
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

    const { data, error } = await supabase
      .from('case_contacts')
      .select('*')
      .eq('case_id', req.params.caseId)
      .is('deleted_at', null)
      .order('created_at')
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// POST /api/cases/:caseId/contacts
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    if (!body.name?.trim()) return res.status(400).json({ error: 'name is required' })

    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

    if (body.isPrimary) {
      await supabase
        .from('case_contacts')
        .update({ is_primary: false })
        .eq('case_id', req.params.caseId)
    }

    const { data, error } = await supabase
      .from('case_contacts')
      .insert({
        case_id: req.params.caseId,
        name: body.name.trim(),
        relationship: body.relationship ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        is_primary: body.isPrimary ?? false,
        is_authorizing_nok: body.isAuthorizingNok ?? false,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/cases/:caseId/contacts/:id
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body

    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

    if (body.isPrimary) {
      await supabase
        .from('case_contacts')
        .update({ is_primary: false })
        .eq('case_id', req.params.caseId)
    }

    const { data, error } = await supabase
      .from('case_contacts')
      .update({
        name: body.name,
        relationship: body.relationship,
        phone: body.phone,
        email: body.email,
        is_primary: body.isPrimary,
        is_authorizing_nok: body.isAuthorizingNok,
      })
      .eq('id', req.params.id)
      .eq('case_id', req.params.caseId)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Contact not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// DELETE /api/cases/:caseId/contacts/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

    const { error } = await supabase
      .from('case_contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('case_id', req.params.caseId)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
