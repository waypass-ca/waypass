import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (!funeralHome) return
    setDisplayName(funeralHome.widgetDisplayName ?? funeralHome.name ?? '')
    setAccentColor(funeralHome.accentColor ?? '#6B8F71')
    setLogoUrl(funeralHome.logoUrl ?? null)
  }, [funeralHome])

  const inputClass = `flex-1 border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition-colors bg-surface ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-secondary/60'}`
  const hasWebsite = Boolean(funeralHome?.website)

  async function applyLogo(url) {
    const derived = await extractDominantColor(url)
    const patch = { logo_url: url }
    if (derived) patch.accent_color = derived
    const next = await updateFuneralHome(patch)
    setFuneralHome(next)
    if (derived) setAccentColor(derived)
    return next
  }

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
      await applyLogo(url)
      setEditorSource(null)
      setMsg({ ok: true, text: 'Logo saved.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message ?? 'Failed to upload logo.' })
      throw err
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveLogo() {
    setUploading(true)
    setMsg(null)
    try {
      const next = await updateFuneralHome({ logo_url: null })
      setFuneralHome(next)
      setLogoUrl(null)
      setMsg({ ok: true, text: 'Logo removed.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message ?? 'Failed to remove logo.' })
    } finally {
      setUploading(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setMsg(null)
    try {
      const next = await generateFuneralHomeLogo()
      setFuneralHome(next)
      if (next.logoUrl) {
        const derived = await extractDominantColor(next.logoUrl)
        if (derived) {
          const withColor = await updateFuneralHome({ accent_color: derived })
          setFuneralHome(withColor)
          setAccentColor(derived)
        }
      }
      setMsg({ ok: true, text: 'Logo generated from your website.' })
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
      <SectionTitle title="Widget Branding" description="Customise how the family booking widget appears to your families." />

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
              <p className="font-sans text-xs text-muted mt-0.5">The accent color updates automatically when you replace this logo.</p>
            </div>
            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" onClick={() => setEditorSource(logoUrl)} disabled={busy}>
                  Edit
                </Button>
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                  {uploading ? 'Uploading…' : 'Replace'}
                </Button>
                <Button variant="secondary" onClick={handleRemoveLogo} disabled={busy}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        ) : (
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
        )}
        {isAdmin && (
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleGenerate}
              disabled={busy || !hasWebsite}
              title={hasWebsite ? undefined : 'Add your website URL in General settings first'}
            >
              {generating ? 'Generating…' : 'Generate from website'}
            </Button>
            {!hasWebsite && (
              <span className="font-sans text-[11px] text-muted">Add a website URL in General settings to enable auto-generation.</span>
            )}
          </div>
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
        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={saving || busy}>
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
