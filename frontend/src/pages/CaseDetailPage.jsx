import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  addCaseNote, fetchCustody, updateCustodyStage, fetchBookings, cancelBooking,
  fetchCaseDocuments, createCaseDocument, deleteCaseDocument, updateCaseDocument,
  fetchCaseActivity, fetchCase,
  updateCase, updateCaseDeceased, updateCaseFinancials,
  fetchCaseContacts, updateCaseContact, addCaseAddon, removeCaseAddon,
  fetchEmailTemplate, fetchEmailOverride, fetchPortalSettingsAuth, sendFamilyEmail,
} from '../lib/api.js'
import { toastError, toastSuccess, toastInfo } from '../lib/toast.js'
import { TEMPLATES, DEFAULT_SECTIONS, DEFAULT_PROGRESS_LABELS, SAMPLE } from '../components/dashboard/EmailEditorPage'
import { generateEmailHtml, buildSubject, buildEmailConfig } from '../lib/emailHtml.jsx'
import { StatusEmailModal } from '../components/cases/modals/StatusEmailModal.jsx'
import { RescheduleBookingModal } from '../components/booking/RescheduleBookingModal.jsx'
import { ConfirmModal } from '../components/ui/ConfirmModal.jsx'
import { slotToLabel, objToKey } from '../lib/slotUtils.js'
import { supabase } from '../lib/supabase.js'
import { CUSTODY_STAGES, CUSTODY_STATUS_MILESTONES, EMPTY_CUSTODY } from '../lib/constants.js'
import { DocumentPreviewModal } from '../components/ui/DocumentPreviewModal'
import { CaseInfoPanel } from '../components/cases/CaseInfoPanel'
import { CaseActivityTab } from '../components/cases/CaseActivityTab'
import { CaseDocumentsTab } from '../components/cases/CaseDocumentsTab'
import { NoteModal } from '../components/cases/modals/NoteModal'
import { LogCustodyModal } from '../components/cases/modals/LogCustodyModal'
import { AuthorizationModal } from '../components/cases/modals/AuthorizationModal'
import { TriangleAlert, Plus } from 'lucide-react'
import { ActivityDetailDrawer } from '../components/cases/ActivityDetailDrawer'
import { EditCaseModal } from '../components/cases/modals/EditCaseModal'
import { useUser } from '../context/UserContext.jsx'

