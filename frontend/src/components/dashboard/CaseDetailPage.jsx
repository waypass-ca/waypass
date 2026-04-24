import { useState, useRef, useEffect, useMemo } from 'react'
import {
  ChevronDown, ArrowLeft, FileText, MessageSquare,
  CheckCircle2, Upload, Printer, Lock, TriangleAlert,
  CalendarPlus, StickyNote, Mail, Phone,
  Plus,
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
    title = event.name
    detail = event.uploadedAt ? `uploaded · ${event.uploadedAt}` : 'Document uploaded'
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

// ── Note modal ─────────────────────────────────────────────────────────────

function NoteModal({ onAdd, onClose }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!text.trim()) return
    setSaving(true)
    await onAdd(text.trim())
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Activity</p>
        <h3 className="font-display text-xl text-ink mb-4">Add Note</h3>
        <textarea
          autoFocus
          placeholder="Write a note…"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd() }}
          className="w-full border border-line rounded-xl px-4 py-3 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white resize-none mb-4"
        />
        <div className="flex items-center justify-between">
          <span className="font-sans text-[11px] text-muted">⌘ Return to submit</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={!text.trim() || saving}>
              {saving ? 'Adding…' : 'Add note'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Log custody modal ───────────────────────────────────────────────────────

function LogCustodyModal({ custody, onUpdate, onClose, authBlocksTransport }) {
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [staff, setStaff] = useState('')
  const [timestamp, setTimestamp] = useState(now())
  const [saving, setSaving] = useState(false)

  const lastCompletedIdx = custody.reduce((acc, e, i) => e.completed ? i : acc, -1)
  const nextPendingIdx = lastCompletedIdx + 1

  async function handleLog() {
    if (selectedIdx === null || !staff.trim()) return
    setSaving(true)
    await onUpdate(selectedIdx, { completed: true, staff, timestamp })
    setSaving(false)
    onClose()
  }

  async function handleRevert(idx) {
    setSaving(true)
    await onUpdate(idx, { completed: false, staff: null, timestamp: null })
    setSaving(false)
    setSelectedIdx(null)
  }

  function canSelect(i) {
    const entry = custody[i] ?? {}
    if (entry.completed) return i === lastCompletedIdx // only last completed (to revert)
    if (i === nextPendingIdx) return !(authBlocksTransport && i === 2)
    return false
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-md mx-4 p-6 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Chain of Custody</p>
        <h3 className="font-display text-xl text-ink mb-5">Log Step</h3>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-0.5 mb-5">
          {CUSTODY_STAGES.map((stage, i) => {
            const entry = custody[i] ?? {}
            const isCompleted = entry.completed
            const isSelected = selectedIdx === i
            const selectable = canSelect(i)
            const isNext = i === nextPendingIdx

            return (
              <div key={i}>
                <button
                  onClick={() => selectable && setSelectedIdx(isSelected ? null : i)}
                  disabled={!selectable}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border-0 outline-none ${isSelected
                      ? 'bg-primary/10'
                      : selectable
                        ? 'hover:bg-canvas cursor-pointer'
                        : 'cursor-default'
                    }`}
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isNext ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-line flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-sans text-sm leading-snug ${isCompleted ? 'text-ink' : isNext ? 'text-primary font-medium' : 'text-muted'
                      }`}>{stage}</p>
                    {isCompleted && (
                      <p className="font-sans text-[11px] text-muted mt-0.5">{entry.timestamp} · {entry.staff}</p>
                    )}
                    {isNext && authBlocksTransport && (
                      <p className="font-sans text-[11px] text-warning mt-0.5">Complete authorization first</p>
                    )}
                  </div>
                </button>

                {isSelected && (
                  <div className="mx-3 mt-1 mb-2 p-3 bg-canvas rounded-xl border border-line">
                    {isCompleted ? (
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs text-secondary">Revert this completed step?</span>
                        <button
                          onClick={() => handleRevert(i)}
                          disabled={saving}
                          className="font-sans text-xs font-medium text-danger hover:opacity-70 cursor-pointer border-0 bg-transparent outline-none disabled:opacity-40"
                        >
                          {saving ? 'Reverting…' : 'Revert'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Staff member name"
                          value={staff}
                          onChange={e => setStaff(e.target.value)}
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
                        />
                        <input
                          type="text"
                          value={timestamp}
                          onChange={e => setTimestamp(e.target.value)}
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
                        />
                        <Button
                          variant="primary"
                          onClick={handleLog}
                          disabled={!staff.trim() || saving}
                          className="w-full justify-center"
                        >
                          {saving ? 'Logging…' : 'Mark complete'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Button variant="secondary" onClick={onClose} className="w-full justify-center">Close</Button>
      </div>
    </div>
  )
}

// ── Auth & documents components ────────────────────────────────────────────

function AuthRow({ label, uploaded, onUpload }) {
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
    <div className="flex items-center justify-between py-3 border-b border-line">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${uploaded ? 'bg-primary/10' : 'bg-warning-light'}`}>
          {uploaded
            ? <CheckCircle2 size={14} className="text-primary" />
            : <TriangleAlert size={13} className="text-warning" />}
        </div>
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-white text-xs font-sans font-medium text-secondary hover:text-ink hover:bg-canvas transition-colors cursor-pointer outline-none"
        >
          <Upload size={11} strokeWidth={1.8} />
          Upload
        </button>
      )}
    </div>
  )
}

function AuthorizationModal({ dop, onUpload, authComplete, onAuthComplete, authFormUploaded, onAuthFormUpload, permitUploaded, onPermitUpload, onClose }) {
  const [meSignOff, setMeSignOff] = useState(false)

  const earliestCremation = (() => {
    const dt = dop ? new Date(dop) : null
    if (!dt || isNaN(dt.getTime())) return 'to be determined'
    dt.setHours(dt.getHours() + 48)
    return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  })()

  async function handleAuthFormUpload(file) { await onUpload(file); onAuthFormUpload() }
  async function handlePermitUpload(file) { await onUpload(file); onPermitUpload() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Documents</p>
        <h3 className="font-display text-xl text-ink mb-5">
          {authComplete ? 'Authorization Complete' : 'Authorization & Permitting'}
        </h3>

        {authComplete ? (
          <div className="flex items-center gap-3 py-4 border-t border-line">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={15} className="text-primary" />
            </div>
            <div>
              <p className="font-sans text-sm font-medium text-ink">All requirements met</p>
              <p className="font-sans text-xs text-muted mt-0.5">Cremation transport is now unlocked</p>
            </div>
          </div>
        ) : (
          <>
            <AuthRow label="Signed cremation authorization form" uploaded={authFormUploaded} onUpload={handleAuthFormUpload} />
            <AuthRow label="Cremation permit" uploaded={permitUploaded} onUpload={handlePermitUpload} />

            <div className="flex items-center justify-between py-3 border-b border-line">
              <label htmlFor="me-signoff" className="font-sans text-sm text-ink cursor-pointer">Medical examiner sign-off</label>
              <input
                id="me-signoff"
                type="checkbox"
                checked={meSignOff}
                onChange={e => setMeSignOff(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="flex items-center gap-2 py-3 border-b border-line mb-5">
              <Lock size={12} className="text-muted flex-shrink-0" />
              <span className="font-sans text-xs text-muted">
                48-hour hold · Earliest cremation: <span className="text-ink font-medium">{earliestCremation}</span>
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
              <Button
                variant="primary"
                onClick={() => { onAuthComplete(); onClose() }}
                disabled={!(authFormUploaded && permitUploaded)}
                className="flex-1"
              >
                Mark complete
              </Button>
            </div>
          </>
        )}

        {authComplete && (
          <div className="mt-4">
            <Button variant="secondary" onClick={onClose} className="w-full justify-center">Close</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function DocRow({ doc }) {
  const name = typeof doc === 'string' ? doc : doc.name
  const path = typeof doc === 'string' ? null : doc.path
  const uploadedAt = typeof doc === 'string' ? null : doc.uploadedAt
  const ext = name?.split('.').pop().toUpperCase() ?? 'FILE'

  async function handleDownload() {
    if (!path) return
    const { data, error } = await supabase.storage.from('case-documents').createSignedUrl(path, 60)
    if (error || !data?.signedUrl) return
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-info-tint flex items-center justify-center flex-shrink-0">
          <span className="font-sans text-[9px] font-bold text-info">{ext}</span>
        </div>
        <div className="min-w-0">
          <p className="font-sans text-sm text-ink truncate">{name}</p>
          {uploadedAt && <p className="font-sans text-[11px] text-muted mt-0.5">{uploadedAt}</p>}
        </div>
      </div>
      {path && (
        <button
          onClick={handleDownload}
          className="font-sans text-xs font-medium text-secondary hover:text-ink transition-colors cursor-pointer border-0 bg-transparent outline-none flex-shrink-0 ml-4"
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

  // if (orderSent) {
  //   return (
  //     <div className="bg-surface rounded-xl border border-line p-6">
  //       <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Transport</p>
  //       <h2 className="font-display text-xl text-ink mb-4">Schedule Transport</h2>
  //       <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-4">
  //         <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
  //           <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
  //             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  //           </svg>
  //         </div>
  //         <div>
  //           <p className="font-sans text-sm font-semibold text-primary">Order sent — awaiting crematory confirmation</p>
  //           <p className="font-sans text-xs text-muted mt-0.5">{sentTime}</p>
  //         </div>
  //       </div>
  //       <InfoRow label="Crematory" value={selectedName} />
  //       <InfoRow label="Pickup window" value={`${pickupDate} · ${pickupTime}`} />
  //       {container && <InfoRow label="Container" value={container} />}
  //       {idDisc && <InfoRow label="ID disc" value={idDisc} />}
  //     </div>
  //   )
  // }

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
                { icon: StickyNote, label: 'Note', onClick: () => setActiveTab('activity') },
                { icon: Mail, label: 'Email', onClick: () => { } },
                { icon: Phone, label: 'Call', onClick: () => { } },
                { icon: Printer, label: 'Print', onClick: () => window.print() },
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
      <div className="flex-1 flex flex-col min-w-0 bg-surface/90 overflow-hidden">

        {/* Tab bar — tabs only */}
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

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Activity tab ── */}
          {activeTab === 'activity' && (
            <div className="max-w-2xl mx-auto px-8 py-6">
              <div className="flex justify-end gap-2 mb-6 -mx-4">
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="h-8 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer outline-none"
                >
                  <Plus size={12} strokeWidth={2} />
                  Note
                </button>
                <button
                  onClick={() => setShowLogModal(true)}
                  className="h-8 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer outline-none"
                >
                  <Plus size={12} strokeWidth={2} />
                  Log
                </button>
              </div>
              {activityFeed.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-sans text-sm text-muted">No activity recorded yet.</p>
                  <p className="font-sans text-xs text-muted mt-1">Use the Note or Log buttons to get started.</p>
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
            <div className="max-w-2xl mx-auto px-4 py-6">
              <div className="flex justify-end gap-2 mb-6 -mx-4">
                {docsActionNeeded && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="h-8 px-3 rounded-lg bg-warning-light border border-warning/40 text-warning font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer outline-none hover:bg-warning/20 transition-colors"
                  >
                    <TriangleAlert size={12} strokeWidth={2} />
                    Authorization
                  </button>
                )}
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]); e.target.value = '' }}
                />
                <button
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={uploading}
                  className="h-8 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer outline-none disabled:opacity-50"
                >
                  {uploading
                    ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    : <Upload size={12} strokeWidth={2} />}
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
              {documents.length > 0 ? (
                <div>
                  <p className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider py-2 mb-1">Files</p>
                  {documents.map((doc, i) => <DocRow key={i} doc={doc} />)}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="font-sans text-sm text-muted">No documents uploaded yet.</p>
                  <p className="font-sans text-xs text-muted mt-1">Use the Upload button above to add files.</p>
                </div>
              )}
              <ScheduleTransportCard show={authorizationComplete} />
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
    </div>
  )
}
