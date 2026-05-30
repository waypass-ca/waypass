import { useState, useEffect, useRef } from 'react'
import {
  fetchCrematoriums, createCrematorium, updateCrematorium,
  disconnectCrematorium, fetchNearbyCrematoriums, loadMapsLib,
} from '../../lib/api.js'
import { PASSAGE_MAP_STYLE } from '../../lib/mapStyles.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PageTitle } from '../layout/PageTitle'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Search, ChevronLeft } from 'lucide-react'

function makeMarkerIcon(onPassage, active = false) {
  const fill  = active
    ? (onPassage ? '#2e4a35' : '#1e3a6e')
    : (onPassage ? '#5a7060' : '#4A72B8')
  const ring  = 'white'

  const w  = active ? 34 : 28
  const h  = active ? 46 : 38
  const cx = w / 2

  const path = active
    ? `M17 1C8.72 1 2 7.72 2 16c0 10.8 15 29 15 29S32 26.8 32 16C32 7.72 25.28 1 17 1z`
    : `M14 1C7.37 1 2 6.37 2 13c0 8.8 12 24 12 24S26 21.8 26 13C26 6.37 20.63 1 14 1z`

  const [ringCy, ringR, dotR] = active
    ? [15, 6.5, 3]
    : [12.5, 5.5, 2.5]

  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <path d="${path}" fill="${fill}"/>
      <circle cx="${cx}" cy="${ringCy}" r="${ringR}" fill="${ring}"/>
      <circle cx="${cx}" cy="${ringCy}" r="${dotR}" fill="${fill}"/>
    </svg>`
  )

  return {
    url: `data:image/svg+xml;charset=utf-8,${svg}`,
    scaledSize: new window.google.maps.Size(w, h),
    anchor: new window.google.maps.Point(cx, h),
  }
}

// ── InputField ────────────────────────────────────────────────────────────────

function InputField({ label, placeholder, type = 'text', prefix, value, onChange }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium text-ink mb-1.5">{label}</label>
      {prefix ? (
        <div className="flex items-center border border-line rounded-lg overflow-hidden bg-canvas focus-within:ring-1 focus-within:ring-ink/20">
          <span className="px-3 font-sans text-sm text-muted select-none border-r border-line bg-canvas py-2">{prefix}</span>
          <input type={type} placeholder={placeholder} value={value} min={type === 'number' ? 0 : undefined}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-canvas px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none" />
        </div>
      ) : (
        <input type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20" />
      )}
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ crm, onSave, onClose }) {
  const rawFee = crm.avgFee?.replace('$', '') ?? ''
  const [form, setForm] = useState({
    name: crm.name ?? '', location: crm.location ?? '', distance: crm.distance ?? '',
    contact: crm.contactName ?? '', phone: crm.phone ?? '',
    avgTurnaround: crm.avgTurnaround ?? '', avgFee: rawFee, status: crm.status ?? 'active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = key => v => setForm(p => ({ ...p, [key]: v }))

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const updated = await updateCrematorium(crm.id, {
        name: form.name, location: form.location, distance: form.distance || null,
        contact: form.contact || null, phone: form.phone || null,
        avg_turnaround: form.avgTurnaround || null,
        avg_fee: form.avgFee ? `$${form.avgFee}` : null, status: form.status,
      })
      onSave(updated)
    } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Edit Partner</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-colors ${form.status === 'active' ? 'border-primary bg-primary-light/40' : 'border-line bg-canvas'}`}>
            <div>
              <p className="font-sans text-sm font-medium text-ink">Active Partner</p>
              <p className="font-sans text-xs text-muted mt-0.5">{form.status === 'active' ? 'Available for case assignments' : 'Not available'}</p>
            </div>
            <button type="button"
              onClick={() => setForm(p => ({ ...p, status: p.status === 'active' ? 'inactive' : 'active' }))}
              className={`w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ml-6 relative border-0 outline-none ${form.status === 'active' ? 'bg-primary' : 'bg-line'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.status === 'active' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><InputField label="Name" placeholder="Crematorium name" value={form.name} onChange={set('name')} /></div>
            <InputField label="Location" placeholder="City, State" value={form.location} onChange={set('location')} />
            <InputField label="Distance" placeholder="e.g. 12 miles" value={form.distance} onChange={set('distance')} />
            <InputField label="Contact Name" placeholder="e.g. John Smith" value={form.contact} onChange={set('contact')} />
            <InputField label="Phone" type="tel" placeholder="(415) 555-0100" value={form.phone} onChange={set('phone')} />
            <InputField label="Avg. Turnaround" placeholder="e.g. 3–5 days" value={form.avgTurnaround} onChange={set('avgTurnaround')} />
            <InputField label="Avg. Fee" type="number" prefix="$" placeholder="295" value={form.avgFee} onChange={set('avgFee')} />
          </div>
          {error && <p className="font-sans text-xs text-danger">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  )
}

// ── Disconnect Modal ──────────────────────────────────────────────────────────

function DisconnectModal({ crm, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(null)

  async function handleRemove() {
    setRemoving(true); setError(null)
    try { await disconnectCrematorium(crm.id); onConfirm(crm.id) }
    catch (err) { setError(err.message); setRemoving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-sm shadow-xl p-6">
        <div className="w-10 h-10 rounded-full bg-danger-tint flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-ink mb-1">Remove Partner</h2>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Remove <span className="text-ink font-medium">{crm.name}</span> from your connected partners? You can reconnect later.
        </p>
        {error && <p className="font-sans text-xs text-danger mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <button onClick={handleRemove} disabled={removing}
            className="flex-1 bg-danger text-white font-sans text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── StarRating ────────────────────────────────────────────────────────────────

function StarRating({ rating, small = false }) {
  const size = small ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
  return (
    <span className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(rating)
        const half = !filled && i - 0.5 <= rating
        return (
          <svg key={i} className={`${size} flex-shrink-0`} viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`h${i}`}><stop offset="50%" stopColor="#F4B942" /><stop offset="50%" stopColor="#d1d5db" /></linearGradient>
            </defs>
            <path fill={filled ? '#F4B942' : half ? `url(#h${i})` : '#d1d5db'}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      })}
    </span>
  )
}

