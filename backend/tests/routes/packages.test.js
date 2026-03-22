import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const mockPackages = [
  { id: 'pkg-1', name: 'Essential', description: 'Basic package', price: 1200 },
  { id: 'pkg-2', name: 'Comfort', description: 'Comfort package', price: 2400 },
]

describe('GET /api/packages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.order.mockResolvedValue({ data: mockPackages, error: null })
  })

  it('returns 200 with packages array', async () => {
    const res = await request(app).get('/api/packages')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockPackages)
  })

  it('returns 500 when Supabase errors', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/packages')
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('DB error')
  })
})
