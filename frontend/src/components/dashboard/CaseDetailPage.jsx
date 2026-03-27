import { useState, useRef } from 'react'
import { addCaseNote, addCaseDocument } from '../../lib/api.js'
import { supabase } from '../../lib/supabase.js'
import { StatusPill } from '../ui/StatusPill'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ProgressTrack } from '../ui/ProgressTrack'

const STATUS_ORDER = ['pending', 'transit', 'cremation', 'complete']

const CUSTODY_STAGES = [
  'Removal from Location',
  'Received at Funeral Home',
  'Transported to Crematory',
  'Received at Crematory',
  'Cremation Started',
  'Cremation Completed',
  'Remains Processed',
  'Returned to Funeral Home',
  'Delivered to Family',
]

// First 4 completed; stage 4 (Cremation Started) is overdue — logged Mar 13, expected Mar 14
const MOCK_CUSTODY = [
  { completed: true,  timestamp: 'Mar 12, 2024 · 11:30 PM', staff: 'Marcus Chen' },
  { completed: true,  timestamp: 'Mar 13, 2024 · 12:45 AM', staff: 'Sandra Okafor' },
  { completed: true,  timestamp: 'Mar 13, 2024 · 9:15 AM',  staff: 'James Whitfield' },
  { completed: true,  timestamp: 'Mar 13, 2024 · 10:02 AM', staff: 'D. Holt — Pacific Cremations' },
  { completed: false, expectedBy: 'Mar 14, 2024 10:00 AM' },
  { completed: false },
  { completed: false },
  { completed: false },
  { completed: false },
]

