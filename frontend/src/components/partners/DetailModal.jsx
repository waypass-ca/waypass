import { useState } from 'react'
import { StarRating } from '../ui/StarRating.jsx'

export function DetailModal({ crm, onAdd, onClose }) {
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
          <button onClick={() => { onAdd(crm); onClose() }}
            className="w-full bg-primary text-white font-sans text-sm font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity cursor-pointer">
            + Add to Partners
          </button>
        </div>
      </div>
    </div>
  )
}
