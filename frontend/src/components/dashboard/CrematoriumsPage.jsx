import { useState, useEffect } from 'react'
import { fetchCrematoriums, fetchOrders, updateCrematorium, deleteCrematorium } from '../../lib/api.js'
import { PageHeader } from '../layout/PageHeader'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

// ── Edit Modal ────────────────────────────────────────────────────────────────

function InputField({ label, placeholder, type = 'text', prefix, value, onChange }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium text-ink mb-1.5">{label}</label>
      {prefix ? (
        <div className="flex items-center border border-line rounded-lg overflow-hidden bg-canvas focus-within:ring-1 focus-within:ring-ink/20">
          <span className="px-3 font-sans text-sm text-muted select-none border-r border-line bg-canvas py-2">{prefix}</span>
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            min={type === 'number' ? 0 : undefined}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-canvas px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20"
        />
      )}
    </div>
  )
}

function EditModal({ crm, onSave, onClose }) {
  const rawFee = crm.avgFee?.replace('$', '') ?? ''
  const [form, setForm] = useState({
    name: crm.name ?? '',
    location: crm.location ?? '',
    distance: crm.distance ?? '',
    contact: crm.contact ?? '',
    phone: crm.phone ?? '',
    avgTurnaround: crm.avgTurnaround ?? '',
    avgFee: rawFee,
    status: crm.status ?? 'active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(key) {
    return v => setForm(p => ({ ...p, [key]: v }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateCrematorium(crm.id, {
        name: form.name,
        location: form.location,
        distance: form.distance || null,
        contact: form.contact || null,
        phone: form.phone || null,
        avg_turnaround: form.avgTurnaround || null,
        avg_fee: form.avgFee ? `$${form.avgFee}` : null,
        status: form.status,
      })
      onSave(updated)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Edit Partner</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Status toggle */}
          <div className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-colors ${form.status === 'active' ? 'border-primary bg-primary-light/40' : 'border-line bg-canvas'}`}>
            <div>
              <p className="font-sans text-sm font-medium text-ink">Active Partner</p>
              <p className="font-sans text-xs text-muted mt-0.5">{form.status === 'active' ? 'Available for case assignments' : 'Not available for assignments'}</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, status: p.status === 'active' ? 'inactive' : 'active' }))}
              className={`w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ml-6 relative border-0 outline-none ${form.status === 'active' ? 'bg-primary' : 'bg-line'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.status === 'active' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <InputField label="Name" placeholder="Crematorium name" value={form.name} onChange={set('name')} />
            </div>
            <InputField label="Location" placeholder="City, State" value={form.location} onChange={set('location')} />
            <InputField label="Distance" placeholder="e.g. 12 miles" value={form.distance} onChange={set('distance')} />
            <InputField label="Contact Name" placeholder="e.g. John Smith" value={form.contact} onChange={set('contact')} />
            <InputField label="Phone" type="tel" placeholder="(415) 555-0100" value={form.phone} onChange={set('phone')} />
            <InputField label="Avg. Turnaround" placeholder="e.g. 3–5 days" value={form.avgTurnaround} onChange={set('avgTurnaround')} />
            <InputField label="Avg. Fee" type="number" prefix="$" placeholder="295" value={form.avgFee} onChange={set('avgFee')} />
          </div>

          {error && <p className="font-sans text-xs text-danger">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ crm, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteCrematorium(crm.id)
      onConfirm(crm.id)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-sm shadow-xl p-6">
        <div className="w-10 h-10 rounded-full bg-danger-tint flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-ink mb-1">Remove Partner</h2>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Are you sure you want to remove <span className="text-ink font-medium">{crm.name}</span>? This cannot be undone.
        </p>
        {error && <p className="font-sans text-xs text-danger mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-danger text-white font-sans text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {deleting ? 'Removing…' : 'Remove Partner'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function CrematoriumCard({ crm, onEdit, onDelete }) {
  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-sans font-semibold text-sm text-ink">{crm.name}</h3>
            <Badge variant={crm.status === 'active' ? 'primary' : 'red'}>{crm.status === 'active' ? 'Active' : 'Inactive'}</Badge>
          </div>
          <p className="font-sans text-xs text-muted">{crm.location}{crm.distance ? ` · ${crm.distance} away` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(crm)}
            className="px-3 py-1.5 rounded-lg border border-line font-sans text-xs text-ink hover:bg-canvas transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(crm)}
            className="px-3 py-1.5 rounded-lg border border-line font-sans text-xs text-danger hover:bg-danger-tint transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-line border-b border-line">
        {[
          { label: 'Active Orders', value: crm.active },
          { label: 'Completed YTD', value: crm.completedYTD },
          { label: 'Avg Turnaround', value: crm.avgTurnaround },
          { label: 'Avg Fee', value: crm.avgFee },
        ].map(stat => (
          <div key={stat.label} className="px-4 py-3 text-center">
            <p className="font-display text-xl text-ink">{stat.value ?? '—'}</p>
            <p className="font-sans text-[10px] text-muted mt-0.5 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-sans text-xs text-muted">{crm.phone}</span>
          <span className="font-sans text-xs text-muted">{crm.contact}</span>
        </div>
        <span className="font-sans text-xs text-muted">Partner since {crm.since}</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CrematoriumsPage({ onAddPartner }) {
  const [crematoriums, setCrematoriums] = useState([])
  const [crematoriumOrders, setCrematoriumOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // crm object being edited
  const [deleting, setDeleting] = useState(null) // crm object to delete

  useEffect(() => {
    Promise.all([fetchCrematoriums(), fetchOrders()])
      .then(([crms, orders]) => {
        setCrematoriums(crms)
        setCrematoriumOrders(orders)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(updated) {
    setCrematoriums(prev => prev.map(c => c.id === updated.id ? updated : c))
    setEditing(null)
  }

  function handleDeleted(id) {
    setCrematoriums(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="font-sans text-sm text-muted">Loading…</p>
    </div>
  )

  const activeCount = crematoriums.filter(c => c.status === 'active').length
  const totalCompleted = crematoriums.reduce((s, c) => s + c.completedYTD, 0)
  const activeOrders = crematoriums.reduce((s, c) => s + c.active, 0)

  return (
    <div>
      {editing && (
        <EditModal crm={editing} onSave={handleSaved} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <DeleteModal crm={deleting} onConfirm={handleDeleted} onClose={() => setDeleting(null)} />
      )}

      <PageHeader
        title="Crematoriums"
        subtitle="Manage your cremation service partners"
        rightSlot={<Button variant="primary" onClick={onAddPartner}>+ Add Partner</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Partner Crematoriums', value: crematoriums.length },
          { label: 'Active Partners', value: activeCount },
          { label: 'Active Orders', value: activeOrders },
          { label: 'Total Completed YTD', value: totalCompleted },
        ].map(s => (
          <div key={s.label} className="bg-surface rounded-xl border border-line p-5">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">{s.label}</p>
            <p className="font-display text-3xl text-ink mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        {crematoriums.map(crm => (
          <CrematoriumCard
            key={crm.id}
            crm={crm}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-line overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="font-display text-xl text-ink">Active Orders</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-canvas border-b border-line">
              {['Case ID', 'Deceased', 'Crematorium', 'Package', 'Scheduled', 'Status'].map(col => (
                <th key={col} className="text-left px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crematoriumOrders.map(o => {
              const stepLabels = ['Received', 'Intake', 'Cremation', 'Return']
              return (
                <tr key={o.id} className="border-t border-line hover:bg-canvas/50 transition-colors">
                  <td className="px-6 py-3"><span className="font-mono text-xs text-muted">{o.id}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-sm text-ink">{o.name}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-xs text-secondary">{o.funeral_home}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-sm text-secondary">{o.package}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-xs text-muted">{o.scheduled}</span></td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-ink">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink" />
                      {stepLabels[o.status]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
