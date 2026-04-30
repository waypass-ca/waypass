import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '../layout/PageHeader'
import { Button } from '../ui/Button'
import { fetchPortalSettings, savePortalSettings } from '../../lib/api.js'

const FALLBACK_SETTINGS = {
  funeralHomeName: 'Evergreen Memorial',
  tagline: 'Compassionate care, with dignity and grace.',
  logoUrl: '',
  primaryColor: '#6B8F71',
  accentColor: '#C4965A',
  backgroundColor: '#F7F3EE',
  cardColor: '#FDFAF7',
  textColor: '#1C1C1E',
  fontStyle: 'serif',
  sections: {
    progressTracker: true,
    deceasedDetails: true,
    coordinator: true,
    documents: false,
    personalMesprimary: true,
  },
  personalMesprimary:
    'Our deepest sympathies are with your family during this time. We are honoured to serve you and will be with you every step of the way.',
}

const SAMPLE_CASE = {
  deceased: 'Margaret Elizabeth Chen',
  family: 'The Chen Family',
  status: 'transit',
  package: 'Comfort Package',
  coordinator: 'Sarah Mitchell',
  coordinatorPhone: '(415) 555-0192',
  date: 'March 15, 2024',
  documents: ['Death Certificate.pdf', 'Cremation Authorization.pdf'],
}

const PROGRESS_STEPS = [
  { key: 'pending', label: 'Case Received' },
  { key: 'transit', label: 'In Transit' },
  { key: 'cremation', label: 'In Cremation' },
  { key: 'complete', label: 'Complete' },
]
const STATUS_ORDER = ['pending', 'transit', 'cremation', 'complete']

// ─── Cloudinary upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary env vars not set (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)')
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? 'Cloudinary upload failed')
  }
  const data = await res.json()
  return data.secure_url
}

// ─── Editor sub-components ────────────────────────────────────────────────────