// ── Contact line (used in detail page) ───────────────────────────────────────

function ContactLine({ icon, value, href }) {
  if (!value) return null
  const content = (
    <div className="flex items-center gap-2.5">
      <span className="flex-shrink-0 w-6 h-6 rounded-md bg-canvas border border-line flex items-center justify-center text-muted">
        {icon}
      </span>
      <span className="font-sans text-xs text-ink truncate">{value}</span>
    </div>
  )
  return href
    ? <a href={href} className="block hover:opacity-70 transition-opacity">{content}</a>
    : <div>{content}</div>
}

// ── PartnerDetailPage ─────────────────────────────────────────────────────────

function PartnerDetailPage({ crm, onBack, onEdit, onRemove }) {
  const isActive = crm.status === 'active'
  const mapQuery = encodeURIComponent(
    [crm.streetAddress, crm.city, crm.state].filter(Boolean).join(', ') || crm.location || ''
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-surface/80 backdrop-blur border-b border-line px-6 pt-5 pb-4 relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-sans text-[12.5px] text-muted hover:text-ink transition-colors mb-3 cursor-pointer"
        >
          <ChevronLeft size={14} />
          Partners
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl text-ink leading-tight">{crm.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={isActive ? 'primary' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Badge>
              {crm.location && <span className="font-sans text-xs text-muted">{crm.location}</span>}
              {crm.rating != null && (
                <>
                  <span className="font-sans text-xs font-bold text-ink">{crm.rating.toFixed(1)}</span>
                  <StarRating rating={crm.rating} small />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <button onClick={() => onEdit(crm)}
              className="px-3 py-1.5 rounded-lg border border-line font-sans text-xs text-ink hover:bg-surface transition-colors">
              Edit
            </button>
            <button onClick={() => onRemove(crm)}
              className="px-3 py-1.5 rounded-lg border border-line font-sans text-xs text-danger hover:bg-danger-tint transition-colors">
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-canvas">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Active Orders', value: crm.activeOrders },
              { label: 'Completed YTD', value: crm.completedYTD },
              { label: 'Avg Turnaround', value: crm.avgTurnaround },
              { label: 'Avg Fee', value: crm.avgFee },
            ].map(s => (
              <div key={s.label} className="bg-surface rounded-xl border border-line px-4 py-3.5">
                <p className="font-display text-2xl text-ink leading-none mb-1.5">{s.value ?? '—'}</p>
                <p className="font-sans text-[9px] uppercase tracking-wide text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-surface rounded-xl border border-line p-5">
            <p className="font-sans text-[9px] uppercase tracking-widest text-muted mb-3">Contact</p>
            <div className="space-y-2">
              <ContactLine
                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                value={crm.contactName}
              />
              <ContactLine
                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                value={crm.phone}
                href={crm.phone ? `tel:${crm.phone}` : null}
              />
              <ContactLine
                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                value={crm.contactEmail}
                href={crm.contactEmail ? `mailto:${crm.contactEmail}` : null}
              />
              <ContactLine
                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
                value={crm.website ? crm.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : null}
                href={crm.website ?? null}
              />
              {!crm.contactName && !crm.phone && !crm.contactEmail && !crm.website && (
                <p className="font-sans text-xs text-muted/60 italic">No contact on file</p>
              )}
            </div>
          </div>

          {/* Hours + Map */}
          <div className="flex gap-5">
            {crm.weekdayDescriptions?.length > 0 && (
              <div className="bg-surface rounded-xl border border-line p-5 w-52 flex-shrink-0">
                <p className="font-sans text-[9px] uppercase tracking-wide text-muted mb-2.5">Hours</p>
                <div className="space-y-0.5">
                  {crm.weekdayDescriptions.map((d, i) => (
                    <p key={i} className="font-sans text-[11px] text-muted leading-relaxed">{d}</p>
                  ))}
                  <p className="font-sans text-[10px] text-muted/50 italic mt-2">Hours may vary on holidays.</p>
                </div>
              </div>
            )}
            <div className="flex-1 bg-surface rounded-xl border border-line overflow-hidden" style={{ minHeight: 200 }}>
              {mapQuery ? (
                <iframe
                  title={`Map — ${crm.name}`}
                  src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&hl=en`}
                  className="w-full h-full border-0"
                  style={{ minHeight: 200 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex items-center justify-center h-full" style={{ minHeight: 200 }}>
                  <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {(crm.licenseNumber || crm.vettingNotes) && (
            <div className="bg-surface rounded-xl border border-line p-5">
              <p className="font-sans text-[9px] uppercase tracking-wide text-muted mb-2">Notes</p>
              {crm.licenseNumber && (
                <p className="font-sans text-xs text-muted mb-1">License: {crm.licenseNumber}</p>
              )}
              {crm.vettingNotes && (
                <p className="font-sans text-xs text-muted leading-relaxed">{crm.vettingNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PartnerRow (list row) ─────────────────────────────────────────────────────

function PartnerRow({ crm, onClick }) {
  const isActive = crm.status === 'active'
  return (
    <tr
      onClick={onClick}
      className="border-b border-line cursor-pointer group transition-colors hover:bg-canvas/40"
    >
      {/* Name · Location */}
      <td className="px-3 py-3 align-middle">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-sans text-[13.5px] font-medium text-ink truncate">{crm.name}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <div className="flex items-center gap-1.5 min-w-0">
          {crm.location && (
              <span className="font-sans text-[12px] text-muted truncate">{crm.location}</span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 align-middle">
        <Badge variant={isActive ? 'primary' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Badge>
      </td>
    </tr>
  )
}

// ── PartnersList ──────────────────────────────────────────────────────────────

function PartnersList({ crematoriums, search, onSelect }) {
  const filtered = crematoriums.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.location ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (crematoriums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
        <div className="w-12 h-12 rounded-full bg-canvas border border-line flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="font-sans text-sm font-medium text-ink">No partners yet</p>
        <p className="font-sans text-xs text-muted mt-1">Use Find a Partner to discover and add crematoriums.</p>
      </div>
    )
  }

  const Th = ({ children, className = '' }) => (
    <th className={`font-sans text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium text-left px-3 py-2.5 ${className}`}>{children}</th>
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 400 }}>
              <thead className="bg-white border-b border-line">
                <tr>
                  <Th>Name</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center">
                      <p className="font-display text-[17px] text-secondary">No results</p>
                      <p className="font-sans text-[12px] text-muted mt-1">Try a different search.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(crm => (
                    <PartnerRow key={crm.id} crm={crm} onClick={() => onSelect(crm)} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer count */}
      <div className="flex-shrink-0 px-6 py-2.5 border-t border-line">
        <p className="font-sans text-[11px] text-muted">
          {filtered.length} of {crematoriums.length} partner{crematoriums.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

// ── MapView ───────────────────────────────────────────────────────────────────

function MapView({ nearby, userLocation, hoveredId, selectedId, onMarkerClick, onMapClick }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerMapRef = useRef({})
  const infoWindowRef = useRef(null)
  const iconsRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let interval
    function tryInit() {
      if (!containerRef.current || !window.google?.maps || mapRef.current) return
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: userLocation ?? { lat: 43.65, lng: -79.38 },
        zoom: 11,
        styles: PASSAGE_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: 'cooperative',
      })
      mapRef.current.addListener('click', () => onMapClick?.())
      iconsRef.current = {
        passage: { normal: makeMarkerIcon(true, false), active: makeMarkerIcon(true, true) },
        plain:   { normal: makeMarkerIcon(false, false), active: makeMarkerIcon(false, true) },
      }
      setMapReady(true)
      clearInterval(interval)
    }
    tryInit()
    if (!mapRef.current) interval = setInterval(tryInit, 150)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (mapRef.current && userLocation) mapRef.current.panTo(userLocation)
  }, [userLocation])

  useEffect(() => {
    if (!mapReady || !window.google?.maps) return
    Object.values(markerMapRef.current).forEach(({ marker }) => marker.setMap(null))
    markerMapRef.current = {}
    if (infoWindowRef.current) infoWindowRef.current.close()

    const bounds = new window.google.maps.LatLngBounds()
    let hasPoints = false

    nearby.forEach(crm => {
      if (!crm.lat || !crm.lng) return
      const pos = { lat: crm.lat, lng: crm.lng }
      bounds.extend(pos)
      hasPoints = true

      const icons = iconsRef.current?.[crm.onPassage ? 'passage' : 'plain']
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        icon: icons?.normal,
      })

      const photoHtml = crm.photos?.[0]
        ? `<img src="${crm.photos[0]}" alt="" style="width:230px;height:120px;object-fit:cover;border-radius:6px;display:block;margin-bottom:8px;">`
        : ''
      const ratingHtml = crm.rating
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:3px">
            <span style="font-size:11px;font-weight:700;color:#2c2522">${crm.rating.toFixed(1)}</span>
            <span style="color:#F4B942;font-size:12px;letter-spacing:-1px">${'★'.repeat(Math.round(crm.rating))}${'☆'.repeat(5 - Math.round(crm.rating))}</span>
            ${crm.userRatingCount ? `<span style="font-size:10px;color:#9e8e82">(${crm.userRatingCount.toLocaleString()})</span>` : ''}
           </div>`
        : ''
      const iwContent = `<div style="font-family:'DM Sans',sans-serif;padding:2px;max-width:230px">
        ${photoHtml}
        <p style="font-weight:600;font-size:13px;margin:0 0 2px;color:#2c2522;line-height:1.3">${crm.name}</p>
        <p style="font-size:11px;color:#9e8e82;margin:0;line-height:1.4">${crm.location}</p>
        ${ratingHtml}
        ${crm.onPassage ? '<span style="display:inline-flex;align-items:center;margin-top:6px;font-size:10px;font-weight:700;color:#5a7060;background:#edf2ee;padding:2px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:0.06em">On Passage</span>' : ''}
      </div>`

      function openIW() {
        if (infoWindowRef.current) infoWindowRef.current.close()
        const iw = new window.google.maps.InfoWindow({
          content: iwContent,
          headerDisabled: true,
          pixelOffset: new window.google.maps.Size(0, -4),
        })
        iw.open({ map: mapRef.current, anchor: marker })
        infoWindowRef.current = iw
      }

      marker.addListener('click', () => {
        openIW()
        onMarkerClick?.(crm.id)
      })

      markerMapRef.current[crm.id] = { marker, openIW, onPassage: crm.onPassage }
    })

    if (hasPoints) {
      if (Object.keys(markerMapRef.current).length === 1) {
        mapRef.current.setCenter(bounds.getCenter())
        mapRef.current.setZoom(13)
      } else {
        mapRef.current.fitBounds(bounds, 72)
      }
    }
  }, [nearby, mapReady])

  useEffect(() => {
    if (!mapReady) return
    Object.entries(markerMapRef.current).forEach(([id, { marker, onPassage }]) => {
      const highlighted = id === hoveredId || id === selectedId
      const icons = iconsRef.current?.[onPassage ? 'passage' : 'plain']
      marker.setIcon(highlighted ? icons?.active : icons?.normal)
      marker.setZIndex(highlighted ? 999 : 1)
    })
  }, [hoveredId, selectedId, mapReady])

  useEffect(() => {
    if (!mapReady) return
    if (selectedId != null) {
      const entry = markerMapRef.current[selectedId]
      if (entry) {
        entry.openIW()
        mapRef.current?.panTo(entry.marker.getPosition())
      }
    } else {
      infoWindowRef.current?.close()
    }
  }, [selectedId, mapReady])

  return <div ref={containerRef} className="w-full h-full" />
}

// ── DetailModal ───────────────────────────────────────────────────────────────

function DetailModal({ crm, onAdd, addingId, onClose }) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const hasPhotos = crm.photos?.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm px-0 sm:px-4" onClick={onClose}>
      <div className="bg-surface rounded-t-2xl sm:rounded-2xl border border-line w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {hasPhotos ? (
          <div className="relative flex-shrink-0 bg-canvas" style={{ height: 220 }}>
            <img src={crm.photos[photoIdx]} alt={crm.name} className="w-full h-full object-cover" />
            {crm.photos.length > 1 && (
              <>
                <button onClick={() => setPhotoIdx(i => (i - 1 + crm.photos.length) % crm.photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink/40 hover:bg-ink/60 text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => setPhotoIdx(i => (i + 1) % crm.photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink/40 hover:bg-ink/60 text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {crm.photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
            <button onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink/40 hover:bg-ink/60 text-white flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-6 pt-5">
            <div />
            <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className="px-6 py-5 space-y-4">
          <div>
            <h2 className="font-display text-2xl text-ink leading-tight">{crm.name}</h2>
            {crm.rating && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="font-sans text-sm font-bold text-ink">{crm.rating.toFixed(1)}</span>
                <StarRating rating={crm.rating} />
                {crm.userRatingCount && <span className="font-sans text-xs text-muted">({crm.userRatingCount.toLocaleString()} reviews)</span>}
                {crm.primaryType && <span className="font-sans text-xs text-muted">· {crm.primaryType}</span>}
              </div>
            )}
            {crm.openNow !== null && (
              <p className={`font-sans text-xs font-medium mt-1 ${crm.openNow ? 'text-sage' : 'text-danger'}`}>
                {crm.openNow ? 'Open now' : 'Closed'}
              </p>
            )}
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            {crm.location && (
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div>
                  <p className="font-sans text-sm text-ink">{crm.location}</p>
                  {crm.distance && <p className="font-sans text-xs text-muted mt-0.5">{crm.distance} away</p>}
                </div>
              </div>
            )}
            {crm.phone && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href={`tel:${crm.phone}`} className="font-sans text-sm text-primary hover:underline">{crm.phone}</a>
              </div>
            )}
            {crm.website && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <a href={crm.website} target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-primary hover:underline truncate">
                  {crm.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
            {crm.weekdayDescriptions?.length > 0 && (
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="space-y-0.5">
                  {crm.weekdayDescriptions.map((d, i) => <p key={i} className="font-sans text-xs text-muted">{d}</p>)}
                  <p className="font-sans text-[10px] text-muted/60 mt-1 italic">Hours may vary on holidays or special occasions.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-line bg-canvas">
          <button onClick={() => { onAdd(crm); onClose() }} disabled={addingId === crm.id}
            className="w-full bg-primary text-white font-sans text-sm font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
            {addingId === crm.id ? 'Adding…' : '+ Add to Partners'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── NearbyDiscovery — split panel ─────────────────────────────────────────────

function NearbyDiscovery({ nearby, nearbyLoading, userLocation, locationError, search, setSearch, onAdd, addingId }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [detailCrm, setDetailCrm] = useState(null)
  const listRef = useRef(null)
  const itemRefs = useRef({})
  const clickTimerRef = useRef(null)

  useEffect(() => { loadMapsLib().catch(err => console.error('Maps SDK failed to load:', err)) }, [])

  const filtered = search
    ? nearby.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.city ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : nearby

  function handleItemClick(crm) {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      setDetailCrm(crm)
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null
        setSelectedId(crm.id)
      }, 280)
    }
  }

  function handleMarkerClick(id) {
    setSelectedId(id)
    const el = itemRefs.current[id]
    if (el && listRef.current) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {detailCrm && (
        <DetailModal crm={detailCrm} onAdd={onAdd} addingId={addingId} onClose={() => setDetailCrm(null)} />
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden border-b border-line">

        {/* ── Left: list ─────────────────────────────────────────────────── */}
        <div className="w-[300px] flex-shrink-0 flex flex-col bg-surface border-r border-line">

          <div ref={listRef} className="flex-1 overflow-y-auto">
            {nearbyLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-line border-t-ink rounded-full animate-spin" />
              </div>
            ) : !userLocation && !locationError ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-5 h-5 border-2 border-line border-t-ink rounded-full animate-spin mb-3" />
                <p className="font-sans text-sm text-muted">Getting your location…</p>
              </div>
            ) : locationError ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <svg className="w-8 h-8 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <p className="font-sans text-sm font-medium text-ink">Location access required</p>
                <p className="font-sans text-xs text-muted mt-1">Enable location in your browser to find nearby crematoriums.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <p className="font-sans text-sm text-muted">No crematoriums found nearby.</p>
                <p className="font-sans text-xs text-muted mt-1 opacity-70">Try searching by name or city.</p>
              </div>
            ) : (
              filtered.map((crm, i) => (
                <div key={crm.id}
                  ref={el => { itemRefs.current[crm.id] = el }}
                  onMouseEnter={() => setHoveredId(crm.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleItemClick(crm)}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-line transition-colors cursor-pointer border-l-2 ${
                    selectedId === crm.id ? 'bg-canvas border-l-ink' : 'border-l-transparent hover:bg-canvas/40'
                  }`}
                >
                  

                  <div className="min-w-0 flex-1">
                    <p className="font-sans font-semibold text-xs text-ink leading-snug">{crm.name}</p>
                    {crm.rating ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-sans text-[11px] font-bold text-ink">{crm.rating.toFixed(1)}</span>
                        <StarRating rating={crm.rating} small />
                        {crm.userRatingCount && <span className="font-sans text-[10px] text-muted">({crm.userRatingCount.toLocaleString()})</span>}
                        {crm.primaryType && <span className="font-sans text-[10px] text-muted">· {crm.primaryType}</span>}
                      </div>
                    ) : null}
                    <p className="font-sans text-[11px] text-muted mt-0.5 line-clamp-1">{crm.location || '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {crm.openNow !== null && (
                        <span className={`font-sans text-[10px] font-medium ${crm.openNow ? 'text-sage' : 'text-danger'}`}>
                          {crm.openNow ? 'Open' : 'Closed'}
                        </span>
                      )}
                      {crm.distance && <span className="font-sans text-[10px] text-muted">{crm.distance} away</span>}
                      {crm.onPassage && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded bg-sage-light font-sans text-[9px] font-bold text-sage uppercase tracking-wider">
                          On Passage
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!nearbyLoading && filtered.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-line bg-canvas flex items-center justify-between">
              <p className="font-sans text-[11px] text-muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-sans text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />Passage Network</span>
                <span className="flex items-center gap-1 font-sans text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-ink/30 inline-block" />Directory</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: map ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-canvas">
          <MapView
            nearby={filtered}
            userLocation={userLocation}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onMarkerClick={handleMarkerClick}
            onMapClick={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CrematoriumsPage({ onAddPartner }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('partners')
  const [crematoriums, setCrematoriums] = useState([])
  const [nearby, setNearby] = useState([])
  const [loading, setLoading] = useState(true)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(false)
  const [editing, setEditing] = useState(null)
  const [disconnecting, setDisconnecting] = useState(null)
  const [addingId, setAddingId] = useState(null)
  const [selectedPartner, setSelectedPartner] = useState(null)

  useEffect(() => {
    fetchCrematoriums().then(setCrematoriums).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError(true),
    )
  }, [])

  useEffect(() => {
    if (!userLocation) return
    setNearbyLoading(true)
    fetchNearbyCrematoriums(userLocation.lat, userLocation.lng)
      .then(setNearby).catch(console.error).finally(() => setNearbyLoading(false))
  }, [userLocation])

  // Keep selectedPartner in sync if it gets edited
  useEffect(() => {
    if (!selectedPartner) return
    const updated = crematoriums.find(c => c.id === selectedPartner.id)
    if (updated) setSelectedPartner(updated)
  }, [crematoriums])

  function handleSaved(updated) {
    setCrematoriums(prev => prev.map(c => c.id === updated.id ? updated : c))
    setEditing(null)
  }

  function handleDisconnected(id) {
    setCrematoriums(prev => prev.filter(c => c.id !== id))
    setDisconnecting(null)
    if (selectedPartner?.id === id) setSelectedPartner(null)
  }

  async function handleAdd(crm) {
    setAddingId(crm.id)
    try {
      const created = await createCrematorium({
        name: crm.name, location: crm.location, streetAddress: crm.streetAddress,
        city: crm.city, state: crm.state, zip: crm.zip, phone: crm.phone,
        website: crm.website, rating: crm.rating, userRatingCount: crm.userRatingCount,
        weekdayDescriptions: crm.weekdayDescriptions,
      })
      setCrematoriums(prev => [...prev, created])
      setNearby(prev => prev.filter(n => n.id !== crm.id))
    } catch (err) {
      console.error(err)
    } finally {
      setAddingId(null)
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="font-sans text-sm text-muted">Loading…</p>
    </div>
  )

  // ── Detail page ───────────────────────────────────────────────────────────
  if (selectedPartner) {
    return (
      <>
        {editing && <EditModal crm={editing} onSave={handleSaved} onClose={() => setEditing(null)} />}
        {disconnecting && <DisconnectModal crm={disconnecting} onConfirm={handleDisconnected} onClose={() => setDisconnecting(null)} />}
        <PartnerDetailPage
          crm={selectedPartner}
          onBack={() => setSelectedPartner(null)}
          onEdit={setEditing}
          onRemove={crm => { setDisconnecting(crm) }}
        />
      </>
    )
  }

  // ── List / Find page ──────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {editing && <EditModal crm={editing} onSave={handleSaved} onClose={() => setEditing(null)} />}
      {disconnecting && <DisconnectModal crm={disconnecting} onConfirm={handleDisconnected} onClose={() => setDisconnecting(null)} />}

      {/* Header — matches CasesPage two-row layout */}
      <div className="border-b border-line bg-surface/80 backdrop-blur shrink-0 relative z-10">
        {/* Row 1: title + toggle */}
        <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <PageTitle className="leading-none">Partners</PageTitle>
          </div>

          
        </div>

        {/* Row 2: search — placeholder changes by tab */}
        <div className="px-6 pb-3 flex items-end justify-between gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'partners' ? 'Search partners…' : 'Search nearby…'}
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-line bg-white text-[13px] text-ink font-sans placeholder:text-muted outline-none focus:border-ink/60 transition"
            />
          </div>
          {/* Tab toggle — Cases-style segment control */}
          <div className="flex bg-surface border border-line rounded-lg p-0.5 h-9 mt-1 shrink-0">
            <button
              onClick={() => { setTab('partners'); setSearch('') }}
              className={`px-3 rounded-md font-sans text-[12px] flex items-center cursor-pointer transition ${
                tab === 'partners'
                  ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              Your Partners
            </button>
            <button
              onClick={() => { setTab('find'); setSearch('') }}
              className={`px-3 rounded-md font-sans text-[12px] flex items-center cursor-pointer transition ${
                tab === 'find'
                  ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              Find a Partner
            </button>
          </div>
        </div>
        
      </div>

      {/* Content */}
      {tab === 'partners' && (
        <PartnersList
          crematoriums={crematoriums}
          search={search}
          onSelect={setSelectedPartner}
        />
      )}

      {tab === 'find' && (
        <div className="flex flex-col flex-1 min-h-0">
          <NearbyDiscovery
            nearby={nearby}
            nearbyLoading={nearbyLoading}
            userLocation={userLocation}
            locationError={locationError}
            search={search}
            setSearch={setSearch}
            onAdd={handleAdd}
            addingId={addingId}
          />
          <footer className="flex-shrink-0 bg-surface border-t border-line px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-sans text-sm font-medium text-ink">Don&rsquo;t see yours?</p>
              <p className="font-sans text-xs text-muted mt-0.5">Manually add a crematorium that isn&rsquo;t in our directory.</p>
            </div>
            <Button variant="primary" onClick={onAddPartner}>+ Add New</Button>
          </footer>
        </div>
      )}
    </div>
  )
}
