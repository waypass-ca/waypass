import { useState, useEffect, useRef } from 'react'
import { Pencil, Upload, Sparkles, Trash2, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { SectionTitle, Divider } from './settingsShared'
import { useUser } from '../../context/UserContext.jsx'
import { useFuneralHome } from '../../context/FuneralHomeContext.jsx'
import { updateFuneralHome, generateFuneralHomeLogo } from '../../lib/api.js'
import { uploadToCloudinary } from '../../lib/cloudinary.js'
import { extractDominantColor } from '../../lib/dominantColor.js'
import { LogoEditorModal } from './LogoEditorModal.jsx'

const MAX_LOGO_BYTES = 1024 * 1024
const ACCEPTED_LOGO_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg']

export function BrandingSection() {
  const { isAdmin } = useUser()
  const { funeralHome, setFuneralHome } = useFuneralHome()
  const disabled = !isAdmin
  const fileInputRef = useRef(null)

  const [displayName, setDisplayName] = useState('')
  const [accentColor, setAccentColor] = useState('#6B8F71')
  const [logoUrl, setLogoUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState(null)
  const [editorSource, setEditorSource] = useState(null)
  const [suggestedColor, setSuggestedColor] = useState(null)

  useEffect(() => {
    if (!funeralHome) return
    setDisplayName(funeralHome.widgetDisplayName ?? funeralHome.name ?? '')
    setAccentColor(funeralHome.accentColor ?? '#6B8F71')
    setLogoUrl(funeralHome.logoUrl ?? null)
  }, [funeralHome])

  const inputClass = `flex-1 border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition-colors bg-surface ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-secondary/60'}`
  const hasWebsite = Boolean(funeralHome?.website)

  const savedLogoUrl = funeralHome?.logoUrl ?? null
  const savedAccentColor = funeralHome?.accentColor ?? '#6B8F71'
  const savedDisplayName = funeralHome?.widgetDisplayName ?? funeralHome?.name ?? ''
  const isDirty = logoUrl !== savedLogoUrl || accentColor !== savedAccentColor || displayName !== savedDisplayName

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMsg(null)
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setMsg({ ok: false, text: 'Logo must be a PNG, SVG, or JPEG file.' })
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setMsg({ ok: false, text: 'Logo must be 1 MB or smaller.' })
      return
    }
    setEditorSource(file)
  }

  async function handleEditorApply(croppedFile) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(croppedFile)
      setLogoUrl(url)
      const derived = await extractDominantColor(url)
      if (derived) setAccentColor(derived)
      setEditorSource(null)
      setMsg({ ok: true, text: 'Logo staged. Click Save Branding to apply.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message ?? 'Failed to upload logo.' })
      throw err
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveLogo() {
    setLogoUrl(null)
    setMsg({ ok: true, text: 'Logo cleared. Click Save Branding to apply.' })
  }

  async function handleGenerate() {
    setGenerating(true)
    setMsg(null)
    try {
      const { logoUrl: newUrl } = await generateFuneralHomeLogo()
      if (!newUrl) throw new Error('Could not generate a logo')
      setLogoUrl(newUrl)
      const derived = await extractDominantColor(newUrl)
      if (derived && derived.toLowerCase() !== accentColor.toLowerCase()) {
        setSuggestedColor(derived)
      }
      setMsg({ ok: true, text: 'Logo staged. Click Save Branding to apply.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message ?? 'Failed to generate logo.' })
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    try {
      const next = await updateFuneralHome({
        widget_display_name: displayName,
        accent_color: accentColor,
        logo_url: logoUrl,
      })
      setFuneralHome(next)
      setMsg({ ok: true, text: 'Branding saved.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message ?? 'Failed to save branding.' })
    } finally {
      setSaving(false)
    }
  }

  const busy = uploading || generating

  return (
    <div>
      <SectionTitle title="Your Waypass Branding" description="Customise how the family booking widget appears to your families." />

      <div className="mb-5">
        <label className="block text-xs font-sans text-muted mb-1.5">Funeral Home Logo</label>
        <input
          ref={fileInputRef}
          id="brand-logo-upload"
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          onChange={handleFileChange}
          disabled={disabled || busy}
          className="hidden"
        />
        {logoUrl ? (
          <div className="border border-line rounded-xl p-4 flex items-center gap-4 bg-surface">
            <div className="w-20 h-20 rounded-lg bg-canvas flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm text-ink truncate">{logoUrl.split('/').pop()}</p>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-1 flex-shrink-0 justify-end">
                <Button variant="secondary" onClick={() => setEditorSource(logoUrl)} disabled={busy} className="gap-1.5">
                  <Pencil size={13} className="text-secondary" />
                  Edit
                </Button>
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy} className="gap-1.5">
                  <Upload size={13} className="text-secondary" />
                  {uploading ? 'Uploading…' : 'Replace'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={busy || !hasWebsite}
                  className="gap-1.5"
                >
                  <Sparkles size={13} className="text-primary" />
                  {generating ? 'Generating…' : 'Generate'}
                </Button>
                <Button variant="secondary" onClick={handleRemoveLogo} disabled={busy} className="gap-1.5">
                  <Trash2 size={13} className="text-danger" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <label
              htmlFor="brand-logo-upload"
              className={`block border-2 border-dashed border-line rounded-xl py-8 text-center transition-colors ${isAdmin && !busy ? 'hover:border-secondary/30 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-sans text-sm text-muted">{uploading ? 'Uploading…' : 'Click to upload logo'}</p>
              <p className="font-sans text-xs text-muted mt-1">PNG, SVG, or JPEG · Max 1 MB · Recommended 200×60 px</p>
            </label>
            {isAdmin && (
              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={busy || !hasWebsite}
                  className="gap-1.5"
                >
                  <Sparkles size={13} className="text-primary" />
                  {generating ? 'Generating…' : 'Generate from website'}
                </Button>
                {!hasWebsite && (
                  <span className="font-sans text-[11px] text-muted">Add a website URL in General settings to enable auto-generation.</span>
                )}
              </div>
            )}
          </>
        )}
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
          <p className="font-sans text-[11px] text-muted mt-1">Auto-derived from your logo. Override anytime.</p>
        </div>
      </div>

      {msg && (
        <p className={`font-sans text-xs mt-3 ${msg.ok ? 'text-primary' : 'text-danger'}`}>{msg.text}</p>
      )}

      {isAdmin && (
        <div className="mt-5 flex items-center justify-end gap-3">
          {isDirty && !saving && (
            <span className="font-sans text-[11px] text-muted">Unsaved changes</span>
          )}
          <Button variant="primary" onClick={handleSave} disabled={saving || busy || !isDirty}>
            {saving ? 'Saving…' : 'Save Branding'}
          </Button>
        </div>
      )}

      {editorSource && (
        <LogoEditorModal
          source={editorSource}
          onApply={handleEditorApply}
          onCancel={() => setEditorSource(null)}
        />
      )}

      {suggestedColor && (
        <ColorSuggestionModal
          currentColor={accentColor}
          suggestedColor={suggestedColor}
          onAccept={() => { setAccentColor(suggestedColor); setSuggestedColor(null) }}
          onDecline={() => setSuggestedColor(null)}
        />
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
          <div
            className="bg-surface rounded-lg border-2 px-4 py-2 text-xs font-sans font-medium text-ink"
            style={{ borderColor: accentColor }}
          >
            Comfort — $1,395
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorSuggestionModal({ currentColor, suggestedColor, onAccept, onDecline }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
      onClick={onDecline}
    >
      <div
        className="bg-white rounded-2xl border border-line shadow-2xl w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <Sparkles size={15} className="text-primary" />
            </div>
            <span className="font-sans text-[14px] font-semibold text-ink">Use color from logo?</span>
          </div>
          <button
            onClick={onDecline}
            className="w-7 h-7 rounded-lg hover:bg-canvas flex items-center justify-center text-muted cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="font-sans text-[13px] text-secondary leading-relaxed mb-4">
            We detected an accent color in the logo you just generated. Want to use it as your brand color?
          </p>
          <div className="flex items-center gap-4 bg-canvas rounded-xl p-4">
            <div className="flex-1 text-center">
              <div
                className="w-full h-14 rounded-lg border border-line"
                style={{ backgroundColor: currentColor }}
              />
              <p className="font-sans text-[10px] text-muted mt-1.5 uppercase tracking-wider">Current</p>
              <p className="font-sans text-[11px] text-ink font-mono mt-0.5">{currentColor}</p>
            </div>
            <div className="text-muted font-sans text-xs">→</div>
            <div className="flex-1 text-center">
              <div
                className="w-full h-14 rounded-lg border border-line"
                style={{ backgroundColor: suggestedColor }}
              />
              <p className="font-sans text-[10px] text-muted mt-1.5 uppercase tracking-wider">From logo</p>
              <p className="font-sans text-[11px] text-ink font-mono mt-0.5">{suggestedColor}</p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-1 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onDecline}>Keep current</Button>
          <Button variant="primary" onClick={onAccept}>Use this color</Button>
        </div>
      </div>
    </div>
  )
}
