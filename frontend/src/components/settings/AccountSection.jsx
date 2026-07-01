import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext.jsx'
import { useUser } from '../../context/UserContext.jsx'
import { SectionTitle, Divider } from './settingsShared'
import { supabase } from '../../lib/supabase.js'
import { updateProfile } from '../../lib/api.js'

export function AccountSection() {
  const { signOut } = useAuth()
  const { profile, canWrite, setProfile } = useUser()

  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [lastName, setLastName] = useState(profile?.lastName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const inputClass = (disabled) =>
    `w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition-colors bg-surface dark:bg-surface ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-secondary/60'
    }`

  async function saveProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const updated = await updateProfile(profile.id, {
        first_name: firstName,
        last_name: lastName,
        phone,
      })
      setProfile(updated)
      setProfileMsg({ ok: true, text: 'Profile saved.' })
    } catch (err) {
      setProfileMsg({ ok: false, text: err.message ?? 'Failed to save profile.' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function updatePassword(e) {
    e.preventDefault()
    if (!newPw || newPw.length < 6) {
      setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' })
      return
    }
    setPwSaving(true)
    setPwMsg(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setCurrentPw('')
      setNewPw('')
      setPwMsg({ ok: true, text: 'Password updated.' })
    } catch (err) {
      setPwMsg({ ok: false, text: err.message })
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div>
      <SectionTitle title="Profile" description="Your personal information." />
      <form onSubmit={saveProfile}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              disabled={!canWrite}
              className={inputClass(!canWrite)}
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              disabled={!canWrite}
              className={inputClass(!canWrite)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-sans text-muted mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              readOnly
              className={inputClass(true)}
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(415) 555-0100"
              disabled={!canWrite}
              className={inputClass(!canWrite)}
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Role</label>
            <input
              type="text"
              value={profile?.role === 'read_only' ? 'Read-Only' : profile?.role === 'admin' ? 'Admin' : 'Staff'}
              readOnly
              className={inputClass(true)}
            />
          </div>
        </div>
        {profileMsg && (
          <p className={`font-sans text-xs mt-3 ${profileMsg.ok ? 'text-primary' : 'text-danger'}`}>{profileMsg.text}</p>
        )}
        {canWrite && (
          <div className="mt-5 flex justify-end">
            <Button variant="primary" type="submit" disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
        )}
      </form>

      <Divider />

      <SectionTitle title="Password" description="Update your login password." />
      <form onSubmit={updatePassword}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              disabled={!canWrite}
              className={inputClass(!canWrite)}
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Min 6 characters"
              disabled={!canWrite}
              className={inputClass(!canWrite)}
            />
          </div>
        </div>
        {pwMsg && (
          <p className={`font-sans text-xs mt-3 ${pwMsg.ok ? 'text-primary' : 'text-danger'}`}>{pwMsg.text}</p>
        )}
        {canWrite && (
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" type="submit" disabled={pwSaving}>
              {pwSaving ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        )}
      </form>

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
