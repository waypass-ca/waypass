import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Star, Search, TriangleAlert,
  Check, Archive, X, Mail, Clock, CheckCheck, ChevronRight,
  AlertCircle, Info, Inbox, Filter,
} from 'lucide-react'
import { InboxDetailPanel } from '../components/inbox/InboxDetailPanel'

const INITIAL_ITEMS = [
  {
    id: 'a1', type: 'alert', read: false, starred: false,
    from: 'System', subject: 'Authorization required — James Carter',
    preview: 'The cremation authorization form for James Carter has not been signed. The case cannot proceed to cremation until this document is completed and uploaded.',
    time: '10:24 AM', date: '2024-04-26', severity: 'warning', caseId: 'CASE-0042',
    body: 'The cremation authorization form for James Carter (CASE-0042) has not been signed.\n\nThe case cannot proceed to cremation until this document is completed and uploaded by the next of kin.\n\nPlease follow up with the family contact: Patricia Carter at (415) 555-0183.\n\nAction required before: Apr 28, 2024.',
  },
  {
    id: 'a2', type: 'alert', read: false, starred: false,
    from: 'System', subject: 'Missing document — Margaret Thompson',
    preview: 'Death certificate has not been uploaded for Margaret Thompson. This is required before transfer can be arranged.',
    time: '9:15 AM', date: '2024-04-26', severity: 'danger', caseId: 'CASE-0039',
    body: 'Death certificate has not been uploaded for Margaret Thompson (CASE-0039).\n\nThis document is legally required before body transfer can be arranged with the crematorium.\n\nPlease ensure the attending physician provides the certificate and that it is uploaded to the case documents.\n\nThis is marked as urgent.',
  },
  {
    id: 'a3', type: 'alert', read: true, starred: true,
    from: 'System', subject: 'Case status updated — Robert Hayes',
    preview: 'Robert Hayes has been received at Riverside Crematorium and the case is now In Transit.',
    time: 'Yesterday', date: '2024-04-25', severity: 'info', caseId: 'CASE-0038',
    body: 'Case CASE-0038 for Robert Hayes has been updated.\n\nStatus changed: Pending → In Transit\n\nRobert Hayes has been received by Riverside Crematorium at 2:14 PM on April 25th. All chain-of-custody documentation has been logged.\n\nExpected cremation date: April 30, 2024.',
  },
  {
    id: 'a4', type: 'alert', read: true, starred: false,
    from: 'System', subject: 'New case submitted via widget',
    preview: 'A new case has been submitted through the family booking widget. Review and assign to a case manager.',
    time: 'Apr 24', date: '2024-04-24', severity: 'info', caseId: 'CASE-0043',
    body: 'A new case has been submitted through the Passage family booking widget.\n\nDeceased: Eleanor Voss\nFamily contact: Thomas Voss\nPackage selected: Comfort — $1,895\n\nThe case has been automatically created as CASE-0043 and is awaiting assignment to a case manager.',
  },
  {
    id: 'm1', type: 'message', read: false, starred: false,
    from: 'Patricia Carter', subject: 'Re: James Carter arrangements',
    preview: 'Thank you so much for walking us through everything. We wanted to confirm the time for the service and ask a quick question about the urn options.',
    time: '11:02 AM', date: '2024-04-26', severity: null, caseId: 'CASE-0042',
    body: 'Hi,\n\nThank you so much for walking us through everything yesterday. It meant a lot to our family to have someone so patient and kind guiding us.\n\nWe wanted to confirm the time for the service on the 30th — we have some family flying in from out of state and want to make sure they can attend.\n\nAlso, we had a quick question about the urn options. Is it possible to see them in person before making a final decision?\n\nThank you again,\nPatricia Carter',
  },
  {
    id: 'm2', type: 'message', read: true, starred: false,
    from: 'David Thompson', subject: 'Question about ashes return',
    preview: 'Hi, I was wondering how long it typically takes for the ashes to be returned after cremation. We are planning a small gathering.',
    time: 'Yesterday', date: '2024-04-25', severity: null, caseId: 'CASE-0039',
    body: 'Hi,\n\nI hope this message finds you well. I was wondering how long it typically takes for the ashes to be returned after cremation. We are trying to plan a small gathering for our mother and want to make sure we have the timing right.\n\nAlso, do you provide a temporary urn while we decide on a permanent one?\n\nThank you,\nDavid Thompson',
  },
  {
    id: 'm3', type: 'message', read: true, starred: true,
    from: 'Susan Hayes', subject: 'Thank you',
    preview: 'I just wanted to say thank you for everything your team did for our family during this difficult time. You made it so much easier.',
    time: 'Apr 24', date: '2024-04-24', severity: null, caseId: 'CASE-0038',
    body: 'Dear Team,\n\nI just wanted to take a moment to say thank you for everything your team did for our family during this incredibly difficult time.\n\nThe care and professionalism shown throughout the entire process made things so much easier than we expected. Robert would have been touched.\n\nWith gratitude,\nSusan Hayes',
  },
  {
    id: 'm4', type: 'message', read: true, starred: false,
    from: 'Michael Torres', subject: 'Documents ready for pickup',
    preview: 'The family has confirmed they are ready to pick up the documentation. What are your office hours on weekends?',
    time: 'Apr 23', date: '2024-04-23', severity: null, caseId: 'CASE-0035',
    body: 'Hello,\n\nThe family has confirmed they are ready to pick up the documentation and ashes for Elena Torres. I was wondering what your office hours are, particularly on weekends, as some family members can only come Saturday.\n\nThank you,\nMichael Torres',
  },
  {
    id: 's1', type: 'schedule', read: false, starred: false,
    from: 'Riverside Crematorium', subject: 'Cremation confirmed — Robert Hayes',
    preview: 'Cremation for Robert Hayes is confirmed for Tuesday April 30th at 9:00 AM. Please confirm receipt of this scheduling notice.',
    time: '8:45 AM', date: '2024-04-26', severity: null, caseId: 'CASE-0038',
    scheduledFor: 'Apr 30, 2024 · 9:00 AM',
    body: 'Dear Evergreen Memorial,\n\nThis is to confirm that cremation services for Robert Hayes (CASE-0038) have been scheduled at Riverside Crematorium.\n\nDate: Tuesday, April 30, 2024\nTime: 9:00 AM\nLocation: Riverside Crematorium, 4400 River Rd, Sacramento, CA\n\nPlease ensure all required documentation has been submitted prior to this date. Ashes will be available for collection within 3–5 business days after completion.\n\nPlease reply to confirm you have received this scheduling notice.\n\nRiverside Crematorium',
  },
  {
    id: 's2', type: 'schedule', read: true, starred: false,
    from: 'Lakeside Memorial', subject: 'Rescheduled — James Carter cremation',
    preview: 'Due to facility maintenance, the cremation originally scheduled for April 28th has been moved to May 2nd at 10:30 AM.',
    time: 'Yesterday', date: '2024-04-25', severity: 'warning', caseId: 'CASE-0042',
    scheduledFor: 'May 2, 2024 · 10:30 AM',
    body: 'Dear Evergreen Memorial,\n\nWe regret to inform you that due to unplanned facility maintenance, the cremation for James Carter originally scheduled for April 28th, 2024 has been rescheduled.\n\nNew date: Thursday, May 2, 2024\nNew time: 10:30 AM\nLocation: Lakeside Memorial, 2200 Lake Shore Drive\n\nWe apologize for any inconvenience this may cause. Please inform the family of this change.\n\nLakeside Memorial Services',
  },
  {
    id: 's3', type: 'schedule', read: true, starred: false,
    from: 'Oakwood Services', subject: 'Pickup confirmed — Margaret Thompson',
    preview: 'Body pickup from residence has been confirmed for April 27th between 2:00 PM and 4:00 PM.',
    time: 'Apr 24', date: '2024-04-24', severity: null, caseId: 'CASE-0039',
    scheduledFor: 'Apr 27, 2024 · 2:00–4:00 PM',
    body: 'Dear Evergreen Memorial,\n\nThis is to confirm that the body pickup for Margaret Thompson (CASE-0039) from the residence at 845 Oak Lane, San Francisco has been scheduled.\n\nDate: Saturday, April 27, 2024\nArrival window: 2:00 PM – 4:00 PM\n\nPlease ensure someone from the family or a representative is present at the time of pickup. Our team will handle all transportation with care and dignity.\n\nOakwood Transfer Services',
  },
]

