import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { SectionTitle, Divider, Field } from './settingsShared'
import { useUser } from '../../context/UserContext.jsx'
import { fetchFuneralHome, updateFuneralHome } from '../../lib/api.js'

export function BrandingSection() {
  const { isAdmin } = useUser()
  const disabled = !isAdmin

  const [displayName, setDisplayName] = useState('')
  const [accentColor, setAccentColor] = useState('#6B8F71')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    fetchFuneralHome()
      .then(data => {
        setDisplayName(data.widgetDisplayName ?? data.widget_display_name ?? data.name ?? '')
        setAccentColor(data.accentColor ?? data.accent_color ?? '#6B8F71')
      })
      .catch(() => {})
  }, [])

  const inputClass = `flex-1 border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition-colors bg-surface ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-secondary/60'}`

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    try {
      await updateFuneralHome({ widget_display_name: displayName, accent_color: accentColor })
      setMsg({ ok: true, text: 'Branding saved.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message ?? 'Failed to save branding.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <SectionTitle title="Widget Branding" description="Customise how the family booking widget appears to your families." />

      <div className="mb-5">
        <label className="block text-xs font-sans text-muted mb-1.5">Funeral Home Logo</label>
        <div className={`border-2 border-dashed border-line rounded-xl py-8 text-center transition-colors ${isAdmin ? 'hover:border-secondary/30 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
          <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-sans text-sm text-muted">Click to upload logo</p>
          <p className="font-sans text-xs text-muted mt-1">PNG or SVG · Max 1 MB · Recommended 200×60 px</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <label className="block text-xs font-sans text-muted mb-1.5">Display Name in Widget</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            disabled={disabled}
            className={`w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition-colors bg-surface ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-secondary/60'}`}
          />
          <p className="font-sans text-[11px] text-muted mt-1">Shown as "Powered by Waypass" header</p>
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">Accent Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              disabled={disabled}
              className={`w-10 h-10 rounded-lg border border-line bg-surface ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <input
              type="text"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {msg && (
        <p className={`font-sans text-xs mt-3 ${msg.ok ? 'text-primary' : 'text-danger'}`}>{msg.text}</p>
      )}

      {isAdmin && (
        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Branding'}
          </Button>
        </div>
      )}

      <Divider />

      <SectionTitle title="Widget Preview" description="A live preview of how families will see your booking widget." />
      <div className="bg-canvas rounded-xl p-8 text-center border border-line">
        <p className="font-sans text-xs text-muted mb-1">{displayName || 'Your Funeral Home'} · Powered by Waypass</p>
        <p className="font-display text-3xl font-light text-ink">Cremation Services</p>
        <p className="font-sans text-xs text-secondary mt-2 max-w-xs mx-auto">
          Transparent pricing, compassionate care. We guide your family through every step.
        </p>
        <div className="mt-5 inline-flex gap-2">
          <div className="bg-surface rounded-lg border-2 border-ink px-4 py-2 text-xs font-sans font-medium text-ink">
            Comfort — $1,395
          </div>
        </div>
      </div>
    </div>
  )
}
