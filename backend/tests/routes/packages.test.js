import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, authHeader, resetDispatch } from '../setup.js'

const { supabase, chain, usersChain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const mockPackages = [
  { id: 'pkg-1', name: 'Essential', description: 'Basic package', price: 1200 },
  { id: 'pkg-2', name: 'Comfort', description: 'Comfort package', price: 2400 },
]

describe('GET /api/packages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.order.mockResolvedValue({ data: mockPackages, error: null })
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/packages')
    expect(res.status).toBe(401)
  })

  it('returns 200 with packages array', async () => {
    const res = await request(app).get('/api/packages').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockPackages)
  })

  it('returns 500 when Supabase errors', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/packages').set(authHeader)
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('DB error')
  })
})
