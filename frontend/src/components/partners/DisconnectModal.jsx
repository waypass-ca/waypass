import { useState } from 'react'
import { disconnectCrematorium, disconnectShippingPartner } from '../../lib/api.js'
import { Button } from '../ui/Button'

export function DisconnectModal({ crm, onConfirm, onClose, kind = 'crematorium' }) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(null)
  const disconnectFn = kind === 'shipping' ? disconnectShippingPartner : disconnectCrematorium

  async function handleRemove() {
    setRemoving(true); setError(null)
    try { await disconnectFn(crm.id); onConfirm(crm.id) }
    catch (err) { setError(err.message); setRemoving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-sm shadow-xl p-6">
        <div className="w-10 h-10 rounded-full bg-danger-tint flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-ink mb-1">Remove Partner</h2>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Remove <span className="text-ink font-medium">{crm.name}</span> from your connected partners? You can reconnect later.
        </p>
        {error && <p className="font-sans text-xs text-danger mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <button onClick={handleRemove} disabled={removing}
            className="flex-1 bg-danger text-white font-sans text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}
