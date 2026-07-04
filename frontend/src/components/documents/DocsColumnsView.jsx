import { useState, useEffect, useRef, useMemo } from 'react'
import { Folder, File, FileText, ChevronRight, Plus, X } from 'lucide-react'
import { makeDocDragImage } from '../../lib/dragImage.js'
import { DOC_TYPES, STATUS_CONFIG, FileIcon, DocMenu, setActiveDragDocId } from './docsShared'

const COL1_TYPES = [{ id: 'all', label: 'All Types' }, ...DOC_TYPES.map(t => ({ id: t, label: t }))]

function Handle({ onMouseDown }) {
  return (
    <div onMouseDown={onMouseDown}
      className="group relative w-px bg-line shrink-0 cursor-col-resize hover:bg-ink/30 transition-colors">
      <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      <div className="absolute top-1/2 -translate-y-1/2 -left-[3px] w-[7px] h-10 rounded-full opacity-0 group-hover:opacity-100 bg-ink/20 transition-opacity" />
    </div>
  )
}

function DocDetailPanel({ doc, onPreview, docFolders, onMoveToFolder, onCreateAndMove }) {
  if (!doc) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <File size={32} className="text-muted/40 mb-3" />
        <div className="font-display text-[18px] text-secondary">Select a document</div>
        <div className="font-sans text-[12px] text-muted mt-1">Choose a document to preview it here.</div>
      </div>
    )
  }
  const s = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending
  return (
    <div className="flex flex-col h-full">
      <div className={`px-5 pt-5 pb-4 border-b ${s.border} ${s.tint}`}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-14 relative flex-shrink-0 mt-0.5">
            <div className="absolute inset-0 bg-white border border-primary/20 rounded" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-canvas border-l border-b border-primary/20 rounded-bl" />
            <div className="absolute bottom-2 left-0 right-0 text-center font-sans font-bold text-[8px] text-primary/60 tracking-wider">{doc.ext}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[14px] font-semibold text-ink leading-snug">{doc.name}</p>
            <p className="font-sans text-[11.5px] text-muted mt-0.5">{doc.type}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-4 py-0.5 rounded-full border text-[11px] font-sans font-medium ${s.tint} ${s.text} ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-5 py-4 space-y-3.5">
          {[
            ['Case',     doc.case],
            ['Uploaded', doc.uploadedAt],
            ['Size',     doc.size],
            ['Type',     doc.type],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-0.5">{label}</div>
              <div className="font-sans text-[13px] text-ink">{value}</div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-4">
          <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Activity</div>
          <div className="font-sans text-[12px] text-muted italic">No activity yet</div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-line flex gap-2 shrink-0">
        <button
          onClick={() => onPreview(doc)}
          className="flex-1 h-9 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5">
          <FileText size={13} /> Open
        </button>
        <DocMenu doc={doc} onPreview={onPreview} folders={docFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} up />
      </div>
    </div>
  )
}

export function DocsColumnsView({ docs, activeDocId, setActiveDocId, onPreview, docFolders, activeDocFolder, setActiveDocFolder, onAddDocFolder, onDeleteDocFolder, onDocFolderDrop, docDragOverId, setDocDragOverId, docFolderCounts, onMoveToFolder, onCreateAndMove }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  function submitAdd() {
    if (newName.trim()) onAddDocFolder(newName.trim())
    setNewName(''); setAdding(false)
  }

  const [colType, setColType] = useState('all')
  const wrapRef = useRef(null)
  const [col1, setCol1] = useState(() => Number(localStorage.getItem('docs-col1')) || 190)
  const [col3, setCol3] = useState(() => Number(localStorage.getItem('docs-col3')) || 340)
  useEffect(() => { localStorage.setItem('docs-col1', col1) }, [col1])
  useEffect(() => { localStorage.setItem('docs-col3', col3) }, [col3])

  const startDrag = (which) => (e) => {
    e.preventDefault()
    const startX = e.clientX
    const start1 = col1, start3 = col3
    const totalW = wrapRef.current?.offsetWidth || 900
    const onMove = (ev) => {
      const dx = ev.clientX - startX
      if (which === 1) {
        const next = Math.max(160, Math.min(320, start1 + dx))
        if (totalW - next - col3 >= 200) setCol1(next)
      } else {
        const next = Math.max(260, Math.min(480, start3 - dx))
        if (totalW - col1 - next >= 200) setCol3(next)
      }
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const typeCounts = useMemo(() => {
    const map = { all: docs.length }
    DOC_TYPES.forEach(t => { map[t] = docs.filter(d => d.type === t).length })
    return map
  }, [docs])

  const colDocs = useMemo(() => {
    if (activeDocFolder) return docs.filter(d => d._folderId === activeDocFolder)
    if (colType === 'all') return docs
    return docs.filter(d => d.type === colType)
  }, [docs, activeDocFolder, colType])

  const activeDoc = activeDocId ? docs.find(d => d.id === activeDocId) : null

  return (
    <div className="h-full">
      <div ref={wrapRef} className="bg-white overflow-hidden flex h-full">
        {/* Col 1: Types + Folders */}
        <div className="overflow-auto py-2 shrink-0" style={{ width: col1 }}>
          <div className="px-3 pt-1 pb-0.5 font-sans text-[10px] uppercase tracking-[0.1em] text-muted/60">Types</div>
          {COL1_TYPES.map(({ id, label }) => (
            <button key={id}
              onClick={() => { setColType(id); setActiveDocFolder(null); setActiveDocId(null) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-colors
                ${colType === id && !activeDocFolder ? 'bg-ink/5 font-medium' : 'hover:bg-ink/5'}`}>
              <FileText size={13} className="text-muted shrink-0" />
              <span className="flex-1 font-sans text-[13px] text-ink truncate">{label}</span>
              <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{typeCounts[id] ?? 0}</span>
              <ChevronRight size={12} className="text-muted shrink-0" />
            </button>
          ))}
          {docFolders.length > 0 && (
            <>
              <div className="mx-3 my-2 h-px bg-line" />
              <div className="px-3 pt-1 pb-0.5 font-sans text-[10px] uppercase tracking-[0.1em] text-muted/60">Folders</div>
              {docFolders.map(f => (
                <div
                  key={f.id}
                  onDragOver={e => { e.preventDefault(); setDocDragOverId(f.id) }}
                  onDragLeave={() => setDocDragOverId(null)}
                  onDrop={e => onDocFolderDrop(e, f.id)}
                  onClick={() => { setActiveDocFolder(activeDocFolder === f.id ? null : f.id); setActiveDocId(null) }}
                  className={`group w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-colors
                    ${activeDocFolder === f.id ? 'bg-ink/5 font-medium' : 'hover:bg-ink/5'}
                    ${docDragOverId === f.id ? 'bg-primary-light' : ''}`}>
                  <Folder size={13} className="text-secondary shrink-0" />
                  <span className="flex-1 font-sans text-[13px] text-ink truncate">{f.name}</span>
                  <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{docFolderCounts[f.id] ?? 0}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteDocFolder(f.id) }}
                    className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-muted hover:bg-danger-tint hover:text-danger cursor-pointer transition-all shrink-0">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </>
          )}

          {adding ? (
            <form onSubmit={e => { e.preventDefault(); submitAdd() }} className="px-3 py-1.5">
              <input
                ref={inputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onBlur={submitAdd}
                onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
                placeholder="Folder name"
                className="w-full px-2 py-1 text-[12.5px] font-sans rounded border border-ink/40 outline-none bg-white text-ink"
              />
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center gap-2 px-3 py-1 mb-1 text-muted hover:text-secondary hover:bg-ink/5 cursor-pointer transition-colors">
              <Plus size={12} className="shrink-0" />
              <span className="font-sans text-[12px]">New Folder</span>
            </button>
          )}
        </div>

        <Handle onMouseDown={startDrag(1)} />

        {/* Col 2: Document list */}
        <div className="flex-1 overflow-auto min-w-0">
          {colDocs.length === 0 && (
            <div className="p-6 text-center font-sans text-[12px] text-muted">No documents in this view</div>
          )}
          {colDocs.map(d => (
            <div
              key={d.id}
              draggable
              onDragStart={e => {
                setActiveDragDocId(d.id)
                e.dataTransfer.setData('docId', d.id)
                e.dataTransfer.setDragImage(makeDocDragImage(d.name, d.ext), 20, 20)
              }}
              onDragEnd={() => setActiveDragDocId(null)}
              onClick={() => setActiveDocId(d.id === activeDocId ? null : d.id)}
              className={`group w-full flex items-center gap-3 px-4 py-2.5 border-b border-line/60 text-left cursor-pointer transition-colors
                ${activeDocId === d.id ? 'bg-canvas/60' : 'hover:bg-canvas/40'}`}>
              <FileIcon ext={d.ext} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[13px] text-ink truncate">{d.name}</div>
                <div className="font-sans text-[11px] text-muted truncate">{d.case} · {d.uploadedAt}</div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[d.status]?.dot ?? 'bg-muted'}`} />
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DocMenu doc={d} onPreview={onPreview} folders={docFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} />
                </div>
                <ChevronRight size={12} className="text-muted" />
              </div>
            </div>
          ))}
        </div>

        <Handle onMouseDown={startDrag(3)} />

        {/* Col 3: Detail preview */}
        <div className="overflow-auto shrink-0" style={{ width: col3 }}>
          <DocDetailPanel doc={activeDoc} onPreview={onPreview} docFolders={docFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} />
        </div>
      </div>
    </div>
  )
}
