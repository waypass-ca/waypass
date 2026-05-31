import { Button } from '../ui/Button'
import { SectionTitle, Divider, Field, AppearancePicker } from './settingsShared'

export function GeneralSection() {
  return (
    <div>
      <SectionTitle title="Funeral Home Details" description="This information appears on all family-facing materials." />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Funeral Home Name" value="Evergreen Memorial" className="col-span-2" />
        <Field label="License Number" value="CA-FH-2021-04821" hint="State funeral home license" />
        <Field label="Phone Number" value="(415) 555-0190" type="tel" />
        <Field label="Street Address" value="1420 Market Street" className="col-span-2" />
        <Field label="City" value="San Francisco" />
        <Field label="State / ZIP" value="CA 94102" />
        <Field label="Email Address" value="care@evergreenememorial.com" type="email" className="col-span-2" />
        <Field label="Website" value="https://evergreenememorial.com" hint="Shown on family receipts and confirmation emails" className="col-span-2" />
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="primary">Save Changes</Button>
      </div>

      <Divider />

      <SectionTitle title="Appearance" description="Choose how Passage looks on this device. System follows your OS setting." />
      <AppearancePicker />
    </div>
  )
}
