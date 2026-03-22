import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock, authedUser, badToken } from '../setup.js'

const { supabase, chain: _chain } = makeSupabaseMock()

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

  it('calls next() and sets req.user on valid token', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)

    const req = { headers: { authorization: 'Bearer valid-token' } }
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.user).toEqual(authedUser.data.user)
  })
})
