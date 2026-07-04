import { Router } from 'express'
import { runWeeklyRevenueJob } from '../lib/weeklyRevenueJob.js'

const router = Router()

// Constant-time compare to avoid timing side-channels on the shared secret.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function requireInternalSecret(req, res, next) {
  const expected = process.env.INTERNAL_JOB_SECRET
  if (!expected) return res.status(503).json({ error: 'INTERNAL_JOB_SECRET not configured' })
  const provided = req.get('x-internal-secret') ?? ''
  if (!safeEqual(provided, expected)) return res.status(401).json({ error: 'unauthorized' })
  next()
}

// POST /api/internal/jobs/weekly-revenue — designed to be called by an
// external cron (e.g. Supabase pg_cron or platform scheduler) once a week.
router.post('/weekly-revenue', requireInternalSecret, async (_req, res, next) => {
  try {
    const result = await runWeeklyRevenueJob()
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
