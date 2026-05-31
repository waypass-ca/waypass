import { useState } from 'react'
import { Lock, CheckCircle2 } from 'lucide-react'
import { AuthRow } from '../AuthRow'
import { Button } from '../../ui/Button'

export function AuthorizationModal({ dop, onUpload, authComplete, onAuthComplete, authFormUploaded, onAuthFormUpload, permitUploaded, onPermitUpload, onClose }) {
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
