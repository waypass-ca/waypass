import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const dbUser = {
  id: 'user-uuid-1',
  funeral_home_id: 'fh-uuid-1',
  email: 'staff@example.com',
  first_name: 'Alice',
  last_name: 'Smith',
  phone: '(415) 555-0100',
  role: 'staff',
  status: 'active',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
}

const shapedUser = {
  id: 'user-uuid-1',
  funeralHomeId: 'fh-uuid-1',
  email: 'staff@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  phone: '(415) 555-0100',
  role: 'staff',
  status: 'active',
  avatarUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.is.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbUser], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })

  it('returns 200 with shaped users', async () => {
    const res = await request(app).get('/api/users').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedUser])
  })

  it('returns 500 on DB error', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/users').set(authHeader)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/users/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbUser, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/users/user-uuid-1')
    expect(res.status).toBe(401)
  })

  it('returns 200 with shaped user', async () => {
    const res = await request(app).get('/api/users/user-uuid-1').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedUser)
  })

  it('returns 404 when user not found', async () => {
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app).get('/api/users/nope').set(authHeader)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('User not found')
  })
})

describe('POST /api/users', () => {
  const payload = {
    id: 'user-uuid-2',
    email: 'new@example.com',
    firstName: 'Bob',
    lastName: 'Jones',
    role: 'admin',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbUser, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/users').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 201 with shaped user', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).post('/api/users').set(authHeader).send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toEqual(shapedUser)
  })
})

describe('PATCH /api/users/:id', () => {
  const payload = { firstName: 'Alice', lastName: 'Updated', role: 'admin' }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).patch('/api/users/user-uuid-1').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated user', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: dbUser, error: null })
    const res = await request(app).patch('/api/users/user-uuid-1').set(authHeader).send(payload)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedUser)
  })

  it('returns 404 when user not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app).patch('/api/users/nope').set(authHeader).send(payload)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('User not found')
  })
})
