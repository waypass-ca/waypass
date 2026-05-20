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
  { elementType: 'geometry', stylers: [{ color: '#f5f0ea' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3d3530' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0ea' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#5a4e48' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e8e0d4' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#ddd5c8' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9e8e82' }] },
  { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d8c8b0' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#c8b89e' }] },
  { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c4d4de' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8aaabb' }] },
]

function makeMarkerIcon(onPassage, active = false) {
  const body = active ? '#1a1210' : (onPassage ? '#5a7060' : '#2c2522')
  const dot = onPassage ? '#ddeedd' : '#f5f0ea'
  const w = active ? 34 : 28
  const h = active ? 44 : 36
  const cx = w / 2
  const cy = w / 2
  const r = active ? 6.5 : 5.5
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <path d="M${cx} 0C${cx * 0.448} 0 0 ${cy * 0.448} 0 ${cy}c0 ${cy * 0.69} ${cx} ${h - cy} ${cx} ${h - cy}S${w} ${cy + cy * 0.69} ${w} ${cy}C${w} ${cy * 0.448} ${cx + cx * 0.552} 0 ${cx} 0z" fill="${body}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${dot}" fill-opacity="0.92"/>
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

function MapView({ nearby, userLocation, activeId, onMarkerClick }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerMapRef = useRef({})
  const infoWindowRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  // Init map — poll until google.maps is available
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
      setMapReady(true)
      clearInterval(interval)
    }
    tryInit()
    if (!mapRef.current) interval = setInterval(tryInit, 150)
    return () => clearInterval(interval)
  }, [])

  // Pan to user location
  useEffect(() => {
    if (mapRef.current && userLocation) mapRef.current.panTo(userLocation)
  }, [userLocation])

  // Rebuild markers when nearby changes
  useEffect(() => {
    if (!mapReady || !window.google?.maps) return
    Object.values(markerMapRef.current).forEach(m => m.setMap(null))
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
        title: crm.name,
        icon: makeMarkerIcon(crm.onPassage, false),
      })

      marker.addListener('click', () => {
        if (infoWindowRef.current) infoWindowRef.current.close()
        const iw = new window.google.maps.InfoWindow({
          content: `<div style="font-family:'DM Sans',sans-serif;padding:6px 2px 2px;min-width:160px">
            <p style="font-weight:600;font-size:13px;margin:0 0 3px;color:#2c2522;line-height:1.3">${crm.name}</p>
            <p style="font-size:11px;color:#9e8e82;margin:0;line-height:1.4">${crm.location}</p>
            ${crm.onPassage ? '<span style="display:inline-flex;align-items:center;margin-top:6px;font-size:10px;font-weight:700;color:#5a7060;background:#edf2ee;padding:2px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:0.06em">On Passage</span>' : ''}
          </div>`,
          pixelOffset: new window.google.maps.Size(0, -4),
        })
        iw.open({ map: mapRef.current, anchor: marker })
        infoWindowRef.current = iw
        onMarkerClick?.(crm.id)
      })

      markerMapRef.current[crm.id] = marker
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

  // Update active marker icon when activeId changes
  useEffect(() => {
    if (!mapReady || !window.google?.maps) return
    nearby.forEach(crm => {
      const marker = markerMapRef.current[crm.id]
      if (!marker) return
      const isActive = crm.id === activeId
      marker.setIcon(makeMarkerIcon(crm.onPassage, isActive))
      marker.setZIndex(isActive ? 999 : 1)
    })
  }, [activeId, mapReady])

  return <div ref={containerRef} className="w-full h-full" />
}

// ── NearbyDiscovery — split panel ─────────────────────────────────────────────

function NearbyDiscovery({ nearby, nearbyLoading, userLocation, search, setSearch, onAdd, addingId }) {
  const [activeId, setActiveId] = useState(null)
  const listRef = useRef(null)
  const itemRefs = useRef({})

  function handleMarkerClick(id) {
    setActiveId(id)
    const el = itemRefs.current[id]
    if (el && listRef.current) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div>
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
              <input
                type="text"
                placeholder="Search nearby…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-canvas border border-line rounded-lg pl-8 pr-7 py-2 font-sans text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-muted hover:text-ink transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
              nearby.map((crm, i) => {
                const isActive = crm.id === activeId
                return (
                  <div
                    key={crm.id}
                    ref={el => { itemRefs.current[crm.id] = el }}
                    onMouseEnter={() => setActiveId(crm.id)}
                    onMouseLeave={() => setActiveId(null)}
                    className={`flex items-start gap-3 px-4 py-3.5 border-b border-line transition-colors cursor-default border-l-2 ${
                      isActive ? 'bg-canvas border-l-ink' : 'border-l-transparent hover:bg-canvas/40'
                    }`}
                  >
                    {/* Index number */}
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 text-[10px] font-bold transition-colors ${
                      isActive ? 'bg-ink text-surface' : 'bg-canvas border border-line text-muted'
                    }`}>
                      {i + 1}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="font-sans font-semibold text-xs text-ink leading-snug">{crm.name}</p>
                          <p className="font-sans text-[11px] text-muted mt-0.5 leading-relaxed line-clamp-2">{crm.location || '—'}</p>
                          {crm.onPassage && (
                            <span className="inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded bg-sage-light font-sans text-[9px] font-bold text-sage uppercase tracking-wider">
                              On Passage
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onAdd(crm)}
                          disabled={addingId === crm.id}
                          className="flex-shrink-0 px-2 py-1 rounded border border-line font-sans text-[10px] font-medium text-ink hover:bg-surface hover:border-ink/20 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          {addingId === crm.id ? '…' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {!nearbyLoading && nearby.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-line bg-canvas flex items-center justify-between">
              <p className="font-sans text-[11px] text-muted">{nearby.length} result{nearby.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-sans text-[10px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />On Passage
                </span>
                <span className="flex items-center gap-1 font-sans text-[10px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/30 inline-block" />Google
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: map ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-canvas">
          <MapView
            nearby={nearby}
            userLocation={userLocation}
            activeId={activeId}
            onMarkerClick={handleMarkerClick}
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
        rightSlot={<Button variant="primary" onClick={onAddPartner}>+ Add Partner</Button>}
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