function EditorSection({ title, children }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-5">
      <p className="font-sans font-semibold text-[10px] text-ink uppercase tracking-widest mb-4">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-sans text-xs text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 font-sans text-sm text-ink border border-line rounded-lg outline-none focus:border-ink transition-colors bg-surface"
    />
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden border border-line cursor-pointer shadow-sm">
        <div className="absolute inset-0" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
      <div className="flex-1">
        <p className="font-sans text-xs text-muted mb-1">{label}</p>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-2.5 py-1.5 font-mono text-xs text-ink border border-line rounded-lg outline-none focus:border-ink transition-colors bg-canvas"
        />
      </div>
    </div>
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-3 py-0.5">
      <div>
        <p className="font-sans text-sm text-ink leading-tight">{label}</p>
        {description && (
          <p className="font-sans text-xs text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors cursor-pointer border-0 outline-none ${
          checked ? 'bg-primary' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'transecondary-x-4' : 'transecondary-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function LogoUpload({ logoUrl, onLogoUrl }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const url = await uploadToCloudinary(file)
      onLogoUrl(url)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      // reset input so the same file can be re-selected
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {/* Preview + remove */}
      {logoUrl && (
        <div className="flex items-center gap-3 p-3 bg-canvas rounded-lg border border-line">
          <img
            src={logoUrl}
            alt="Logo preview"
            className="h-8 w-auto max-w-[100px] object-contain rounded"
          />
          <div className="flex-1 min-w-0">
            <p className="font-sans text-xs text-secondary truncate">{logoUrl.split('/').pop()}</p>
          </div>
          <button
            onClick={() => onLogoUrl('')}
            className="text-muted hover:text-danger transition-colors cursor-pointer border-0 outline-none bg-transparent p-0.5"
            title="Remove logo"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-line rounded-lg font-sans text-sm text-secondary hover:border-ink hover:text-ink transition-colors cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Uploading…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 10l-4-4-4 4M12 6v10" />
            </svg>
            {logoUrl ? 'Replace logo' : 'Upload logo'}
          </>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {uploadError && (
        <p className="font-sans text-xs text-danger">{uploadError}</p>
      )}
      <p className="font-sans text-[10px] text-muted">PNG, SVG or JPEG · max 5 MB</p>
    </div>
  )
}

// ─── Family portal preview ────────────────────────────────────────────────────

function FamilyPortalPreview({ settings }) {
  const stepIndex = STATUS_ORDER.indexOf(SAMPLE_CASE.status)

  return (
    <div
      className="rounded-2xl overflow-hidden border border-line shadow-sm"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {/* Header */}
      <div
        className="px-7 py-5 flex items-center gap-3.5"
        style={{ backgroundColor: settings.primaryColor }}
      >
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="Logo"
            className="h-8 w-auto max-w-[120px] object-contain"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
            </svg>
          </div>
        )}
        <div>
          <p className="font-sans font-semibold text-white text-sm leading-tight">
            {settings.funeralHomeName || 'Funeral Home'}
          </p>
          {settings.tagline && (
            <p className="font-sans text-white/65 text-xs mt-0.5">{settings.tagline}</p>
          )}
        </div>
      </div>

      <div className="px-7 py-7">
        {/* Greeting */}
        <div className="mb-6">
          <p
            className={`text-2xl leading-snug mb-1 ${
              settings.fontStyle === 'serif' ? 'font-display' : 'font-sans font-medium'
            }`}
            style={{ color: settings.textColor }}
          >
            {SAMPLE_CASE.family}
          </p>
          <p className="font-sans text-sm" style={{ color: settings.textColor + '99' }}>
            Case for {SAMPLE_CASE.deceased} · {SAMPLE_CASE.package}
          </p>
        </div>

        {/* Personal message */}
        {settings.sections.personalMesprimary && settings.personalMesprimary && (
          <div
            className="rounded-xl px-5 py-4 mb-5 border-l-4"
            style={{ backgroundColor: settings.cardColor, borderLeftColor: settings.accentColor }}
          >
            <p className="font-sans text-sm leading-relaxed" style={{ color: settings.textColor + 'CC' }}>
              {settings.personalMesprimary}
            </p>
          </div>
        )}

        {/* Progress tracker */}
        {settings.sections.progressTracker && (
          <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: settings.cardColor }}>
            <p
              className="font-sans text-[10px] font-semibold uppercase tracking-widest mb-5"
              style={{ color: settings.textColor + '66' }}
            >
              Progress
            </p>
            <div className="flex items-start">
              {PROGRESS_STEPS.map((step, i) => {
                const done = i <= stepIndex
                const active = i === stepIndex
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                    {i < PROGRESS_STEPS.length - 1 && (
                      <div
                        className="absolute top-3.5 left-1/2 w-full h-px"
                        style={{ backgroundColor: i < stepIndex ? settings.primaryColor : '#E8E3DC' }}
                      />
                    )}
                    <div
                      className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2"
                      style={{
                        backgroundColor: done ? settings.primaryColor : 'transparent',
                        borderColor: done ? settings.primaryColor : '#E8E3DC',
                      }}
                    >
                      {done && !active && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {active && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <p
                      className="font-sans text-[10px] font-medium mt-2 text-center leading-tight px-1"
                      style={{ color: done ? settings.textColor : settings.textColor + '44' }}
                    >
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Detail cards */}
        <div className="grid grid-cols-2 gap-3">
          {settings.sections.deceasedDetails && (
            <div className="rounded-xl p-4" style={{ backgroundColor: settings.cardColor }}>
              <p
                className="font-sans text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: settings.textColor + '66' }}
              >
                Case Details
              </p>
              <div className="space-y-2.5">
                {[
                  { label: 'Deceased', value: SAMPLE_CASE.deceased },
                  { label: 'Case Date', value: SAMPLE_CASE.date },
                  { label: 'Package', value: SAMPLE_CASE.package },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-sans text-[10px] text-muted">{label}</p>
                    <p className="font-sans text-xs font-medium leading-tight" style={{ color: settings.textColor }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settings.sections.coordinator && (
            <div className="rounded-xl p-4" style={{ backgroundColor: settings.cardColor }}>
              <p
                className="font-sans text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: settings.textColor + '66' }}
              >
                Your Coordinator
              </p>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: settings.primaryColor + '22', color: settings.primaryColor }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-sans text-xs font-medium" style={{ color: settings.textColor }}>
                    {SAMPLE_CASE.coordinator}
                  </p>
                  <p className="font-sans text-[10px] text-muted">{SAMPLE_CASE.coordinatorPhone}</p>
                </div>
              </div>
              <button
                className="w-full py-1.5 rounded-lg font-sans text-xs font-medium text-white"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Send Mesprimary
              </button>
            </div>
          )}

          {settings.sections.documents && (
            <div className="rounded-xl p-4 col-span-2" style={{ backgroundColor: settings.cardColor }}>
              <p
                className="font-sans text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: settings.textColor + '66' }}
              >
                Documents
              </p>
              <div className="space-y-2">
                {SAMPLE_CASE.documents.map(doc => (
                  <div key={doc} className="flex items-center gap-2.5">
                    <svg
                      className="w-3.5 h-3.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      style={{ color: settings.primaryColor }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V8l-5-5H7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3v5h5" />
                    </svg>
                    <p className="font-sans text-xs" style={{ color: settings.textColor }}>{doc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main editor page ─────────────────────────────────────────────────────────

export function FamilyPageEditorPage() {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    fetchPortalSettings()
      .then(data => setSettings(data))
      .catch(() => {/* keep fallback */})
      .finally(() => setLoading(false))
  }, [])

  function update(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
    if (saveState === 'saved') setSaveState('idle')
  }

  function updateSection(key, value) {
    setSettings(prev => ({
      ...prev,
      sections: { ...prev.sections, [key]: value },
    }))
    if (saveState === 'saved') setSaveState('idle')
  }

  async function handleSave() {
    setSaveState('saving')
    setSaveError(null)
    try {
      await savePortalSettings(settings)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch (err) {
      setSaveError(err.message)
      setSaveState('error')
    }
  }

  const saveLabel =
    saveState === 'saving' ? 'Saving…' :
    saveState === 'saved'  ? '✓ Saved' :
    saveState === 'error'  ? 'Save failed' :
    'Save Changes'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="font-sans text-sm text-muted">Loading portal settings…</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Family Portal Editor"
        subtitle="Customise what families see when tracking their loved one's case"
        rightSlot={
          <div className="flex items-center gap-3">
            {saveState === 'error' && saveError && (
              <p className="font-sans text-xs text-danger">{saveError}</p>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saveState === 'saving'}
            >
              {saveLabel}
            </Button>
          </div>
        }
      />

      <div className="flex gap-6 items-start">
        {/* ── Editor panel ── */}
        <div className="w-[300px] flex-shrink-0 space-y-3">

          <EditorSection title="Branding">
            <Field label="Funeral home name">
              <TextInput
                value={settings.funeralHomeName}
                onChange={v => update('funeralHomeName', v)}
                placeholder="Your funeral home name"
              />
            </Field>
            <Field label="Tagline">
              <TextInput
                value={settings.tagline}
                onChange={v => update('tagline', v)}
                placeholder="A short tagline…"
              />
            </Field>
            <Field label="Logo">
              <LogoUpload
                logoUrl={settings.logoUrl}
                onLogoUrl={url => update('logoUrl', url)}
              />
            </Field>
            <Field label="Heading font">
              <div className="flex gap-2">
                {[
                  { value: 'serif', label: 'Serif' },
                  { value: 'sans', label: 'Sans-serif' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update('fontStyle', opt.value)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-sans transition-all cursor-pointer outline-none ${
                      settings.fontStyle === opt.value
                        ? 'border-ink bg-ink text-surface'
                        : 'border-line text-secondary hover:border-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
          </EditorSection>

          <EditorSection title="Colours">
            <ColorField label="Primary" value={settings.primaryColor} onChange={v => update('primaryColor', v)} />
            <ColorField label="Accent" value={settings.accentColor} onChange={v => update('accentColor', v)} />
            <ColorField label="Background" value={settings.backgroundColor} onChange={v => update('backgroundColor', v)} />
            <ColorField label="Card background" value={settings.cardColor} onChange={v => update('cardColor', v)} />
            <ColorField label="Text" value={settings.textColor} onChange={v => update('textColor', v)} />
          </EditorSection>

          <EditorSection title="Sections">
            <Toggle
              label="Progress tracker"
              description="4-step status indicator"
              checked={settings.sections.progressTracker}
              onChange={v => updateSection('progressTracker', v)}
            />
            <Toggle
              label="Case details"
              description="Deceased name, date, and package"
              checked={settings.sections.deceasedDetails}
              onChange={v => updateSection('deceasedDetails', v)}
            />
            <Toggle
              label="Coordinator contact"
              description="Assigned staff name and phone"
              checked={settings.sections.coordinator}
              onChange={v => updateSection('coordinator', v)}
            />
            <Toggle
              label="Documents"
              description="Allow families to view shared files"
              checked={settings.sections.documents}
              onChange={v => updateSection('documents', v)}
            />
            <Toggle
              label="Personal message"
              description="A custom message at the top of the page"
              checked={settings.sections.personalMesprimary}
              onChange={v => updateSection('personalMesprimary', v)}
            />
          </EditorSection>

          {settings.sections.personalMesprimary && (
            <EditorSection title="Personal Mesprimary">
              <textarea
                value={settings.personalMesprimary}
                onChange={e => update('personalMesprimary', e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 font-sans text-sm text-ink border border-line rounded-lg outline-none focus:border-ink transition-colors bg-surface resize-none leading-relaxed"
              />
            </EditorSection>
          )}
        </div>

        {/* ── Live preview ── */}
        <div className="flex-1 min-w-0">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              <p className="font-sans text-xs text-muted">Live Preview — Family Portal</p>
            </div>
            <FamilyPortalPreview settings={settings} />
          </div>
        </div>
      </div>
    </div>
  )
}
