import { Button } from '../ui/Button'
import { SectionTitle, Divider, AppearancePicker } from './settingsShared'
import { useUser } from '../../context/UserContext.jsx'

export function GeneralSection() {
  const { isAdmin } = useUser()

  const inputClass = (disabled) =>
    `w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition-colors bg-surface dark:bg-surface ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-secondary/60'
    }`

  return (
    <div>
      <SectionTitle title="Funeral Home Details" description="This information appears on all family-facing materials." />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-sans text-muted mb-1.5">Funeral Home Name</label>
          <input type="text" defaultValue="Evergreen Memorial" disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">License Number</label>
          <input type="text" defaultValue="CA-FH-2021-04821" disabled={!isAdmin} className={inputClass(!isAdmin)} />
          <p className="font-sans text-[11px] text-muted mt-1">State funeral home license</p>
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">Phone Number</label>
          <input type="tel" defaultValue="(415) 555-0190" disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-sans text-muted mb-1.5">Street Address</label>
          <input type="text" defaultValue="1420 Market Street" disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">City</label>
          <input type="text" defaultValue="San Francisco" disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">State / ZIP</label>
          <input type="text" defaultValue="CA 94102" disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-sans text-muted mb-1.5">Email Address</label>
          <input type="email" defaultValue="care@evergreenememorial.com" disabled={!isAdmin} className={inputClass(!isAdmin)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-sans text-muted mb-1.5">Website</label>
          <input type="text" defaultValue="https://evergreenememorial.com" disabled={!isAdmin} className={inputClass(!isAdmin)} />
          <p className="font-sans text-[11px] text-muted mt-1">Shown on family receipts and confirmation emails</p>
        </div>
      </div>
      {isAdmin && (
        <div className="mt-5 flex justify-end">
          <Button variant="primary">Save Changes</Button>
        </div>
      )}

      <Divider />

      <SectionTitle title="Appearance" description="Choose how Waypass looks on this device. System follows your OS setting." />
      <AppearancePicker />
    </div>
  )
}
