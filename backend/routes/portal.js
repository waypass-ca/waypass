import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireWrite } from '../middleware/requireRole.js'

const router = Router()

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

// GET /api/portal-settings — public; accepts ?funeralHomeId= for family portal
// or returns current user's settings if authenticated
router.get('/', async (req, res, next) => {
  try {
    const funeralHomeId = req.query.funeralHomeId ?? null
    let query = supabase.from('portal_settings').select('*')

    if (funeralHomeId) {
      query = query.eq('funeral_home_id', funeralHomeId)
    } else {
      query = query.eq('id', 'default')
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    res.json(shapeRow(data ?? {}))
  } catch (err) {
    next(err)
  }
})

// PUT /api/portal-settings — requires auth, scoped to funeral home
router.put('/', requireAuth, requireWrite, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('portal_settings')
      .upsert(
        {
          id: req.user.funeralHomeId,
          funeral_home_id: req.user.funeralHomeId,
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
