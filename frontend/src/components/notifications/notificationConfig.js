import { AlertCircle, Info, TriangleAlert } from 'lucide-react'

export const SEVERITY_CONFIG = {
  danger:  { icon: AlertCircle,   text: 'text-danger',  bg: 'bg-danger-tint',    border: 'border-danger/25',  dot: 'bg-danger'  },
  warning: { icon: TriangleAlert, text: 'text-warning', bg: 'bg-warning-light',  border: 'border-warning/25', dot: 'bg-warning' },
  info:    { icon: Info,          text: 'text-info',    bg: 'bg-info-tint',      border: 'border-info/25',    dot: 'bg-info'    },
}

export const TYPE_CONFIG = {
  alert:    { label: 'Alert',    color: 'text-warning', dot: 'bg-warning', tint: 'bg-warning-light',    tintText: 'text-warning' },
  message:  { label: 'Message',  color: 'text-primary', dot: 'bg-primary', tint: 'bg-primary-light/40', tintText: 'text-primary' },
  schedule: { label: 'Schedule', color: 'text-info',    dot: 'bg-info',    tint: 'bg-info-tint',        tintText: 'text-info'    },
}

// Convenience map for code that only needs the dot color.
export const TYPE_DOT = Object.fromEntries(
  Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.dot])
)

/**
 * Accent color (bg-*) for a notification. Severity wins (danger/warning/info
 * override the type's neutral color); type is the fallback; falls back to
 * bg-muted if neither is recognized.
 */
export function getAccent(severity, type) {
  return SEVERITY_CONFIG[severity]?.dot ?? TYPE_CONFIG[type]?.dot ?? 'bg-muted'
}

// `scheduled_for` is a timestamptz string. Format for inline display
// (badge in the list and detail panel).
export function formatScheduledFor(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}
