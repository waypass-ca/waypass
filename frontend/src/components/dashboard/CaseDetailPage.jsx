import { useState } from 'react'
import { addCaseNote } from '../../lib/api.js'
import { StatusPill } from '../ui/StatusPill'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ProgressTrack } from '../ui/ProgressTrack'

const STATUS_ORDER = ['pending', 'transit', 'cremation', 'complete']
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

function DocRow({ filename }) {
  const ext = filename.split('.').pop().toUpperCase()
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-light flex items-center justify-center">
          <span className="font-sans text-[9px] font-bold text-blue-soft">{ext}</span>
        </div>
        <span className="font-sans text-sm text-charcoal">{filename}</span>
      </div>
      <button className="font-sans text-xs font-medium text-sage hover:text-sage/80 transition-colors cursor-pointer border-0 bg-transparent outline-none">
        Download
      </button>
    </div>
  )
}

export function CaseDetailPage({ caseData, onBack, onStatusChange }) {
  const [notes, setNotes] = useState(caseData.notes ?? [])
  const [newNote, setNewNote] = useState('')
  const [status, setStatus] = useState(caseData.status)

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

      {/* Progress track */}
      <div className="bg-warm-white rounded-xl border border-border px-6 py-5 mb-5">
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-4">Case Progress</p>
        <ProgressTrack steps={STEPS} currentStep={stepIndex} />
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-3 gap-5">
        {/* Left — notes + documents */}
        <div className="col-span-2 space-y-5">
          {/* Notes */}
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

          {/* Documents */}
          <div className="bg-warm-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-charcoal">Documents</h2>
              <Button variant="secondary">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Upload
              </Button>
            </div>

            {caseData.documents.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl py-8 text-center">
                <p className="font-sans text-sm text-muted">No documents uploaded yet.</p>
                <p className="font-sans text-xs text-muted mt-1">Click Upload to add files.</p>
              </div>
            ) : (
              <div>
                {caseData.documents.map((doc, i) => <DocRow key={i} filename={doc} />)}
              </div>
            )}
          </div>
        </div>

        {/* Right — case info */}
        <div className="space-y-5">
          {/* Case details */}
          <div className="bg-warm-white rounded-xl border border-border p-5">
            <h3 className="font-sans text-xs font-semibold text-muted uppercase tracking-wide mb-3">Deceased Details</h3>
            <InfoRow label="Full Name" value={caseData.deceased} />
            <InfoRow label="Date of Birth" value={caseData.dob} />
            <InfoRow label="Date of Passing" value={caseData.dop} />
            <InfoRow label="Location" value={caseData.location} />
          </div>

          <div className="bg-warm-white rounded-xl border border-border p-5">
            <h3 className="font-sans text-xs font-semibold text-muted uppercase tracking-wide mb-3">Family Contact</h3>
            <InfoRow label="Name" value={caseData.contactName} />
            <InfoRow label="Relationship" value={caseData.relationship} />
            <InfoRow label="Phone" value={caseData.contactPhone} />
            <InfoRow label="Email" value={caseData.contactEmail} />
          </div>

          <div className="bg-warm-white rounded-xl border border-border p-5">
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
      </div>
    </div>
  )
}
