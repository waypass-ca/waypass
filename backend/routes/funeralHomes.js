import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/requireRole.js'

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name ?? null,
    licenseNumber: row.license_number ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    website: row.website ?? null,
    streetAddress: row.street_address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zip: row.zip ?? null,
    country: row.country ?? 'US',
    logoUrl: row.logo_url ?? null,
    accentColor: row.accent_color ?? '#6B8F71',
    subscriptionTier: row.subscription_tier ?? 'starter',
    createdAt: row.created_at,
  }
}

// GET /api/funeral-homes/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('funeral_homes')
      .select('*')
      .eq('id', req.user.funeralHomeId)
      .single()
    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/funeral-homes/me — admin only
router.patch('/me', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const ALLOWED = new Set([
      'name', 'display_name', 'license_number', 'phone', 'email', 'website',
      'street_address', 'city', 'state', 'zip', 'country', 'logo_url', 'accent_color',
    ])
    const patch = {}
    for (const [k, v] of Object.entries(req.body ?? {})) {
      if (ALLOWED.has(k)) patch[k] = v
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' })
    }
    patch.modified_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('funeral_homes')
      .update(patch)
      .eq('id', req.user.funeralHomeId)
      .select()
      .single()
    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

export default router
