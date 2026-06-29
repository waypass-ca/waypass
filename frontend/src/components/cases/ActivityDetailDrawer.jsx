import { useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { deleteCaseDocument, updateCaseDocument } from '../../lib/api.js'
import { toastError, toastSuccess } from '../../lib/toast.js'

function fmtSlot(s) {
  if (!s) return null
  const dateStr = s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }) : ''
  return `${dateStr} · ${s.start} – ${s.end}`
}

function fmtTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return String(ts)
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

function Field({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div>
      <p className="font-sans text-[10.5px] uppercase tracking-wide text-muted mb-1">{label}</p>
      <p className="font-sans text-[13px] text-ink break-words">{value}</p>
    </div>
  )
}

function SlotList({ label, slots }) {
  if (!slots || slots.length === 0) return null
  return (
    <div>
      <p className="font-sans text-[10.5px] uppercase tracking-wide text-muted mb-1">{label}</p>
      <ul className="space-y-1">
        {slots.map((s, i) => (
          <li key={i} className="font-sans text-[13px] text-ink">{fmtSlot(s)}</li>
        ))}
      </ul>
    </div>
  )
}

function DocumentBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="File" value={p.fileName} />
      <Field label="Type" value={p.documentType} />
      <Field label="Status" value={p.status} />
      <Field label="Folder" value={p.folderName} />
    </>
  )
}

function DocumentFooter({ event, caseId, onChanged, onClose }) {
  const p = event.payload ?? {}
  const openPreview = async () => {
    if (!p.storagePath) return
    const { data, error } = await supabase.storage.from('case-documents')
      .createSignedUrl(p.storagePath, 3600)
    if (error) { toastError(`Preview failed: ${error.message}`); return }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }
  const rename = async () => {
    const newName = prompt('Rename file', p.fileName)
    if (!newName || newName.trim() === p.fileName) return
    try {
      await updateCaseDocument(caseId, p.id, { fileName: newName.trim() })
      toastSuccess('File renamed')
      onChanged?.()
    } catch (err) {
      toastError(`Rename failed: ${err.message}`)
    }
  }
  const remove = async () => {
    if (!confirm(`Delete ${p.fileName}?`)) return
    try {
      await deleteCaseDocument(caseId, p.id)
      toastSuccess('Document deleted')
      onChanged?.()
      onClose?.()
    } catch (err) {
      toastError(`Delete failed: ${err.message}`)
    }
  }
  return (
    <div className="shrink-0 border-t border-line p-4 flex gap-2">
      <button onClick={openPreview} className="flex-1 h-9 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer border-0">Open</button>
      <button onClick={rename} className="flex-1 h-9 rounded-lg border border-line bg-surface hover:bg-canvas text-ink font-sans text-[12.5px] font-medium cursor-pointer">Edit</button>
      <button onClick={remove} className="h-9 px-3 rounded-lg border border-danger/30 bg-surface hover:bg-red-50 text-danger font-sans text-[12.5px] font-medium cursor-pointer">Delete</button>
    </div>
  )
}

function NoteBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="Author" value={p.author} />
      <div>
        <p className="font-sans text-[10.5px] uppercase tracking-wide text-muted mb-1">Note</p>
        <div className="bg-canvas border border-line rounded-xl px-3 py-3">
          <p className="font-sans text-[13px] text-ink leading-relaxed whitespace-pre-wrap">{p.text}</p>
        </div>
      </div>
    </>
  )
}

function CustodyBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="Stage" value={p.stageLabel} />
      <Field label="Staff" value={p.staff} />
      <Field label="Recorded" value={fmtTs(event.ts)} />
    </>
  )
}

function BookingCreatedBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="Deceased" value={p.deceased_name} />
      <Field label="Crematorium" value={p.crematorium_name} />
      <Field label="Shipping partner" value={p.shipping_partner_name} />
      <SlotList label="Proposed slots" slots={p.proposed_slots} />
    </>
  )
}

