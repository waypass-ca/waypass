import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { markInboxItemRead } from '../../lib/api.js'
import { TYPE_CONFIG, getAccent } from './notificationConfig.js'

const TOAST_TTL_MS = 6000
const EXIT_ANIM_MS = 220

function initials(name) {
  if (!name) return '··'
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function relativeTime(iso) {
  if (!iso) return 'just now'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 45_000) return 'just now'
  const m = Math.round(ms / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

function Toast({ toast, exiting, onDismiss, onView }) {
  const typeCfg = TYPE_CONFIG[toast.type]
  const accent = getAccent(toast.severity, toast.type)
  const avatarTint = typeCfg ? `${typeCfg.tint} ${typeCfg.tintText}` : 'bg-canvas text-secondary'

  // Mount with offscreen state, then flip to onscreen on the next frame so
  // the transition has a real start value to animate from.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const offscreen = !mounted || exiting

  function handleOpen() {
    markInboxItemRead(toast.id).catch(console.error)
    onView(toast.id)
    onDismiss(toast.id)
  }

  return (
    <div
      onClick={handleOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen() } }}
      role="button"
      tabIndex={0}
      aria-label={`Open notification from ${toast.from}: ${toast.subject}`}
      style={{
        transform: offscreen ? 'translateX(120%)' : 'translateX(0)',
        opacity: offscreen ? 0 : 1,
        transition: exiting
          ? 'transform 200ms cubic-bezier(0.4,0,1,1), opacity 200ms ease-in'
          : 'transform 320ms cubic-bezier(0.16,1,0.3,1), opacity 320ms ease-out',
      }}
      className="group relative w-[360px] flex overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl border border-line/70 cursor-pointer
        shadow-[0_20px_50px_-12px_rgba(28,28,30,0.25),0_4px_12px_-4px_rgba(28,28,30,0.08)]
        hover:shadow-[0_28px_60px_-12px_rgba(28,28,30,0.3),0_6px_16px_-4px_rgba(28,28,30,0.1)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
    >
      {/* Accent rail */}
      <div className={`w-1 shrink-0 ${accent}`} />

      <div className="flex-1 flex gap-3 p-3.5 min-w-0">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${avatarTint}`}>
          <span className="font-sans text-[10.5px] font-semibold tracking-wide">
            {initials(toast.from)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-5">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`font-sans text-[10px] font-semibold uppercase tracking-[0.08em] ${typeCfg?.color ?? 'text-muted'}`}>
              {typeCfg?.label ?? 'Update'}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-muted/60" aria-hidden />
            <span className="font-sans text-[10.5px] text-muted">{relativeTime(toast.createdAt)}</span>
          </div>

          <p className="font-sans text-[13.5px] font-semibold text-ink leading-snug truncate">
            {toast.subject}
          </p>

          {toast.preview && (
            <p className="font-sans text-[12px] text-secondary leading-snug truncate mt-0.5">
              {toast.preview}
            </p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={e => { e.stopPropagation(); onDismiss(toast.id) }}
          aria-label="Dismiss notification"
          className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer border-0 bg-transparent"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

export function NotificationToast({ onViewInbox }) {
  const { user } = useAuth()
  const [toasts, setToasts] = useState([])
  const [exiting, setExiting] = useState(() => new Set())

  const dismiss = useCallback((id) => {
    setExiting(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev); next.add(id); return next
    })
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      setExiting(prev => {
        if (!prev.has(id)) return prev
        const next = new Set(prev); next.delete(id); return next
      })
    }, EXIT_ANIM_MS)
  }, [])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`inbox-toast-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inbox_items', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new
          if (row.archived_at) return
          const toast = {
            id: row.id,
            type: row.type,
            severity: row.severity,
            from: row.sender,
            subject: row.subject,
            preview: row.preview,
            createdAt: row.created_at,
          }
          setToasts(prev => [...prev, toast])
          setTimeout(() => dismiss(toast.id), TOAST_TTL_MS)
        }
      )
      // If another tab marks the item read, archives it, or deletes it,
      // dismiss any matching live toast so the user doesn't see stale state.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inbox_items', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new.read || payload.new.archived_at) dismiss(payload.new.id)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'inbox_items', filter: `user_id=eq.${user.id}` },
        (payload) => { dismiss(payload.old.id) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, dismiss])

  if (toasts.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="New notifications"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 items-end"
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          exiting={exiting.has(toast.id)}
          onDismiss={dismiss}
          onView={onViewInbox}
        />
      ))}
    </div>
  )
}
