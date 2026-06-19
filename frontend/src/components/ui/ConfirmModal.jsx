import { X, TriangleAlert } from 'lucide-react'

export function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl border border-line shadow-2xl w-[380px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${destructive ? 'bg-danger/10 border-danger/20' : 'bg-canvas border-line'}`}>
              <TriangleAlert size={15} className={destructive ? 'text-danger' : 'text-secondary'} />
            </div>
            <span className="font-sans text-[14px] font-semibold text-ink">{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-lg hover:bg-canvas flex items-center justify-center text-muted cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {message && (
          <div className="px-5 py-4">
            <p className="font-sans text-[13px] text-secondary leading-relaxed">{message}</p>
          </div>
        )}

        <div className="px-5 pb-5 pt-1 flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-line bg-canvas font-sans text-[13px] font-medium text-ink cursor-pointer hover:bg-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl font-sans text-[13px] font-medium text-white cursor-pointer transition-colors ${destructive ? 'bg-danger hover:bg-danger/90' : 'bg-ink hover:opacity-90'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
