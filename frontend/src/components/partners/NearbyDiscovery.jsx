import { useState, useRef, useEffect } from 'react'
import { loadMapsLib } from '../../lib/api.js'
import { StarRating } from '../ui/StarRating.jsx'
import { DetailModal } from './DetailModal.jsx'
import { MapView } from './MapView.jsx'
import { FEATURES } from '../../lib/features.js'

export function NearbyDiscovery({ nearby, nearbyLoading, userLocation, locationError, search, setSearch, onAdd }) {
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
        <DetailModal crm={detailCrm} onAdd={onAdd} onClose={() => setDetailCrm(null)} />
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden border-b border-line">

        {/* Left: list */}
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
              filtered.map(crm => (
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

        {/* Right: map */}
        {FEATURES.googleMaps && (
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
        )}
      </div>
    </div>
  )
}
