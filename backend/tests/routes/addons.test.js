import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const mockAddons = [
  { id: 'add-1', name: 'Memorial Jewelry', description: 'Keepsake jewelry', price: 150 },
  { id: 'add-2', name: 'Witnessed Cremation', description: 'Family present', price: 300 },
]

describe('GET /api/addons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.order.mockResolvedValue({ data: mockAddons, error: null })
  })

  it('returns 200 with addons array', async () => {
    const res = await request(app).get('/api/addons')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockAddons)
  })

  it('returns 500 when Supabase errors', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/addons')
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('DB error')
  })
})
