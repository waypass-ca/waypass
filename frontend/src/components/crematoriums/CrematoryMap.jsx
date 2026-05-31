import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { PASSAGE_MAP_STYLE } from '../../lib/mapStyles.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

// Pin colors
const PIN_GOLD   = '#c9a96e'  // Passage network
const PIN_SLATE  = '#4a5568'  // Non-network
const PIN_BLUE   = '#3b82f6'  // Funeral home location

function makePinSvg(color, size = 28) {
  const h = Math.round(size * 38 / 28)
  const cx = size / 2
  const cy = Math.round(size * 12.5 / 28)
  const ringR = Math.round(size * 5.5 / 28)
  const dotR  = Math.round(size * 2.5 / 28)
  return encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 ${size} ${h}">
      <path d="M${cx} 1C${(cx - 12).toFixed(1)} 1 2 ${(cy - 11).toFixed(1)} 2 ${cy}c0 ${Math.round(size * 0.75)} ${cx - 2} ${Math.round(size * 0.875)} ${cx - 2} ${Math.round(size * 0.875)}S${size - 2} ${cy + Math.round(size * 0.75)} ${size - 2} ${cy}C${size - 2} ${(cy - 11).toFixed(1)} ${(cx + 12).toFixed(1)} 1 ${cx} 1z" fill="${color}"/>
      <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="white"/>
      <circle cx="${cx}" cy="${cy}" r="${dotR}" fill="${color}"/>
    </svg>`
  )
}

function makeMarkerIcon(google, color, size = 28) {
  const h = Math.round(size * 38 / 28)
  const cx = size / 2
  return {
    url: `data:image/svg+xml;charset=utf-8,${makePinSvg(color, size)}`,
    scaledSize: new google.maps.Size(size, h),
    anchor: new google.maps.Point(cx, h),
  }
}

// ── Sidebar list item ─────────────────────────────────────────────────────────

function SidebarItem({ crematory, active, onClick, id }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-3 border-b border-line transition-colors',
        active ? 'bg-amber/10' : 'hover:bg-surface',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-sans text-sm font-medium text-ink truncate">{crematory.name}</p>
          {crematory.address && (
            <p className="font-sans text-xs text-muted mt-0.5 truncate">{crematory.address}</p>
          )}
          {crematory.distance_miles != null && (
            <p className="font-sans text-xs text-muted mt-0.5">{crematory.distance_miles} mi away</p>
          )}
        </div>
        {crematory.is_passage_network && (
          <span className="shrink-0 mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-sans bg-amber/15 text-amber-700">
            Passage
          </span>
        )}
      </div>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * CrematoryMap
 *
 * Props:
 *   onSelect(crematory)       — called when user clicks "Select" in an info window
 *   funeralHomeLocation       — { lat, lng, name? } — renders a blue pin + fitBounds
 */
export function CrematoryMap({ onSelect, funeralHomeLocation }) {
  const mapRef      = useRef(null)
  const googleRef   = useRef(null)
  const mapInstance = useRef(null)
  const markersRef  = useRef(new Map())
  const infoRef     = useRef(null)
  const fhMarkerRef = useRef(null)

  const [crematories, setCrematories]     = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [activeId, setActiveId]           = useState(null)

  // Filters
  const [stateFilter, setStateFilter]         = useState('')
  const [cityFilter, setCityFilter]           = useState('')
  const [networkOnly, setNetworkOnly]         = useState(false)

  // Derived state list
  const states = [...new Set(crematories.map(c => c.state).filter(Boolean))].sort()

  // ── Fetch crematories ──────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams()
    if (stateFilter) params.set('state', stateFilter)
    if (cityFilter)  params.set('city', cityFilter)
    if (networkOnly) params.set('is_passage_network', 'true')

    fetch(`${API_URL}/api/crematoriums/db?${params}`)
      .then(r => { if (!r.ok) throw new Error('Failed to load crematoriums'); return r.json() })
      .then(data => {
        setCrematories(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [stateFilter, cityFilter, networkOnly])

  // ── Load Maps SDK ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!MAPS_KEY) {
      setError('VITE_GOOGLE_MAPS_API_KEY is not set')
      return
    }
    const loader = new Loader({ apiKey: MAPS_KEY, version: 'weekly', libraries: ['maps', 'marker'] })
    loader.importLibrary('maps').then(({ Map, InfoWindow }) => {
      googleRef.current = window.google

      const map = new Map(mapRef.current, {
        center: funeralHomeLocation ?? { lat: 39.5, lng: -98.35 },
        zoom: funeralHomeLocation ? 10 : 4,
        styles: PASSAGE_MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      })
      mapInstance.current = map
      infoRef.current = new InfoWindow()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Place/update markers when crematories or map ready ────────────────────
  const openInfoWindow = useCallback((crematory, marker) => {
    if (!infoRef.current || !mapInstance.current) return
    setActiveId(crematory.id)

    const content = `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 240px; padding: 4px 0;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <strong style="font-size:14px;color:#1a1a1a;line-height:1.3;">${crematory.name}</strong>
          ${crematory.is_passage_network
            ? `<span style="background:#fef3c7;color:#92400e;font-size:10px;padding:2px 6px;border-radius:4px;white-space:nowrap;">Passage</span>`
            : ''}
        </div>
        ${crematory.address ? `<p style="font-size:12px;color:#6b7280;margin:0 0 4px;">${crematory.address}</p>` : ''}
        ${crematory.phone   ? `<p style="font-size:12px;color:#6b7280;margin:0 0 4px;">📞 ${crematory.phone}</p>` : ''}
        ${crematory.website ? `<p style="font-size:12px;margin:0 0 8px;"><a href="${crematory.website}" target="_blank" rel="noopener" style="color:#3b82f6;">${crematory.website.replace(/^https?:\/\//, '')}</a></p>` : ''}
        ${crematory.passage_tier ? `<p style="font-size:11px;color:#6b7280;margin:0 0 8px;">Tier: ${crematory.passage_tier}</p>` : ''}
        <button
          id="crm-select-${crematory.id}"
          style="width:100%;padding:6px 12px;background:#c9a96e;color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;"
        >Select</button>
      </div>`

    infoRef.current.setContent(content)
    infoRef.current.open(mapInstance.current, marker)

    // Attach select button listener after InfoWindow DOM renders
    window.google.maps.event.addListenerOnce(infoRef.current, 'domready', () => {
      document.getElementById(`crm-select-${crematory.id}`)
        ?.addEventListener('click', () => {
          onSelect?.(crematory)
          infoRef.current.close()
        })
    })
  }, [onSelect])

  useEffect(() => {
    if (!mapInstance.current || !googleRef.current) return

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current.clear()

    const google = googleRef.current
    const bounds = new google.maps.LatLngBounds()

    crematories.forEach(crematory => {
      if (!crematory.lat || !crematory.lng) return

      const color  = crematory.is_passage_network ? PIN_GOLD : PIN_SLATE
      const marker = new google.maps.Marker({
        position: { lat: crematory.lat, lng: crematory.lng },
        map: mapInstance.current,
        title: crematory.name,
        icon: makeMarkerIcon(google, color),
      })

      marker.addListener('click', () => openInfoWindow(crematory, marker))
      markersRef.current.set(crematory.id, marker)
      bounds.extend({ lat: crematory.lat, lng: crematory.lng })
    })

    // Funeral home location pin (blue)
    if (fhMarkerRef.current) {
      fhMarkerRef.current.setMap(null)
      fhMarkerRef.current = null
    }
    if (funeralHomeLocation?.lat && funeralHomeLocation?.lng) {
      fhMarkerRef.current = new google.maps.Marker({
        position: { lat: funeralHomeLocation.lat, lng: funeralHomeLocation.lng },
        map: mapInstance.current,
        title: funeralHomeLocation.name ?? 'Your Location',
        icon: makeMarkerIcon(google, PIN_BLUE, 32),
        zIndex: 999,
      })
      bounds.extend({ lat: funeralHomeLocation.lat, lng: funeralHomeLocation.lng })
    }

    if (!bounds.isEmpty() && crematories.length > 0) {
      mapInstance.current.fitBounds(bounds, 60)
    }
  }, [crematories, funeralHomeLocation, openInfoWindow])

  // ── Scroll sidebar to active item ─────────────────────────────────────────
  const scrollToItem = useCallback((id) => {
    document.getElementById(`crm-item-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  useEffect(() => {
    if (activeId) scrollToItem(activeId)
  }, [activeId, scrollToItem])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-line bg-canvas">
      {/* Sidebar */}
      <div className="flex flex-col w-72 shrink-0 border-r border-line overflow-hidden">
        {/* Filters */}
        <div className="p-3 border-b border-line space-y-2 bg-surface">
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="w-full font-sans text-sm border border-line rounded-lg px-3 py-1.5 bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink/20"
          >
            <option value="">All states</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="text"
            placeholder="Filter by city…"
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="w-full font-sans text-sm border border-line rounded-lg px-3 py-1.5 bg-canvas text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={networkOnly}
              onChange={e => setNetworkOnly(e.target.checked)}
              className="rounded border-line accent-amber-600"
            />
            <span className="font-sans text-sm text-ink">Passage network only</span>
          </label>
        </div>

        {/* Count */}
        <div className="px-4 py-2 border-b border-line">
          <p className="font-sans text-xs text-muted">{crematories.length} crematoriums</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32 text-muted font-sans text-sm">Loading…</div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32 text-red-500 font-sans text-sm px-4 text-center">{error}</div>
          )}
          {!loading && !error && crematories.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted font-sans text-sm">No results</div>
          )}
          {!loading && !error && crematories.map(crm => (
            <SidebarItem
              key={crm.id}
              id={`crm-item-${crm.id}`}
              crematory={crm}
              active={activeId === crm.id}
              onClick={() => {
                setActiveId(crm.id)
                if (mapInstance.current && crm.lat && crm.lng) {
                  mapInstance.current.panTo({ lat: crm.lat, lng: crm.lng })
                  mapInstance.current.setZoom(13)
                }
                const marker = markersRef.current.get(crm.id)
                if (marker) openInfoWindow(crm, marker)
              }}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {error && !mapInstance.current && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface text-muted font-sans text-sm">{error}</div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  )
}
