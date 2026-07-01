import { useState, useRef } from 'react'
import { updateCrematorium, updateShippingPartner, generateCrematoriumLogo } from '../lib/api.js'
import { uploadToCloudinary } from '../lib/cloudinary.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { getDefaultShippingPartnerId, setDefaultShippingPartnerId } from '../lib/preferences.js'
import { Badge } from '../components/ui/Badge'
import { InfoField } from '../components/ui/InfoField'
import { InfoSection } from '../components/ui/InfoSection'
import { ChevronLeft, Pencil, TriangleAlert, Star, ImageIcon, Sparkles, Upload } from 'lucide-react'

function LogoSlot({ crm, canWrite, onUpdated }) {
  const [mode, setMode] = useState(null) // null | 'picker' | 'working'
  const [logoError, setLogoError] = useState(null)
  const fileRef = useRef(null)

  async function handleGenerate() {
    setMode('working')
    setLogoError(null)
    try {
      const updated = await generateCrematoriumLogo(crm.id)
      onUpdated(updated)
    } catch (err) {
      setLogoError(err.message)
    } finally {
      setMode(null)
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setMode('working')
    setLogoError(null)
    try {
      const logoUrl = await uploadToCloudinary(file)
      const updated = await updateCrematorium(crm.id, { logoUrl })
      onUpdated(updated)
    } catch (err) {
      setLogoError(err.message)
    } finally {
      setMode(null)
      e.target.value = ''
    }
  }

  const isWorking = mode === 'working'

  const picker = mode === 'picker' && (
    <div className="absolute top-full left-0 mt-1.5 z-20 bg-white border border-line rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.10)] p-2 w-52">
      {crm.website && (
        <button
          onClick={handleGenerate}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-canvas transition-colors group"
        >
          <Sparkles size={13} className="text-primary flex-shrink-0" />
          <div>
            <p className="font-sans text-[12.5px] font-medium text-ink">Generate from website</p>
            <p className="font-sans text-[11px] text-muted">Pull logo from {(() => { try { return new URL(crm.website.startsWith('http') ? crm.website : `https://${crm.website}`).hostname.replace(/^www\./, '') } catch { return crm.website } })()}</p>
          </div>
        </button>
      )}
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-canvas transition-colors"
      >
        <Upload size={13} className="text-muted flex-shrink-0" />
        <div>
          <p className="font-sans text-[12.5px] font-medium text-ink">Upload image</p>
          <p className="font-sans text-[11px] text-muted">PNG, JPG, SVG up to 2 MB</p>
        </div>
      </button>
      {logoError && <p className="font-sans text-[11px] text-danger px-3 pb-1 mt-1">{logoError}</p>}
    </div>
  )

  if (crm.logoUrl) {
    return (
      <div className="relative flex-shrink-0" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setMode(null) }} tabIndex={-1}>
        <div className="relative group">
          <img
            src={crm.logoUrl}
            alt=""
            className="w-14 h-14 rounded-xl object-contain border border-line bg-white"
          />
          {canWrite && (
            <button
              onClick={() => setMode(m => m === 'picker' ? null : 'picker')}
              className={`absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center cursor-pointer border-0 outline-none transition-opacity ${isWorking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              {isWorking
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Pencil size={14} className="text-white" />
              }
            </button>
          )}
        </div>
        {picker}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    )
  }

  if (!canWrite) return null

  return (
    <div className="relative flex-shrink-0" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setMode(null) }} tabIndex={-1}>
      <button
        onClick={() => setMode(m => m === 'picker' ? null : 'picker')}
        className="w-14 h-14 rounded-xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-0.5 text-muted hover:border-ink/30 hover:text-ink/50 transition-colors cursor-pointer bg-transparent outline-none"
      >
        {isWorking
          ? <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
          : <ImageIcon size={16} />
        }
      </button>
      {picker}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

export function PartnerDetailPage({ crm, cases = [], onBack, onRemove, onViewCase, onSave, kind = 'crematorium' }) {
  const updateFn = kind === 'shipping' ? updateShippingPartner : updateCrematorium
  const { user } = useAuth()
  const { canWrite } = useUser()
  const [isDefault, setIsDefault] = useState(
    kind === 'shipping' && getDefaultShippingPartnerId(user?.id) === crm.id
  )
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: crm.name ?? '',
    location: crm.location ?? '',
    contactName: crm.contactName ?? '',
    phone: crm.phone ?? '',
    contactEmail: crm.contactEmail ?? '',
    website: crm.website ?? '',
    hoursText: crm.weekdayDescriptions?.join('\n') ?? '',
    status: crm.status ?? 'active',
  })

  const set = key => val => setForm(p => ({ ...p, [key]: val }))

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const updated = await updateFn(crm.id, {
        name: form.name,
        location: form.location || null,
        contactName: form.contactName || null,
        phone: form.phone || null,
        contactEmail: form.contactEmail || null,
        website: form.website || null,
        weekdayDescriptions: form.hoursText ? form.hoursText.split('\n').filter(Boolean) : null,
        status: form.status,
      })
      onSave(updated)
      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setForm({
      name: crm.name ?? '',
      location: crm.location ?? '',
      contactName: crm.contactName ?? '',
      phone: crm.phone ?? '',
      contactEmail: crm.contactEmail ?? '',
      website: crm.website ?? '',
      hoursText: crm.weekdayDescriptions?.join('\n') ?? '',
      status: crm.status ?? 'active',
    })
    setIsEditing(false)
    setError(null)
  }

  const isActive = form.status === 'active'
  const address = [crm.streetAddress, crm.city, crm.state, crm.zip].filter(Boolean).join(', ') || crm.location || ''
  const mapQuery = encodeURIComponent(address ? `${crm.name} ${address}` : crm.name)

  const recentCases = cases
    .filter(c => kind === 'shipping' ? c.shippingPartnerId === crm.id : c.crematorium === crm.name)
    .slice(0, 5)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      <div className="flex-shrink-0 bg-surface/80 backdrop-blur border-b border-line px-6 pt-5 pb-4 relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-sans text-[12.5px] text-muted hover:text-ink transition-colors mb-3 cursor-pointer border-0 bg-transparent outline-none"
        >
          <ChevronLeft size={14} />
          Partners
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {kind === 'crematorium' && (
              <LogoSlot crm={crm} canWrite={canWrite} onUpdated={onSave} />
            )}
            {isEditing ? (
              <input
                value={form.name}
                onChange={e => set('name')(e.target.value)}
                className="font-display text-3xl text-ink leading-tight bg-white/60 border border-line/60 rounded-md px-2 py-0.5 outline-none focus:border-ink/30 transition-colors min-w-0 w-full"
              />
            ) : (
              <h1 className="font-display text-3xl text-ink leading-tight">{crm.name}</h1>
            )}
            <Badge variant={isActive ? 'primary' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Badge>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {canWrite && (isEditing ? (
              <>
                <button onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg border border-line font-sans text-xs text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-ink text-surface font-sans text-xs font-medium hover:bg-ink/90 transition-colors cursor-pointer disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-line text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer">
                <Pencil size={14} />
              </button>
            ))}
          </div>
        </div>
        {error && <p className="font-sans text-xs text-danger mt-2">{error}</p>}
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">

        <div className="flex-1 bg-white border-r border-line flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">

            {!isEditing && (
              <InfoSection title="Recent Cases">
                {recentCases.length === 0 ? (
                  <p className="font-sans text-[13px] text-muted py-1">No cases with this partner yet.</p>
                ) : (
                  <div className="rounded-lg border border-line bg-surface overflow-hidden">
                    {recentCases.map(c => (
                      <button
                        key={c.id}
                        onClick={() => onViewCase?.(c.id)}
                        className="w-full text-left flex items-center justify-between px-4 py-2.5 border-b border-line last:border-0 hover:bg-canvas/60 transition-colors"
                      >
                        <p className="font-sans text-[13px] text-ink truncate">{c.deceased}</p>
                        {c.date && <span className="font-sans text-[11.5px] text-muted flex-shrink-0 ml-2">{c.date}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </InfoSection>
            )}

            {isEditing && (
              <InfoSection title="Status">
                <div className="flex items-center justify-between py-2">
                  <span className="font-sans text-[13px] text-ink">Active Partner</span>
                  <button type="button"
                    onClick={() => set('status')(form.status === 'active' ? 'inactive' : 'active')}
                    className={`w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 relative border-0 outline-none ${form.status === 'active' ? 'bg-primary' : 'bg-line'}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.status === 'active' ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </InfoSection>
            )}

            <InfoSection title="Contact">
              {isEditing && (
                <InfoField label="Location" value={form.location} editing onChange={set('location')} />
              )}
              <InfoField label="Contact Name" value={isEditing ? form.contactName : crm.contactName}
                editing={isEditing} onChange={set('contactName')} />
              <InfoField label="Phone" value={isEditing ? form.phone : crm.phone}
                href={!isEditing && crm.phone ? `tel:${crm.phone}` : null}
                editing={isEditing} onChange={set('phone')} type="tel" />
              <InfoField label="Email" value={isEditing ? form.contactEmail : crm.contactEmail}
                href={!isEditing && crm.contactEmail ? `mailto:${crm.contactEmail}` : null}
                editing={isEditing} onChange={set('contactEmail')} type="email" />
              <InfoField label="Website"
                value={isEditing ? form.website : (crm.website ? crm.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : null)}
                href={!isEditing ? crm.website ?? null : null}
                editing={isEditing} onChange={set('website')} />
            </InfoSection>

            {(isEditing || crm.weekdayDescriptions?.length > 0) && (
              <InfoSection title="Hours">
                {isEditing ? (
                  <div className="py-1.5">
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-1">One entry per line</p>
                    <textarea
                      value={form.hoursText}
                      onChange={e => set('hoursText')(e.target.value)}
                      rows={7}
                      placeholder={"Monday: 8:00 AM – 5:00 PM\nTuesday: 8:00 AM – 5:00 PM\n…"}
                      className="w-full font-sans text-[13px] text-ink bg-white/60 border border-line/60 rounded-md px-2 py-1 outline-none focus:border-ink/30 transition-colors resize-none leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-0.5 py-1">
                    {crm.weekdayDescriptions.map((d, i) => (
                      <p key={i} className="font-sans text-[12px] text-ink leading-relaxed">{d}</p>
                    ))}
                    <p className="font-sans text-[10px] text-muted/60 italic mt-2">Hours may vary on holidays.</p>
                  </div>
                )}
              </InfoSection>
            )}

            {!isEditing && (crm.licenseNumber || crm.vettingNotes) && (
              <InfoSection title="Notes">
                {crm.licenseNumber && <InfoField label="License Number" value={crm.licenseNumber} />}
                {crm.vettingNotes && (
                  <p className="font-sans text-[13px] text-ink leading-relaxed py-1.5">{crm.vettingNotes}</p>
                )}
              </InfoSection>
            )}

          </div>

          {!isEditing && (
            <div className="flex-shrink-0 px-5 py-4 space-y-2.5">
              {kind === 'shipping' && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-line bg-canvas/60">
                  <Star size={14} className={`flex-shrink-0 ${isDefault ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[12.5px] font-medium text-ink">
                      {isDefault ? 'Default shipping partner' : 'Set as default shipping partner'}
                    </p>
                    <p className="font-sans text-[11px] text-muted mt-0.5">
                      {isDefault
                        ? 'Pre-selected on new cremation bookings.'
                        : 'Pre-select this partner on new cremation bookings.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isDefault
                      setDefaultShippingPartnerId(user?.id, next ? crm.id : null)
                      setIsDefault(next)
                    }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-line bg-white font-sans text-xs font-medium text-ink hover:bg-canvas transition-colors cursor-pointer"
                  >
                    {isDefault ? 'Unset' : 'Set default'}
                  </button>
                </div>
              )}
              {canWrite && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-danger/30 bg-danger-tint/40">
                  <TriangleAlert size={14} className="text-danger flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[12.5px] font-medium text-danger">Remove Partner</p>
                    <p className="font-sans text-[11px] text-danger/70 mt-0.5">This will disconnect the partner from your account.</p>
                  </div>
                  <button
                    onClick={() => onRemove(crm)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-danger text-white font-sans text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-[380px] flex-shrink-0 flex flex-col relative">
          {mapQuery ? (
            <>
              <iframe
                title={`Map — ${crm.name}`}
                src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&hl=en`}
                className="w-full flex-1 border-0"
                style={{ minHeight: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {address && (
                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)] max-w-[55%]">
                  <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="font-sans text-[12.5px] text-ink">{address}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
              <svg className="w-8 h-8 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <p className="font-sans text-sm text-muted">No address on file</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
