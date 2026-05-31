import { useState, useMemo, useEffect } from 'react'
import { addCaseNote, addCaseDocument, fetchCustody, updateCustodyStage } from '../lib/api.js'
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

export function CaseDetailPage({ caseData, onBack, onStatusChange }) {
  const [notes, setNotes] = useState(caseData.notes ?? [])
  const [status, setStatus] = useState(caseData.status)
  const [documents, setDocuments] = useState(caseData.documents ?? [])
  const [uploading, setUploading] = useState(false)
  const [authorizationComplete, setAuthorizationComplete] = useState(false)
  const [custody, setCustody] = useState(EMPTY_CUSTODY)
  const [authPending, setAuthPending] = useState(false)
  const [activeTab, setActiveTab] = useState('activity')
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

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'activity' && (
            <CaseActivityTab
              activityFeed={activityFeed}
              onShowNote={() => setShowNoteModal(true)}
              onShowLog={() => setShowLogModal(true)}
            />
          )}
          {activeTab === 'documents' && (
            <CaseDocumentsTab
              documents={documents}
              uploading={uploading}
              docsActionNeeded={docsActionNeeded}
              authorizationComplete={authorizationComplete}
              onShowAuth={() => setShowAuthModal(true)}
              onUpload={handleUpload}
              onPreview={handlePreview}
            />
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
    </div>
  )
}
