import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('addons').select('*').order('price')
    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
