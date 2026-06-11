import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { SectionTitle, Toggle } from './settingsShared'
import { fetchNotificationPrefs, saveNotificationPrefs } from '../../lib/api.js'

const DEFAULTS = {
  newCaseSubmitted: true,
  caseStatusUpdated: true,
  documentUploaded: true,
  caseMarkedComplete: true,
  newCrematoriumRequest: false,
  weeklyRevenueSummary: true,
  familyMessageReceived: true,
}

const ITEMS = [
  { key: 'newCaseSubmitted',      label: 'New case submitted',              description: 'When a family completes the booking widget' },
  { key: 'caseStatusUpdated',     label: 'Case status updated',             description: 'When a crematorium updates an order status' },
  { key: 'documentUploaded',      label: 'Document uploaded',               description: 'When a new document is added to a case' },
  { key: 'caseMarkedComplete',    label: 'Case marked complete',            description: 'When a case reaches the Complete stage' },
  { key: 'newCrematoriumRequest', label: 'New crematorium partner request', description: 'When a crematorium applies to partner' },
  { key: 'weeklyRevenueSummary',  label: 'Weekly revenue summary',          description: "Every Monday with last week's revenue totals" },
  { key: 'familyMessageReceived', label: 'Family message received',         description: 'When a family member sends a message about a case' },
]

const SAVE_DEBOUNCE_MS = 500

export function NotificationsSection() {
  const [prefs, setPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const saveTimer = useRef(null)
  const savedTimer = useRef(null)

  useEffect(() => {
    fetchNotificationPrefs()
      .then(row => setPrefs(row ?? DEFAULTS))
      .catch(() => setPrefs(DEFAULTS))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (savedTimer.current) clearTimeout(savedTimer.current)
  }, [])

  function update(key, value) {
    setPrefs(p => {
      const next = { ...p, [key]: value }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setStatus('saving')
        try {
          await saveNotificationPrefs(next)
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
        <SectionTitle
          title="Email Notifications"
          description="Choose which events trigger an email to your inbox."
        />
        <StatusIndicator status={status} />
      </div>
      <div className="divide-y divide-line">
        {ITEMS.map(({ key, label, description }) => (
          <Toggle
            key={key}
            label={label}
            description={description}
            checked={loading ? false : !!prefs?.[key]}
            disabled={loading}
            onChange={v => update(key, v)}
          />
        ))}
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
