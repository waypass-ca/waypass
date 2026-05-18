import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    newCaseSubmitted: row.new_case_submitted,
    caseStatusUpdated: row.case_status_updated,
    documentUploaded: row.document_uploaded,
    caseMarkedComplete: row.case_marked_complete,
    newCrematoriumRequest: row.new_crematorium_request,
    weeklyRevenueSummary: row.weekly_revenue_summary,
    familyMessageReceived: row.family_message_received,
  }
}

// GET /api/notifications/:userId
router.get('/:userId', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.params.userId)
      .maybeSingle()
    if (error) throw error
    res.json(data ? shapeRow(data) : null)
  } catch (err) {
    next(err)
  }
})

// PUT /api/notifications/:userId
router.put('/:userId', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('notifications')
      .upsert(
        {
          user_id: req.params.userId,
          new_case_submitted: body.newCaseSubmitted,
          case_status_updated: body.caseStatusUpdated,
          document_uploaded: body.documentUploaded,
          case_marked_complete: body.caseMarkedComplete,
          new_crematorium_request: body.newCrematoriumRequest,
          weekly_revenue_summary: body.weeklyRevenueSummary,
          family_message_received: body.familyMessageReceived,
        },
        { onConflict: 'user_id' }
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
