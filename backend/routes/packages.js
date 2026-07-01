import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireWrite } from '../middleware/requireRole.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('funeral_home_id', req.user.funeralHomeId)
      .order('sort_order')
    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('packages')
      .insert({ ...body, funeral_home_id: req.user.funeralHomeId })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Package not found' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
