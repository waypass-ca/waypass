import { useState, useRef, useEffect, useMemo } from 'react'
import {
  ChevronDown, ArrowLeft, FileText, MessageSquare,
  CheckCircle2, Upload, Printer, Lock, TriangleAlert,
  CalendarPlus, StickyNote, Mail, Phone,
} from 'lucide-react'
import { addCaseNote, addCaseDocument, fetchCustody, updateCustodyStage } from '../../lib/api.js'
import { crematoriums } from '../../data/mockData.js'
import { supabase } from '../../lib/supabase.js'
import { StatusPill } from '../ui/StatusPill'
import { Button } from '../ui/Button'

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

const CUSTODY_STATUS_MILESTONES = { 2: 'transit', 4: 'cremation', 8: 'complete' }
const EMPTY_CUSTODY = Array.from({ length: 9 }, () => ({ completed: false, staff: null, timestamp: null }))

function now() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// ── Left sliver components ─────────────────────────────────────────────────

function InfoField({ label, value }) {
  return (
    <div className="py-1.5 border-b border-line last:border-0">
      <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-sans text-[13px] text-ink">{value || '—'}</p>
    </div>
  )
}

function InfoSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 pt-3 pb-2 hover:bg-ink/[0.02] transition-colors cursor-pointer border-0 bg-transparent outline-none"
      >
        <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">{title}</span>
        <ChevronDown
          size={12}
          className={`text-muted transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
          strokeWidth={2}
        />
      </button>
      {open && <div className="px-5 pb-2">{children}</div>}
    </div>
  )
}

// ── Activity feed components ───────────────────────────────────────────────

function ActivityEvent({ event, isLast }) {
  let iconEl, iconBg, title, detail, body = null

  if (event.type === 'custody') {
    iconEl = <CheckCircle2 size={13} className="text-primary" />
    iconBg = 'bg-primary/15'
    title = event.label
    detail = `Logged by ${event.staff} · ${event.time}`
  } else if (event.type === 'note') {
    iconEl = <MessageSquare size={12} className="text-info" />
    iconBg = 'bg-info-tint'
    title = event.author
    detail = `added a note · ${event.time}`
    body = (
      <div className="mt-2 bg-canvas border border-line rounded-xl px-4 py-3">
        <p className="font-sans text-sm text-secondary leading-relaxed">{event.text}</p>
      </div>
    )
  } else if (event.type === 'document') {
    iconEl = <FileText size={12} className="text-warning" />
    iconBg = 'bg-warning-light'
    title = 'Document uploaded'
    detail = event.name
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {iconEl}
        </div>
        {!isLast && <div className="w-px flex-1 bg-line mt-1 min-h-[28px]" />}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-2' : 'pb-5'}`}>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-sans text-[13px] font-medium text-ink">{title}</span>
          {detail && <span className="font-sans text-xs text-muted">{detail}</span>}
        </div>
        {body}
      </div>
    </div>
  )
}

// ── Custody modal ──────────────────────────────────────────────────────────

