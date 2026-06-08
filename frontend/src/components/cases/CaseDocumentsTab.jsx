import { useRef } from 'react'
import { TriangleAlert, Upload } from 'lucide-react'
import { DocRow } from './DocRow'

export function CaseDocumentsTab({ documents, uploading, docsActionNeeded, authorizationComplete, onShowAuth, onUpload, onPreview }) {
  const uploadInputRef = useRef(null)

  return (
    <div className="max-w-2xl mx-auto px-8 py-6">
      <div className="flex justify-end gap-2 mb-6 -mx-4">
        {docsActionNeeded && (
          <button
            onClick={onShowAuth}
            className="h-8 px-3 rounded-lg bg-warning-light border border-warning/40 text-warning font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer outline-none hover:bg-warning/20 transition-colors"
          >
            <TriangleAlert size={12} strokeWidth={2} />
            Authorization
          </button>
        )}
        <input
          ref={uploadInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = '' }}
        />
        <button
          onClick={() => uploadInputRef.current?.click()}
          disabled={uploading}
          className="h-8 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer outline-none disabled:opacity-50"
        >
          {uploading
            ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            : <Upload size={12} strokeWidth={2} />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {documents.length > 0 ? (
        <div>
          <p className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider py-2 mb-1">Files</p>
          {documents.map((doc, i) => <DocRow key={i} doc={doc} onPreview={onPreview} />)}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-sans text-sm text-muted">No documents uploaded yet.</p>
          <p className="font-sans text-xs text-muted mt-1">Use the Upload button above to add files.</p>
        </div>
      )}
    </div>
  )
}
