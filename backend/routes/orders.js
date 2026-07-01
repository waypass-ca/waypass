import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const STEPS = ['Received', 'Intake', 'Cremation', 'Return']

const router = Router()

function shapeRow(o) {
  return {
    ...o,
    name: o.deceased_name ?? o.name,
    funeralHome: o.funeral_home_name ?? o.funeral_home,
    package: o.package_name ?? o.package,
    received: o.received_at ?? o.received,
    scheduled: o.scheduled_at ?? o.scheduled,
    steps: STEPS,
  }
}

// ── GET /api/orders ─────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('crematorium_orders')
      .select('*')
      .eq('funeral_home_id', req.user.funeralHomeId)
      .order('id')
    if (error) throw error
    res.json(data.map(shapeRow))
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
      .eq('funeral_home_id', req.user.funeralHomeId)
      .single()

    if (fetchErr) throw fetchErr
    if (!current) return res.status(404).json({ error: 'Order not found' })
    if (current.status >= 3) {
      return res.status(400).json({ error: 'Order already at final status' })
    }

    const newStatus = current.status + 1
    const { data, error } = await supabase
      .from('crematorium_orders')
      .update({
        status: newStatus,
        completed_at: newStatus === 3 ? new Date().toISOString().slice(0, 10) : null,
        modified_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

export default router
