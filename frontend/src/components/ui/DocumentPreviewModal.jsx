import { FileText, Download, X } from 'lucide-react'

export function DocumentPreviewModal({ doc, onClose }) {
  const fileName = doc.fullName ?? doc.name
  const isPdf    = fileName.toLowerCase().endsWith('.pdf')
  const isImage  = /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '760px', height: '88vh', maxWidth: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-line bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-canvas border border-line flex items-center justify-center shrink-0">
              <FileText size={13} className="text-muted" />
            </div>
            <span className="font-sans text-sm font-medium text-ink truncate max-w-[400px]">{fileName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={doc.url}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="h-8 px-3 rounded-lg border border-line bg-canvas text-xs font-sans font-medium text-secondary hover:text-ink hover:bg-white transition-colors flex items-center gap-1.5"
            >
              <Download size={12} strokeWidth={1.8} />
              Download
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-canvas flex items-center justify-center text-muted transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-[#f0f0f0]">
          {isPdf ? (
            <iframe
              src={`${doc.url}#toolbar=0&navpanes=0`}
              title={fileName}
              className="w-full h-full border-none"
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-6">
              <img src={doc.url} alt={fileName} className="max-w-full max-h-full object-contain rounded-lg shadow" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <FileText size={48} className="text-muted/40" />
              <p className="font-sans text-[13px] text-secondary">Preview not available for this file type</p>
              <a
                href={doc.url}
                download={fileName}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-4 rounded-lg bg-ink text-surface font-sans text-[12.5px] font-medium flex items-center gap-1.5 hover:bg-ink/90 transition-colors"
              >
                <Download size={13} /> Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
