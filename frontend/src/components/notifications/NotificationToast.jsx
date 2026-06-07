import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'

const TYPE_DOT = {
  alert: 'bg-warning',
  message: 'bg-primary',
  schedule: 'bg-info',
}

function Toast({ toast, onDismiss, onView }) {
  const dot = TYPE_DOT[toast.type] ?? 'bg-muted'

  return (
    <div
      onClick={() => { onView(toast.id); onDismiss(toast.id) }}
      className="w-72 bg-white border border-line rounded-xl shadow-md flex items-center gap-3 px-4 py-3 cursor-pointer animate-in slide-in-from-top-3 fade-in duration-200 hover:bg-canvas transition-colors"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[11px] text-muted truncate">{toast.from}</p>
        <p className="font-sans text-[13px] font-medium text-ink leading-snug truncate">{toast.subject}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss(toast.id) }}
        className="w-5 h-5 rounded flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export function NotificationToast({ onViewInbox }) {
  const { user } = useAuth()
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`inbox-toast-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inbox_items',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new
          const toast = {
            id: row.id,
            type: row.type,
            from: row.sender,
            subject: row.subject,
          }
          setToasts(prev => [...prev, toast])
          setTimeout(() => dismiss(toast.id), 5000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, dismiss])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={dismiss}
          onView={onViewInbox}
        />
      ))}
    </div>
  )
}
