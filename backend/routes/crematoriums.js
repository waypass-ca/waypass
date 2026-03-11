import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

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

export default router
