import { useEffect, useState } from 'react'
import { Mail, Trash2, ChevronDown, RotateCcw } from 'lucide-react'
import { SectionTitle, Divider } from './settingsShared.jsx'
import { useUser } from '../../context/UserContext.jsx'
import { ConfirmModal } from '../ui/ConfirmModal.jsx'
import { fetchUsers, fetchPendingInvites, inviteUser, revokeInvite, resendInvite, changeUserRole, removeUser } from '../../lib/api.js'

const ROLE_LABELS = { admin: 'Admin', staff: 'Staff', read_only: 'Read-Only' }

function RoleBadge({ role }) {
  const colors = {
    admin: 'bg-primary/10 text-primary',
    staff: 'bg-blue-50 text-blue-700',
    read_only: 'bg-surface text-muted border border-line',
  }
  return (
    <span className={`text-xs font-sans font-medium px-2 py-0.5 rounded-full ${colors[role] ?? colors.staff}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-1.5">
        <div className="animate-pulse h-3.5 w-32 bg-line rounded" />
        <div className="animate-pulse h-3 w-44 bg-line rounded" />
      </div>
      <div className="animate-pulse h-6 w-16 bg-line rounded-full" />
    </div>
  )
}

export function StaffSection() {
  const { profile, isAdmin } = useUser()
  const [users, setUsers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviteError, setInviteError] = useState(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([
      fetchUsers(),
      isAdmin ? fetchPendingInvites() : Promise.resolve([]),
    ])
      .then(([u, inv]) => { setUsers(u); setInvites(inv) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [isAdmin])

  async function handleInvite(e) {
    e.preventDefault()
    setInviteError(null)
    setInviteLoading(true)
    try {
      await inviteUser(inviteEmail, inviteRole)
      setInviteEmail('')
      setInviteSent(true)
      setTimeout(() => setInviteSent(false), 3000)
      load()
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRoleChange(userId, role) {
    setActionError(null)
    try {
      await changeUserRole(userId, role)
      load()
    } catch (err) {
      setActionError(err.message ?? 'Failed to change role.')
    }
  }

  async function handleRemoveConfirmed() {
    const userId = confirmTarget
    setConfirmTarget(null)
    setActionError(null)
    try {
      await removeUser(userId)
      load()
    } catch (err) {
      setActionError(err.message ?? 'Failed to remove user.')
    }
  }

  async function handleRevokeInvite(id) {
    setActionError(null)
    try {
      await revokeInvite(id)
      load()
    } catch (err) {
      setActionError(err.message ?? 'Failed to revoke invite.')
    }
  }

  async function handleResendInvite(id) {
    setActionError(null)
    try {
      await resendInvite(id)
      load()
    } catch (err) {
      setActionError(err.message ?? 'Failed to resend invite.')
    }
  }

  return (
    <div>
      <SectionTitle
        title="Team"
        description="Manage who has access to your funeral home."
      />

      {actionError && (
        <p className="font-sans text-xs text-danger mb-3">{actionError}</p>
      )}

      {/* Active users */}
      <div className="divide-y divide-line">
        {loading
          ? [0, 1, 2].map(i => <SkeletonRow key={i} />)
          : users.map(u => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-sans text-sm text-ink flex items-center gap-1.5">
                  {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                  {u.id === profile?.id && (
                    <span className="text-xs border border-line rounded-full px-2 py-0.5 text-muted">You</span>
                  )}
                </p>
                {(u.firstName || u.lastName) && (
                  <p className="font-sans text-xs text-muted">{u.email}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && u.id !== profile?.id ? (
                  <div className="relative">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="appearance-none text-xs font-sans border border-line rounded-lg px-3 py-1.5 pr-7 text-ink bg-surface outline-none cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="read_only">Read-Only</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                ) : (
                  <RoleBadge role={u.role} />
                )}
                {isAdmin && u.id !== profile?.id && (
                  <button
                    onClick={() => setConfirmTarget(u.id)}
                    className="text-muted hover:text-danger transition-colors cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {/* Pending invites */}
      {isAdmin && invites.length > 0 && (
        <>
          <Divider />
          <SectionTitle title="Pending Invites" />
          <div className="divide-y divide-line">
            {invites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-sans text-sm text-ink">{inv.email}</p>
                  <p className="font-sans text-xs text-muted">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={inv.role} />
                  <button
                    onClick={() => handleResendInvite(inv.id)}
                    title="Resend invite"
                    className="text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    title="Revoke invite"
                    className="text-muted hover:text-danger transition-colors cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Invite form — admins only */}
      {isAdmin && (
        <>
          <Divider />
          <SectionTitle title="Invite Team Member" />
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <label className="block text-xs font-sans text-muted mb-1.5">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none focus:border-secondary/60 transition-colors bg-surface"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-muted mb-1.5">Role</label>
              <div className="relative">
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="appearance-none w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none focus:border-secondary/60 transition-colors bg-surface pr-8 cursor-pointer"
                >
                  <option value="staff">Staff — full case access, no admin controls</option>
                  <option value="admin">Admin — full access including team management</option>
                  <option value="read_only">Read-Only — view only, no edits</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>

            {inviteError && <p className="font-sans text-xs text-danger">{inviteError}</p>}
            {inviteSent && <p className="font-sans text-xs text-primary">Invite sent!</p>}

            <button
              type="submit"
              disabled={inviteLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-sans font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 cursor-pointer border-0"
            >
              <Mail size={14} />
              {inviteLoading ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
        </>
      )}

      {confirmTarget && (
        <ConfirmModal
          title="Remove team member"
          message="This will revoke their access immediately. They can be re-invited later."
          confirmLabel="Remove"
          destructive
          onConfirm={handleRemoveConfirmed}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}
