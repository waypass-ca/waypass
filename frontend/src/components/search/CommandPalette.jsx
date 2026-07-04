import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft } from 'lucide-react'
import { globalSearch } from '../../lib/api.js'

const TYPES = {
  case:         { label: 'Case',             resultKey: 'cases' },
  crematorium:  { label: 'Crematorium',      resultKey: 'crematoriums' },
  shipping:     { label: 'Shipping Partner', resultKey: 'shippingPartners' },
  booking:      { label: 'Booking',          resultKey: 'bookings' },
  inbox:        { label: 'Inbox',            resultKey: 'inbox' },
}

const TYPE_ORDER = ['case', 'crematorium', 'shipping', 'booking', 'inbox']

const EMPTY_RESULTS = { cases: [], crematoriums: [], shippingPartners: [], bookings: [], inbox: [] }

// Higher score = better match. Falls back to 1 so backend-included rows still rank above nothing.
function scoreRow(row, q) {
  const label = (row.label ?? '').toLowerCase()
  const sub = (row.sublabel ?? '').toLowerCase()
  if (!label && !sub) return 1
  if (label === q) return 200
  if (label.startsWith(q)) return 100
  if (label.includes(q)) return 60
  if (sub.startsWith(q)) return 30
  if (sub.includes(q)) return 20
  return 1
}

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const requestIdRef = useRef(0)
  const rowRefs = useRef([])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setResults(EMPTY_RESULTS)
    setActiveIndex(0)
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const term = query.trim()
    if (!term) {
      setResults(EMPTY_RESULTS)
      setLoading(false)
      return
    }
    setLoading(true)
    const rid = ++requestIdRef.current
    const t = setTimeout(async () => {
      try {
        const data = await globalSearch(term)
        if (rid !== requestIdRef.current) return
        setResults(data ?? EMPTY_RESULTS)
      } catch {
        if (rid === requestIdRef.current) setResults(EMPTY_RESULTS)
      } finally {
        if (rid === requestIdRef.current) setLoading(false)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [query, open])

  const rankedRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const rows = []
    for (const typeKey of TYPE_ORDER) {
      const { resultKey, label } = TYPES[typeKey]
      for (const item of results[resultKey] ?? []) {
        rows.push({
          ...item,
          type: typeKey,
          typeLabel: label,
          score: scoreRow(item, q),
        })
      }
    }
    // Sort by score desc; TYPE_ORDER (declaration order) breaks ties naturally
    // because Array.sort is stable in modern JS engines.
    rows.sort((a, b) => b.score - a.score)
    return rows
  }, [results, query])

  useEffect(() => { setActiveIndex(0) }, [rankedRows.length])

  useEffect(() => {
    const el = rowRefs.current[activeIndex]
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  function handleSelect(row) {
    if (!row?.href) return
    onClose()
    navigate(row.href)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (rankedRows.length === 0) return
      setActiveIndex(i => (i + 1) % rankedRows.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (rankedRows.length === 0) return
      setActiveIndex(i => (i - 1 + rankedRows.length) % rankedRows.length)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (rankedRows[activeIndex]) handleSelect(rankedRows[activeIndex])
      return
    }
  }

  const trimmed = query.trim()
  const hasAnyResults = rankedRows.length > 0

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/40 pt-[15vh] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line">
          <Search size={16} className="text-muted flex-shrink-0" strokeWidth={1.8} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search cases, partners, bookings…"
            className="flex-1 bg-transparent outline-none font-sans text-[14px] text-ink placeholder:text-muted"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <span className="font-sans text-[11px] text-muted">Searching…</span>
          )}
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {!trimmed && (
            <div className="px-4 py-6 text-center font-sans text-[12px] text-muted">
              Type to search across cases, partners, bookings, and inbox.
            </div>
          )}

          {trimmed && !loading && !hasAnyResults && (
            <div className="px-4 py-6 text-center font-sans text-[12px] text-muted">
              No matches for "{trimmed}".
            </div>
          )}

          {trimmed && hasAnyResults && rankedRows.map((row, idx) => {
            const isActive = idx === activeIndex
            return (
              <button
                key={`${row.type}-${row.id}`}
                ref={el => { rowRefs.current[idx] = el }}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleSelect(row)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer border-0 outline-none transition-colors ${
                  isActive ? 'bg-ink/[0.06]' : 'bg-transparent hover:bg-ink/[0.04]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-[13px] text-ink truncate">{row.label}</div>
                  {row.sublabel && (
                    <div className="font-sans text-[11px] text-muted truncate">{row.sublabel}</div>
                  )}
                </div>
                <span className="font-sans text-[10px] font-medium uppercase tracking-wider text-primary bg-primary-light px-1.5 py-0.5 rounded flex-shrink-0">
                  {row.typeLabel}
                </span>
                {isActive && (
                  <CornerDownLeft size={12} className="text-muted flex-shrink-0" strokeWidth={1.8} />
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-line bg-canvas font-sans text-[10px] text-muted">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-px rounded bg-white border border-line text-[9px]">↑</kbd> <kbd className="px-1 py-px rounded bg-white border border-line text-[9px]">↓</kbd> navigate</span>
            <span><kbd className="px-1 py-px rounded bg-white border border-line text-[9px]">↵</kbd> open</span>
            <span><kbd className="px-1 py-px rounded bg-white border border-line text-[9px]">esc</kbd> close</span>
          </div>
          <span>
            <kbd className="px-1 py-px rounded bg-white border border-line text-[9px]">⌘K</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}
