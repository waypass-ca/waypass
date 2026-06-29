import { useEffect, useState } from 'react'
import { subscribeToasts, dismissToast } from '../../lib/toast.js'
import { X } from 'lucide-react'

const KIND_STYLES = {
  error:   'bg-red-50 border-red-200 text-red-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  info:    'bg-white border-line text-ink',
}

export function AppToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return subscribeToasts(evt => {
      if (evt.kind === 'add') {
        setToasts(prev => [...prev, evt.toast])
      } else if (evt.kind === 'remove') {
        setToasts(prev => prev.filter(t => t.id !== evt.id))
      }
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-3 max-w-sm px-4 py-3 rounded-lg border shadow-md ${KIND_STYLES[t.kind] ?? KIND_STYLES.info}`}
        >
          <span className="font-sans text-[13px] flex-1">{t.message}</span>
          <button
            onClick={() => dismissToast(t.id)}
            className="w-5 h-5 rounded flex items-center justify-center text-current/70 hover:text-current bg-transparent border-0 cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