const SEVERITY_CONFIG = {
  danger:  { icon: AlertCircle, text: 'text-danger', bg: 'bg-danger-tint', border: 'border-danger/25', dot: 'bg-danger' },
  warning: { icon: TriangleAlert, text: 'text-warning', bg: 'bg-warning-light', border: 'border-warning/25', dot: 'bg-warning' },
  info:    { icon: Info, text: 'text-info', bg: 'bg-info-tint', border: 'border-info/25', dot: 'bg-info' },
}

const TYPE_CONFIG = {
  alert:    { label: 'Alert',    color: 'text-warning', dot: 'bg-warning' },
  message:  { label: 'Message',  color: 'text-primary',  dot: 'bg-primary' },
  schedule: { label: 'Schedule', color: 'text-info',    dot: 'bg-info' },
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

function TopBar({ search, setSearch, filters, setFilters, selected, onMarkAllRead, onArchiveSelected, onClearSelected, totalCount, unreadCount }) {
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
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
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

function InboxRow({ item, isSelected, isActive, onSelect, onOpen, onStar }) {
  return (
    <div
      onClick={() => onOpen(item.id)}
      className={`relative flex items-center gap-3 px-4 py-3 border-b border-line/60 cursor-pointer transition-all group
        hover:shadow-[0_2px_12px_-2px_rgba(28,28,30,0.15)] hover:z-10
        ${isSelected || isActive ? 'shadow-[0_2px_12px_-2px_rgba(28,28,30,0.2)] z-10' : ''}
        ${isSelected ? 'bg-primary' : isActive ? 'bg-primary-light/40' : item.read ? 'bg-surface' : 'bg-white'}`}
    >
      <button
        onClick={e => { e.stopPropagation(); onSelect(item.id) }}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition
          ${isSelected ? 'border-ink bg-ink' : 'border-line bg-white hover:border-secondary'}`}
      >
        {isSelected && <Check size={10} className="text-surface" />}
      </button>

      <button
        onClick={e => { e.stopPropagation(); onStar(item.id) }}
        className="flex-shrink-0 cursor-pointer border-0 bg-transparent p-0"
      >
        <StarIcon filled={item.starred} size={14} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-sans text-[13px] truncate ${item.read ? 'text-secondary font-normal' : 'text-ink font-semibold'}`}>
            {item.from}
          </span>
          <TypeBadge type={item.type} />
          {item.scheduledFor && (
            <span className="flex items-center gap-1 font-sans text-[10.5px] text-info bg-info-tint border border-info/20 rounded px-1.5 py-px flex-shrink-0">
              <Clock size={10} />
              {item.scheduledFor}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 min-w-0">
          <span className={`font-sans text-[12.5px] truncate ${item.read ? 'text-secondary' : 'text-ink font-medium'}`}>
            {item.subject}
          </span>
          <span className="font-sans text-[12px] text-muted truncate flex-1 hidden sm:block">
            — {item.preview}
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

export function InboxPage() {
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [filters, setFilters] = useState({ types: new Set(), datePreset: '', readStatus: '' })
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [activeId, setActiveId] = useState(null)

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

  function openItem(id) {
    setActiveId(id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i))
  }

  function toggleStar(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, starred: !i.starred } : i))
  }

  function markRead(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i))
  }

  function markAllRead() {
    setItems(prev => prev.map(i =>
      (filters.types.size === 0 || filters.types.has(i.type)) ? { ...i, read: true } : i
    ))
  }

  function archiveSelected() {
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    if (selected.has(activeId)) setActiveId(null)
    setSelected(new Set())
  }

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

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
          onArchiveSelected={archiveSelected}
          onClearSelected={() => setSelected(new Set())}
          totalCount={filtered.length}
          unreadCount={filtered.filter(i => !i.read).length}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto min-h-0">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Inbox size={32} className="mx-auto text-muted/40 mb-3" />
                <p className="font-display text-[17px] text-secondary">Nothing here</p>
                <p className="font-sans text-[12px] text-muted mt-1">
                  {search ? 'Try a different search term.' : 'You\'re all caught up.'}
                </p>
              </div>
            ) : filtered.map(item => (
              <InboxRow
                key={item.id}
                item={item}
                isSelected={selected.has(item.id)}
                isActive={activeId === item.id}
                onSelect={toggleSelect}
                onOpen={openItem}
                onStar={toggleStar}
              />
            ))}
          </div>

          {activeId && (
            <InboxDetailPanel
              item={activeItem}
              onClose={() => setActiveId(null)}
              onStar={toggleStar}
              onMarkRead={markRead}
            />
          )}
        </div>

        <StatusFooter count={filtered.length} unread={filtered.filter(i => !i.read).length} />
      </div>
    </div>
  )
}
