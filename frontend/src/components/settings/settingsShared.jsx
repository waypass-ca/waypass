import { useState } from 'react'
import { Check } from 'lucide-react'
import { useDarkMode } from '../../context/DarkModeContext.jsx'

export function SectionTitle({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="font-sans text-sm font-semibold text-ink">{title}</h2>
      {description && <p className="font-sans text-xs text-muted mt-1">{description}</p>}
    </div>
  )
}

export function Divider() {
  return <div className="border-t border-line my-8" />
}

export function Field({ label, value, placeholder, type = 'text', hint, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-sans text-muted mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none focus:border-secondary/60 transition-colors bg-surface dark:bg-surface"
      />
      {hint && <p className="font-sans text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  )
}

export function Toggle({ label, description, defaultChecked = false, checked, onChange, disabled = false, hideLabel = false }) {
  const isControlled = checked !== undefined
  const [internal, setInternal] = useState(defaultChecked)
  const on = isControlled ? checked : internal
  const toggle = () => {
    if (disabled) return
    const next = !on
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }
  const switchBtn = (
    <button
      onClick={toggle}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`w-9 h-5 rounded-full transition-all flex-shrink-0 relative border-0 outline-none ${on ? 'bg-primary' : 'bg-line'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-4' : 'left-0.5'}`} />
    </button>
  )
  if (hideLabel) return switchBtn
  return (
    <div className="flex items-start justify-between py-4">
      <div className="pr-6">
        <p className="font-sans text-sm text-ink">{label}</p>
        {description && <p className="font-sans text-xs text-muted mt-0.5">{description}</p>}
      </div>
      {switchBtn}
    </div>
  )
}

export function AppearancePicker() {
  const { mode, setMode } = useDarkMode()

  const options = [
    {
      id: 'light',
      label: 'Light',
      preview: (
        <div className="w-full rounded-md overflow-hidden border border-line/60 mb-2.5" style={{ aspectRatio: '4/3', background: '#EEF1F7' }}>
          <div className="flex h-full">
            <div className="w-1/4 h-full" style={{ background: '#F7F9FD', borderRight: '1px solid #DCE3F0' }}>
              <div className="m-1.5 space-y-1">
                {[40, 30, 30].map((w, i) => (
                  <div key={i} style={{ width: `${w}%`, height: 3, background: '#DCE3F0', borderRadius: 2 }} />
                ))}
              </div>
            </div>
            <div className="flex-1 p-2 space-y-1.5">
              <div style={{ height: 5, width: '55%', background: '#1C1C1E', borderRadius: 2, opacity: 0.15 }} />
              <div style={{ height: 30, background: '#F7F9FD', borderRadius: 5, border: '1px solid #DCE3F0' }} />
              <div style={{ height: 30, background: '#F7F9FD', borderRadius: 5, border: '1px solid #DCE3F0' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dark',
      label: 'Dark',
      preview: (
        <div className="w-full rounded-md overflow-hidden border border-line/60 mb-2.5" style={{ aspectRatio: '4/3', background: '#10121A' }}>
          <div className="flex h-full">
            <div className="w-1/4 h-full" style={{ background: '#171B27', borderRight: '1px solid #252A3D' }}>
              <div className="m-1.5 space-y-1">
                {[40, 30, 30].map((w, i) => (
                  <div key={i} style={{ width: `${w}%`, height: 3, background: '#252A3D', borderRadius: 2 }} />
                ))}
              </div>
            </div>
            <div className="flex-1 p-2 space-y-1.5">
              <div style={{ height: 5, width: '55%', background: '#EAEAF0', borderRadius: 2, opacity: 0.2 }} />
              <div style={{ height: 30, background: '#171B27', borderRadius: 5, border: '1px solid #252A3D' }} />
              <div style={{ height: 30, background: '#171B27', borderRadius: 5, border: '1px solid #252A3D' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'system',
      label: 'System',
      preview: (
        <div className="w-full rounded-md overflow-hidden border border-line/60 mb-2.5 flex" style={{ aspectRatio: '4/3' }}>
          <div className="w-1/2 h-full flex" style={{ background: '#EEF1F7' }}>
            <div className="w-1/3 h-full" style={{ background: '#F7F9FD', borderRight: '1px solid #DCE3F0' }}>
              <div className="m-1 space-y-1">
                {[50, 35].map((w, i) => (
                  <div key={i} style={{ width: `${w}%`, height: 3, background: '#DCE3F0', borderRadius: 2 }} />
                ))}
              </div>
            </div>
            <div className="flex-1 p-1.5 space-y-1">
              <div style={{ height: 4, width: '60%', background: '#1C1C1E', borderRadius: 2, opacity: 0.15 }} />
              <div style={{ height: 24, background: '#F7F9FD', borderRadius: 4, border: '1px solid #DCE3F0' }} />
            </div>
          </div>
          <div className="w-1/2 h-full flex" style={{ background: '#10121A', borderLeft: '1px solid #252A3D' }}>
            <div className="w-1/3 h-full" style={{ background: '#171B27', borderRight: '1px solid #252A3D' }}>
              <div className="m-1 space-y-1">
                {[50, 35].map((w, i) => (
                  <div key={i} style={{ width: `${w}%`, height: 3, background: '#252A3D', borderRadius: 2 }} />
                ))}
              </div>
            </div>
            <div className="flex-1 p-1.5 space-y-1">
              <div style={{ height: 4, width: '60%', background: '#EAEAF0', borderRadius: 2, opacity: 0.2 }} />
              <div style={{ height: 24, background: '#171B27', borderRadius: 4, border: '1px solid #252A3D' }} />
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map(({ id, label, preview }) => {
        const selected = mode === id
        return (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`relative text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer outline-none
              ${selected ? 'border-ink bg-surface' : 'border-line bg-canvas hover:border-secondary/40'}`}
          >
            {preview}
            <div className="flex items-center justify-between">
              <span className={`font-sans text-xs font-medium ${selected ? 'text-ink' : 'text-secondary'}`}>{label}</span>
              {selected && (
                <span className="w-3.5 h-3.5 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                  <Check size={8} className="text-surface" strokeWidth={3} />
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
