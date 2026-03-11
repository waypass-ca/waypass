import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const STEPS = ['Received', 'Intake', 'Cremation', 'Return']

const router = Router()

// ── GET /api/orders ─────────────────────────────
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('crematorium_orders')
      .select('*')
      .order('id')
    if (error) throw error
    res.json(data.map(o => ({ ...o, steps: STEPS })))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/orders/:id/advance ───────────────
router.patch('/:id/advance', requireAuth, async (req, res, next) => {
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('crematorium_orders')
      .select('status')
      .eq('id', req.params.id)
      .single()

    if (fetchErr) throw fetchErr
    if (!current) return res.status(404).json({ error: 'Order not found' })
    if (current.status >= 3) {
      return res.status(400).json({ error: 'Order already at final status' })
    }

    const { data, error } = await supabase
      .from('crematorium_orders')
      .update({ status: current.status + 1 })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ ...data, steps: STEPS })
  } catch (err) {
    next(err)
  }
})

export default router
