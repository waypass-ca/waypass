import { useState } from 'react'
import { PageHeader } from '../layout/PageHeader'
import { Button } from '../ui/Button'

const TABS = ['Profile', 'Branding', 'Notifications', 'Billing']

function SectionHeader({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="font-sans text-sm font-semibold text-charcoal">{title}</h2>
      {description && <p className="font-sans text-xs text-muted mt-0.5">{description}</p>}
    </div>
  )
}

function Field({ label, value, placeholder, type = 'text', hint }) {
  return (
    <div>
      <label className="block text-xs font-sans text-muted mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
      />
      {hint && <p className="font-sans text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  )
}

function Toggle({ label, description, defaultChecked = false }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div className="flex items-start justify-between py-4 border-b border-border last:border-0">
      <div>
        <p className="font-sans text-sm font-medium text-charcoal">{label}</p>
        {description && <p className="font-sans text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => setOn(v => !v)}
        className={`w-10 h-5 rounded-full transition-all cursor-pointer flex-shrink-0 ml-6 relative border-0 outline-none ${on ? 'bg-sage' : 'bg-border'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <div className="bg-warm-white rounded-xl border border-border p-6">
        <SectionHeader title="Funeral Home Details" description="This information appears on all family-facing materials." />
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Funeral Home Name" value="Evergreen Memorial" />
          </div>
          <Field label="License Number" value="CA-FH-2021-04821" hint="State funeral home license" />
          <Field label="Phone Number" value="(415) 555-0190" type="tel" />
          <div className="col-span-2">
            <Field label="Street Address" value="1420 Market Street" />
          </div>
          <Field label="City" value="San Francisco" />
          <Field label="State / ZIP" value="CA 94102" />
          <div className="col-span-2">
            <Field label="Email Address" value="care@evergreenememorial.com" type="email" />
          </div>
          <div className="col-span-2">
            <Field label="Website" value="https://evergreenememorial.com" hint="Shown on family receipt and confirmation emails" />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="primary">Save Changes</Button>
        </div>
      </div>

      <div className="bg-warm-white rounded-xl border border-border p-6">
        <SectionHeader title="Account" description="Manage your login credentials." />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Account Email" value="admin@evergreenememorial.com" type="email" />
          <Field label="Password" value="••••••••••" type="password" />
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="secondary">Change Password</Button>
        </div>
      </div>
    </div>
  )
}

function BrandingTab() {
  return (
    <div className="space-y-6">
      <div className="bg-warm-white rounded-xl border border-border p-6">
        <SectionHeader title="Widget Branding" description="Customise how the family booking widget appears to your families." />

        {/* Logo upload */}
        <div className="mb-5">
          <label className="block text-xs font-sans text-muted mb-2">Funeral Home Logo</label>
          <div className="border-2 border-dashed border-border rounded-xl py-8 text-center hover:border-slate/40 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-sans text-sm text-muted">Click to upload logo</p>
            <p className="font-sans text-xs text-muted mt-1">PNG or SVG · Max 1MB · Recommended 200×60px</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Display Name in Widget" value="Evergreen Memorial" hint='Shown as "Powered by Passage" header' />
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Accent Color</label>
            <div className="flex items-center gap-3">
              <input type="color" defaultValue="#6B8F71" className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-white" />
              <input type="text" defaultValue="#6B8F71" className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Widget preview */}
      <div className="bg-warm-white rounded-xl border border-border p-6">
        <SectionHeader title="Widget Preview" />
        <div className="bg-cream rounded-xl p-6 text-center">
          <p className="font-sans text-xs text-muted mb-1">Evergreen Memorial · Powered by Passage</p>
          <p className="font-display text-2xl font-light text-charcoal">Cremation Services</p>
          <p className="font-sans text-xs text-slate mt-1 max-w-xs mx-auto">
            Transparent pricing, compassionate care. We guide your family through every step.
          </p>
          <div className="mt-4 inline-flex gap-2">
            <div className="bg-white rounded-lg border-2 border-charcoal px-4 py-2 text-xs font-sans font-medium text-charcoal">Comfort — $1,395</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div className="bg-warm-white rounded-xl border border-border p-6">
      <SectionHeader title="Email Notifications" description="Choose which events trigger an email to your inbox." />
      <div>
        <Toggle label="New case submitted" description="When a family completes the booking widget" defaultChecked />
        <Toggle label="Case status updated" description="When a crematorium updates an order status" defaultChecked />
        <Toggle label="Document uploaded" description="When a new document is added to a case" defaultChecked />
        <Toggle label="Case marked complete" description="When a case reaches the Complete stage" defaultChecked />
        <Toggle label="New crematorium partner request" description="When a crematorium applies to partner" />
        <Toggle label="Weekly revenue summary" description="Every Monday with last week's revenue totals" defaultChecked />
      </div>
    </div>
  )
}

function BillingTab() {
  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="bg-charcoal rounded-xl p-6 text-warm-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-sans text-xs text-white/50 uppercase tracking-wide">Current Plan</p>
            <p className="font-display text-3xl mt-1">Professional</p>
            <p className="font-sans text-sm text-white/60 mt-1">Up to 50 cases/month · 3 crematorium partners</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl">$199<span className="font-sans text-base text-white/50">/mo</span></p>
            <p className="font-sans text-xs text-white/50 mt-1">Renews Apr 1, 2024</p>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-white/10 flex gap-3">
          <Button variant="secondary" className="border-white/20 text-white hover:bg-white/10">Upgrade Plan</Button>
          <Button variant="secondary" className="border-white/20 text-white/60 hover:bg-white/10">Cancel Plan</Button>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-warm-white rounded-xl border border-border p-6">
        <SectionHeader title="Payment Method" />
        <div className="flex items-center justify-between py-3 border border-border rounded-xl px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-6 bg-blue-soft rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">VISA</span>
            </div>
            <div>
              <p className="font-sans text-sm font-medium text-charcoal">•••• •••• •••• 4242</p>
              <p className="font-sans text-xs text-muted">Expires 09/2026</p>
            </div>
          </div>
          <Button variant="secondary">Update</Button>
        </div>
      </div>

      {/* Billing history */}
      <div className="bg-warm-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl text-charcoal">Billing History</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-cream border-b border-border">
              {['Date', 'Description', 'Amount', 'Receipt'].map(col => (
                <th key={col} className="text-left px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { date: 'Mar 1, 2024', desc: 'Professional Plan — March 2024', amount: '$199.00' },
              { date: 'Feb 1, 2024', desc: 'Professional Plan — February 2024', amount: '$199.00' },
              { date: 'Jan 1, 2024', desc: 'Professional Plan — January 2024', amount: '$199.00' },
            ].map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-cream/50 transition-colors">
                <td className="px-6 py-3"><span className="font-sans text-xs text-muted">{row.date}</span></td>
                <td className="px-6 py-3"><span className="font-sans text-sm text-charcoal">{row.desc}</span></td>
                <td className="px-6 py-3"><span className="font-sans text-sm font-medium text-charcoal">{row.amount}</span></td>
                <td className="px-6 py-3">
                  <button className="font-sans text-xs font-medium text-sage hover:text-sage/80 transition-colors cursor-pointer border-0 bg-transparent outline-none">
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TAB_CONTENT = [ProfileTab, BrandingTab, NotificationsTab, BillingTab]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0)
  const Content = TAB_CONTENT[activeTab]

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your funeral home account" date="March 10, 2024" />

      {/* Tab bar */}
      <div className="flex gap-1 bg-warm-white border border-border rounded-xl p-1 mb-6 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`
              px-4 py-2 rounded-lg text-sm font-sans font-medium transition-all cursor-pointer border-0 outline-none
              ${activeTab === i ? 'bg-charcoal text-warm-white' : 'text-slate hover:text-charcoal'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      <Content />
    </div>
  )
}
