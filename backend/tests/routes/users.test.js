import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeChain, makeSupabaseMock, authedUser, badToken, authHeader, dbProfile, resetDispatch } from '../setup.js'

const { supabase, chain, usersChain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const dbUser = {
  id: 'test-user-id',
  funeral_home_id: 'fh-uuid-1',
  email: 'admin@acme.com',
  first_name: 'Alice',
  last_name: 'Smith',
  phone: '(415) 555-0100',
  role: 'admin',
  status: 'active',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
}

const shapedUser = {
  id: 'test-user-id',
  funeralHomeId: 'fh-uuid-1',
  email: 'admin@acme.com',
  firstName: 'Alice',
  lastName: 'Smith',
  phone: '(415) 555-0100',
  role: 'admin',
  status: 'active',
  avatarUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    usersChain.order.mockResolvedValue({ data: [dbUser], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })

  it('returns 200 with users scoped to funeral home', async () => {
    const res = await request(app).get('/api/users').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedUser])
  })

  it('returns 500 on DB error', async () => {
    usersChain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/users').set(authHeader)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/users/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    usersChain.single.mockResolvedValue({ data: dbUser, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/users/me')
    expect(res.status).toBe(401)
  })

  it('returns 200 with current user profile', async () => {
    const res = await request(app).get('/api/users/me').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedUser)
  })
})

describe('POST /api/users/invite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/users/invite').send({ email: 'staff@acme.com', role: 'staff' })
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin user', async () => {
    usersChain.maybeSingle.mockResolvedValue({ data: { ...dbProfile, role: 'staff' }, error: null })
    const res = await request(app).post('/api/users/invite').set(authHeader).send({ email: 'staff@acme.com', role: 'staff' })
    expect(res.status).toBe(403)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/users/invite').set(authHeader).send({ role: 'staff' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('email is required')
  })

  it('creates invite and returns 201', async () => {
    // Use table-aware dispatch with specific per-table mocks
    const inviteChain = makeChain()
    inviteChain.insert.mockReturnThis()
    inviteChain.select.mockReturnThis()
    inviteChain.single.mockResolvedValue({ data: { id: 'invite-uuid', email: 'staff@acme.com', role: 'staff' }, error: null })

    const fhChain = makeChain()
    fhChain.single.mockResolvedValue({ data: { name: 'Acme Funeral Home' }, error: null })

    let nonUsersCalls = 0
    supabase.from.mockImplementation(table => {
      if (table === 'users') return usersChain
      if (table === 'funeral_home_invites') return inviteChain
      if (table === 'funeral_homes') return fhChain
      return chain
    })

    // Profile query → admin; member check → no existing member
    usersChain.maybySingle = vi.fn()
      .mockResolvedValueOnce({ data: dbProfile, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    usersChain.maybeSingle = usersChain.maybySingle

    const res = await request(app).post('/api/users/invite').set(authHeader).send({ email: 'staff@acme.com', role: 'staff' })
    expect(res.status).toBe(201)
    expect(res.body.email).toBe('staff@acme.com')
    expect(res.body.role).toBe('staff')
  })
})

describe('PATCH /api/users/:id/role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    usersChain.single.mockResolvedValue({ data: { ...dbUser, role: 'staff' }, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).patch('/api/users/other-user-id/role').send({ role: 'staff' })
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    usersChain.maybySingle = vi.fn().mockResolvedValue({ data: { ...dbProfile, role: 'staff' }, error: null })
    usersChain.maybeSingle = usersChain.maybySingle
    const res = await request(app).patch('/api/users/other-user-id/role').set(authHeader).send({ role: 'read_only' })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid role', async () => {
    usersChain.maybySingle = vi.fn().mockResolvedValue({ data: dbProfile, error: null })
    usersChain.maybeSingle = usersChain.maybySingle
    const res = await request(app).patch('/api/users/other-user-id/role').set(authHeader).send({ role: 'superadmin' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/role must be one of/)
  })

  it('returns 400 when trying to change own role', async () => {
    const res = await request(app).patch('/api/users/test-user-id/role').set(authHeader).send({ role: 'staff' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Cannot change your own role')
  })

  it('returns 200 on successful role change', async () => {
    const res = await request(app).patch('/api/users/other-user-id/role').set(authHeader).send({ role: 'staff' })
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/users/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    usersChain.update = vi.fn().mockReturnThis()
    usersChain.eq = vi.fn().mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).delete('/api/users/other-user-id')
    expect(res.status).toBe(401)
  })

  it('returns 400 when trying to remove self', async () => {
    const res = await request(app).delete('/api/users/test-user-id').set(authHeader)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Cannot remove yourself')
  })
})
