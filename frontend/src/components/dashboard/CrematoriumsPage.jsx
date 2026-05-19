import { useState, useEffect } from 'react'
import {
  fetchCrematoriums, createCrematorium, updateCrematorium, deleteCrematorium,
  connectCrematorium, disconnectCrematorium, fetchNearbyCrematoriums,
} from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PageHeader } from '../layout/PageHeader'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

// ── InputField ────────────────────────────────────────────────────────────────

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

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ crm, onSave, onClose }) {
  const rawFee = crm.avgFee?.replace('$', '') ?? ''
  const [form, setForm] = useState({
    name: crm.name ?? '',
    location: crm.location ?? '',
    distance: crm.distance ?? '',
    contact: crm.contactName ?? '',
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

// ── Disconnect confirmation modal ─────────────────────────────────────────────

function DisconnectModal({ crm, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(null)

  async function handleRemove() {
    setRemoving(true)
    setError(null)
    try {
      await disconnectCrematorium(crm.id)
      onConfirm(crm.id)
    } catch (err) {
      setError(err.message)
      setRemoving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-sm shadow-xl p-6">
        <div className="w-10 h-10 rounded-full bg-danger-tint flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-ink mb-1">Remove Partner</h2>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Remove <span className="text-ink font-medium">{crm.name}</span> from your connected partners? You can reconnect later from the discovery feed.
        </p>
        {error && <p className="font-sans text-xs text-danger mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex-1 bg-danger text-white font-sans text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CompactCrematoriumCard — "Your Crematoriums" section ──────────────────────

function CompactCrematoriumCard({ crm, onEdit, onRemove }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3 min-w-[220px] w-[220px] flex-shrink-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-sans font-semibold text-sm text-ink leading-tight truncate">{crm.name}</p>
          <p className="font-sans text-xs text-muted mt-0.5 truncate">
            {crm.location}{crm.distance ? ` · ${crm.distance}` : ''}
          </p>
        </div>
        <Badge variant={crm.status === 'active' ? 'primary' : 'red'}>
          {crm.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {crm.phone && (
        <p className="font-sans text-xs text-muted truncate">{crm.phone}</p>
      )}

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onEdit(crm)}
          className="flex-1 px-2 py-1.5 rounded-lg border border-line font-sans text-xs text-ink hover:bg-canvas transition-colors text-center"
        >
          Edit
        </button>
        <button
          onClick={() => onRemove(crm)}
          className="flex-1 px-2 py-1.5 rounded-lg border border-line font-sans text-xs text-danger hover:bg-danger-tint transition-colors text-center"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ── NearbyCard — discovery section ───────────────────────────────────────────

function NearbyCard({ crm, onAdd, adding }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-sans font-semibold text-sm text-ink leading-tight">{crm.name}</p>
            {crm.onPassage && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-sans text-[10px] font-semibold uppercase tracking-wide">
                On Passage
              </span>
            )}
          </div>
          <p className="font-sans text-xs text-muted mt-0.5 line-clamp-2">
            {crm.location || crm.streetAddress || '—'}
            {crm.distance ? ` · ${crm.distance}` : ''}
          </p>
        </div>
      </div>

      {crm.phone && (
        <p className="font-sans text-xs text-muted">{crm.phone}</p>
      )}

      <button
        onClick={() => onAdd(crm)}
        disabled={adding}
        className="mt-auto w-full px-3 py-1.5 rounded-lg border border-primary/40 font-sans text-xs font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {adding ? 'Adding…' : '+ Add'}
      </button>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-line border-t-primary rounded-full animate-spin" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CrematoriumsPage({ onAddPartner }) {
  const { user } = useAuth()
  const [crematoriums, setCrematoriums] = useState([])
  const [nearby, setNearby] = useState([])
  const [loading, setLoading] = useState(true)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [editing, setEditing] = useState(null)
  const [disconnecting, setDisconnecting] = useState(null)
  const [addingId, setAddingId] = useState(null)

  // Fetch connected crematoriums
  useEffect(() => {
    fetchCrematoriums()
      .then(setCrematoriums)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Request geolocation once
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    )
  }, [])

  // Debounced nearby fetch
  useEffect(() => {
    const t = setTimeout(() => {
      setNearbyLoading(true)
      fetchNearbyCrematoriums(userLocation?.lat ?? 0, userLocation?.lng ?? 0, search)
        .then(setNearby)
        .catch(console.error)
        .finally(() => setNearbyLoading(false))
    }, 400)
    return () => clearTimeout(t)
  }, [search, userLocation])

  function handleSaved(updated) {
    setCrematoriums(prev => prev.map(c => c.id === updated.id ? updated : c))
    setEditing(null)
  }

  function handleDisconnected(id) {
    setCrematoriums(prev => prev.filter(c => c.id !== id))
    setDisconnecting(null)
  }

  async function handleAdd(crm) {
    setAddingId(crm.id)
    try {
      if (crm.onPassage) {
        // Passage DB crematorium — just connect
        const connected = await connectCrematorium(crm.id)
        setCrematoriums(prev => [...prev, connected])
      } else {
        // Google Places result — create then it auto-connects via POST /
        const created = await createCrematorium({
          name: crm.name,
          location: crm.location,
          streetAddress: crm.streetAddress,
        })
        setCrematoriums(prev => [...prev, created])
      }
      // Remove from nearby optimistically
      setNearby(prev => prev.filter(n => n.id !== crm.id))
    } catch (err) {
      console.error(err)
    } finally {
      setAddingId(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="font-sans text-sm text-muted">Loading…</p>
    </div>
  )

  return (
    <div className="space-y-8">
      {editing && (
        <EditModal crm={editing} onSave={handleSaved} onClose={() => setEditing(null)} />
      )}
      {disconnecting && (
        <DisconnectModal crm={disconnecting} onConfirm={handleDisconnected} onClose={() => setDisconnecting(null)} />
      )}

      <PageHeader
        title="Crematoriums"
        subtitle="Manage your cremation service partners"
        rightSlot={<Button variant="primary" onClick={onAddPartner}>+ Add Partner</Button>}
      />

      {/* Section 1 — Your Crematoriums */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="font-display text-xl text-ink">Your crematoriums</h2>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-canvas border border-line font-sans text-[11px] font-semibold text-muted">
            {crematoriums.length}
          </span>
        </div>

        {crematoriums.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl px-6 py-10 text-center">
            <p className="font-sans text-sm text-muted">No connected crematoriums yet. Add one below.</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {crematoriums.map(crm => (
              <CompactCrematoriumCard
                key={crm.id}
                crm={crm}
                onEdit={setEditing}
                onRemove={setDisconnecting}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Top Crematoriums Nearby */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="font-display text-xl text-ink flex-shrink-0">Top crematoriums nearby</h2>
          <div className="relative max-w-xs w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search crematoriums…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20"
            />
          </div>
        </div>

        {nearbyLoading ? (
          <Spinner />
        ) : nearby.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl px-6 py-10 text-center">
            <p className="font-sans text-sm text-muted">
              {userLocation ? 'No crematoriums found nearby.' : 'Allow location access to see nearby crematoriums, or search above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {nearby.map(crm => (
              <NearbyCard
                key={crm.id}
                crm={crm}
                onAdd={handleAdd}
                adding={addingId === crm.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — CTA */}
      <section className="bg-surface border border-line rounded-xl px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-sans text-sm font-medium text-ink">Don&rsquo;t see yours?</p>
          <p className="font-sans text-xs text-muted mt-0.5">Manually add a crematorium that isn&rsquo;t in our directory.</p>
        </div>
        <Button variant="primary" onClick={onAddPartner}>+ Add New</Button>
      </section>
    </div>
  )
}
