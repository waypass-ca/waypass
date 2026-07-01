import { Folder, ChevronRight, Check, Eye } from 'lucide-react'
import { makeCaseDragImage } from '../../lib/dragImage.js'
import { STATUS, StarFilled, PackageChip, StatusBadge, CaseMenu, FolderCard, NewFolderCard } from './caseShared'

function CaseCard({ c, selected, toggleSelect, activeId, setActiveId, isStarred, onViewCase, userFolders, onMoveToFolder, onCreateAndMove }) {
  const s = STATUS[c.status] || STATUS.pending
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('caseId', c.id)
        e.dataTransfer.setDragImage(makeCaseDragImage(c.deceased), 20, 20)
      }}
      onClick={() => onViewCase(c.id)}
      className={`group relative bg-white border rounded-lg cursor-default transition
        hover:shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)] hover:-translate-y-0.5
        ${activeId === c.id ? 'border-ink/40 ring-2 ring-ink/10' : 'border-line'}
        ${selected.has(c.id) ? 'ring-2 ring-info/60' : ''}`}>
      <div className="rounded-t-[7px] overflow-hidden">
        <div className={`h-14 ${s.tint} relative border-b ${s.border} flex items-center justify-center`}>
          <div className="absolute top-1.5 left-1.5">
            <button onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}
              className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
                ${selected.has(c.id) ? 'border-ink bg-ink' : 'border-line bg-white hover:border-secondary'}`}>
              {selected.has(c.id) && <Check size={11} className="text-surface" />}
            </button>
          </div>
          {isStarred(c.id) && <StarFilled size={12} className="absolute top-2 left-7 text-warning" />}
          <div className="w-9 h-10 bg-white rounded-[4px] shadow-[0_2px_6px_rgba(28,28,30,0.08)] flex flex-col items-center justify-center gap-0.5">
            <div className={`w-4 h-[2px] ${s.dot} rounded-full`} />
            <span className="font-display text-[14px] text-ink leading-none">
              {(c.deceased || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('')}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={e => { e.stopPropagation(); setActiveId(c.id === activeId ? null : c.id) }}
          title="Preview"
          className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors
            ${activeId === c.id ? 'bg-ink text-surface' : 'hover:bg-black/10 text-muted'}`}>
          <Eye size={12} />
        </button>
        <div onClick={e => e.stopPropagation()}>
          <CaseMenu
            c={c}
            onViewCase={onViewCase}
            userFolders={userFolders}
            onMoveToFolder={onMoveToFolder}
            onCreateAndMove={onCreateAndMove}
            triggerClassName={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors ${activeId === c.id ? 'bg-ink text-surface' : 'hover:bg-black/10 text-muted'}`}
          />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1.5 mb-1">
          <div className="min-w-0">
            <div className="font-sans text-[12.5px] font-medium text-ink truncate">{c.deceased}</div>
            <div className="font-sans text-[11px] text-muted truncate">{c.family}</div>
          </div>
          <PackageChip pkg={c.package} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <StatusBadge status={c.status} />
          <span className="font-sans text-[11.5px] font-medium text-ink tabular-nums">${c.amount.toLocaleString()}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-line flex items-center justify-between font-sans text-[10.5px] text-muted">
          <span className="truncate pr-2">{c.crematorium || <span className="italic">Unassigned</span>}</span>
          <span className="shrink-0">{c.date}</span>
        </div>
      </div>
    </div>
  )
}

export function CasesGridView({ cases, userFolders, folderCounts, gridFolderView, setGridFolderView,
  selected, toggleSelect, activeId, setActiveId, isStarred, onViewCase,
  onAddFolder, onDeleteFolder, dragOverFolderId, setDragOverFolderId, onFolderDrop,
  onMoveToFolder, onCreateAndMove }) {

  const currentFolder = gridFolderView ? userFolders.find(f => f.id === gridFolderView) : null
  const displayCases = gridFolderView
    ? cases.filter(c => c.folderId === gridFolderView)
    : cases.filter(c => !c.folderId)

  const hasUnfiled = !gridFolderView && displayCases.length > 0

  return (
    <div className="px-4 py-4">
      {gridFolderView && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setGridFolderView(null)}
            className="flex items-center gap-1 font-sans text-[12.5px] text-muted hover:text-ink cursor-pointer transition-colors">
            <ChevronRight size={13} className="rotate-180" />
            Cases
          </button>
          <ChevronRight size={12} className="text-muted/40" />
          <span className="font-sans text-[12.5px] font-medium text-ink flex items-center gap-1.5">
            <Folder size={13} className="text-secondary" />
            {currentFolder?.name}
          </span>
        </div>
      )}

      {!gridFolderView && (
        <>
          {hasUnfiled && (
            <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Folders</div>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-5">
            {userFolders.map(f => (
              <FolderCard
                key={f.id}
                folder={f}
                count={folderCounts[f.id] ?? 0}
                onClick={() => setGridFolderView(f.id)}
                onDelete={onDeleteFolder}
                onDragOver={e => { e.preventDefault(); setDragOverFolderId(f.id) }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={e => onFolderDrop(e, f.id)}
                isDragOver={dragOverFolderId === f.id}
              />
            ))}
            <NewFolderCard onAdd={onAddFolder} />
          </div>

          {hasUnfiled && (
            <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Unfiled</div>
          )}
        </>
      )}

      {displayCases.length === 0 ? (
        <div className="py-12 text-center">
          <Folder size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="font-display text-[17px] text-secondary">
            {gridFolderView ? 'This folder is empty' : 'No unfiled cases'}
          </p>
          <p className="font-sans text-[12px] text-muted mt-1">
            {gridFolderView ? 'Drag cases here to add them.' : 'All cases are in folders, or try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {displayCases.map(c => (
            <CaseCard
              key={c.id}
              c={c}
              selected={selected}
              toggleSelect={toggleSelect}
              activeId={activeId}
              setActiveId={setActiveId}
              isStarred={isStarred}
              onViewCase={onViewCase}
              userFolders={userFolders}
              onMoveToFolder={onMoveToFolder}
              onCreateAndMove={onCreateAndMove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