function CustodyNode({ completed, overdue, gap }) {
  if (completed) {
    return (
      <div className="w-5 h-5 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (overdue || gap) {
    return (
      <div className="w-5 h-5 rounded-full bg-amber-light border-2 border-amber flex items-center justify-center flex-shrink-0">
        <svg className="w-2.5 h-2.5 text-amber" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full border-2 border-border bg-cream flex-shrink-0" />
  )
}

function CustodyTimeline({ entries }) {
  const lastCompletedIdx = entries.reduce((acc, e, i) => e.completed ? i : acc, -1)

  return (
    <div className="bg-warm-white rounded-xl border border-border px-6 py-5 mb-5">
      <div className="flex items-center justify-between mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-wide">Chain of Custody</p>
        <Button variant="secondary" onClick={() => window.print()}>
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </Button>
      </div>

      <div>
        {CUSTODY_STAGES.map((stage, i) => {
          const entry = entries[i] ?? {}
          const isCompleted = entry.completed === true
          const isGap = !isCompleted && i < lastCompletedIdx
          const isOverdue = !isCompleted && !isGap && !!entry.expectedBy
          const isLast = i === CUSTODY_STAGES.length - 1

          return (
            <div key={i} className="flex gap-3.5">
              {/* Node + vertical connector */}
              <div className="flex flex-col items-center">
                <CustodyNode completed={isCompleted} overdue={isOverdue} gap={isGap} />
                {!isLast && (
                  <div className={`w-px flex-1 my-1 min-h-[28px] ${isCompleted ? 'bg-sage' : 'bg-border'}`} />
                )}
              </div>

              {/* Row content */}
              <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-sans text-sm font-medium ${
                    isCompleted ? 'text-charcoal' : isGap || isOverdue ? 'text-amber' : 'text-muted'
                  }`}>
                    {stage}
                  </span>
                  {isGap && (
                    <Badge variant="amber">Gap detected</Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="amber">Overdue</Badge>
                  )}
                </div>
                {isCompleted ? (
                  <p className="font-sans text-xs text-muted mt-0.5">
                    {entry.timestamp} · {entry.staff}
                  </p>
                ) : isOverdue ? (
                  <p className="font-sans text-xs text-amber mt-0.5">
                    Expected by {entry.expectedBy} — not yet logged
                  </p>
                ) : isGap ? (
                  <p className="font-sans text-xs text-amber mt-0.5">
                    No log entry — gap in chain
                  </p>
                ) : (
                  <p className="font-sans text-xs text-muted mt-0.5">Pending</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
const STEPS = ['Arrangements', 'Transport', 'Cremation', 'Complete']
const STATUS_NEXT_LABEL = {
  pending: 'Mark In Transit',
  transit: 'Mark In Cremation',
  cremation: 'Mark Complete',
  complete: null,
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-border last:border-0">
      <span className="font-sans text-xs text-muted">{label}</span>
      <span className="font-sans text-xs text-charcoal font-medium text-right max-w-[60%]">{value || '—'}</span>
    </div>
  )
}

function NoteCard({ note }) {
  return (
    <div className="bg-cream rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-xs font-semibold text-charcoal">{note.author}</span>
        <span className="font-sans text-xs text-muted">{note.time}</span>
      </div>
      <p className="font-sans text-sm text-slate leading-relaxed">{note.text}</p>
    </div>
  )
}

function DocRow({ doc }) {
  // Support both legacy string format and new {type, path, name} object format
  const name = typeof doc === 'string' ? doc : doc.name
  const path = typeof doc === 'string' ? null : doc.path
  const ext = name?.split('.').pop().toUpperCase() ?? 'FILE'

  async function handleDownload() {
    if (!path) return
    const { data, error } = await supabase.storage
      .from('case-documents')
      .createSignedUrl(path, 60)
    if (error || !data?.signedUrl) return
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-light flex items-center justify-center">
          <span className="font-sans text-[9px] font-bold text-blue-soft">{ext}</span>
        </div>
        <span className="font-sans text-sm text-charcoal">{name}</span>
      </div>
      {path && (
        <button
          onClick={handleDownload}
          className="font-sans text-xs font-medium text-sage hover:text-sage/80 transition-colors cursor-pointer border-0 bg-transparent outline-none"
        >
          Download
        </button>
      )}
    </div>
  )
}

export function CaseDetailPage({ caseData, onBack, onStatusChange }) {
  const [notes, setNotes] = useState(caseData.notes ?? [])
  const [newNote, setNewNote] = useState('')
  const [status, setStatus] = useState(caseData.status)
  const [documents, setDocuments] = useState(caseData.documents ?? [])
  const [uploading, setUploading] = useState(false)
  const uploadInputRef = useRef(null)

  async function handleUpload(file) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `cases/${caseData.id}/${Date.now()}.${ext}`
    const { error: storageError } = await supabase.storage
      .from('case-documents')
      .upload(path, file, { upsert: true })
    if (storageError) { setUploading(false); return }
    try {
      const saved = await addCaseDocument(caseData.id, { path, name: file.name })
      setDocuments(prev => [...prev, saved])
    } catch {
      // file is in storage but DB failed; still show it locally
      setDocuments(prev => [...prev, { path, name: file.name }])
    } finally {
      setUploading(false)
    }
  }

  const stepIndex = STATUS_ORDER.indexOf(status)
  const nextLabel = STATUS_NEXT_LABEL[status]

  function advanceStatus() {
    if (stepIndex < 3) {
      const next = STATUS_ORDER[stepIndex + 1]
      setStatus(next)
      onStatusChange?.(caseData.id, next)
    }
  }

  async function addNote() {
    if (!newNote.trim()) return
    const text = newNote.trim()
    const time = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    // Optimistic
    setNotes(prev => [...prev, { author: 'You', text, time }])
    setNewNote('')
    try {
      const saved = await addCaseNote(caseData.id, { author: 'You', text, time })
      // Replace optimistic note with saved data
      setNotes(prev => [...prev.slice(0, -1), saved])
    } catch (err) {
      console.error('Failed to save note:', err.message)
    }
  }

  return (
    <div>
      {/* Back + header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-sans text-muted hover:text-charcoal transition-colors cursor-pointer border-0 bg-transparent outline-none mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Cases
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-muted">{caseData.id}</span>
              <StatusPill status={status} />
            </div>
            <h1 className="font-display text-4xl font-light text-charcoal">{caseData.deceased}</h1>
            <p className="font-sans text-sm text-muted mt-1">{caseData.family} · Opened {caseData.date}</p>
          </div>
          <div className="flex gap-2 mt-2">
            {nextLabel && (
              <Button variant="sage" onClick={advanceStatus}>{nextLabel}</Button>
            )}
            <Button variant="secondary">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Progress track
      <div className="bg-warm-white rounded-xl border border-border px-6 py-5 mb-5">
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-4">Case Progress</p>
        <ProgressTrack steps={STEPS} currentStep={stepIndex} />
      </div> */}

      

      {/* Main 2-col layout */}
      <div className="grid grid-cols-5 gap-5">

        
        {/* Left — notes + documents */}
        <div className="col-span-3 space-y-5">
          {/* Case details */}
          <div className="bg-warm-white rounded-xl border border-border p-5">
            <div className="p-3">
            <h3 className="font-sans text-xs font-semibold text-muted uppercase tracking-wide mb-3">Deceased Details</h3>
            <InfoRow label="Full Name" value={caseData.deceased} />
            <InfoRow label="Date of Birth" value={caseData.dob} />
            <InfoRow label="Date of Passing" value={caseData.dop} />
            <InfoRow label="Location" value={caseData.location} />
          </div>

          <div className="p-3">
            <h3 className="font-sans text-xs font-semibold text-muted uppercase tracking-wide mb-3">Family Contact</h3>
            <InfoRow label="Name" value={caseData.contactName} />
            <InfoRow label="Relationship" value={caseData.relationship} />
            <InfoRow label="Phone" value={caseData.contactPhone} />
            <InfoRow label="Email" value={caseData.contactEmail} />
          </div>

          <div className="p-3">
            <h3 className="font-sans text-xs font-semibold text-muted uppercase tracking-wide mb-3">Arrangement</h3>
            <InfoRow label="Package" value={caseData.package} />
            <InfoRow label="Add-ons" value={caseData.addons?.join(', ') || 'None'} />
            <InfoRow label="Crematorium" value={caseData.crematorium} />
            <div className="flex justify-between pt-3 mt-1">
              <span className="font-sans text-xs font-semibold text-charcoal">Total</span>
              <span className="font-display text-xl text-charcoal">${caseData.amount.toLocaleString()}</span>
            </div>
          </div>
          </div>
          {/* Notes */}
          {/* Documents */}
          <div className="bg-warm-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-charcoal">Documents</h2>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]); e.target.value = '' }}
              />
              <Button
                variant="secondary"
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <svg className="w-3.5 h-3.5 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl py-8 text-center">
                <p className="font-sans text-sm text-muted">No documents uploaded yet.</p>
                <p className="font-sans text-xs text-muted mt-1">Click Upload to add files.</p>
              </div>
            ) : (
              <div>
                {documents.map((doc, i) => <DocRow key={i} doc={doc} />)}
              </div>
            )}
          </div>
          

          


        </div>

        {/* Right — case info */}
        <div className="space-y-5 col-span-2">

          {/* Chain of Custody */}
          <CustodyTimeline entries={MOCK_CUSTODY} />
          <div className="bg-warm-white rounded-xl border border-border p-6">
            <h2 className="font-display text-xl text-charcoal mb-4">Case Notes</h2>

            {notes.length === 0 ? (
              <p className="font-sans text-sm text-muted italic mb-4">No notes yet.</p>
            ) : (
              <div className="space-y-3 mb-5">
                {notes.map((n, i) => <NoteCard key={i} note={n} />)}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a note…"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
              />
              <Button variant="primary" onClick={addNote}>Add</Button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
