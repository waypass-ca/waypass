import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeChain, makeSupabaseMock } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const dbFuneralHome = {
  id: 'fh-uuid-1',
  name: 'Acme Funeral Home',
  created_at: '2024-01-01T00:00:00Z',
}

const dbInvite = {
  id: 'invite-uuid',
  email: 'staff@acme.com',
  role: 'staff',
  funeral_home_id: 'fh-uuid-1',
  token: 'valid-token',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  accepted_at: null,
  funeral_homes: { name: 'Acme Funeral Home' },
}

describe('POST /api/auth/signup', () => {
  function setupSignupMocks({ authError = null } = {}) {
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-uuid' } },
      error: authError,
    })

    // funeral_homes insert
    const fhChain = makeChain()
    fhChain.insert.mockReturnThis()
    fhChain.select.mockReturnThis()
    fhChain.single.mockResolvedValue({ data: dbFuneralHome, error: null })

    // users insert
    const usersInsertChain = makeChain()
    usersInsertChain.insert.mockResolvedValue({ error: null })

    supabase.from
      .mockReturnValueOnce(fhChain)
      .mockReturnValueOnce(usersInsertChain)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 201 and creates funeral home + admin user', async () => {
    setupSignupMocks()
    const res = await request(app).post('/api/auth/signup').send({
      email: 'admin@acme.com',
      password: 'password123',
      firstName: 'Alice',
      lastName: 'Smith',
      funeralHomeName: 'Acme Funeral Home',
    })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.email).toBe('admin@acme.com')
    expect(res.body.funeralHomeId).toBe('fh-uuid-1')
  })

  it('returns 409 when email already registered', async () => {
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered', code: 'email_exists' },
    })
    const res = await request(app).post('/api/auth/signup').send({
      email: 'existing@acme.com',
      password: 'password123',
      funeralHomeName: 'Acme Funeral Home',
    })
    expect(res.status).toBe(409)
  })

  it('returns 500 on DB error creating funeral home', async () => {
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-uuid' } },
      error: null,
    })
    // funeral_homes insert fails
    const fhChain = makeChain()
    fhChain.insert.mockReturnThis()
    fhChain.select.mockReturnThis()
    fhChain.single.mockResolvedValue({ data: null, error: new Error('DB error') })
    supabase.from.mockReturnValueOnce(fhChain)
    supabase.auth.admin.deleteUser.mockResolvedValue({})

    const res = await request(app).post('/api/auth/signup').send({
      email: 'admin@acme.com',
      password: 'password123',
      funeralHomeName: 'Acme Funeral Home',
    })
    expect(res.status).toBe(500)
  })
})

describe('GET /api/auth/invite-info/:token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 404 for unknown token', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await request(app).get('/api/auth/invite-info/bad-token')
    expect(res.status).toBe(404)
  })

  it('returns invite info for valid token', async () => {
    chain.maybeSingle.mockResolvedValue({ data: dbInvite, error: null })
    const res = await request(app).get('/api/auth/invite-info/valid-token')
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('staff@acme.com')
    expect(res.body.role).toBe('staff')
    expect(res.body.funeralHomeName).toBe('Acme Funeral Home')
    expect(res.body.expired).toBe(false)
    expect(res.body.alreadyAccepted).toBe(false)
  })

  it('marks expired invites', async () => {
    const expired = {
      ...dbInvite,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    }
    chain.maybeSingle.mockResolvedValue({ data: expired, error: null })
    const res = await request(app).get('/api/auth/invite-info/expired-token')
    expect(res.status).toBe(200)
    expect(res.body.expired).toBe(true)
  })

  it('marks already accepted invites', async () => {
    const accepted = {
      ...dbInvite,
      accepted_at: '2024-01-01T00:00:00Z',
    }
    chain.maybeSingle.mockResolvedValue({ data: accepted, error: null })
    const res = await request(app).get('/api/auth/invite-info/used-token')
    expect(res.status).toBe(200)
    expect(res.body.alreadyAccepted).toBe(true)
  })
})

describe('POST /api/auth/accept-invite', () => {
  function setupAcceptMocks() {
    // invite lookup
    chain.maybeSingle.mockResolvedValue({ data: dbInvite, error: null })

    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-staff-uuid' } },
      error: null,
    })

    // users insert
    const usersChain = makeChain()
    usersChain.insert.mockResolvedValue({ error: null })
    supabase.from
      .mockImplementationOnce(() => chain) // invite lookup
      .mockImplementationOnce(() => usersChain) // users insert

    // invite update (mark accepted)
    chain.update = vi.fn().mockReturnThis()
    chain.eq = vi.fn().mockReturnThis()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when token or password is missing', async () => {
    const res = await request(app).post('/api/auth/accept-invite').send({ token: 'valid-token' })
    expect(res.status).toBe(400)
  })

  it('returns 404 for invalid token', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await request(app).post('/api/auth/accept-invite').send({ token: 'bad-token', password: 'pass123' })
    expect(res.status).toBe(404)
  })

  it('returns 409 for already accepted invite', async () => {
    chain.maybeSingle.mockResolvedValue({
      data: { ...dbInvite, accepted_at: '2024-01-01T00:00:00Z' },
      error: null,
    })
    const res = await request(app).post('/api/auth/accept-invite').send({ token: 'valid-token', password: 'pass123' })
    expect(res.status).toBe(409)
  })

  it('returns 410 for expired invite', async () => {
    chain.maybeSingle.mockResolvedValue({
      data: { ...dbInvite, expires_at: new Date(Date.now() - 1000).toISOString() },
      error: null,
    })
    const res = await request(app).post('/api/auth/accept-invite').send({ token: 'valid-token', password: 'pass123' })
    expect(res.status).toBe(410)
  })

  it('returns 201 and creates user on valid invite', async () => {
    setupAcceptMocks()
    const res = await request(app).post('/api/auth/accept-invite').send({
      token: 'valid-token',
      password: 'password123',
      firstName: 'Bob',
      lastName: 'Jones',
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.email).toBe('staff@acme.com')
  })
})
