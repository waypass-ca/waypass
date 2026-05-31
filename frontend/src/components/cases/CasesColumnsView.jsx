import { useState, useEffect, useRef } from 'react'
import { Folder, File, ChevronRight, Plus, X } from 'lucide-react'
import { makeCaseDragImage } from '../../lib/dragImage.js'
import { SMART_FOLDERS, StarFilled, CaseMenu, CasePreviewBody } from './caseShared'

function Handle({ onMouseDown }) {
  return (
    <div onMouseDown={onMouseDown}
      className="group relative w-px bg-line shrink-0 cursor-col-resize hover:bg-ink/30 transition-colors">
      <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      <div className="absolute top-1/2 -translate-y-1/2 -left-[3px] w-[7px] h-10 rounded-full opacity-0 group-hover:opacity-100 bg-ink/20 transition-opacity" />
    </div>
  )
}

export function CasesColumnsView({
  rows, activeId, setActiveId, folder, setFolder, counts, cases, isStarred, onViewCase,
  userFolders, onAddFolder, onDeleteFolder, onFolderDrop, dragOverFolderId, setDragOverFolderId,
  onMoveToFolder, onCreateAndMove,
}) {
  const smartFolders = SMART_FOLDERS.map(f => ({ ...f, count: counts[f.id] }))
  const c = activeId ? (rows.find(r => r.id === activeId) || cases.find(r => r.id === activeId)) : null

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  function submitAdd() {
    if (newName.trim()) onAddFolder(newName.trim())
    setNewName(''); setAdding(false)
  }

  const wrapRef = useRef(null)
  const [col1, setCol1] = useState(() => Number(localStorage.getItem('cases-col1')) || 200)
  const [col3, setCol3] = useState(() => Number(localStorage.getItem('cases-col3')) || 360)
  useEffect(() => { localStorage.setItem('cases-col1', col1) }, [col1])
  useEffect(() => { localStorage.setItem('cases-col3', col3) }, [col3])

  const startDrag = (which) => (e) => {
    e.preventDefault()
    const startX = e.clientX
    const start1 = col1, start3 = col3
    const totalW = wrapRef.current?.offsetWidth || 900
    const onMove = (ev) => {
      const dx = ev.clientX - startX
      if (which === 1) {
        const next = Math.max(160, Math.min(360, start1 + dx))
        if (totalW - next - col3 >= 180) setCol1(next)
      } else {
        const next = Math.max(240, Math.min(500, start3 - dx))
        if (totalW - col1 - next >= 180) setCol3(next)
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

  return (
    <div className="h-full">
      <div ref={wrapRef} className="bg-white overflow-hidden flex h-full">
        {/* Col 1: Folders */}
        <div className="overflow-auto py-2 shrink-0 flex flex-col" style={{ width: col1 }}>
          <div className="px-3 pt-1 pb-0.5 font-sans text-[10px] uppercase tracking-[0.1em] text-muted/60">Smart</div>
          {smartFolders.map(f => (
            <button key={f.id} onClick={() => { setFolder(f.id); setActiveId(null) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors
                ${folder === f.id ? 'bg-ink/5 font-medium' : 'hover:bg-ink/5'}`}>
              <span className={`shrink-0 ${f.tint || 'text-secondary'}`}>{f.icon}</span>
              <span className="flex-1 font-sans text-[13px] text-ink truncate">{f.label}</span>
              <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{f.count}</span>
              <ChevronRight size={12} className="text-muted shrink-0" />
            </button>
          ))}

          <div className="mx-3 my-2 h-px bg-line shrink-0" />
          <div className="px-3 pb-0.5 font-sans text-[10px] uppercase tracking-[0.1em] text-muted/60">My Folders</div>

          {userFolders.map(f => (
            <div
              key={f.id}
              onDragOver={e => { e.preventDefault(); setDragOverFolderId(f.id) }}
              onDragLeave={() => setDragOverFolderId(null)}
              onDrop={e => onFolderDrop(e, f.id)}
              onClick={() => { setFolder(f.id); setActiveId(null) }}
              className={`group w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors
                ${folder === f.id ? 'bg-ink/5 font-medium' : 'hover:bg-ink/5'}
                ${dragOverFolderId === f.id ? 'bg-primary-light' : ''}`}>
              <Folder size={13} className="text-secondary shrink-0" />
              <span className="flex-1 font-sans text-[13px] text-ink truncate">{f.name}</span>
              <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{counts[f.id] ?? 0}</span>
              <button
                onClick={e => { e.stopPropagation(); onDeleteFolder(f.id) }}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-muted hover:bg-danger-tint hover:text-danger cursor-pointer transition-all shrink-0">
                <X size={10} />
              </button>
            </div>
          ))}

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
              className="w-full flex items-center gap-2 px-3 py-1.5 text-muted hover:text-secondary hover:bg-ink/5 cursor-pointer transition-colors">
              <Plus size={12} className="shrink-0" />
              <span className="font-sans text-[12px]">New Folder</span>
            </button>
          )}
        </div>

        <Handle onMouseDown={startDrag(1)} />

        {/* Col 2: Cases list */}
        <div className="flex-1 overflow-auto min-w-0">
          {rows.length === 0 && <div className="p-6 text-center font-sans text-[12px] text-muted">Empty folder</div>}
          {rows.map(r => (
            <div
              key={r.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('caseId', r.id)
                e.dataTransfer.setDragImage(makeCaseDragImage(r.deceased), 20, 20)
              }}
              onDoubleClick={() => onViewCase(r.id)}
              onClick={() => setActiveId(r.id)}
              className={`group w-full flex items-center gap-3 px-4 py-2.5 border-b border-line/60 text-left cursor-pointer transition-colors
                ${activeId === r.id ? 'bg-canvas/60' : 'hover:bg-canvas/60'}`}>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[13px] truncate flex items-center gap-1.5 text-ink">
                  {r.deceased}
                  {isStarred(r.id) && <StarFilled size={10} className={activeId === r.id ? 'text-warning-light' : 'text-warning'} />}
                </div>
                <div className="font-sans text-[11px] truncate text-muted">
                  {r.family} · {r.date}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <CaseMenu c={r} onViewCase={onViewCase} userFolders={userFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} />
              </div>
              <ChevronRight size={12} className="text-muted shrink-0" />
            </div>
          ))}
        </div>

        <Handle onMouseDown={startDrag(3)} />

        {/* Col 3: Preview */}
        <div className="overflow-auto shrink-0" style={{ width: col3 }}>
          {c ? (
            <CasePreviewBody c={c} isStarred={isStarred} onViewCase={onViewCase} userFolders={userFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center px-8 text-center">
              <File size={32} className="text-muted/40 mb-3" />
              <div className="font-display text-[18px] text-secondary">Select a case</div>
              <div className="font-sans text-[12px] text-muted mt-1">Choose a case to see details here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
