import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Star, Search,
  Check, Archive, X, Mail, MailOpen, Clock, CheckCheck,
  Inbox, Filter, Undo2,
} from 'lucide-react'
import { InboxDetailPanel } from '../components/inbox/InboxDetailPanel'
import {
  fetchInbox, markInboxItemRead, markInboxItemUnread, markAllInboxRead, starInboxItem,
  archiveInboxItem, unarchiveInboxItem,
} from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { TYPE_CONFIG, formatScheduledFor } from '../components/notifications/notificationConfig.js'


const PAGE_SIZE = 50

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function shapeItem(raw) {
  return {
    id: raw.id,
    type: raw.type,
    read: raw.read,
    starred: raw.starred,
    from: raw.from,
    subject: raw.subject,
    preview: raw.preview,
    body: raw.body,
    time: formatTime(raw.createdAt),
    date: raw.createdAt ? raw.createdAt.slice(0, 10) : '',
    severity: raw.severity ?? null,
    caseId: raw.caseId ?? null,
    bookingId: raw.bookingId ?? null,
    scheduledFor: raw.scheduledFor ?? null,
    scheduledForLabel: formatScheduledFor(raw.scheduledFor),
    createdAt: raw.createdAt ?? null,
  }
}

const StarIcon = ({ filled, size = 14, className = '' }) =>
  filled
    ? <Star size={size} className={`[&_*]:fill-current [&_*]:stroke-current text-warning ${className}`} />
    : <Star size={size} className={`text-muted hover:text-warning ${className}`} />

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type]
  return (
    <span className={`inline-flex items-center gap-1.5 font-sans text-[10.5px] font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function TopBar({ search, setSearch, filters, setFilters, selected, onMarkAllRead, onMarkSelectedRead, onMarkSelectedUnread, onArchiveSelected, onClearSelected, totalCount, unreadCount }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const filterRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!filterOpen) return
    const h = e => {
      const inButton = filterRef.current?.contains(e.target)
      const inDropdown = dropdownRef.current?.contains(e.target)
      if (!inButton && !inDropdown) setFilterOpen(false)
    }
    const esc = e => { if (e.key === 'Escape') setFilterOpen(false) }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', esc)
    }
  }, [filterOpen])

  const toggleType = (type) => setFilters(f => {
    const types = new Set(f.types)
    types.has(type) ? types.delete(type) : types.add(type)
    return { ...f, types }
  })

  const setDatePreset = (id) => setFilters(f => ({ ...f, datePreset: f.datePreset === id ? '' : id }))
  const setReadStatus = (id) => setFilters(f => ({ ...f, readStatus: f.readStatus === id ? '' : id }))
  const clearAll = () => setFilters({ types: new Set(), datePreset: '', readStatus: '' })

  const filtersActive = filters.types.size + (filters.datePreset ? 1 : 0) + (filters.readStatus ? 1 : 0)

  return (
    <div className="border-b border-line bg-surface/80 backdrop-blur shrink-0">
      <div className="flex items-center gap-1.5 font-sans text-[11.5px] text-muted mb-1.5">
      </div>
      <div className="px-6 pt-5 pb-4 flex items-baseline gap-3">
        <h1 className="font-display font-light text-[30px] leading-none text-ink">Inbox</h1>
        <p className="font-sans text-[12.5px] text-muted ">
          {unreadCount > 0 ? `${unreadCount} unread · ` : ''}{totalCount} total
        </p>
      </div>

      <div className="px-6 pb-3 flex items-center gap-2">
        {selected.size > 0 ? (
          <div className="flex-1 flex items-center gap-2">
            <span className="font-sans text-[12.5px] text-secondary">{selected.size} selected</span>
            <button
              onClick={onMarkSelectedRead}
              className="h-8 px-3 rounded-lg border border-line hover:bg-canvas text-secondary font-sans text-[12px] flex items-center gap-1.5 cursor-pointer"
            >
              <MailOpen size={13} /> Mark as read
            </button>
            <button
              onClick={onMarkSelectedUnread}
              className="h-8 px-3 rounded-lg border border-line hover:bg-canvas text-secondary font-sans text-[12px] flex items-center gap-1.5 cursor-pointer"
            >
              <Mail size={13} /> Mark as unread
            </button>
            <button
              onClick={onArchiveSelected}
              className="h-8 px-3 rounded-lg border border-line hover:bg-canvas text-secondary font-sans text-[12px] flex items-center gap-1.5 cursor-pointer"
            >
              <Archive size={13} /> Archive
            </button>
            <button
              onClick={onClearSelected}
              className="h-8 px-3 rounded-lg border border-line hover:bg-canvas text-secondary font-sans text-[12px] flex items-center gap-1.5 cursor-pointer"
            >
              <X size={13} /> Deselect
            </button>
          </div>
        ) : (
          <>
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search inbox…"
                aria-label="Search inbox"
                type="search"
                className="w-full pl-9 pr-4 h-9 rounded-lg border border-line bg-white text-[13px] text-ink font-sans placeholder:text-muted outline-none focus:border-ink/60 transition"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div ref={filterRef} className="relative">
                <button
                  onClick={() => {
                    if (!filterOpen && filterRef.current) {
                      const rect = filterRef.current.getBoundingClientRect()
                      setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
                    }
                    setFilterOpen(o => !o)
                  }}
                  aria-label={`Filters${filtersActive ? ` (${filtersActive} active)` : ''}`}
                  aria-expanded={filterOpen}
                  aria-haspopup="dialog"
                  className={`relative h-9 w-9 rounded-lg border bg-white hover:bg-surface flex items-center justify-center cursor-pointer transition
                    ${filterOpen || filtersActive ? 'border-ink text-ink' : 'border-line text-secondary'}`}
                >
                  <Filter size={15} />
                  {filtersActive > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-ink text-surface font-sans text-[9px] font-medium flex items-center justify-center">
                      {filtersActive}
                    </span>
                  )}
                </button>

                {filterOpen && createPortal(
                  <div
                    ref={dropdownRef}
                    role="dialog"
                    aria-label="Inbox filters"
                    style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
                    className="w-72 bg-surface border border-line rounded-xl shadow-[0_12px_32px_-8px_rgba(28,28,30,0.18)] overflow-hidden flex flex-col"
                  >
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-line shrink-0">
                      <div className="font-sans text-[12px] font-medium text-ink">Filters</div>
                      <button
                        onClick={clearAll}
                        disabled={!filtersActive}
                        className={`font-sans text-[11px] border-0 bg-transparent outline-none ${filtersActive ? 'text-danger hover:underline cursor-pointer' : 'text-muted cursor-default'}`}
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="bg-white">
                      <div className="px-4 pt-3 pb-3">
                        <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Message Type</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: 'alert',    label: 'Alerts',     dot: 'bg-warning' },
                            { id: 'message',  label: 'Messages',   dot: 'bg-primary' },
                            { id: 'schedule', label: 'Scheduling', dot: 'bg-info'    },
                          ].map(({ id, label, dot }) => {
                            const on = filters.types.has(id)
                            return (
                              <button key={id} onClick={() => toggleType(id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-sans text-[11.5px] cursor-pointer transition
                                  ${on ? 'border-ink bg-ink text-surface' : 'border-line bg-white text-secondary hover:border-secondary'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-white/60' : dot}`} />
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="px-4 pb-3 border-t border-line/60 pt-3">
                        <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Date</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: '7d',  label: 'Last 7 days'   },
                            { id: '30d', label: 'Last 30 days'  },
                            { id: '3m',  label: 'Last 3 months' },
                            { id: '1y',  label: 'This year'     },
                          ].map(({ id, label }) => {
                            const on = filters.datePreset === id
                            return (
                              <button key={id} onClick={() => setDatePreset(id)}
                                className={`px-2.5 py-1 rounded-full border font-sans text-[11.5px] cursor-pointer transition
                                  ${on ? 'border-ink bg-ink text-surface' : 'border-line bg-white text-secondary hover:border-secondary'}`}>
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="px-4 pb-3 border-t border-line/60 pt-3">
                        <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Read</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: 'unread', label: 'Unread' },
                            { id: 'read',   label: 'Read'   },
                          ].map(({ id, label }) => {
                            const on = filters.readStatus === id
                            return (
                              <button key={id} onClick={() => setReadStatus(id)}
                                className={`px-2.5 py-1 rounded-full border font-sans text-[11.5px] cursor-pointer transition
                                  ${on ? 'border-ink bg-ink text-surface' : 'border-line bg-white text-secondary hover:border-secondary'}`}>
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 border-t border-line bg-surface flex items-center justify-between shrink-0">
                      <span className="font-sans text-[11px] text-muted">{filtersActive === 0 ? 'No filters applied' : `${filtersActive} active`}</span>
                      <button onClick={() => setFilterOpen(false)} className="h-7 px-3 rounded-md bg-ink text-surface font-sans text-[11.5px] cursor-pointer border-0 outline-none">Done</button>
                    </div>
                  </div>,
                  document.body
                )}
              </div>

              <button
                onClick={onMarkAllRead}
                className="h-9 px-3.5 rounded-lg bg-white border border-line hover:bg-canvas text-secondary font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InboxRow({ item, isSelected, isActive, onSelect, onOpen, onStar, compact }) {
  return (
    <div
      onClick={() => onOpen(item.id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(item.id) }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${item.read ? '' : 'Unread. '}${item.from}: ${item.subject}`}
      className={`relative flex items-center gap-3 px-4 py-3 border-b border-line/60 cursor-pointer transition-all group
        hover:shadow-[0_2px_12px_-2px_rgba(28,28,30,0.15)] hover:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30
        ${isSelected || isActive ? 'shadow-[0_2px_12px_-2px_rgba(28,28,30,0.2)] z-10' : ''}
        ${isSelected ? 'bg-primary' : isActive ? 'bg-primary-light/40' : item.read ? 'bg-surface' : 'bg-white'}`}
    >
      <button
        onClick={e => { e.stopPropagation(); onSelect(item.id) }}
        aria-label={isSelected ? 'Deselect' : 'Select'}
        aria-pressed={isSelected}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition
          ${isSelected ? 'border-ink bg-ink' : 'border-line bg-white hover:border-secondary'}`}
      >
        {isSelected && <Check size={10} className="text-surface" />}
      </button>

      <button
        onClick={e => { e.stopPropagation(); onStar(item.id) }}
        aria-label={item.starred ? 'Unstar' : 'Star'}
        aria-pressed={item.starred}
        className="flex-shrink-0 cursor-pointer border-0 bg-transparent p-0"
      >
        <StarIcon filled={item.starred} size={14} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-sans text-[11px] truncate ${item.read ? 'text-secondary font-normal' : 'text-ink font-semibold'}`}>
            {item.from}
          </span>
          <TypeBadge type={item.type} />
          {item.scheduledForLabel && !compact && (
            <span className="flex items-center gap-1 font-sans text-[11px] text-info bg-info-tint border border-info/20 rounded px-1.5 py-px flex-shrink-0">
              <Clock size={10} />
              {item.scheduledForLabel}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 min-w-0">
          <span className={`font-sans text-[13px] truncate ${item.read ? 'text-secondary' : 'text-ink font-medium'}`}>
            {item.subject}
          </span>
          <span className="font-sans text-[12px] text-muted truncate flex-1 hidden sm:block">
            - {item.preview}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="font-sans text-[11px] text-muted">{item.time}</span>
      </div>
    </div>
  )
}

function StatusFooter({ count, unread }) {
  return (
    <div className="px-4 h-9 border-t border-line bg-surface flex items-center justify-between font-sans text-[11px] text-muted shrink-0">
      <span>{count} {count === 1 ? 'item' : 'items'}{unread > 0 ? ` · ${unread} unread` : ''}</span>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Live
      </div>
    </div>
  )
}

function shapeFromDb(row) {
  return shapeItem({
    id: row.id,
    type: row.type,
    from: row.sender,
    subject: row.subject,
    preview: row.preview,
    body: row.body,
    caseId: row.case_id,
    bookingId: row.booking_id,
    severity: row.severity,
    scheduledFor: row.scheduled_for,
    read: row.read,
    starred: row.starred,
    createdAt: row.created_at,
  })
}

export function InboxPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialActiveId = location.state?.activeId ?? null
  const onViewCase = (caseId) => navigate('/cases/' + caseId)
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState({ types: new Set(), datePreset: '', readStatus: '' })
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [activeId, setActiveId] = useState(null)
  const [panelWidth, setPanelWidth] = useState(520)
  const [panelFull, setPanelFull] = useState(false)
  const [undo, setUndo] = useState(null) // { ids: string[], expiresAt }
  const undoTimerRef = useRef(null)
  const containerRef = useRef(null)

  const startDrag = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const containerWidth = containerRef.current?.offsetWidth ?? window.innerWidth
    const startWidth = panelFull ? containerWidth : panelWidth
    const onMove = (e) => {
      const cw = containerRef.current?.offsetWidth ?? window.innerWidth
      const rawWidth = startWidth + (startX - e.clientX)
      if (rawWidth >= cw * 0.8) {
        setPanelFull(true)
      } else {
        setPanelFull(false)
        setPanelWidth(Math.max(320, Math.min(cw * 0.75, rawWidth)))
      }
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelWidth, panelFull])

  useEffect(() => {
    fetchInbox({ limit: PAGE_SIZE })
      .then(data => {
        setItems(data.map(shapeItem))
        setHasMore(data.length === PAGE_SIZE)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || items.length === 0) return
    setLoadingMore(true)
    try {
      const oldest = items[items.length - 1]
      const data = await fetchInbox({ limit: PAGE_SIZE, before: oldest.createdAt })
      setItems(prev => [...prev, ...data.map(shapeItem)])
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, items])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`inbox-page-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'inbox_items',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.archived_at) return
        setItems(prev => prev.some(i => i.id === payload.new.id)
          ? prev
          : [shapeFromDb(payload.new), ...prev])
      })
      // Sync read/star/archive from other tabs.
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'inbox_items',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new
        if (row.archived_at) {
          setItems(prev => prev.filter(i => i.id !== row.id))
          setActiveId(curr => curr === row.id ? null : curr)
          return
        }
        setItems(prev => prev.map(i => i.id === row.id ? shapeFromDb(row) : i))
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'inbox_items',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setItems(prev => prev.filter(i => i.id !== payload.old.id))
        setActiveId(curr => curr === payload.old.id ? null : curr)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const filtered = useMemo(() => {
    let rows = items
    if (filters.types.size > 0) rows = rows.filter(r => filters.types.has(r.type))
    if (filters.datePreset) {
      const now = new Date()
      const cutoff = {
        '7d':  new Date(now - 7  * 86400000),
        '30d': new Date(now - 30 * 86400000),
        '3m':  new Date(now - 90 * 86400000),
        '1y':  new Date(now.getFullYear(), 0, 1),
      }[filters.datePreset]
      rows = rows.filter(r => new Date(r.date) >= cutoff)
    }
    if (filters.readStatus === 'unread') rows = rows.filter(r => !r.read)
    if (filters.readStatus === 'read')   rows = rows.filter(r => r.read)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.from.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.preview.toLowerCase().includes(q) ||
        (r.caseId || '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [items, filters, search])

  const activeItem = activeId ? items.find(i => i.id === activeId) : null

  const markRead = useCallback((id) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (!item || item.read) return prev
      markInboxItemRead(id).catch(console.error)
      return prev.map(i => i.id === id ? { ...i, read: true } : i)
    })
  }, [])

  const openItem = useCallback((id) => {
    setActiveId(id)
    markRead(id)
  }, [markRead])

  // Open and mark as read when navigating from a toast
  useEffect(() => {
    if (!loading && initialActiveId) {
      setActiveId(initialActiveId)
      markRead(initialActiveId)
    }
  }, [loading, initialActiveId, markRead])

  const toggleStar = useCallback((id) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      const starred = !i.starred
      starInboxItem(id, starred).catch(console.error)
      return { ...i, starred }
    }))
  }, [])

  const markUnread = useCallback((id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: false } : i))
    markInboxItemUnread(id).catch(console.error)
  }, [])

  const markSelectedUnread = useCallback(() => {
    const toMark = [...selected]
    setItems(prev => prev.map(i => selected.has(i.id) ? { ...i, read: false } : i))
    setSelected(new Set())
    toMark.forEach(id => markInboxItemUnread(id).catch(console.error))
  }, [selected])

  const markSelectedRead = useCallback(() => {
    setItems(prev => {
      const unreadIds = prev.filter(i => selected.has(i.id) && !i.read).map(i => i.id)
      unreadIds.forEach(id => markInboxItemRead(id).catch(console.error))
      return prev.map(i => selected.has(i.id) ? { ...i, read: true } : i)
    })
    setSelected(new Set())
  }, [selected])

  const markAllRead = useCallback(() => {
    setItems(prev => prev.map(i =>
      (filters.types.size === 0 || filters.types.has(i.type)) ? { ...i, read: true } : i
    ))
    markAllInboxRead().catch(console.error)
  }, [filters.types])

  const clearUndo = useCallback(() => {
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null }
    setUndo(null)
  }, [])

  const archiveSelected = useCallback(() => {
    const ids = [...selected]
    if (ids.length === 0) return
    const removed = items.filter(i => selected.has(i.id))
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    if (selected.has(activeId)) setActiveId(null)
    setSelected(new Set())
    Promise.all(ids.map(id => archiveInboxItem(id).catch(console.error)))
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setUndo({ ids, items: removed })
    undoTimerRef.current = setTimeout(() => setUndo(null), 8000)
  }, [selected, activeId, items])

  const handleUndo = useCallback(async () => {
    if (!undo) return
    const restore = undo.items
    clearUndo()
    setItems(prev => {
      const ids = new Set(prev.map(i => i.id))
      const additions = restore.filter(i => !ids.has(i.id))
      return [...additions, ...prev].sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      )
    })
    await Promise.all(undo.ids.map(id => unarchiveInboxItem(id).catch(console.error)))
  }, [undo, clearUndo])

  useEffect(() => () => clearUndo(), [clearUndo])

  const toggleSelect = useCallback((id) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])

  const listWidth = activeId && !panelFull
    ? (containerRef.current?.offsetWidth ?? 0) - panelWidth - 1
    : Infinity

  if (loading) return null

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden bg-white text-ink">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TopBar
          search={search}
          setSearch={setSearch}
          filters={filters}
          setFilters={setFilters}
          selected={selected}
          onMarkAllRead={markAllRead}
          onMarkSelectedRead={markSelectedRead}
          onMarkSelectedUnread={markSelectedUnread}
          onArchiveSelected={archiveSelected}
          onClearSelected={() => setSelected(new Set())}
          totalCount={filtered.length}
          unreadCount={filtered.filter(i => !i.read).length}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden" ref={containerRef}>
          {(!panelFull || !activeId) && (
            <div className="flex-1 overflow-auto min-h-0">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Inbox size={32} className="mx-auto text-muted/40 mb-3" />
                  <p className="font-display text-[17px] text-secondary">Nothing here</p>
                  <p className="font-sans text-[12px] text-muted mt-1">
                    {search ? 'Try a different search term.' : 'You\'re all caught up.'}
                  </p>
                </div>
              ) : (
                <>
                  {filtered.map(item => (
                    <InboxRow
                      key={item.id}
                      item={item}
                      isSelected={selected.has(item.id)}
                      isActive={activeId === item.id}
                      onSelect={toggleSelect}
                      onOpen={openItem}
                      onStar={toggleStar}
                      compact={listWidth < 550}
                    />
                  ))}
                  {hasMore && (
                    <div className="py-4 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="h-8 px-4 rounded-lg border border-line bg-white hover:bg-canvas text-secondary font-sans text-[12px] cursor-pointer disabled:opacity-50"
                      >
                        {loadingMore ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeId && (
            <>
              <div
                onMouseDown={startDrag}
                className="w-1 shrink-0 cursor-col-resize bg-line hover:bg-primary/40 transition-colors"
              />
              <InboxDetailPanel
                item={activeItem}
                onClose={() => setActiveId(null)}
                onStar={toggleStar}
                onMarkRead={markRead}
                onMarkUnread={markUnread}
                onViewCase={onViewCase}
                style={panelFull ? { flex: 1 } : { width: panelWidth }}
              />
            </>
          )}
        </div>

        <StatusFooter count={filtered.length} unread={filtered.filter(i => !i.read).length} />
      </div>

      {undo && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-ink text-surface rounded-xl px-4 py-2.5 shadow-lg"
        >
          <span className="font-sans text-[13px]">
            Archived {undo.ids.length} {undo.ids.length === 1 ? 'item' : 'items'}
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 font-sans text-[12.5px] font-medium underline-offset-2 hover:underline cursor-pointer border-0 bg-transparent text-surface"
          >
            <Undo2 size={13} /> Undo
          </button>
          <button
            onClick={clearUndo}
            aria-label="Dismiss"
            className="text-surface/60 hover:text-surface cursor-pointer border-0 bg-transparent"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
