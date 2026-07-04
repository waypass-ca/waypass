import { useEffect, useState } from 'react'
import { Button } from '../../ui/Button'
import { fetchAddons, fetchPackages, fetchFolders, fetchCrematoriums } from '../../../lib/api.js'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block font-sans text-[10.5px] text-muted uppercase tracking-wide mb-1">{label}</span>
      {children}
    </label>
  )
}

const INPUT_CLS = "w-full border border-line rounded-lg px-3 py-2 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"

export function EditCaseModal({ caseData, primaryContact, onSubmit, onClose }) {
  const [packages, setPackages] = useState([])
  const [allAddons, setAllAddons] = useState([])
  const [folders, setFolders] = useState([])
  const [crematoriums, setCrematoriums] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // One local form per logical entity. Keep nulls so we can diff against the
  // initial values and only PATCH what actually changed.
  const [deceased, setDeceased] = useState({
    date_of_birth: caseData.dob ?? '',
    date_of_passing: caseData.dop ?? '',
    place_of_death: caseData.location ?? '',
  })
  const [contact, setContact] = useState({
    name: primaryContact?.name ?? '',
    relationship: primaryContact?.relationship ?? '',
    phone: primaryContact?.phone ?? '',
    email: primaryContact?.email ?? '',
  })
  const [caseFields, setCaseFields] = useState({
    package_name: caseData.package ?? '',
    folder_id: caseData.folderId ?? '',
    crematorium_id: caseData.crematoriumId ?? '',
  })
  const [financials, setFinancials] = useState({
    amount_billed: caseData.amount ?? 0,
  })
  const [addonIds, setAddonIds] = useState(caseData.addons ?? [])

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {})
    fetchAddons().then(setAllAddons).catch(() => {})
    fetchFolders('case').then(setFolders).catch(() => {})
    fetchCrematoriums().then(setCrematoriums).catch(() => {})
  }, [])

  function toggleAddon(id) {
    setAddonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSave() {
    setError(null)
    setSaving(true)

    const deceasedPatch = {}
    if (deceased.date_of_birth !== (caseData.dob ?? '')) deceasedPatch.date_of_birth = deceased.date_of_birth || null
    if (deceased.date_of_passing !== (caseData.dop ?? '')) deceasedPatch.date_of_passing = deceased.date_of_passing || null
    if (deceased.place_of_death !== (caseData.location ?? '')) deceasedPatch.place_of_death = deceased.place_of_death || null

    const contactPatch = {}
    if (primaryContact) {
      if (contact.name !== (primaryContact.name ?? '')) contactPatch.name = contact.name || null
      if (contact.relationship !== (primaryContact.relationship ?? '')) contactPatch.relationship = contact.relationship || null
      if (contact.phone !== (primaryContact.phone ?? '')) contactPatch.phone = contact.phone || null
      if (contact.email !== (primaryContact.email ?? '')) contactPatch.email = contact.email || null
    }

    const casePatch = {}
    if (caseFields.package_name !== (caseData.package ?? '')) {
      const p = packages.find(x => x.name === caseFields.package_name)
      casePatch.package_id = p?.id ?? null
      casePatch.package_name = caseFields.package_name || null
      casePatch.package_price = p?.price ?? null
    }
    if ((caseFields.folder_id || null) !== (caseData.folderId ?? null)) {
      casePatch.folder_id = caseFields.folder_id || null
    }
    const selectedCrem = crematoriums.find(c => c.id === caseFields.crematorium_id)
    if ((caseFields.crematorium_id || null) !== (caseData.crematoriumId ?? null)) {
      casePatch.crematorium_id = caseFields.crematorium_id || null
      casePatch.crematorium_name = selectedCrem?.name ?? null
    }

    const financialsPatch = {}
    if (Number(financials.amount_billed) !== Number(caseData.amount ?? 0)) {
      financialsPatch.amount_billed = Number(financials.amount_billed) || 0
    }

    const originalAddons = new Set(caseData.addons ?? [])
    const nextAddons = new Set(addonIds)
    const addonsToAdd = [...nextAddons].filter(id => !originalAddons.has(id))
    const addonsToRemove = [...originalAddons].filter(id => !nextAddons.has(id))

    try {
      await onSubmit({
        deceasedPatch,
        contactPatch,
        contactId: primaryContact?.id ?? null,
        casePatch,
        financialsPatch,
        addonsToAdd,
        addonsToRemove,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-line">
          <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Case</p>
          <h3 className="font-display text-xl text-ink">Edit details</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section className="space-y-3">
            <h4 className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">Deceased</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth">
                <input type="date" className={INPUT_CLS}
                  value={deceased.date_of_birth ?? ''}
                  onChange={e => setDeceased(s => ({ ...s, date_of_birth: e.target.value }))} />
              </Field>
              <Field label="Date of Passing">
                <input type="date" className={INPUT_CLS}
                  value={deceased.date_of_passing ?? ''}
                  onChange={e => setDeceased(s => ({ ...s, date_of_passing: e.target.value }))} />
              </Field>
            </div>
            <Field label="Place of Death">
              <input className={INPUT_CLS}
                value={deceased.place_of_death ?? ''}
                onChange={e => setDeceased(s => ({ ...s, place_of_death: e.target.value }))} />
            </Field>
          </section>

          <section className="space-y-3">
            <h4 className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">Family Contact</h4>
            {!primaryContact && (
              <p className="font-sans text-[12px] text-muted italic">No primary contact on this case yet.</p>
            )}
            {primaryContact && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name">
                    <input className={INPUT_CLS}
                      value={contact.name ?? ''}
                      onChange={e => setContact(s => ({ ...s, name: e.target.value }))} />
                  </Field>
                  <Field label="Relationship">
                    <input className={INPUT_CLS}
                      value={contact.relationship ?? ''}
                      onChange={e => setContact(s => ({ ...s, relationship: e.target.value }))} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone">
                    <input type="tel" className={INPUT_CLS}
                      value={contact.phone ?? ''}
                      onChange={e => setContact(s => ({ ...s, phone: e.target.value }))} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={INPUT_CLS}
                      value={contact.email ?? ''}
                      onChange={e => setContact(s => ({ ...s, email: e.target.value }))} />
                  </Field>
                </div>
              </>
            )}
          </section>

          <section className="space-y-3">
            <h4 className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">Arrangements</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Package">
                <select className={INPUT_CLS}
                  value={caseFields.package_name ?? ''}
                  onChange={e => setCaseFields(s => ({ ...s, package_name: e.target.value }))}>
                  <option value="">—</option>
                  {packages.map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
                </select>
              </Field>
              <Field label="Folder">
                <select className={INPUT_CLS}
                  value={caseFields.folder_id ?? ''}
                  onChange={e => setCaseFields(s => ({ ...s, folder_id: e.target.value }))}>
                  <option value="">—</option>
                  {folders.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                </select>
              </Field>
            </div>
            <Field label="Crematorium">
              <select className={INPUT_CLS}
                value={caseFields.crematorium_id ?? ''}
                onChange={e => setCaseFields(s => ({ ...s, crematorium_id: e.target.value }))}>
                <option value="">— None —</option>
                {crematoriums.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </Field>
            <Field label="Add-ons">
              <div className="flex flex-wrap gap-2 pt-1">
                {allAddons.length === 0 && (
                  <span className="font-sans text-[12px] text-muted italic">No add-ons available.</span>
                )}
                {allAddons.map(a => {
                  const selected = addonIds.includes(a.id)
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAddon(a.id)}
                      className={`px-3 py-1 rounded-full border text-[12px] font-sans cursor-pointer transition-colors ${
                        selected
                          ? 'bg-ink border-ink text-surface'
                          : 'bg-white border-line text-secondary hover:bg-canvas hover:text-ink'
                      }`}
                    >
                      {a.name}
                    </button>
                  )
                })}
              </div>
            </Field>
            <Field label="Total">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm text-muted">$</span>
                <input type="number" min="0" step="1" className={INPUT_CLS}
                  value={financials.amount_billed ?? 0}
                  onChange={e => setFinancials(s => ({ ...s, amount_billed: e.target.value }))} />
              </div>
            </Field>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-sans text-[12.5px] text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
