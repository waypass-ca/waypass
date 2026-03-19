import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    distance: row.distance,
    active: row.active,
    completedYTD: row.completed_ytd,
    avgTurnaround: row.avg_turnaround,
    avgFee: row.avg_fee,
    status: row.status,
    contact: row.contact,
    phone: row.phone,
    since: row.since,
  }
}

router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('crematoriums').select('*').order('name')
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const id = `CRM-${String(Date.now()).slice(-6)}`
    const { data, error } = await supabase
      .from('crematoriums')
      .insert({
        id,
        name: body.name,
        location: body.location,
        distance: body.distance ?? null,
        contact: body.contact ?? null,
        phone: body.phone ?? null,
        avg_turnaround: body.avg_turnaround ?? null,
        avg_fee: body.avg_fee ?? null,
        status: 'active',
        active: 0,
        completed_ytd: 0,
        since: new Date().getFullYear().toString(),
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('crematoriums')
      .update({
        name: body.name,
        location: body.location,
        distance: body.distance ?? null,
        contact: body.contact ?? null,
        phone: body.phone ?? null,
        avg_turnaround: body.avg_turnaround ?? null,
        avg_fee: body.avg_fee ?? null,
        status: body.status,
      })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Crematorium not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('crematoriums')
      .delete()
      .eq('id', req.params.id)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
