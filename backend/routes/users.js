import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    funeralHomeId: row.funeral_home_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    status: row.status,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  }
}

// GET /api/users
router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .is('deleted_at', null)
      .order('first_name')
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'User not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// POST /api/users
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: body.id,
        funeral_home_id: body.funeralHomeId ?? null,
        email: body.email,
        first_name: body.firstName ?? null,
        last_name: body.lastName ?? null,
        phone: body.phone ?? null,
        role: body.role ?? 'staff',
        status: body.status ?? 'active',
        avatar_url: body.avatarUrl ?? null,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/:id
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('users')
      .update({
        funeral_home_id: body.funeralHomeId,
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
        role: body.role,
        status: body.status,
        avatar_url: body.avatarUrl,
        modified_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'User not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

export default router
