import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function InfoSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 pt-3 pb-2 hover:bg-ink/[0.02] transition-colors cursor-pointer border-0 bg-transparent outline-none"
      >
        <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">{title}</span>
        <ChevronDown
          size={12}
          className={`text-muted transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
          strokeWidth={2}
        />
      </button>
      {open && <div className="px-5 pb-2">{children}</div>}
    </div>
  )
}
