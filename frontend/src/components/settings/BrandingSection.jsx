import { Button } from '../ui/Button'
import { SectionTitle, Divider, Field } from './settingsShared'

export function BrandingSection() {
  return (
    <div>
      <SectionTitle title="Widget Branding" description="Customise how the family booking widget appears to your families." />

      <div className="mb-5">
        <label className="block text-xs font-sans text-muted mb-1.5">Funeral Home Logo</label>
        <div className="border-2 border-dashed border-line rounded-xl py-8 text-center hover:border-secondary/30 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-sans text-sm text-muted">Click to upload logo</p>
          <p className="font-sans text-xs text-muted mt-1">PNG or SVG · Max 1 MB · Recommended 200×60 px</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Display Name in Widget" value="Evergreen Memorial" hint='Shown as "Powered by Passage" header' />
        <div>
          <label className="block text-xs font-sans text-muted mb-1.5">Accent Color</label>
          <div className="flex items-center gap-3">
            <input type="color" defaultValue="#6B8F71" className="w-10 h-10 rounded-lg border border-line cursor-pointer bg-surface" />
            <input type="text" defaultValue="#6B8F71" className="flex-1 border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none focus:border-secondary/60 bg-surface" />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="primary">Save Branding</Button>
      </div>

      <Divider />

      <SectionTitle title="Widget Preview" description="A live preview of how families will see your booking widget." />
      <div className="bg-canvas rounded-xl p-8 text-center border border-line">
        <p className="font-sans text-xs text-muted mb-1">Evergreen Memorial · Powered by Passage</p>
        <p className="font-display text-3xl font-light text-ink">Cremation Services</p>
        <p className="font-sans text-xs text-secondary mt-2 max-w-xs mx-auto">
          Transparent pricing, compassionate care. We guide your family through every step.
        </p>
        <div className="mt-5 inline-flex gap-2">
          <div className="bg-surface rounded-lg border-2 border-ink px-4 py-2 text-xs font-sans font-medium text-ink">
            Comfort — $1,395
          </div>
        </div>
      </div>
    </div>
  )
}
