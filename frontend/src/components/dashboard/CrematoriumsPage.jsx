import { useState, useEffect, useRef } from 'react'
import {
  fetchCrematoriums, createCrematorium, updateCrematorium,
  connectCrematorium, disconnectCrematorium, fetchNearbyCrematoriums,
} from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PageHeader } from '../layout/PageHeader'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

// ── Passage map style ─────────────────────────────────────────────────────────

const PASSAGE_MAP_STYLE = [
  // Declutter — keep Google's base colors, strip noise
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  // Slightly lighten roads for a cleaner, modern feel
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ lightness: 20 }, { saturation: -30 }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ lightness: 10 }] },
  // Refine water to a cooler, more modern blue
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a0c4d8' }, { lightness: 5 }] },
  // Subtle label tone to match DM Sans weight — charcoal-adjacent
  { elementType: 'labels.text.fill', stylers: [{ color: '#3a3a3a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 2 }] },
]

function makeMarkerIcon(onPassage, active = false) {
  const fill  = active
    ? (onPassage ? '#2e4a35' : '#1e3a6e')
    : (onPassage ? '#5a7060' : '#4A72B8')
  const ring  = 'white'

  // Normal 28×38, active 34×46
  const w  = active ? 34 : 28
  const h  = active ? 46 : 38
  const cx = w / 2

  // Paths hand-tuned for clean modern proportions
  const path = active
    ? `M17 1C8.72 1 2 7.72 2 16c0 10.8 15 29 15 29S32 26.8 32 16C32 7.72 25.28 1 17 1z`
    : `M14 1C7.37 1 2 6.37 2 13c0 8.8 12 24 12 24S26 21.8 26 13C26 6.37 20.63 1 14 1z`

  // Donut: white outer ring + fill-colored inner dot
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

// ── CompactCrematoriumCard ────────────────────────────────────────────────────

function CompactCrematoriumCard({ crm, onEdit, onRemove }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3 min-w-[220px] w-[220px] flex-shrink-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-sans font-semibold text-sm text-ink leading-tight truncate">{crm.name}</p>
          <p className="font-sans text-xs text-muted mt-0.5 truncate">{crm.location}{crm.distance ? ` · ${crm.distance}` : ''}</p>
        </div>
        <Badge variant={crm.status === 'active' ? 'primary' : 'red'}>{crm.status === 'active' ? 'Active' : 'Inactive'}</Badge>
      </div>
      {crm.phone && <p className="font-sans text-xs text-muted truncate">{crm.phone}</p>}
      <div className="flex gap-2 mt-auto">
        <button onClick={() => onEdit(crm)} className="flex-1 px-2 py-1.5 rounded-lg border border-line font-sans text-xs text-ink hover:bg-canvas transition-colors text-center">Edit</button>
        <button onClick={() => onRemove(crm)} className="flex-1 px-2 py-1.5 rounded-lg border border-line font-sans text-xs text-danger hover:bg-danger-tint transition-colors text-center">Remove</button>
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

      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        icon: makeMarkerIcon(crm.onPassage, false),
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

  // Hover — update icons only
  useEffect(() => {
    if (!mapReady) return
    Object.entries(markerMapRef.current).forEach(([id, { marker, onPassage }]) => {
      const highlighted = id === hoveredId || id === selectedId
      marker.setIcon(makeMarkerIcon(onPassage, highlighted))
      marker.setZIndex(highlighted ? 999 : 1)
    })
  }, [hoveredId, selectedId, mapReady])

  // Click — open info window + pan
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

function NearbyDiscovery({ nearby, nearbyLoading, userLocation, search, setSearch, onAdd, addingId }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [detailCrm, setDetailCrm] = useState(null)
  const listRef = useRef(null)
  const itemRefs = useRef({})
  const clickTimerRef = useRef(null)

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
    <div>
      {detailCrm && (
        <DetailModal crm={detailCrm} onAdd={onAdd} addingId={addingId} onClose={() => setDetailCrm(null)} />
      )}

      {/* Section heading */}
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className="font-display text-xl text-ink">Top crematoriums nearby</h2>
      </div>

      {/* Split panel */}
      <div className="flex rounded-xl overflow-hidden border border-line" style={{ height: 540 }}>

        {/* ── Left: list ─────────────────────────────────────────────────── */}
        <div className="w-[300px] flex-shrink-0 flex flex-col bg-surface border-r border-line">

          {/* Search */}
          <div className="flex-shrink-0 p-3 border-b border-line">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search nearby…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-canvas border border-line rounded-lg pl-8 pr-7 py-2 font-sans text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-muted hover:text-ink transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {nearbyLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-line border-t-ink rounded-full animate-spin" />
              </div>
            ) : nearby.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <p className="font-sans text-sm text-muted">No crematoriums found nearby.</p>
                <p className="font-sans text-xs text-muted mt-1 opacity-70">Try searching by name or city.</p>
              </div>
            ) : (
              nearby.map((crm, i) => (
                <div key={crm.id}
                  ref={el => { itemRefs.current[crm.id] = el }}
                  onMouseEnter={() => setHoveredId(crm.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleItemClick(crm)}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-line transition-colors cursor-pointer border-l-2 ${
                    selectedId === crm.id ? 'bg-canvas border-l-ink' : 'border-l-transparent hover:bg-canvas/40'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 text-[10px] font-bold transition-colors ${
                    selectedId === crm.id ? 'bg-ink text-surface' : 'bg-canvas border border-line text-muted'
                  }`}>
                    {i + 1}
                  </div>

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

          {/* Footer */}
          {!nearbyLoading && nearby.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-line bg-canvas flex items-center justify-between">
              <p className="font-sans text-[11px] text-muted">{nearby.length} result{nearby.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-sans text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />On Passage</span>
                <span className="flex items-center gap-1 font-sans text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-ink/30 inline-block" />Google</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: map ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-canvas">
          <MapView
            nearby={nearby}
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
  const [crematoriums, setCrematoriums] = useState([])
  const [nearby, setNearby] = useState([])
  const [loading, setLoading] = useState(true)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [editing, setEditing] = useState(null)
  const [disconnecting, setDisconnecting] = useState(null)
  const [addingId, setAddingId] = useState(null)

  useEffect(() => {
    fetchCrematoriums().then(setCrematoriums).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    )
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setNearbyLoading(true)
      fetchNearbyCrematoriums(userLocation?.lat ?? 0, userLocation?.lng ?? 0, search)
        .then(setNearby).catch(console.error).finally(() => setNearbyLoading(false))
    }, 400)
    return () => clearTimeout(t)
  }, [search, userLocation])

  function handleSaved(updated) {
    setCrematoriums(prev => prev.map(c => c.id === updated.id ? updated : c))
    setEditing(null)
  }

  function handleDisconnected(id) {
    setCrematoriums(prev => prev.filter(c => c.id !== id))
    setDisconnecting(null)
  }

  async function handleAdd(crm) {
    setAddingId(crm.id)
    try {
      if (crm.onPassage) {
        const connected = await connectCrematorium(crm.id)
        setCrematoriums(prev => [...prev, connected])
      } else {
        const created = await createCrematorium({ name: crm.name, location: crm.location, streetAddress: crm.streetAddress })
        setCrematoriums(prev => [...prev, created])
      }
      setNearby(prev => prev.filter(n => n.id !== crm.id))
    } catch (err) {
      console.error(err)
    } finally {
      setAddingId(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="font-sans text-sm text-muted">Loading…</p>
    </div>
  )

  return (
    <div className="space-y-8">
      {editing && <EditModal crm={editing} onSave={handleSaved} onClose={() => setEditing(null)} />}
      {disconnecting && <DisconnectModal crm={disconnecting} onConfirm={handleDisconnected} onClose={() => setDisconnecting(null)} />}

      <PageHeader
        title="Crematoriums"
        subtitle="Manage your cremation service partners"
      />

      {/* Section 1 — Your Crematoriums */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="font-display text-xl text-ink">Your crematoriums</h2>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-canvas border border-line font-sans text-[11px] font-semibold text-muted">
            {crematoriums.length}
          </span>
        </div>
        {crematoriums.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl px-6 py-10 text-center">
            <p className="font-sans text-sm text-muted">No connected crematoriums yet. Add one below.</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {crematoriums.map(crm => (
              <CompactCrematoriumCard key={crm.id} crm={crm} onEdit={setEditing} onRemove={setDisconnecting} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Nearby discovery */}
      <NearbyDiscovery
        nearby={nearby}
        nearbyLoading={nearbyLoading}
        userLocation={userLocation}
        search={search}
        setSearch={setSearch}
        onAdd={handleAdd}
        addingId={addingId}
      />

      {/* Section 3 — CTA */}
      <section className="bg-surface border border-line rounded-xl px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-sans text-sm font-medium text-ink">Don&rsquo;t see yours?</p>
          <p className="font-sans text-xs text-muted mt-0.5">Manually add a crematorium that isn&rsquo;t in our directory.</p>
        </div>
        <Button variant="primary" onClick={onAddPartner}>+ Add New</Button>
      </section>
    </div>
  )
}
