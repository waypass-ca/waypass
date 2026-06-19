import { useState } from 'react'
import { Button } from '../ui/Button'

export function InputField({ label, placeholder, type = 'text', prefix, value, onChange }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium text-ink mb-1.5">{label}</label>
      {prefix ? (
        <div className="flex items-center border border-line rounded-lg overflow-hidden bg-canvas focus-within:ring-1 focus-within:ring-ink/20">
          <span className="px-3 font-sans text-sm text-muted select-none border-r border-line bg-canvas py-2">{prefix}</span>
          <input type={type} placeholder={placeholder} value={value} min={type === 'number' ? 0 : undefined}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-canvas px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none" />
        </div>
      ) : (
        <input type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20" />
      )}
    </div>
  )
}

export function AddPartnerModal({ crm, onConfirm, onClose, kind = 'crematorium' }) {
  const namePlaceholder = kind === 'shipping' ? 'Shipping partner name' : 'Crematorium name'
  const address = [crm.streetAddress, crm.city, crm.state, crm.zip].filter(Boolean).join(', ') || crm.location || ''
  const [form, setForm] = useState({
    name: crm.name ?? '',
    location: address,
    contactName: '',
    contactEmail: '',
    phone: crm.phone ?? '',
    website: crm.website ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = key => v => setForm(p => ({ ...p, [key]: v }))

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      await onConfirm({
        ...crm,
        name: form.name,
        location: form.location,
        contactName: form.contactName || null,
        contactEmail: form.contactEmail || null,
        phone: form.phone || null,
        website: form.website || null,
      })
    } catch (err) { setError(err.message); setSaving(false) }
  }

  const missing = [
    !form.contactName && 'Contact name',
    !form.contactEmail && 'Email',
    !form.phone && 'Phone',
  ].filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-ink">Add Partner</h2>
            {missing.length > 0 && (
              <p className="font-sans text-xs text-muted mt-0.5">Missing: {missing.join(', ')}</p>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><InputField label="Name" placeholder={namePlaceholder} value={form.name} onChange={set('name')} /></div>
            <div className="col-span-2"><InputField label="Location" placeholder="City, Province" value={form.location} onChange={set('location')} /></div>
            <InputField label="Contact Name" placeholder="e.g. John Smith" value={form.contactName} onChange={set('contactName')} />
            <InputField label="Contact Email" type="email" placeholder="email@example.com" value={form.contactEmail} onChange={set('contactEmail')} />
            <InputField label="Phone" type="tel" placeholder="(415) 555-0100" value={form.phone} onChange={set('phone')} />
            <InputField label="Website" placeholder="https://…" value={form.website} onChange={set('website')} />
          </div>
          {error && <p className="font-sans text-xs text-danger">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Adding…' : 'Add Partner'}
          </Button>
        </div>
      </div>
    </div>
  )
}
