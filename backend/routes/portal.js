import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const SETTINGS_ID = 'default'

function shapeRow(row) {
  return {
    funeralHomeName: row.funeral_home_name ?? 'Evergreen Memorial',
    tagline: row.tagline ?? 'Compassionate care, with dignity and grace.',
    logoUrl: row.logo_url ?? '',
    primaryColor: row.primary_color ?? '#6B8F71',
    accentColor: row.accent_color ?? '#C4965A',
    backgroundColor: row.background_color ?? '#F7F3EE',
    cardColor: row.card_color ?? '#FDFAF7',
    textColor: row.text_color ?? '#1C1C1E',
    fontStyle: row.font_style ?? 'serif',
    sections: {
      progressTracker: row.section_progress_tracker ?? true,
      deceasedDetails: row.section_deceased_details ?? true,
      coordinator: row.section_coordinator ?? true,
      documents: row.section_documents ?? false,
      personalMessage: row.section_personal_message ?? true,
    },
    personalMessage:
      row.personal_message ??
      'Our deepest sympathies are with your family during this time. We are honoured to serve you and will be with you every step of the way.',
  }
}

// GET /api/portal-settings — public, families also need to read this
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('portal_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .maybeSingle()
    if (error) throw error
    res.json(shapeRow(data ?? {}))
  } catch (err) {
    next(err)
  }
})

// PUT /api/portal-settings — requires auth
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('portal_settings')
      .upsert(
        {
          id: SETTINGS_ID,
          funeral_home_name: body.funeralHomeName,
          tagline: body.tagline,
          logo_url: body.logoUrl,
          primary_color: body.primaryColor,
          accent_color: body.accentColor,
          background_color: body.backgroundColor,
          card_color: body.cardColor,
          text_color: body.textColor,
          font_style: body.fontStyle,
          section_progress_tracker: body.sections?.progressTracker ?? true,
          section_deceased_details: body.sections?.deceasedDetails ?? true,
          section_coordinator: body.sections?.coordinator ?? true,
          section_documents: body.sections?.documents ?? false,
          section_personal_message: body.sections?.personalMessage ?? true,
          personal_message: body.personalMessage,
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

export default router
