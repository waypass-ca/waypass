import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { SectionTitle, Divider, AppearancePicker } from './settingsShared'
import { useUser } from '../../context/UserContext.jsx'
import { fetchFuneralHome, updateFuneralHome } from '../../lib/api.js'

export function GeneralSection() {
  const { isAdmin } = useUser()

  const [name, setName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [stateZip, setStateZip] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    fetchFuneralHome()
      .then(data => {
        setName(data.name ?? '')
        setLicenseNumber(data.licenseNumber ?? data.license_number ?? '')
        setPhone(data.phone ?? '')
        setStreetAddress(data.streetAddress ?? data.street_address ?? '')
        setCity(data.city ?? '')
        setStateZip(data.stateZip ?? data.state_zip ?? '')
        setEmail(data.email ?? '')
        setWebsite(data.website ?? '')
      })
      .catch(() => {})
  }, [])

  const inputClass = (disabled) =>
    `w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition-colors bg-surface dark:bg-surface ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-secondary/60'
    }`

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    try {
      await updateFuneralHome({
        name,
        license_number: licenseNumber,
        phone,
        street_address: streetAddress,
        city,
        state_zip: stateZip,
        email,
        website,
      })
      setMsg({ ok: true, text: 'Changes saved.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message ?? 'Failed to save changes.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <SectionTitle title="Funeral Home Details" description="This information appears on all family-facing materials." />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-sans text-muted mb-1.5">Funeral Home Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">License Number</label>
          <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} disabled={!isAdmin} className={inputClass(!isAdmin)} />
          <p className="font-sans text-[11px] text-muted mt-1">State funeral home license</p>
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">Phone Number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-sans text-muted mb-1.5">Street Address</label>
          <input type="text" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">City</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">State / ZIP</label>
          <input type="text" value={stateZip} onChange={e => setStateZip(e.target.value)} disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-sans text-muted mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-sans text-muted mb-1.5">Website</label>
          <input type="text" value={website} onChange={e => setWebsite(e.target.value)} disabled={!isAdmin} className={inputClass(!isAdmin)} />
          <p className="font-sans text-[11px] text-muted mt-1">Shown on family receipts and confirmation emails</p>
        </div>
      </div>
      {msg && (
        <p className={`font-sans text-xs mt-3 ${msg.ok ? 'text-primary' : 'text-danger'}`}>{msg.text}</p>
      )}
      {isAdmin && (
        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      )}

      <Divider />

      <SectionTitle title="Appearance" description="Choose how Waypass looks on this device. System follows your OS setting." />
      <AppearancePicker />
    </div>
  )
}
