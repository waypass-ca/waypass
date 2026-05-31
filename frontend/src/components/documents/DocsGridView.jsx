import { Folder, FileText, ChevronRight } from 'lucide-react'
import { DocFolderCard, DocNewFolderCard, DocCard } from './docsShared'

export function DocsGridView({ docs, docFolders, docFolderCounts, gridDocFolderView, setGridDocFolderView,
  selected, toggleSelect, onPreview, onAddDocFolder, onDeleteDocFolder,
  docDragOverId, setDocDragOverId, onDocFolderDrop, onMoveToFolder, onCreateAndMove }) {

  const currentFolder = gridDocFolderView ? docFolders.find(f => f.id === gridDocFolderView) : null
  const displayDocs = gridDocFolderView
    ? docs.filter(d => d._folderId === gridDocFolderView)
    : docs.filter(d => !d._folderId)

  const hasFolders = !gridDocFolderView && docFolders.length > 0
  const hasUnfiled = !gridDocFolderView && displayDocs.length > 0

  return (
    <div className="p-4">
      {gridDocFolderView && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setGridDocFolderView(null)}
            className="flex items-center gap-1 font-sans text-[12.5px] text-muted hover:text-ink cursor-pointer transition-colors">
            <ChevronRight size={13} className="rotate-180" />
            Documents
          </button>
          <ChevronRight size={12} className="text-muted/40" />
          <span className="font-sans text-[12.5px] font-medium text-ink flex items-center gap-1.5">
            <Folder size={13} className="text-secondary" />
            {currentFolder?.name}
          </span>
        </div>
      )}

      {!gridDocFolderView && (
        <>
          {hasUnfiled && (
            <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Folders</div>
          )}
          <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {docFolders.map(f => (
              <DocFolderCard
                key={f.id}
                folder={f}
                count={docFolderCounts[f.id] ?? 0}
                onClick={() => setGridDocFolderView(f.id)}
                onDelete={onDeleteDocFolder}
                onDragOver={e => { e.preventDefault(); setDocDragOverId(f.id) }}
                onDragLeave={() => setDocDragOverId(null)}
                onDrop={e => onDocFolderDrop(e, f.id)}
                isDragOver={docDragOverId === f.id}
              />
            ))}
            <DocNewFolderCard onAdd={onAddDocFolder} />
          </div>

          {hasUnfiled && (
            <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Unfiled</div>
          )}
        </>
      )}

      {displayDocs.length === 0 ? (
        <div className="py-12 text-center">
          <FileText size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="font-display text-[17px] text-secondary">
            {gridDocFolderView ? 'This folder is empty' : 'No unfiled documents'}
          </p>
          <p className="font-sans text-[12px] text-muted mt-1">
            {gridDocFolderView ? 'Drag documents here to add them.' : 'All documents are in folders, or try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {displayDocs.map(d => (
            <DocCard key={d.id} d={d} selected={selected} toggleSelect={toggleSelect} onPreview={onPreview} docFolders={docFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} />
          ))}
        </div>
      )}
    </div>
  )
}
