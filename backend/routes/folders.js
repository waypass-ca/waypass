import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    funeralHomeId: row.funeral_home_id,
    name: row.name,
    type: row.type,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

// GET /api/folders?type=cases|documents
router.get('/', requireAuth, async (req, res, next) => {
  try {
    let query = supabase
      .from('folders')
      .select('*')
      .eq('funeral_home_id', req.user.funeralHomeId)
      .is('deleted_at', null)

    if (req.query.type) query = query.eq('type', req.query.type)

    const { data, error } = await query.order('sort_order')
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// POST /api/folders
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    if (!body.name?.trim()) return res.status(400).json({ error: 'name is required' })
    if (!['cases', 'documents'].includes(body.type)) {
      return res.status(400).json({ error: 'type must be cases or documents' })
    }

    const { data, error } = await supabase
      .from('folders')
      .insert({
        funeral_home_id: req.user.funeralHomeId,
        name: body.name.trim(),
        type: body.type,
        color: body.color ?? null,
        sort_order: body.sortOrder ?? 0,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/folders/:id
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('folders')
      .update({
        name: body.name,
        color: body.color,
        sort_order: body.sortOrder,
        modified_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Folder not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// DELETE /api/folders/:id?type=cases|documents&withContents=true
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { type, withContents } = req.query
    const deleteContents = withContents === 'true'

    if (type === 'documents') {
      const { error } = deleteContents
        ? await supabase.from('case_documents')
            .update({ deleted_at: new Date().toISOString() })
            .eq('folder_id', req.params.id)
            .is('deleted_at', null)
        : await supabase.from('case_documents')
            .update({ folder_id: null })
            .eq('folder_id', req.params.id)
      if (error) throw error
    } else if (type === 'cases') {
      const update = deleteContents
        ? { folder_id: null, deleted_at: new Date().toISOString() }
        : { folder_id: null }
      const { error } = await supabase.from('cases')
        .update(update)
        .eq('folder_id', req.params.id)
        .is('deleted_at', null)
      if (error) throw error
    }

    const { error } = await supabase
      .from('folders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
