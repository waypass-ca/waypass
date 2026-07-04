import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { notifyUser } from '../lib/notifications.js'

const lastName = (name) => {
  if (!name) return null
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1]
}

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
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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
// Client uploads to Supabase Storage bucket `case-documents` first, then POSTs
// the metadata. If the DB insert fails, we delete the storage object so we
// never leak orphaned files. Without that rollback, transient DB errors leave
// dangling blobs and the UI silently shows nothing.
router.post('/structured', requireAuth, async (req, res, next) => {
  try {
    const body = req.body
    if (!body.fileUrl || !body.fileName) {
      return res.status(400).json({ error: 'fileUrl and fileName are required' })
    }

    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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
    if (error) {
      if (body.storagePath) {
        const { error: rmErr } = await supabase
          .storage.from('case-documents').remove([body.storagePath])
        if (rmErr) console.error('Failed to roll back storage object after DB error:', rmErr.message)
      }
      throw error
    }

    // Surface uploads in the inbox so they appear in /inbox and trigger the
    // realtime toast subscription. Failure to notify shouldn't fail the upload.
    try {
      const { data: caseRow } = await supabase
        .from('cases').select('deceased').eq('id', req.params.caseId).maybeSingle()
      const deceasedName = caseRow?.deceased ?? req.params.caseId
      const ln = lastName(deceasedName) ?? req.params.caseId
      await notifyUser(req.user.id, 'documentUploaded', {
        type: 'message',
        sender: 'Documents',
        subject: `${ln} · Document uploaded`,
        preview: `${data.file_name} added to ${deceasedName}.`,
        body: `${data.file_name} was uploaded to case ${req.params.caseId} (${deceasedName}).`,
        caseId: req.params.caseId,
        severity: 'info',
      })
    } catch (notifyErr) {
      console.error('Failed to create document upload inbox item:', notifyErr.message)
    }

    res.status(201).json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/cases/:caseId/documents/structured/:id
router.patch('/structured/:id', requireAuth, async (req, res, next) => {
  try {
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

    const body = req.body
    const patch = {}
    if ('documentType' in body) patch.document_type = body.documentType
    if ('status' in body) patch.status = body.status
    if ('visibleToFamily' in body) patch.visible_to_family = body.visibleToFamily
    if ('fileName' in body) {
      const trimmed = String(body.fileName ?? '').trim()
      if (!trimmed) return res.status(400).json({ error: 'fileName cannot be empty' })
      patch.file_name = trimmed
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' })
    }

    const { data, error } = await supabase
      .from('case_documents')
      .update(patch)
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
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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
    const { data: _case, error: caseErr } = await supabase
      .from('cases').select('id').eq('id', req.params.caseId).eq('funeral_home_id', req.user.funeralHomeId).single()
    if (caseErr || !_case) return res.status(404).json({ error: 'Case not found' })

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
