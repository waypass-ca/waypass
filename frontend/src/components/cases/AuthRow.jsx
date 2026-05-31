import { useRef, useState } from 'react'
import { CheckCircle2, TriangleAlert, Upload } from 'lucide-react'

export function AuthRow({ label, uploaded, onUpload }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    await onUpload(file)
    setUploading(false)
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-line">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${uploaded ? 'bg-primary/10' : 'bg-warning-light'}`}>
          {uploaded
            ? <CheckCircle2 size={14} className="text-primary" />
            : <TriangleAlert size={13} className="text-warning" />}
        </div>
        <span className="font-sans text-sm text-ink">{label}</span>
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleChange} />
      {uploading ? (
        <span className="font-sans text-xs text-muted">Uploading…</span>
      ) : uploaded ? (
        <span className="font-sans text-xs text-primary font-medium">Uploaded</span>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-white text-xs font-sans font-medium text-secondary hover:text-ink hover:bg-canvas transition-colors cursor-pointer outline-none"
        >
          <Upload size={11} strokeWidth={1.8} />
          Upload
        </button>
      )}
    </div>
  )
}