export function CaseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cases, setCases } = useOutletContext()
  const caseData = cases.find(c => c.id === id)
  const onBack = () => navigate('/cases')
  const onStatusChange = (caseId, newStatus) => setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c))
  const onSchedule = () => navigate('/book', { state: { preselectedCase: caseData } })
  const { canWrite, profile } = useUser()
  const [caseRow, setCaseRow] = useState(caseData ?? null)
  const [status, setStatus] = useState(caseData?.status ?? null)
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [custody, setCustody] = useState(EMPTY_CUSTODY)
  const [authPending, setAuthPending] = useState(false)
  const [activeTab, setActiveTab] = useState('activity')
  const [caseBookings, setCaseBookings] = useState([])
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  // Derive auth doc presence from the persisted document_type column so the
  // state survives a refresh — previously these were local booleans that
  // reset on reload, leaving the "Authorization" warning stuck on screen.
  const authFormUploaded = useMemo(
    () => documents.some(d => d.documentType === 'authorization'),
    [documents]
  )
  const permitUploaded = useMemo(
    () => documents.some(d => d.documentType === 'permit'),
    [documents]
  )
  const authorizationComplete = authFormUploaded && permitUploaded
  const [activity, setActivity] = useState([])
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [contacts, setContacts] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const activityScrollRef = useRef(null)
  const uploadInputRef = useRef(null)

  // Email connectivity state
  const [emailTemplateSettings, setEmailTemplateSettings] = useState(null)
  const [emailOverride, setEmailOverride] = useState(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [pendingEmailStatus, setPendingEmailStatus] = useState(null)

  const refetchCase = useCallback(async () => {
    try {
      const fresh = await fetchCase(caseData.id)
      setCaseRow(fresh)
      setStatus(fresh.status)
    } catch (err) {
      toastError(`Failed to reload case: ${err.message}`)
    }
  }, [caseData.id])

  const refetchContacts = useCallback(async () => {
    try {
      const list = await fetchCaseContacts(caseData.id)
      setContacts(list)
    } catch (err) {
      console.error('Failed to load contacts:', err.message)
    }
  }, [caseData.id])

  const refetchDocuments = useCallback(async () => {
    try {
      const docs = await fetchCaseDocuments(caseData.id)
      setDocuments(docs)
    } catch (err) {
      toastError(`Failed to load documents: ${err.message}`)
    }
  }, [caseData.id])

  const refetchActivity = useCallback(async () => {
    try {
      const events = await fetchCaseActivity(caseData.id)
      setActivity(events)
    } catch (err) {
      console.error('Failed to load activity:', err.message)
    }
  }, [caseData.id])

  useEffect(() => {
    Promise.allSettled([
      fetchCustody(caseData.id)
        .then(data => { setCustody(data); setAuthPending(!data[2]?.completed) })
        .catch(() => { setAuthPending(true) }),
      fetchBookings()
        .then(all => setCaseBookings(all.filter(b => b.caseId === caseData.id)))
        .catch(() => {}),
      refetchDocuments(),
      refetchActivity(),
      refetchContacts(),
      fetchEmailTemplate().then(setEmailTemplateSettings).catch(() => {}),
      fetchEmailOverride(caseData.id).then(setEmailOverride).catch(() => {}),
      fetchPortalSettingsAuth().then(d => { if (d?.logoUrl) setLogoUrl(d.logoUrl) }).catch(() => {}),
    ])
  }, [caseData.id, refetchDocuments, refetchActivity, refetchContacts])

  const lastCompletedIdx = custody.reduce((acc, e, i) => e.completed ? i : acc, -1)
  const nextCustodyIdx = lastCompletedIdx + 1

  // Resolve the effective email template + config for this case
  const effectiveTemplate = useMemo(() => {
    const overrideTemplateId = emailOverride?.overrides?.activeTemplateId
    const globalTemplateId = emailTemplateSettings?.activeTemplateId ?? 'classic'
    const templateId = overrideTemplateId ?? globalTemplateId
    const base = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0]
    const colorOverrides = emailOverride?.overrides?.customizations?.[templateId]?.colors
      ?? emailTemplateSettings?.customizations?.[templateId]?.colors
      ?? {}
    const fontOverride = emailOverride?.overrides?.customizations?.[templateId]?.font
      ?? emailTemplateSettings?.customizations?.[templateId]?.font
      ?? null
    return { ...base, ...colorOverrides, font: fontOverride ?? base.font }
  }, [emailTemplateSettings, emailOverride])

  const effectiveSections = useMemo(() => (
    emailOverride?.overrides?.customizations?.[effectiveTemplate.id]?.sections
    ?? emailTemplateSettings?.customizations?.[effectiveTemplate.id]?.sections
    ?? DEFAULT_SECTIONS
  ), [emailTemplateSettings, emailOverride, effectiveTemplate])

  const effectiveConfig = useMemo(() => {
    const cust = emailOverride?.overrides?.customizations?.[effectiveTemplate.id]
      ?? emailTemplateSettings?.customizations?.[effectiveTemplate.id]
      ?? {}
    return buildEmailConfig(cust, effectiveTemplate, profile?.funeralHomeName)
  }, [emailTemplateSettings, emailOverride, effectiveTemplate, profile?.funeralHomeName])

  async function handleSendStatusEmail(newStatus) {
    const recipientEmail = caseRow.contactEmail
    if (!recipientEmail || !newStatus) return
    const emailCaseData = {
      deceased:  caseRow.deceased,
      family:    caseRow.family ?? caseRow.contactName,
      status:    newStatus,
      package:   caseRow.package,
      date:      caseRow.date,
      documents: documents.map(d => d.fileName || 'Document'),
    }
    const html = generateEmailHtml(effectiveTemplate, effectiveSections, effectiveConfig, emailCaseData, logoUrl)
    const subject = buildSubject(newStatus, effectiveConfig.footerName)
    const attachments = documents
      .filter(d => d.storagePath)
      .map(d => ({ name: d.fileName || 'document.pdf', storagePath: d.storagePath }))
    await sendFamilyEmail({ to: recipientEmail, subject, html, caseId: caseData.id, attachments })
    toastSuccess(`Status update sent to ${recipientEmail}`)
    setPendingEmailStatus(null)
  }

  async function handleCustodyUpdate(stageIdx, payload) {
    const saved = await updateCustodyStage(caseData.id, stageIdx, payload)
    const next = custody.map((e, i) => i === stageIdx ? { ...e, ...saved } : e)
    setCustody(next)
    setAuthPending(!next[2]?.completed)
    setShowLogModal(false)

    if (payload.completed && CUSTODY_STATUS_MILESTONES[stageIdx]) {
      const nextStatus = CUSTODY_STATUS_MILESTONES[stageIdx]
      setStatus(nextStatus)
      onStatusChange?.(caseData.id, nextStatus)
      setPendingEmailStatus(nextStatus)
    }

    refetchActivity()
  }

  async function handleUpload(file, documentType = 'other') {
    setUploading(true)
    const rawExt = file.name.includes('.') ? file.name.split('.').pop() : ''
    const ext = rawExt ? `.${rawExt}` : ''
    const path = `cases/${caseData.id}/${crypto.randomUUID()}${ext}`

    const { error: storageError } = await supabase.storage
      .from('case-documents')
      .upload(path, file, { upsert: false })
    if (storageError) {
      setUploading(false)
      toastError(`Upload failed: ${storageError.message}`)
      return
    }

    const { data: pub } = supabase.storage.from('case-documents').getPublicUrl(path)
    try {
      await createCaseDocument(caseData.id, {
        storagePath: path,
        fileUrl: pub?.publicUrl ?? '',
        fileName: file.name,
        documentType,
        visibleToFamily: false,
      })
      await refetchDocuments()
      await refetchActivity()
    } catch (err) {
      // Backend already attempts to remove the storage object on DB failure;
      // best-effort client-side remove guards against missing/old backend.
      await supabase.storage.from('case-documents').remove([path]).catch(() => {})
      toastError(`Could not save document: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleRenameDoc(docId, fileName) {
    try {
      await updateCaseDocument(caseData.id, docId, { fileName })
      await refetchDocuments()
    } catch (err) {
      toastError(`Rename failed: ${err.message}`)
    }
  }

  async function handleDeleteDoc(docId) {
    try {
      await deleteCaseDocument(caseData.id, docId)
      await refetchDocuments()
      await refetchActivity()
    } catch (err) {
      toastError(`Delete failed: ${err.message}`)
    }
  }

  async function handleUpdateDocMeta(docId, patch) {
    try {
      await updateCaseDocument(caseData.id, docId, patch)
      await refetchDocuments()
    } catch (err) {
      toastError(`Update failed: ${err.message}`)
    }
  }

  async function addNote(text) {
    try {
      await addCaseNote(caseData.id, { author: 'You', text })
      await refetchActivity()
    } catch (err) {
      toastError(`Failed to save note: ${err.message}`)
    }
  }

  // Bulk-save handler from EditCaseModal. Throws on failure so the modal can
  // surface the error; on success refreshes the case + contacts to reflect any
  // server-side normalization.
  async function handleSubmitEdit({ deceasedPatch, contactPatch, contactId, casePatch, financialsPatch, addonsToAdd, addonsToRemove }) {
    if (Object.keys(deceasedPatch).length) {
      await updateCaseDeceased(caseData.id, deceasedPatch)
    }
    if (contactId && Object.keys(contactPatch).length) {
      await updateCaseContact(caseData.id, contactId, contactPatch)
    }
    if (Object.keys(casePatch).length) {
      await updateCase(caseData.id, casePatch)
    }
    if (Object.keys(financialsPatch).length) {
      await updateCaseFinancials(caseData.id, financialsPatch)
    }
    for (const id of addonsToRemove) {
      await removeCaseAddon(caseData.id, id)
    }
    for (const id of addonsToAdd) {
      await addCaseAddon(caseData.id, id)
    }
    await refetchCase()
    await refetchContacts()
    toastSuccess('Case updated')
  }

  async function handlePreview(doc) {
    const path = doc.storagePath ?? doc.path
    if (!path) {
      toastError('This document has no storage path.')
      return
    }
    const { data, error } = await supabase.storage.from('case-documents').createSignedUrl(path, 3600)
    if (error || !data?.signedUrl) {
      toastError(`Preview failed: ${error?.message ?? 'no signed URL'}`)
      return
    }
    setPreviewDoc({ fullName: doc.fileName ?? doc.name, url: data.signedUrl })
  }

  const docsActionNeeded = authPending && !authorizationComplete
  const authBlocksTransport = nextCustodyIdx === 2 && authPending && !authorizationComplete

  if (!caseData) return null

  return (
    <div className="flex-1 flex overflow-hidden">
      <CaseInfoPanel
        caseData={caseRow}
        onBack={onBack}
        status={status}
        setActiveTab={setActiveTab}
        onShowNote={() => setShowNoteModal(true)}
        onSchedule={onSchedule}
        shippingPartnerName={caseBookings.find(b => b.status !== 'cancelled' && b.shippingPartnerName)?.shippingPartnerName ?? null}
        onEdit={canWrite ? () => setShowEditModal(true) : undefined}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        <div className="bg-surface/90 backdrop-blur border-b border-line shrink-0 px-8 flex items-center justify-between">
          <div className="flex gap-0">
            {[
              { id: 'activity', label: 'Activity' },
              { id: 'documents', label: 'Documents' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 font-sans text-sm font-medium border-0 bg-transparent outline-none cursor-pointer transition-colors ${
                  activeTab === tab.id ? 'text-ink border-b-2 border-ink -mb-px' : 'text-muted hover:text-ink'
                }`}
              >
                {tab.label}
                {tab.id === 'documents' && docsActionNeeded && (
                  <TriangleAlert size={13} className="text-warning flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          {activeTab === 'activity' && canWrite && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowNoteModal(true)}
                className="h-7 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12px] font-medium flex items-center gap-1.5 cursor-pointer outline-none border-0"
              >
                <Plus size={11} strokeWidth={2} />
                Note
              </button>
              <button
                onClick={() => setShowLogModal(true)}
                className="h-7 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12px] font-medium flex items-center gap-1.5 cursor-pointer outline-none border-0"
              >
                <Plus size={11} strokeWidth={2} />
                Log custody
              </button>
            </div>
          )}
          {activeTab === 'documents' && canWrite && (
            <div className="flex gap-2">
              <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]); e.target.value = '' }}
              />
              {docsActionNeeded && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="h-7 px-3 rounded-lg bg-warning-light border border-warning/40 text-warning font-sans text-[12px] font-medium flex items-center gap-1.5 cursor-pointer outline-none hover:bg-warning/20 transition-colors"
                >
                  <TriangleAlert size={11} strokeWidth={2} />
                  Authorization
                </button>
              )}
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
                className="h-7 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12px] font-medium flex items-center gap-1.5 cursor-pointer outline-none border-0 disabled:opacity-50"
              >
                {uploading
                  ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <Plus size={11} strokeWidth={2} />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'activity' && (
            <div ref={activityScrollRef} className="flex-1 overflow-y-auto">
              <CaseActivityTab
                activityFeed={activity}
                onSelectEvent={setSelectedActivity}
                onShowNote={canWrite ? () => setShowNoteModal(true) : undefined}
                onShowLog={canWrite ? () => setShowLogModal(true) : undefined}
              />
            </div>
          )}
          {activeTab === 'documents' && (
            <div className="flex-1 overflow-y-auto">
              <CaseDocumentsTab
                documents={documents}
                uploading={uploading}
                docsActionNeeded={docsActionNeeded}
                authorizationComplete={authorizationComplete}
                onShowAuth={canWrite ? () => setShowAuthModal(true) : undefined}
                onUpload={canWrite ? handleUpload : undefined}
                onPreview={handlePreview}
                onRenameDoc={canWrite ? handleRenameDoc : undefined}
                onDeleteDoc={canWrite ? handleDeleteDoc : undefined}
                onUpdateDocMeta={canWrite ? handleUpdateDocMeta : undefined}
              />
            </div>
          )}
          {caseBookings.length > 0 && (
            <div className="shrink-0 border-t border-line bg-white px-8 py-4 flex flex-col gap-2">
              {caseBookings.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onReschedule={canWrite ? setRescheduleTarget : undefined}
                  onCancel={canWrite ? setCancelTarget : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showNoteModal && canWrite && (
        <NoteModal onAdd={addNote} onClose={() => setShowNoteModal(false)} />
      )}
      {showLogModal && canWrite && (
        <LogCustodyModal
          custody={custody}
          onUpdate={handleCustodyUpdate}
          onClose={() => setShowLogModal(false)}
          authBlocksTransport={authBlocksTransport}
        />
      )}
      {showAuthModal && (
        <AuthorizationModal
          dop={caseData.dop}
          onUpload={handleUpload}
          authComplete={authorizationComplete}
          authFormUploaded={authFormUploaded}
          permitUploaded={permitUploaded}
          onClose={() => setShowAuthModal(false)}
        />
      )}
      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
      {rescheduleTarget && (
        <RescheduleBookingModal
          booking={rescheduleTarget}
          existingBookings={caseBookings}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={updated => setCaseBookings(prev => prev.map(b => b.id === updated.id ? updated : b))}
        />
      )}
      {cancelTarget && (
        <ConfirmModal
          title="Cancel booking?"
          message={`This will cancel the pickup request${cancelTarget.crematoriumName ? ` with ${cancelTarget.crematoriumName}` : ''}. You can reopen it later via Change booking.`}
          confirmLabel="Cancel booking"
          cancelLabel="Keep booking"
          destructive
          onCancel={() => setCancelTarget(null)}
          onConfirm={async () => {
            await cancelBooking(cancelTarget.id)
            setCaseBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b))
            setCancelTarget(null)
            refetchActivity()
          }}
        />
      )}
      <ActivityDetailDrawer
        event={selectedActivity}
        caseId={caseData.id}
        onClose={() => setSelectedActivity(null)}
        onChanged={() => { refetchActivity(); refetchDocuments() }}
      />
      {showEditModal && canWrite && (
        <EditCaseModal
          caseData={caseRow}
          primaryContact={contacts.find(c => c.isPrimary) ?? contacts[0] ?? null}
          onSubmit={handleSubmitEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {pendingEmailStatus && (
        <StatusEmailModal
          status={pendingEmailStatus}
          recipientEmail={caseRow.contactEmail ?? null}
          template={effectiveTemplate}
          sections={effectiveSections}
          config={effectiveConfig}
          caseData={{
            deceased:  caseRow.deceased,
            family:    caseRow.family ?? caseRow.contactName,
            status:    pendingEmailStatus,
            package:   caseRow.package,
            date:      caseRow.date,
            documents: documents.map(d => d.fileName || 'Document'),
          }}
          logoUrl={logoUrl}
          onSend={() => handleSendStatusEmail(pendingEmailStatus)}
          onSkip={() => { toastInfo('Status update email skipped.'); setPendingEmailStatus(null) }}
        />
      )}
    </div>
  )
}

const BOOKING_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  awaiting_shipping: 'bg-amber-50 text-amber-700 border-amber-200',
  responded: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-line text-muted border-line',
}
const BOOKING_STATUS_LABEL = {
  pending: 'Pending',
  awaiting_shipping: 'Awaiting shipping',
  responded: 'Responded',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

function BookingCard({ booking, onReschedule, onCancel }) {
  const chip = BOOKING_STATUS_STYLES[booking.status] ?? BOOKING_STATUS_STYLES.cancelled
  return (
    <div className="pb-2 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-sans text-[10px] uppercase tracking-wide text-muted">Cremation booking</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${chip}`}>
            {BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>
        <p className="font-sans text-[13px] font-medium text-ink">{booking.crematoriumName}</p>
        {booking.status === 'confirmed' && booking.confirmedSlot && (
          <p className="font-sans text-[12px] text-emerald-600 mt-0.5">
            {slotToLabel(objToKey(booking.confirmedSlot))}
          </p>
        )}
        {booking.shippingPartnerName && (
          <p className="font-sans text-[11px] text-muted mt-0.5">via {booking.shippingPartnerName}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onReschedule(booking)}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-ink text-surface font-sans text-[12px] font-medium hover:opacity-90 transition-opacity"
        >
          Change Booking
        </button>
        <button
          onClick={() => onCancel(booking)}
          disabled={booking.status === 'cancelled'}
          className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-danger/30 bg-surface text-danger font-sans text-[12px] font-medium hover:bg-danger/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
