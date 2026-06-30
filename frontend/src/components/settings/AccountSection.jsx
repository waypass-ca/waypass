import { useState } from 'react'
import { LogOut, Trash2, UserPlus } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext.jsx'
import { SectionTitle, Divider, Field } from './settingsShared'

const MOCK_TEAM = [
  { name: 'Sarah Holloway', email: 'sarah@evergreenememorial.com', role: 'Admin', initials: 'SH' },
  { name: 'Marcus Reid', email: 'marcus@evergreenememorial.com', role: 'Staff', initials: 'MR' },
]

export function AccountSection() {
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
        <SectionTitle title="Team Members" description="People with access to your Waypass account." />
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
