import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock, authedUser, badToken, dbProfile } from '../setup.js'

const { supabase, usersChain } = makeSupabaseMock()

vi.mock('../../lib/supabase.js', () => ({ supabase }))

// Import after mock is registered
const { requireAuth } = await import('../../middleware/auth.js')

function makeRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this },
    json(body) { this._body = body; return this },
  }
  return res
}

describe('requireAuth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usersChain.maybeSingle.mockResolvedValue({ data: dbProfile, error: null })
  })

  it('returns 401 when Authorization header is missing', async () => {
    const req = { headers: {} }
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res._status).toBe(401)
    expect(res._body.error).toBe('Authorization required')
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic abc123' } }
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res._status).toBe(401)
    expect(res._body.error).toBe('Authorization required')
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is invalid or expired', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)

    const req = { headers: { authorization: 'Bearer bad-token' } }
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res._status).toBe(401)
    expect(res._body.error).toBe('Invalid or expired token')
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 403 when user has no profile or funeral_home_id', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    usersChain.maybeSingle.mockResolvedValue({ data: null, error: null })

    const req = { headers: { authorization: 'Bearer valid-token' } }
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res._status).toBe(403)
    expect(res._body.error).toBe('account_not_setup')
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() and sets req.user with funeralHomeId and role on valid token', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)

    const req = { headers: { authorization: 'Bearer valid-token' } }
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.user).toMatchObject({
      id: authedUser.data.user.id,
      email: authedUser.data.user.email,
      funeralHomeId: dbProfile.funeral_home_id,
      role: dbProfile.role,
      token: 'valid-token',
    })
  })
})
