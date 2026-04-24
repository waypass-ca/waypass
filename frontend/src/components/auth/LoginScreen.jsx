import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from '../ui/Button.jsx'

export function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  function switchMode(next) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setSignedUp(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (signedUp) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-54px)] bg-canvas">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-ink">Check your email</h2>
          <p className="font-sans text-sm text-muted mt-2 max-w-xs mx-auto">
            We sent a confirmation link to <span className="font-medium text-ink">{email}</span>. Click it to activate your account, then sign in.
          </p>
          <button
            onClick={() => { setSignedUp(false); switchMode('signin') }}
            className="mt-5 font-sans text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer border-0 bg-transparent outline-none"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-54px)] bg-canvas">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-light text-ink">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="font-sans text-sm text-muted mt-2">
            {mode === 'signin' ? 'Access your Passage account' : 'Get started with Passage'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-line p-8 space-y-4">
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
          </div>

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
