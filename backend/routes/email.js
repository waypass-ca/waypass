import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const TEMPLATE_ID = 'default'

function shapeTemplate(row, portalLogoUrl) {
  return {
    bgColor: row.bg_color,
    headerBgColor: row.header_bg_color,
    bodyBgColor: row.body_bg_color,
    fontFamily: row.font_family,
    fontSize: String(row.font_size),
    headingColor: row.heading_color,
    bodyColor: row.body_color,
    linkColor: row.link_color,
    logoUrl: row.logo_url ?? portalLogoUrl ?? '',
    logoStoragePath: row.logo_storage_path ?? null,
    logoAlt: row.logo_alt,
    progressTrackerEnabled: row.progress_tracker_enabled,
    progressTrackerTitle: row.progress_tracker_title,
    progressActiveColor: row.progress_active_color,
    progressSteps: row.progress_steps,
    caseDetailsEnabled: row.case_details_enabled,
    caseDetailsTitle: row.case_details_title,
    caseDetailsFields: row.case_details_fields,
    documentsEnabled: row.documents_enabled,
    documentsTitle: row.documents_title,
    documentsNote: row.documents_note,
    personalMessageEnabled: row.personal_message_enabled,
    personalMessageHeading: row.personal_message_heading,
    personalMessageBody: row.personal_message_body,
    footerEnabled: row.footer_enabled,
    footerCompanyName: row.footer_company_name,
    footerAddress: row.footer_address,
    footerPhone: row.footer_phone,
    footerUnsubscribeText: row.footer_unsubscribe_text,
    footerCopyrightText: row.footer_copyright_text,
    footerShowSocials: row.footer_show_socials,
  }
}

function mapTemplateToDB(body) {
  return {
    id: TEMPLATE_ID,
    bg_color: body.bgColor,
    header_bg_color: body.headerBgColor,
    body_bg_color: body.bodyBgColor,
    font_family: body.fontFamily,
    font_size: parseInt(body.fontSize, 10) || 15,
    heading_color: body.headingColor,
    body_color: body.bodyColor,
    link_color: body.linkColor,
    logo_url: body.logoUrl || null,
    logo_storage_path: body.logoStoragePath ?? null,
    logo_alt: body.logoAlt,
    progress_tracker_enabled: body.progressTrackerEnabled,
    progress_tracker_title: body.progressTrackerTitle,
    progress_active_color: body.progressActiveColor,
    progress_steps: body.progressSteps,
    case_details_enabled: body.caseDetailsEnabled,
    case_details_title: body.caseDetailsTitle,
    case_details_fields: body.caseDetailsFields,
    documents_enabled: body.documentsEnabled,
    documents_title: body.documentsTitle,
    documents_note: body.documentsNote,
    personal_message_enabled: body.personalMessageEnabled,
    personal_message_heading: body.personalMessageHeading,
    personal_message_body: body.personalMessageBody,
    footer_enabled: body.footerEnabled,
    footer_company_name: body.footerCompanyName,
    footer_address: body.footerAddress,
    footer_phone: body.footerPhone,
    footer_unsubscribe_text: body.footerUnsubscribeText,
    footer_copyright_text: body.footerCopyrightText,
    footer_show_socials: body.footerShowSocials,
    updated_at: new Date().toISOString(),
  }
}

// GET /api/email-template — public (families render their portal from this)
router.get('/', async (_req, res, next) => {
  try {
    const [templateResult, portalResult] = await Promise.all([
      supabase.from('email_template').select('*').eq('id', TEMPLATE_ID).maybeSingle(),
      supabase.from('portal_settings').select('logo_url').eq('id', 'default').maybeSingle(),
    ])
    if (templateResult.error) throw templateResult.error
    const portalLogoUrl = portalResult.data?.logo_url ?? null
    res.json(shapeTemplate(templateResult.data ?? {}, portalLogoUrl))
  } catch (err) {
    next(err)
  }
})

// PUT /api/email-template — authenticated
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('email_template')
      .upsert(mapTemplateToDB(req.body), { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error

    const { data: portalData } = await supabase
      .from('portal_settings')
      .select('logo_url')
      .eq('id', 'default')
      .maybeSingle()

    res.json(shapeTemplate(data, portalData?.logo_url ?? null))
  } catch (err) {
    next(err)
  }
})

// GET /api/email-template/overrides/:caseId — authenticated
router.get('/overrides/:caseId', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('case_email_overrides')
      .select('overrides, logo_storage_path, updated_at')
      .eq('case_id', req.params.caseId)
      .maybeSingle()
    if (error) throw error
    // null means the case uses the template exactly
    res.json(data ?? null)
  } catch (err) {
    next(err)
  }
})

// PUT /api/email-template/overrides/:caseId — authenticated
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

// DELETE /api/email-template/overrides/:caseId — authenticated (reset case to template)
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
