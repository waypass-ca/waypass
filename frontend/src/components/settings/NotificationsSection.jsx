import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { SectionTitle, Toggle } from './settingsShared'
import { fetchNotificationPrefs, saveNotificationPrefs } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

const ITEMS = [
  { key: 'newCaseSubmitted',      label: 'New case submitted',       description: 'When a family completes the booking widget' },
  { key: 'caseStatusUpdated',     label: 'Case status updated',      description: 'When a crematorium updates an order status' },
  { key: 'documentUploaded',      label: 'Document uploaded',        description: 'When a new document is added to a case' },
  { key: 'caseMarkedComplete',    label: 'Case marked complete',     description: 'When a case reaches the Complete stage' },
  { key: 'weeklyRevenueSummary',  label: 'Weekly revenue summary',   description: "Every Monday with last week's revenue totals (admins only)" },
  { key: 'familyMessageReceived', label: 'Family message received',  description: 'When a family member sends a message about a case' },
]

const DEFAULTS = {
  email: Object.fromEntries(ITEMS.map(i => [i.key, true])),
  inApp: Object.fromEntries(ITEMS.map(i => [i.key, true])),
}

const SAVE_DEBOUNCE_MS = 500

export function NotificationsSection() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const saveTimer = useRef(null)
  const savedTimer = useRef(null)

  useEffect(() => {
    fetchNotificationPrefs()
      .then(row => setPrefs(normalize(row)))
      .catch(() => setPrefs(DEFAULTS))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (savedTimer.current) clearTimeout(savedTimer.current)
  }, [])

  function update(channel, key, value) {
    setPrefs(p => {
      const next = { ...p, [channel]: { ...p[channel], [key]: value } }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setStatus('saving')
        try {
          await saveNotificationPrefs({ email: next.email, inApp: next.inApp })
          setStatus('saved')
          if (savedTimer.current) clearTimeout(savedTimer.current)
          savedTimer.current = setTimeout(() => setStatus('idle'), 1500)
        } catch {
          setStatus('error')
        }
      }, SAVE_DEBOUNCE_MS)
      return next
    })
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionTitle
            title="Notifications"
            description="Choose which events reach you by email and in-app."
          />
          {user?.email && (
            <p className="font-sans text-xs text-muted -mt-4">
              Emails are sent to <span className="text-ink font-medium">{user.email}</span>.
            </p>
          )}
        </div>
        <StatusIndicator status={status} />
      </div>

      <div className="grid grid-cols-[1fr_64px_64px] items-center gap-x-4 pb-2 border-b border-line">
        <span />
        <span className="font-sans text-[11px] uppercase tracking-wide text-muted text-center">Email</span>
        <span className="font-sans text-[11px] uppercase tracking-wide text-muted text-center">In-app</span>
      </div>

      <div className="divide-y divide-line">
        {ITEMS.map(({ key, label, description }) => (
          <Row
            key={key}
            label={label}
            description={description}
            emailChecked={loading ? false : !!prefs?.email?.[key]}
            inAppChecked={loading ? false : !!prefs?.inApp?.[key]}
            disabled={loading}
            onEmailChange={v => update('email', key, v)}
            onInAppChange={v => update('inApp', key, v)}
          />
        ))}
      </div>
    </div>
  )
}

function normalize(row) {
  if (!row || (!row.email && !row.inApp)) return DEFAULTS
  return {
    email: { ...DEFAULTS.email, ...(row.email ?? {}) },
    inApp: { ...DEFAULTS.inApp, ...(row.inApp ?? {}) },
  }
}

function Row({ label, description, emailChecked, inAppChecked, disabled, onEmailChange, onInAppChange }) {
  return (
    <div className="grid grid-cols-[1fr_64px_64px] items-center gap-x-4 py-4">
      <div className="pr-4">
        <p className="font-sans text-sm text-ink">{label}</p>
        {description && <p className="font-sans text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <div className="flex justify-center">
        <Toggle
          label={`${label} email`}
          checked={emailChecked}
          disabled={disabled}
          onChange={onEmailChange}
          hideLabel
        />
      </div>
      <div className="flex justify-center">
        <Toggle
          label={`${label} in-app`}
          checked={inAppChecked}
          disabled={disabled}
          onChange={onInAppChange}
          hideLabel
        />
      </div>
    </div>
  )
}

function StatusIndicator({ status }) {
  if (status === 'idle') return null
  if (status === 'saving') return (
    <span className="font-sans text-[11px] text-muted">Saving…</span>
  )
  if (status === 'saved') return (
    <span className="font-sans text-[11px] text-info flex items-center gap-1">
      <Check size={11} /> Saved
    </span>
  )
  return <span className="font-sans text-[11px] text-danger">Couldn't save</span>
}
