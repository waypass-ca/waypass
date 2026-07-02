import { useState } from 'react'
import { X } from 'lucide-react'
import { EditableEmailPreview } from '../../dashboard/EmailEditorPage'

const STATUS_LABELS = {
  transit:   'In Transit',
  cremation: 'At Cremation',
  complete:  'Complete',
}

export function StatusEmailModal({ status, recipientEmail, template, sections, config, caseData, logoUrl, onSend, onSkip }) {
  const [sending, setSending] = useState(false)

  async function handleSend() {
    setSending(true)
    try {
      await onSend()
    } finally {
      setSending(false)
    }
  }

  const statusLabel = STATUS_LABELS[status] ?? status
  const canSend = !!recipientEmail

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onSkip} />
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col bg-canvas rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0 bg-surface">
          <div>
            <p className="font-sans font-semibold text-[15px] text-ink">Send status update to family?</p>
            <p className="font-sans text-xs text-muted mt-0.5">
              Status updated to <span className="font-medium text-ink">{statusLabel}</span>
              {recipientEmail
                ? <> · sending to <span className="font-medium text-ink">{recipientEmail}</span></>
                : <> · <span className="text-warning">no family email on file</span></>
              }
            </p>
          </div>
          <button
            onClick={onSkip}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-line/50 transition-colors cursor-pointer border-0 outline-none bg-transparent"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-canvas">
          <div className="p-6">
            <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5">
              <EditableEmailPreview
                template={template}
                sections={sections}
                config={config}
                caseData={caseData}
                logoUrl={logoUrl}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-surface flex-shrink-0">
          <button
            onClick={onSkip}
            className="px-4 py-2 rounded-lg border border-line bg-white font-sans text-[13px] text-secondary hover:text-ink hover:border-ink/30 transition-colors cursor-pointer outline-none"
          >
            Skip
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !canSend}
            className="px-5 py-2 rounded-lg bg-primary text-white font-sans text-[13px] font-medium cursor-pointer border-0 outline-none hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : 'Send Update'}
          </button>
        </div>

      </div>
    </div>
  )
}
