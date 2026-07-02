import { Router } from 'express'
import { randomUUID } from 'crypto'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function shapeRow(row) {
  return {
    activeTemplateId: row.active_template_id ?? 'classic',
    favouriteIds: row.favourite_ids ?? [],
    customizations: row.customizations ?? {},
    updatedAt: row.updated_at,
  }
}

// GET /api/email-template — requires auth, scoped to funeral home
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('email_template_settings')
      .select('*')
      .eq('funeral_home_id', req.user.funeralHomeId)
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
          id: req.user.funeralHomeId,
          funeral_home_id: req.user.funeralHomeId,
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
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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

// POST /api/email-template/send-family — send a family email via Resend
router.post('/send-family', requireAuth, async (req, res, next) => {
  try {
    const { to, subject, html, attachments = [] } = req.body
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'to, subject, and html are required' })
    }

    // Download each document from Supabase storage and attach to email
    const emailAttachments = []
    for (const att of attachments) {
      if (!att.storagePath) continue
      try {
        const { data, error } = await supabase.storage
          .from('case-documents')
          .download(att.storagePath)
        if (error || !data) continue
        const buffer = Buffer.from(await data.arrayBuffer())
        emailAttachments.push({ filename: att.name || 'document.pdf', content: buffer })
      } catch {
        // skip failed attachment — don't block the whole email
      }
    }

    if (process.env.ENABLE_RESEND !== 'false') {
      const apiKey = process.env.RESEND_API_KEY
      if (apiKey) {
        const { Resend } = await import('resend')
        const resend = new Resend(apiKey)
        const fromDomain = (process.env.RESEND_FROM ?? 'noreply@waypass.ca').split('@')[1] || 'waypass.ca'
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? 'noreply@waypass.ca',
          to,
          subject,
          html,
          attachments: emailAttachments,
          headers: {
            'Message-ID': `<${randomUUID()}@${fromDomain}>`,
          },
        })
      }
    }

    res.json({ sent: true })
  } catch (err) {
    next(err)
  }
})

export default router
