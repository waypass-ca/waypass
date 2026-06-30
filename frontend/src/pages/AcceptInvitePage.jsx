import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { getInviteInfo, acceptInvite } from '../lib/api.js'

export function AcceptInvitePage() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token') ?? ''

  const [info, setInfo] = useState(null)
  const [infoError, setInfoError] = useState(null)
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setInfoError('No invite token provided.')
      return
    }
    getInviteInfo(token)
      .then(data => {
        if (data.alreadyAccepted) {
          setInfoError('This invite has already been accepted. Try signing in.')
        } else if (data.expired) {
          setInfoError('This invite has expired. Ask your admin to send a new one.')
        } else {
          setInfo(data)
        }
      })
      .catch(() => setInfoError('Invite not found or expired.'))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await acceptInvite({ token, password, firstName, lastName })
      setDone(true)
      await supabase.auth.signInWithPassword({ email: info.email, password })
      window.location.replace('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white'

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="text-center">
          <h2 className="font-display text-2xl text-ink mb-2">Welcome to Passage</h2>
          <p className="font-sans text-sm text-muted">Setting up your account…</p>
        </div>
      </div>
    )
  }

  if (infoError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="text-center max-w-sm">
          <h2 className="font-display text-2xl text-ink mb-2">Invite Error</h2>
          <p className="font-sans text-sm text-muted">{infoError}</p>
        </div>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <p className="font-sans text-sm text-muted">Loading invite…</p>
      </div>
    )
  }

  const roleLabel = info.role === 'admin' ? 'Admin' : info.role === 'read_only' ? 'Read-Only' : 'Staff'

  return (
    <div className="flex items-center justify-center min-h-screen bg-canvas">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-light text-ink">Accept Invite</h1>
          <p className="font-sans text-sm text-muted mt-2">
            Join <strong>{info.funeralHomeName}</strong> as <strong>{roleLabel}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-line p-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-muted mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Jane"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-muted mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Smith"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Email</label>
            <input
              type="email"
              value={info.email}
              readOnly
              className={`${inputClass} bg-canvas text-muted`}
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Choose a Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={inputClass}
            />
            <p className="font-sans text-[11px] text-muted mt-1">Minimum 6 characters</p>
          </div>

          {error && <p className="font-sans text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white rounded-lg py-2.5 text-sm font-sans font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting up account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
