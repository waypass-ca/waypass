import { AlertCircle, Info, TriangleAlert } from 'lucide-react'

export const SEVERITY_CONFIG = {
  danger:  { icon: AlertCircle,   text: 'text-danger',  bg: 'bg-danger-tint',    border: 'border-danger/25',  dot: 'bg-danger'  },
  warning: { icon: TriangleAlert, text: 'text-warning', bg: 'bg-warning-light',  border: 'border-warning/25', dot: 'bg-warning' },
  info:    { icon: Info,          text: 'text-info',    bg: 'bg-info-tint',      border: 'border-info/25',    dot: 'bg-info'    },
}

export const TYPE_CONFIG = {
  alert:    { label: 'Alert',    color: 'text-warning', dot: 'bg-warning' },
  message:  { label: 'Message',  color: 'text-primary', dot: 'bg-primary' },
  schedule: { label: 'Schedule', color: 'text-info',    dot: 'bg-info'    },
}

export const TYPE_DOT = {
  alert: 'bg-warning',
  message: 'bg-primary',
  schedule: 'bg-info',
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
