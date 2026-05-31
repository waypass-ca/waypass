import { X } from 'lucide-react'
import { CasePreviewBody } from './caseShared'

export function CasePreviewPanel({ c, close, onViewCase, isStarred }) {
  return (
    <aside className="w-[360px] border-l border-line bg-white overflow-auto shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-line shrink-0 bg-surface sticky top-0 z-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.1em] text-muted">Case Details</div>
        <button onClick={close} className="w-7 h-7 rounded-md hover:bg-canvas flex items-center justify-center text-muted cursor-pointer">
          <X size={15} />
        </button>
      </div>
      <CasePreviewBody c={c} onViewCase={onViewCase} isStarred={isStarred} />
    </aside>
  )
}
