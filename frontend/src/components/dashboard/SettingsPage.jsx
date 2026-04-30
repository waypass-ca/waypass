import { useState } from 'react'
import { LogOut, Check, Plus, Trash2, UserPlus } from 'lucide-react'
import { Button } from '../ui/Button'
import { PageTitle } from '../layout/PageTitle'
import { useAuth } from '../../context/AuthContext.jsx'
import { useDarkMode } from '../../context/DarkModeContext.jsx'

const NAV_ITEMS = [
  { id: 'general',       label: 'General' },
  { id: 'account',       label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'branding',      label: 'Branding' },
  { id: 'billing',       label: 'Billing' },
]

function SectionTitle({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="font-sans text-sm font-semibold text-ink">{title}</h2>
      {description && <p className="font-sans text-xs text-muted mt-1">{description}</p>}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-line my-8" />
}

function Field({ label, value, placeholder, type = 'text', hint, className = '' }) {
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

function Toggle({ label, description, defaultChecked = false }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div className="flex items-start justify-between py-4">
      <div className="pr-6">
        <p className="font-sans text-sm text-ink">{label}</p>
        {description && <p className="font-sans text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => setOn(v => !v)}
        className={`w-9 h-5 rounded-full transition-all cursor-pointer flex-shrink-0 relative border-0 outline-none ${on ? 'bg-primary' : 'bg-line'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-4' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

/* ── Appearance picker ─────────────────────────────────────────────────────── */
function AppearancePicker() {
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

/* ── Section panels ────────────────────────────────────────────────────────── */
function GeneralSection() {
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

const MOCK_TEAM = [
  { name: 'Sarah Holloway', email: 'sarah@evergreenememorial.com', role: 'Admin', initials: 'SH' },
  { name: 'Marcus Reid', email: 'marcus@evergreenememorial.com', role: 'Staff', initials: 'MR' },
]

function AccountSection() {
  const { user, signOut } = useAuth()
  const [showInvite, setShowInvite] = useState(false)
  const [team, setTeam] = useState(MOCK_TEAM)

  return (
    <div>
      <SectionTitle title="Login Credentials" description="Manage your personal login information." />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Account Email" value={user?.email ?? 'admin@evergreenememorial.com'} type="email" className="col-span-2" />
        <Field label="Current Password" placeholder="••••••••••" type="password" />
        <Field label="New Password" placeholder="New password" type="password" />
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="secondary">Update Password</Button>
      </div>

      <Divider />

      <div className="flex items-center justify-between mb-6">
        <SectionTitle title="Team Members" description="People with access to your Passage account." />
        <button
          onClick={() => setShowInvite(v => !v)}
          className="flex items-center gap-1.5 text-xs font-sans font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer border-0 bg-transparent outline-none flex-shrink-0 -mt-6"
        >
          <UserPlus size={13} strokeWidth={1.8} />
          Invite user
        </button>
      </div>

      {showInvite && (
        <div className="mb-5 p-4 rounded-xl border border-line bg-canvas flex gap-3 items-end">
          <Field label="Email address" placeholder="colleague@example.com" className="flex-1" />
          <div className="flex-shrink-0">
            <label className="block text-xs font-sans text-muted mb-1.5">Role</label>
            <select className="border border-line rounded-lg px-3 py-2.5 text-sm font-sans text-ink outline-none focus:border-secondary/60 bg-surface dark:bg-surface cursor-pointer">
              <option>Staff</option>
              <option>Admin</option>
            </select>
          </div>
          <Button variant="primary" onClick={() => setShowInvite(false)}>Send Invite</Button>
        </div>
      )}

      <div className="rounded-xl border border-line overflow-hidden">
        {team.map((member, i) => (
          <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? 'border-t border-line' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-sans font-semibold flex-shrink-0">
                {member.initials}
              </div>
              <div>
                <p className="font-sans text-sm text-ink">{member.name}</p>
                <p className="font-sans text-xs text-muted">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-sans text-xs text-muted">{member.role}</span>
              <button
                onClick={() => setTeam(t => t.filter((_, j) => j !== i))}
                className="text-muted hover:text-danger transition-colors cursor-pointer border-0 bg-transparent outline-none p-1"
              >
                <Trash2 size={13} strokeWidth={1.6} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-sm font-medium text-ink">Sign out</p>
          <p className="font-sans text-xs text-muted mt-0.5">You'll be returned to the login screen.</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 font-sans text-sm text-danger hover:text-danger/80 transition-colors cursor-pointer border border-danger/30 hover:border-danger/50 rounded-lg px-3.5 py-2 bg-transparent outline-none"
        >
          <LogOut size={13} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </div>
  )
}

function BrandingSection() {
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

function BillingSection() {
  return (
    <div>
      <SectionTitle title="Current Plan" />
      <div className="bg-ink rounded-xl p-6 text-surface">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-sans text-xs text-white/40 uppercase tracking-widest mb-1">Plan</p>
            <p className="font-display text-3xl text-white">Professional</p>
            <p className="font-sans text-sm text-white/50 mt-1">Up to 50 cases/month · 3 crematorium partners</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-white">$199<span className="font-sans text-base text-white/40">/mo</span></p>
            <p className="font-sans text-xs text-white/40 mt-1">Renews Apr 1, 2025</p>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-white/10 flex gap-3">
          <Button variant="secondary" className="border-white/20 text-white hover:bg-white/10">Upgrade Plan</Button>
          <Button variant="secondary" className="border-white/20 text-white/50 hover:bg-white/10">Cancel Plan</Button>
        </div>
      </div>

      <Divider />

      <SectionTitle title="Payment Method" />
      <div className="flex items-center justify-between py-3.5 border border-line rounded-xl px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-6 bg-info rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-bold tracking-tight">VISA</span>
          </div>
          <div>
            <p className="font-sans text-sm text-ink">•••• •••• •••• 4242</p>
            <p className="font-sans text-xs text-muted">Expires 09/2026</p>
          </div>
        </div>
        <Button variant="secondary">Update</Button>
      </div>

      <Divider />

      <SectionTitle title="Billing History" />
      <div className="rounded-xl border border-line overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-canvas border-b border-line">
              {['Date', 'Description', 'Amount', 'Receipt'].map(col => (
                <th key={col} className="text-left px-5 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { date: 'Mar 1, 2025', desc: 'Professional Plan — March 2025', amount: '$199.00' },
              { date: 'Feb 1, 2025', desc: 'Professional Plan — February 2025', amount: '$199.00' },
              { date: 'Jan 1, 2025', desc: 'Professional Plan — January 2025', amount: '$199.00' },
            ].map((row, i) => (
              <tr key={i} className={`hover:bg-canvas/50 transition-colors ${i > 0 ? 'border-t border-line' : ''}`}>
                <td className="px-5 py-3 font-sans text-xs text-muted whitespace-nowrap">{row.date}</td>
                <td className="px-5 py-3 font-sans text-sm text-ink">{row.desc}</td>
                <td className="px-5 py-3 font-sans text-sm font-medium text-ink">{row.amount}</td>
                <td className="px-5 py-3">
                  <button className="font-sans text-xs font-medium text-primary hover:text-primary/70 transition-colors cursor-pointer border-0 bg-transparent outline-none">
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

function NotificationsSection() {
  return (
    <div>
      <SectionTitle title="Email Notifications" description="Choose which events trigger an email to your inbox." />
        <div className="divide-y divide-line">
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

const SECTIONS = {
  general:       GeneralSection,
  account:       AccountSection,
  notifications: NotificationsSection,
  branding:      BrandingSection,
  billing:       BillingSection,
}

export function SettingsPage() {
  const [activeId, setActiveId] = useState('general')
  const Content = SECTIONS[activeId]

  return (
    <div className="flex gap-12 min-h-0">
      {/* Left sidebar nav */}
      <aside className="w-44 flex-shrink-0">
        <PageTitle className="mb-6">Settings</PageTitle>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans transition-colors cursor-pointer border-0 outline-none
                ${activeId === id
                  ? 'bg-line/60 text-ink font-medium'
                  : 'text-secondary hover:text-ink hover:bg-canvas'
                }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-15 pb-16 max-w-3xl">
        <Content />
      </main>
    </div>
  )
}
