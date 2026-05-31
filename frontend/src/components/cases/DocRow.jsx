export function DocRow({ doc, onPreview }) {
  const name = typeof doc === 'string' ? doc : doc.name
  const path = typeof doc === 'string' ? null : doc.path
  const uploadedAt = typeof doc === 'string' ? null : doc.uploadedAt
  const ext = name?.split('.').pop().toUpperCase() ?? 'FILE'

  return (
    <div
      onClick={() => onPreview(doc)}
      className="flex items-center justify-between py-3 border-b border-line last:border-0 cursor-pointer hover:bg-canvas/50 -mx-2 px-2 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-info-tint flex items-center justify-center flex-shrink-0">
          <span className="font-sans text-[9px] font-bold text-info">{ext}</span>
        </div>
        <div className="min-w-0">
          <p className="font-sans text-sm text-ink truncate">{name}</p>
          {uploadedAt && <p className="font-sans text-[11px] text-muted mt-0.5">{uploadedAt}</p>}
        </div>
      </div>
      {path && (
        <span className="font-sans text-xs font-medium text-muted group-hover:text-ink transition-colors flex-shrink-0 ml-4">
          Open
        </span>
      )}
    </div>
  )
}