function InvitedBody({ event, party }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label={party === 'crematorium' ? 'Crematorium' : 'Shipping partner'}
        value={party === 'crematorium' ? p.crematorium_name : p.shipping_partner_name} />
      <Field label="Email" value={party === 'crematorium' ? p.crematorium_email : p.shipping_partner_email} />
      <Field label="Email delivered" value={p.email_sent ? 'Yes' : 'No'} />
      {p.reason && <Field label="Reason" value={p.reason} />}
      <SlotList label="Slots offered" slots={party === 'crematorium' ? p.proposed_slots : p.crematorium_slots} />
    </>
  )
}

function CrematoriumRespondedBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="Crematorium" value={p.crematorium_name} />
      <SlotList label="Available slots" slots={p.crematorium_slots} />
      <SlotList label="Original request" slots={p.proposed_slots} />
    </>
  )
}

function ShippingRespondedBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="Shipping partner" value={p.shipping_partner_name} />
      <SlotList label="Available slots" slots={p.shipping_slots} />
      <SlotList label="Crematorium window" slots={p.crematorium_slots} />
    </>
  )
}

function ConfirmedBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="Crematorium" value={p.crematorium_name} />
      <Field label="Shipping partner" value={p.shipping_partner_name} />
      <Field label="Confirmed slot" value={fmtSlot(p.confirmed_slot)} />
      <Field label="Scheduled for" value={p.scheduled_for ? fmtTs(p.scheduled_for) : null} />
    </>
  )
}

function RescheduledBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="Previous status" value={p.previous_status} />
      <SlotList label="Previously proposed" slots={p.from?.proposed_slots} />
      <Field label="Previously confirmed" value={fmtSlot(p.from?.confirmed_slot)} />
      <SlotList label="New proposed slots" slots={p.to?.proposed_slots} />
    </>
  )
}

function CancelledBody({ event }) {
  const p = event.payload ?? {}
  return (
    <>
      <Field label="Crematorium" value={p.crematorium_name} />
      <Field label="Shipping partner" value={p.shipping_partner_name} />
      <Field label="Reason" value={p.cancel_reason} />
      <Field label="Previous status" value={p.previous_status} />
    </>
  )
}

const BODY_FOR_TYPE = {
  document:               (e) => <DocumentBody event={e} />,
  note:                   (e) => <NoteBody event={e} />,
  custody:                (e) => <CustodyBody event={e} />,
  booking_created:        (e) => <BookingCreatedBody event={e} />,
  crematorium_invited:    (e) => <InvitedBody event={e} party="crematorium" />,
  shipping_invited:       (e) => <InvitedBody event={e} party="shipping" />,
  crematorium_responded:  (e) => <CrematoriumRespondedBody event={e} />,
  shipping_responded:     (e) => <ShippingRespondedBody event={e} />,
  booking_confirmed:      (e) => <ConfirmedBody event={e} />,
  booking_rescheduled:    (e) => <RescheduledBody event={e} />,
  booking_cancelled:      (e) => <CancelledBody event={e} />,
}

export function ActivityDetailDrawer({ event, caseId, onClose, onChanged }) {
  useEffect(() => {
    if (!event) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [event, onClose])

  const renderBody = event ? BODY_FOR_TYPE[event.type] : null

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${event ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        role="dialog"
        aria-hidden={!event}
        className={`fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-surface border-l border-line shadow-xl transition-transform duration-200 ${event ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {event && (
          <div className="h-full flex flex-col">
            <div className="flex items-start justify-between p-5 border-b border-line">
              <div>
                <p className="font-sans text-[10.5px] uppercase tracking-wide text-muted mb-1">{event.type.replace(/_/g, ' ')}</p>
                <h3 className="font-sans text-[16px] font-semibold text-ink leading-snug">{event.summary}</h3>
                <p className="font-sans text-[12px] text-muted mt-1">
                  {event.actor ? `${event.actor} · ` : ''}{fmtTs(event.ts)}
                </p>
              </div>
              <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-canvas border-0 bg-transparent cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {renderBody
                ? renderBody(event, { caseId, onChanged, onClose })
                : <pre className="font-mono text-[11px] text-muted whitespace-pre-wrap">{JSON.stringify(event.payload, null, 2)}</pre>}
            </div>
            {event.type === 'document' && (
              <DocumentFooter event={event} caseId={caseId} onChanged={onChanged} onClose={onClose} />
            )}
          </div>
        )}
      </aside>
    </>
  )
}
