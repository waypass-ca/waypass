import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router({ mergeParams: true })

const DOC_SELECT = '*, folder:folders(*)'

function shapeRow(row) {
  return {
    id: row.id,
    caseId: row.case_id,
    uploadedBy: row.uploaded_by,
    documentType: row.document_type,
    fileUrl: row.file_url,
    fileName: row.file_name,
    storagePath: row.storage_path,
    status: row.status,
    visibleToFamily: row.visible_to_family,
    folderId: row.folder?.id ?? row.folder_id ?? null,
    folderName: row.folder?.name ?? null,
    uploadedAt: row.uploaded_at,
  }
}

// GET /api/cases/:caseId/documents/structured
router.get('/structured', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .select(DOC_SELECT)
      .eq('case_id', req.params.caseId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// POST /api/cases/:caseId/documents/structured
router.post('/structured', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    if (!body.fileUrl || !body.fileName) {
      return res.status(400).json({ error: 'fileUrl and fileName are required' })
    }

    const { data, error } = await supabase
      .from('case_documents')
      .insert({
        case_id: req.params.caseId,
        uploaded_by: body.uploadedBy ?? null,
        document_type: body.documentType ?? 'other',
        file_url: body.fileUrl,
        file_name: body.fileName,
        storage_path: body.storagePath ?? null,
        status: body.status ?? 'pending',
        visible_to_family: body.visibleToFamily ?? false,
        folder_id: body.folderId ?? null,
      })
      .select(DOC_SELECT)
      .single()
    if (error) throw error
    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/cases/:caseId/documents/structured/:id
router.patch('/structured/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    const { data, error } = await supabase
      .from('case_documents')
      .update({
        document_type: body.documentType,
        status: body.status,
        visible_to_family: body.visibleToFamily,
      })
      .eq('id', req.params.id)
      .eq('case_id', req.params.caseId)
      .select(DOC_SELECT)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Document not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/cases/:caseId/documents/structured/:id/folder
router.patch('/structured/:id/folder', requireAuth, async (req, res, next) => {
  try {
    const { folderId } = req.body
    const { data, error } = await supabase
      .from('case_documents')
      .update({ folder_id: folderId ?? null })
      .eq('id', req.params.id)
      .eq('case_id', req.params.caseId)
      .select(DOC_SELECT)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Document not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// DELETE /api/cases/:caseId/documents/structured/:id
router.delete('/structured/:id', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('case_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('case_id', req.params.caseId)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
