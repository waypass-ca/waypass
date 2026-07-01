import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from '../ui/Button.jsx'
import { supabase } from '../../lib/supabase.js'

export function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [funeralHomeName, setFuneralHomeName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState(null)

  function switchMode(next) {
    setMode(next)
    setError(null)
    setResetMsg(null)
  }

  async function handleForgotPassword() {
    if (!email) {
      setResetMsg({ ok: false, text: 'Please enter your email address above first.' })
      return
    }
    await supabase.auth.resetPasswordForEmail(email)
    setResetMsg({ ok: true, text: 'Check your email for a password reset link.' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp({ email, password, firstName, lastName, funeralHomeName })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-54px)] bg-canvas">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-light text-ink">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="font-sans text-sm text-muted mt-2">
            {mode === 'signin' ? 'Access your Waypass account' : 'Get started with Waypass'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-line p-8 space-y-4">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans text-muted mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane"
                    required
                    className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
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
                    className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-sans text-muted mb-1.5">Funeral Home Name</label>
                <input
                  type="text"
                  value={funeralHomeName}
                  onChange={e => setFuneralHomeName(e.target.value)}
                  placeholder="Evergreen Memorial"
                  required
                  className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
            />
            {mode === 'signup' && (
              <p className="font-sans text-[11px] text-muted mt-1">Minimum 6 characters</p>
            )}
            {mode === 'signin' && (
              <div className="mt-1.5 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-sans text-[11px] text-muted hover:text-primary transition-colors cursor-pointer border-0 bg-transparent outline-none"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {resetMsg && (
            <p className={`font-sans text-xs ${resetMsg.ok ? 'text-primary' : 'text-danger'}`}>{resetMsg.text}</p>
          )}

          {error && (
            <p className="font-sans text-xs text-danger">{error}</p>
          )}

          <Button variant="primary" type="submit" disabled={loading} className="w-full justify-center">
            {loading
              ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')
            }
          </Button>

          <div className="pt-1 text-center">
            {mode === 'signin' ? (
              <p className="font-sans text-xs text-muted">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer border-0 bg-transparent outline-none"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p className="font-sans text-xs text-muted">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer border-0 bg-transparent outline-none"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