function CustodyModal({ stage, entry, onSave, onClose }) {
  const isCompleted = entry?.completed === true
  const [staff, setStaff] = useState(entry?.staff ?? '')
  const [timestamp, setTimestamp] = useState(entry?.timestamp ?? now())
  const [saving, setSaving] = useState(false)

  async function handleSave(completed) {
    setSaving(true)
    await onSave(completed, completed ? staff : null, completed ? timestamp : null)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Chain of Custody</p>
        <h3 className="font-display text-xl text-ink mb-5">{stage}</h3>

        {isCompleted ? (
          <>
            <p className="font-sans text-sm text-secondary mb-5">
              Logged by <strong>{entry.staff}</strong> on {entry.timestamp}.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 rounded-lg border border-danger bg-danger-tint text-danger font-sans text-sm font-medium py-2.5 px-4 hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Reverting…' : 'Revert step'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              <div>
                <label className="font-sans text-xs text-muted block mb-1">Staff member</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Full name"
                  value={staff}
                  onChange={e => setStaff(e.target.value)}
                  className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
                />
              </div>
              <div>
                <label className="font-sans text-xs text-muted block mb-1">Date &amp; time</label>
                <input
                  type="text"
                  value={timestamp}
                  onChange={e => setTimestamp(e.target.value)}
                  className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                variant="primary"
                onClick={() => handleSave(true)}
                disabled={saving || !staff.trim()}
                className="flex-1"
              >
                {saving ? 'Saving…' : 'Mark complete'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Auth & documents components ────────────────────────────────────────────

function AuthStatusRow({ label, uploaded, onUpload }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    await onUpload(file)
    setUploading(false)
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
      <div className="flex items-center gap-3">
        {uploaded ? (
          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-warning-light flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <span className="font-sans text-sm text-ink">{label}</span>
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleChange} />
      {uploading ? (
        <span className="font-sans text-xs text-muted">Uploading…</span>
      ) : uploaded ? (
        <span className="font-sans text-xs text-primary font-medium">Uploaded</span>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="font-sans text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer border-0 bg-transparent outline-none"
        >
          Upload
        </button>
      )}
    </div>
  )
}

function AuthorizationCard({ dop, onUpload, authComplete, onAuthComplete }) {
  const [authFormUploaded, setAuthFormUploaded] = useState(false)
  const [permitUploaded, setPermitUploaded] = useState(false)
  const [meSignOff, setMeSignOff] = useState(false)

  const earliestCremation = (() => {
    const dt = dop ? new Date(dop) : null
    if (!dt || isNaN(dt.getTime())) return 'to be determined'
    dt.setHours(dt.getHours() + 48)
    return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  })()

  if (authComplete) {
    return (
      <div
        className="rounded-xl border border-line bg-surface px-5 py-4 flex items-center gap-3"
        style={{ borderLeft: '3px solid var(--color-primary)' }}
      >
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="font-sans text-sm font-semibold text-primary">Authorization complete</span>
      </div>
    )
  }

  async function handleAuthFormUpload(file) { await onUpload(file); setAuthFormUploaded(true) }
  async function handlePermitUpload(file) { await onUpload(file); setPermitUploaded(true) }

  return (
    <div
      className="rounded-xl border border-line bg-surface p-5"
      style={{ borderLeft: '3px solid var(--color-warning)' }}
    >
      <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Requires action</p>
      <h3 className="font-display text-xl text-ink mb-4">Authorization &amp; Permitting</h3>
      <div className="mb-1">
        <AuthStatusRow label="Signed cremation authorization form" uploaded={authFormUploaded} onUpload={handleAuthFormUpload} />
        <AuthStatusRow label="Cremation permit" uploaded={permitUploaded} onUpload={handlePermitUpload} />
      </div>
      <label className="flex items-center gap-3 py-2.5 border-b border-line cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={meSignOff}
          onChange={e => setMeSignOff(e.target.checked)}
          className="w-4 h-4 rounded border-line cursor-pointer"
          style={{ accentColor: 'var(--color-warning)' }}
        />
        <span className="font-sans text-sm text-ink">Medical examiner sign-off required</span>
      </label>
      <div className="bg-warning-light rounded-lg px-4 py-3 mb-5">
        <p className="font-sans text-xs text-warning font-semibold uppercase tracking-wide mb-1">Mandatory wait period</p>
        <p className="font-sans text-sm text-ink">
          Minimum 48 hours required. Earliest cremation: <strong>{earliestCremation}</strong>.
        </p>
      </div>
      <Button
        variant="primary"
        onClick={onAuthComplete}
        disabled={!(authFormUploaded && permitUploaded)}
        className="w-full justify-center"
      >
        Mark Authorization Complete
      </Button>
    </div>
  )
}

function DocRow({ doc }) {
  const name = typeof doc === 'string' ? doc : doc.name
  const path = typeof doc === 'string' ? null : doc.path
  const ext = name?.split('.').pop().toUpperCase() ?? 'FILE'

  async function handleDownload() {
    if (!path) return
    const { data, error } = await supabase.storage.from('case-documents').createSignedUrl(path, 60)
    if (error || !data?.signedUrl) return
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-info-tint flex items-center justify-center">
          <span className="font-sans text-[9px] font-bold text-info">{ext}</span>
        </div>
        <span className="font-sans text-sm text-ink">{name}</span>
      </div>
      {path && (
        <button
          onClick={handleDownload}
          className="font-sans text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer border-0 bg-transparent outline-none"
        >
          Download
        </button>
      )}
    </div>
  )
}

function ScheduleTransportCard({ show }) {
  const [selectedCrematory, setSelectedCrematory] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [container, setContainer] = useState('')
  const [idDisc, setIdDisc] = useState('')
  const [orderSent, setOrderSent] = useState(false)
  const [sentTime, setSentTime] = useState(null)

  if (!show) return null

  function handleSend() {
    const t = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    setSentTime(t)
    setOrderSent(true)
  }

  const selectedName = crematoriums.find(c => c.id === selectedCrematory)?.name ?? ''
  const canSend = selectedCrematory && pickupDate && pickupTime

  function InfoRow({ label, value }) {
    return (
      <div className="flex justify-between py-2.5 border-b border-line last:border-0">
        <span className="font-sans text-xs text-muted">{label}</span>
        <span className="font-sans text-xs text-ink font-medium text-right max-w-[60%]">{value}</span>
      </div>
    )
  }

  if (orderSent) {
    return (
      <div className="bg-surface rounded-xl border border-line p-6">
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Transport</p>
        <h2 className="font-display text-xl text-ink mb-4">Schedule Transport</h2>
        <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-4">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-sans text-sm font-semibold text-primary">Order sent — awaiting crematory confirmation</p>
            <p className="font-sans text-xs text-muted mt-0.5">{sentTime}</p>
          </div>
        </div>
        <InfoRow label="Crematory" value={selectedName} />
        <InfoRow label="Pickup window" value={`${pickupDate} · ${pickupTime}`} />
        {container && <InfoRow label="Container" value={container} />}
        {idDisc && <InfoRow label="ID disc" value={idDisc} />}
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-line p-6">
      <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Transport</p>
      <h2 className="font-display text-xl text-ink mb-5">Schedule Transport</h2>
      <div className="space-y-4">
        <div>
          <label className="font-sans text-xs text-muted block mb-1.5">Crematory</label>
          <select
            value={selectedCrematory}
            onChange={e => setSelectedCrematory(e.target.value)}
            className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white cursor-pointer"
          >
            <option value="">Select crematory…</option>
            {crematoriums.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.distance}</option>
            ))}
          </select>
          <p className="font-sans text-xs text-muted mt-1.5">Order will include all authorization documents attached to this case.</p>
        </div>
        <div>
          <label className="font-sans text-xs text-muted block mb-1.5">Preferred pickup window</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={pickupDate}
              onChange={e => setPickupDate(e.target.value)}
              className="flex-1 border border-line rounded-lg px-3 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
            />
            <select
              value={pickupTime}
              onChange={e => setPickupTime(e.target.value)}
              className="border border-line rounded-lg px-3 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white cursor-pointer"
            >
              <option value="">Time…</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>
        <div>
          <label className="font-sans text-xs text-muted block mb-1.5">Combustible container</label>
          <input
            type="text"
            placeholder="e.g. Cardboard alternative container"
            value={container}
            onChange={e => setContainer(e.target.value)}
            className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
          />
        </div>
        <div>
          <label className="font-sans text-xs text-muted block mb-1.5">ID disc number</label>
          <input
            type="text"
            placeholder="e.g. 2024-0047"
            value={idDisc}
            onChange={e => setIdDisc(e.target.value)}
            className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
          />
        </div>
      </div>
      <Button variant="primary" onClick={handleSend} disabled={!canSend} className="w-full justify-center mt-5">
        Send Order to Crematory
      </Button>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────

export function CaseDetailPage({ caseData, onBack, onStatusChange }) {
  const [notes, setNotes] = useState(caseData.notes ?? [])
  const [newNote, setNewNote] = useState('')
  const [status, setStatus] = useState(caseData.status)
  const [documents, setDocuments] = useState(caseData.documents ?? [])
  const [uploading, setUploading] = useState(false)
  const [authorizationComplete, setAuthorizationComplete] = useState(false)
  const [custody, setCustody] = useState(EMPTY_CUSTODY)
  const [authPending, setAuthPending] = useState(false)
  const [activeTab, setActiveTab] = useState('activity')
  const [modalIdx, setModalIdx] = useState(null)
  const uploadInputRef = useRef(null)

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
    const ext = file.name.split('.').pop()
    const path = `cases/${caseData.id}/${Date.now()}.${ext}`
    const { error: storageError } = await supabase.storage.from('case-documents').upload(path, file, { upsert: true })
    if (storageError) { setUploading(false); return }
    try {
      const saved = await addCaseDocument(caseData.id, { path, name: file.name })
      setDocuments(prev => [...prev, saved])
    } catch {
      setDocuments(prev => [...prev, { path, name: file.name }])
    } finally {
      setUploading(false)
    }
  }

  async function addNote() {
    if (!newNote.trim()) return
    const text = newNote.trim()
    const time = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    setNotes(prev => [...prev, { author: 'You', text, time }])
    setNewNote('')
    try {
      const saved = await addCaseNote(caseData.id, { author: 'You', text, time })
      setNotes(prev => [...prev.slice(0, -1), saved])
    } catch (err) {
      console.error('Failed to save note:', err.message)
    }
  }

  const activityFeed = useMemo(() => {
    const events = []
    custody.forEach((entry, i) => {
      if (entry.completed) events.push({ type: 'custody', label: CUSTODY_STAGES[i], staff: entry.staff, time: entry.timestamp })
    })
    notes.forEach(n => events.push({ type: 'note', ...n }))
    documents.forEach(d => events.push({ type: 'document', name: typeof d === 'string' ? d : d.name }))
    return events
  }, [custody, notes, documents])

  const initials = (caseData.deceased || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('')
  const docsActionNeeded = authPending && !authorizationComplete
  const authBlocksTransport = nextCustodyIdx === 2 && authPending && !authorizationComplete

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Left sliver ── */}
      <div className="w-[320px] flex-shrink-0 bg-white border-r border-line flex flex-col overflow-hidden">

        {/* Back + identity */}
        <div className="px-5 pt-5 pb-5 border-b border-line flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-sans text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent outline-none mb-5"
          >
            <ArrowLeft size={12} />
            Cases
          </button>
          <div className=" flex flex-col items-center">
            
            <h2 className="font-display text-[32px] text-ink leading-snug mb-1 flex items-center">{caseData.deceased}</h2>
            <div className="flex items-center gap-2 mb-1">
              <StatusPill status={status} />
            </div>
            <p className="font-mono text-[10px] text-muted mb-2">{caseData.id}</p>

            
            <div className="flex justify-around">
              {[
                { icon: CalendarPlus, label: 'Schedule', onClick: () => setActiveTab('activity') },
                { icon: StickyNote,   label: 'Note',     onClick: () => setActiveTab('activity') },
                { icon: Mail,         label: 'Email',    onClick: () => {} },
                { icon: Phone,        label: 'Call',     onClick: () => {} },
                { icon: Printer,      label: 'Print',    onClick: () => window.print() },
              ].map(({ icon: Icon, label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex flex-col items-center gap-1.5 mx-1.5  cursor-pointer border-0 bg-transparent outline-none group"
                >
                  <div className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center group-hover:bg-line transition-colors">
                    <Icon size={14} strokeWidth={1.6} className="text-secondary group-hover:text-ink transition-colors" />
                  </div>
                  <span className="font-sans text-[9px] text-muted group-hover:text-ink transition-colors leading-none">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable info sections */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <InfoSection title="Deceased Details">
            <InfoField label="Date of Birth" value={caseData.dob} />
            <InfoField label="Date of Passing" value={caseData.dop} />
            <InfoField label="Location" value={caseData.location} />
          </InfoSection>

          <InfoSection title="Family Contact">
            <InfoField label="Name" value={caseData.contactName} />
            <InfoField label="Relationship" value={caseData.relationship} />
            <InfoField label="Phone" value={caseData.contactPhone} />
            <InfoField label="Email" value={caseData.contactEmail} />
          </InfoSection>

          <InfoSection title="Arrangements">
            <InfoField label="Package" value={caseData.package} />
            <InfoField label="Add-ons" value={caseData.addons?.join(', ') || 'None'} />
            <InfoField label="Crematorium" value={caseData.crematorium} />
            <div className="flex items-baseline justify-between py-3 mt-1">
              <span className="font-sans text-[10px] text-muted uppercase tracking-wide">Total</span>
              <span className="font-display text-xl text-ink">${caseData.amount?.toLocaleString()}</span>
            </div>
          </InfoSection>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-canvas overflow-hidden">

        {/* Tab bar */}
        <div className="bg-surface/90 backdrop-blur border-b border-line shrink-0 px-8">
          <div className="flex gap-0">
            {[
              { id: 'activity', label: 'Activity' },
              { id: 'documents', label: 'Documents', badge: docsActionNeeded },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3.5 font-sans text-sm font-medium border-0 bg-transparent outline-none cursor-pointer transition-colors ${activeTab === tab.id
                    ? 'text-ink border-b-2 border-ink -mb-px'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                {tab.label}
                {tab.badge && <TriangleAlert size={13} className="text-warning flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Activity tab ── */}
          {activeTab === 'activity' && (
            <div className="max-w-2xl mx-auto px-8 py-6">

              {/* Next custody step card */}
              {nextCustodyIdx < CUSTODY_STAGES.length && (
                <div className="bg-surface border border-line rounded-xl p-4 mb-5">
                  <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-2">Next custody step</p>
                  {authBlocksTransport ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning-light flex items-center justify-center flex-shrink-0">
                        <Lock size={13} className="text-warning" />
                      </div>
                      <div>
                        <p className="font-sans text-sm font-semibold text-warning">{CUSTODY_STAGES[nextCustodyIdx]}</p>
                        <p className="font-sans text-xs text-muted mt-0.5">Complete authorization in the Documents tab first</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setModalIdx(nextCustodyIdx)}
                      className="w-full flex items-center justify-between text-left cursor-pointer border-0 bg-transparent outline-none group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-sans text-sm font-semibold text-ink">{CUSTODY_STAGES[nextCustodyIdx]}</p>
                          <p className="font-sans text-xs text-muted mt-0.5">Click to log staff and time</p>
                        </div>
                      </div>
                      <span className="font-sans text-xs font-medium text-primary group-hover:underline">Log →</span>
                    </button>
                  )}
                </div>
              )}

              {/* Note composer */}
              <div className="bg-surface border border-line rounded-xl p-4 mb-7">
                <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-2">Add note</p>
                <textarea
                  placeholder="Write a note…"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
                  className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white resize-none mb-3"
                />
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] text-muted">⌘ + Enter to submit</span>
                  <Button variant="primary" onClick={addNote} disabled={!newNote.trim()}>
                    Add note
                  </Button>
                </div>
              </div>

              {/* Activity feed */}
              {activityFeed.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-sans text-sm text-muted">No activity recorded yet.</p>
                  <p className="font-sans text-xs text-muted mt-1">Add a note or log the first custody step above.</p>
                </div>
              ) : (
                <div>
                  {[...activityFeed].reverse().map((event, i, arr) => (
                    <ActivityEvent key={i} event={event} isLast={i === arr.length - 1} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Documents tab ── */}
          {activeTab === 'documents' && (
            <div className="max-w-2xl mx-auto px-8 py-6 space-y-5">
              {authPending && (
                <AuthorizationCard
                  dop={caseData.dop}
                  onUpload={handleUpload}
                  authComplete={authorizationComplete}
                  onAuthComplete={() => setAuthorizationComplete(true)}
                />
              )}

              <div className="bg-surface rounded-xl border border-line p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl text-ink">Documents</h2>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]); e.target.value = '' }}
                  />
                  <Button variant="secondary" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
                    {uploading ? (
                      <svg className="w-3.5 h-3.5 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <Upload size={13} className="mr-1.5" />
                    )}
                    {uploading ? 'Uploading…' : 'Upload'}
                  </Button>
                </div>

                {documents.length === 0 ? (
                  <div className="border-2 border-dashed border-line rounded-xl py-10 text-center">
                    <p className="font-sans text-sm text-muted">No documents uploaded yet.</p>
                    <p className="font-sans text-xs text-muted mt-1">Click Upload to add files.</p>
                  </div>
                ) : (
                  <div>{documents.map((doc, i) => <DocRow key={i} doc={doc} />)}</div>
                )}
              </div>

              <ScheduleTransportCard show={authorizationComplete} />
            </div>
          )}

        </div>
      </div>

      {/* Custody modal */}
      {modalIdx !== null && (
        <CustodyModal
          stage={CUSTODY_STAGES[modalIdx]}
          entry={custody[modalIdx]}
          onSave={(completed, staff, timestamp) => handleCustodyUpdate(modalIdx, { completed, staff, timestamp })}
          onClose={() => setModalIdx(null)}
        />
      )}
    </div>
  )
}
