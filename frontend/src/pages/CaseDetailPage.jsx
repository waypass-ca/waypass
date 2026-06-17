import { useState, useMemo, useEffect } from 'react'
import { addCaseNote, addCaseDocument, fetchCustody, updateCustodyStage, fetchBookings, cancelBooking } from '../lib/api.js'
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
import { TriangleAlert } from 'lucide-react'

export function CaseDetailPage({ caseData, onBack, onStatusChange, onSchedule }) {
  const [notes, setNotes] = useState(caseData.notes ?? [])
  const [status, setStatus] = useState(caseData.status)
  const [documents, setDocuments] = useState(caseData.documents ?? [])
  const [uploading, setUploading] = useState(false)
  const [authorizationComplete, setAuthorizationComplete] = useState(false)
  const [custody, setCustody] = useState(EMPTY_CUSTODY)
  const [authPending, setAuthPending] = useState(false)
  const [activeTab, setActiveTab] = useState('activity')
  const [caseBookings, setCaseBookings] = useState([])
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authFormUploaded, setAuthFormUploaded] = useState(false)
  const [permitUploaded, setPermitUploaded] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    fetchCustody(caseData.id)
      .then(data => { setCustody(data); setAuthPending(!data[2]?.completed) })
      .catch(() => { setAuthPending(true) })
    fetchBookings()
      .then(all => setCaseBookings(all.filter(b => b.caseId === caseData.id)))
      .catch(() => {})
  }, [caseData.id])

  const lastCompletedIdx = custody.reduce((acc, e, i) => e.completed ? i : acc, -1)
  const nextCustodyIdx = lastCompletedIdx + 1

  async function handleCustodyUpdate(stageIdx, payload) {
    const saved = await updateCustodyStage(caseData.id, stageIdx, payload)
    const next = custody.map((e, i) => i === stageIdx ? { ...e, ...saved } : e)
    setCustody(next)
    setAuthPending(!next[2]?.completed)
    if (payload.completed && CUSTODY_STATUS_MILESTONES[stageIdx]) {
      const nextStatus = CUSTODY_STATUS_MILESTONES[stageIdx]
      setStatus(nextStatus)
      onStatusChange?.(caseData.id, nextStatus)
    }
    setModalIdx(null)
  }

  async function handleUpload(file) {
    setUploading(true)
    const _ts = Date.now()
    const uploadedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    const ext = file.name.split('.').pop()
    const path = `cases/${caseData.id}/${_ts}.${ext}`
    const { error: storageError } = await supabase.storage.from('case-documents').upload(path, file, { upsert: true })
    if (storageError) { setUploading(false); return }
    try {
      const saved = await addCaseDocument(caseData.id, { path, name: file.name })
      setDocuments(prev => [...prev, { ...saved, _ts, uploadedAt }])
    } catch {
      setDocuments(prev => [...prev, { path, name: file.name, _ts, uploadedAt }])
    } finally {
      setUploading(false)
    }
  }

  async function addNote(text) {
    const _ts = Date.now()
    const time = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    setNotes(prev => [...prev, { author: 'You', text, time, _ts }])
    try {
      const saved = await addCaseNote(caseData.id, { author: 'You', text, time })
      setNotes(prev => [...prev.slice(0, -1), { ...saved, _ts }])
    } catch (err) {
      console.error('Failed to save note:', err.message)
    }
  }

  async function handlePreview(doc) {
    const path = typeof doc === 'string' ? null : doc.path
    if (!path) return
    const { data, error } = await supabase.storage.from('case-documents').createSignedUrl(path, 3600)
    if (!error && data?.signedUrl) {
      const name = typeof doc === 'string' ? doc : doc.name
      setPreviewDoc({ fullName: name, url: data.signedUrl })
    }
  }

  const activityFeed = useMemo(() => {
    const events = []
    custody.forEach((entry, i) => {
      if (entry.completed) {
        const parsed = new Date(entry.timestamp)
        const _ts = isNaN(parsed.getTime()) ? i * 10000 : parsed.getTime()
        events.push({ type: 'custody', label: CUSTODY_STAGES[i], staff: entry.staff, time: entry.timestamp, _ts })
      }
    })
    notes.forEach(n => events.push({ type: 'note', ...n, _ts: n._ts ?? 0 }))
    documents.forEach(d => {
      const name = typeof d === 'string' ? d : d.name
      events.push({ type: 'document', name, uploadedAt: d.uploadedAt, _ts: d._ts ?? 0 })
    })
    return events.sort((a, b) => a._ts - b._ts)
  }, [custody, notes, documents])

  const docsActionNeeded = authPending && !authorizationComplete
  const authBlocksTransport = nextCustodyIdx === 2 && authPending && !authorizationComplete

  return (
    <div className="flex-1 flex overflow-hidden">
      <CaseInfoPanel
        caseData={caseData}
        onBack={onBack}
        status={status}
        setActiveTab={setActiveTab}
        onShowNote={() => setShowNoteModal(true)}
        onSchedule={onSchedule}
        shippingPartnerName={caseBookings.find(b => b.status !== 'cancelled' && b.shippingPartnerName)?.shippingPartnerName ?? null}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-surface/90 overflow-hidden">
        <div className="bg-surface/90 backdrop-blur border-b border-line shrink-0 px-8">
          <div className="flex gap-0">
            {[
              { id: 'activity', label: 'Activity' },
              { id: 'documents', label: 'Documents' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 font-sans text-sm font-medium border-0 bg-transparent outline-none cursor-pointer transition-colors ${
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
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'activity' && (
            <>
              <div className="flex-1 overflow-y-auto">
                <CaseActivityTab
                  activityFeed={activityFeed}
                  onShowNote={() => setShowNoteModal(true)}
                  onShowLog={() => setShowLogModal(true)}
                />
              </div>
              {caseBookings.length > 0 && (
                <div className="shrink-0 border-t border-line bg-white px-8 py-4 flex flex-col gap-2">
                  {caseBookings.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onReschedule={setRescheduleTarget}
                      onCancel={setCancelTarget}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {activeTab === 'documents' && (
            <div className="flex-1 overflow-y-auto">
              <CaseDocumentsTab
                documents={documents}
                uploading={uploading}
                docsActionNeeded={docsActionNeeded}
                authorizationComplete={authorizationComplete}
                onShowAuth={() => setShowAuthModal(true)}
                onUpload={handleUpload}
                onPreview={handlePreview}
              />
            </div>
          )}
        </div>
      </div>

      {showNoteModal && (
        <NoteModal onAdd={addNote} onClose={() => setShowNoteModal(false)} />
      )}
      {showLogModal && (
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
          onAuthComplete={() => setAuthorizationComplete(true)}
          authFormUploaded={authFormUploaded}
          onAuthFormUpload={() => setAuthFormUploaded(true)}
          permitUploaded={permitUploaded}
          onPermitUpload={() => setPermitUploaded(true)}
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
          }}
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
