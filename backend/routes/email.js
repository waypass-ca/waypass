import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const SETTINGS_ID = 'default'

function shapeRow(row) {
  return {
    activeTemplateId: row.active_template_id ?? 'classic',
    favouriteIds: row.favourite_ids ?? [],
    customizations: row.customizations ?? {},
    updatedAt: row.updated_at,
  }
}

// GET /api/email-template — public (frontend loads on mount)
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('email_template_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .maybeSingle()
    if (error) throw error
    res.json(shapeRow(data ?? {}))
  } catch (err) {
    next(err)
  }
})

// PUT /api/email-template — authenticated, upserts full state
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('email_template_settings')
      .upsert(
        {
          id: SETTINGS_ID,
          active_template_id: body.activeTemplateId ?? 'classic',
          favourite_ids: body.favouriteIds ?? [],
          customizations: body.customizations ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single()
    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// ── Case-level overrides (kept — uses case_email_overrides table) ────────────

router.get('/overrides/:caseId', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('case_email_overrides')
      .select('overrides, logo_storage_path, updated_at')
      .eq('case_id', req.params.caseId)
      .maybeSingle()
    if (error) throw error
    res.json(data ?? null)
  } catch (err) {
    next(err)
  }
})

router.put('/overrides/:caseId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id ?? null
    const { overrides, logoStoragePath } = req.body
    const { data, error } = await supabase
      .from('case_email_overrides')
      .upsert(
        {
          case_id: req.params.caseId,
          overrides: overrides ?? {},
          logo_storage_path: logoStoragePath ?? null,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        { onConflict: 'case_id' }
      )
      .select()
      .single()
    if (error) throw error
    res.json({ overrides: data.overrides, logoStoragePath: data.logo_storage_path, updatedAt: data.updated_at })
  } catch (err) {
    next(err)
  }
})

router.delete('/overrides/:caseId', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('case_email_overrides')
      .delete()
      .eq('case_id', req.params.caseId)
    if (error) throw error
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router
