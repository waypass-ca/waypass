export function InfoField({ label, value, href, editing, onChange, type = 'text' }) {
  if (editing) {
    return (
      <div className="py-1.5 border-b border-line last:border-0">
        <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-1">{label}</p>
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="w-full font-sans text-[13px] text-ink bg-white/60 border border-line/60 rounded-md px-2 py-1 outline-none focus:border-ink/30 transition-colors"
        />
      </div>
    )
  }
  const content = (
    <div className="py-1.5 border-b border-line last:border-0">
      <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-sans text-[13px] text-ink">{value || '—'}</p>
    </div>
  )
  return href && value
    ? <a href={href} className="block hover:opacity-70 transition-opacity">{content}</a>
    : content
}
