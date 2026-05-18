import { X, Folder } from 'lucide-react'

export function FolderDeleteModal({ folder, itemLabel = 'items', onDeleteFolder, onDeleteWithContents, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onCancel}>
      <div
        className="bg-white rounded-2xl border border-line shadow-2xl w-[360px] overflow-hidden"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-canvas border border-line flex items-center justify-center">
              <Folder size={15} className="text-secondary" />
            </div>
            <span className="font-sans text-[14px] font-semibold text-ink">Delete folder</span>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-lg hover:bg-canvas flex items-center justify-center text-muted cursor-pointer transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="font-sans text-[13px] text-secondary leading-relaxed">
            How would you like to delete{' '}
            <span className="font-medium text-ink">"{folder.name}"</span>?
          </p>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            onClick={onDeleteWithContents}
            className="w-full h-10 rounded-xl bg-danger text-white font-sans text-[13px] font-medium cursor-pointer hover:bg-danger/90 transition-colors flex items-center justify-between px-4">
            Delete folder and contents
            <span className="font-sans text-[11px] text-white/65 font-normal">removes all {itemLabel}</span>
          </button>
          <button
            onClick={onDeleteFolder}
            className="w-full h-10 rounded-xl border border-line bg-canvas font-sans text-[13px] text-ink cursor-pointer hover:bg-white transition-colors text-left px-4">
            Delete folder only
          </button>
          <button
            onClick={onCancel}
            className="w-full h-9 rounded-xl font-sans text-[13px] text-secondary cursor-pointer hover:text-ink transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
