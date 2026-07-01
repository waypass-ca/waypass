import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeChain, makeSupabaseMock, authedUser, badToken, authHeader, resetDispatch } from '../setup.js'

const { supabase, chain, usersChain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const STEPS = ['Received', 'Intake', 'Cremation', 'Return']

const dbOrder = {
  id: 1,
  case_id: 'PSG-2024-0001',
  deceased: 'Margaret Chen',
  funeral_home: 'Evergreen Memorial',
  package: 'Comfort Package',
  scheduled: 'March 18, 2024',
  status: 1,
}

describe('GET /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbOrder], error: null })
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/orders')
    expect(res.status).toBe(401)
  })

  it('returns 200 with orders including steps array', async () => {
    const res = await request(app).get('/api/orders').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].steps).toEqual(STEPS)
    expect(res.body[0].status).toBe(1)
  })
})

describe('PATCH /api/orders/:id/advance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).patch('/api/orders/1/advance')
    expect(res.status).toBe(401)
  })

  it('returns 200 and increments status when status < 3', async () => {
    const fetchChain = makeChain()
    fetchChain.select.mockReturnThis()
    fetchChain.eq.mockReturnThis()
    fetchChain.single.mockResolvedValue({ data: { status: 1 }, error: null })

    const updateChain = makeChain()
    updateChain.update.mockReturnThis()
    updateChain.eq.mockReturnThis()
    updateChain.select.mockReturnThis()
    updateChain.single.mockResolvedValue({ data: { ...dbOrder, status: 2 }, error: null })

    let callCount = 0
    supabase.from.mockImplementation(table => {
      if (table === 'users') return usersChain
      callCount++
      return callCount === 1 ? fetchChain : updateChain
    })

    const res = await request(app).patch('/api/orders/1/advance').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe(2)
    expect(res.body.steps).toEqual(STEPS)
  })

  it('returns 400 when order is already at final status (3)', async () => {
    const fetchChain = makeChain()
    fetchChain.select.mockReturnThis()
    fetchChain.eq.mockReturnThis()
    fetchChain.single.mockResolvedValue({ data: { status: 3 }, error: null })

    supabase.from.mockImplementation(table => {
      if (table === 'users') return usersChain
      return fetchChain
    })

    const res = await request(app).patch('/api/orders/1/advance').set(authHeader)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Order already at final status')
  })

  it('returns 404 when order not found', async () => {
    const fetchChain = makeChain()
    fetchChain.select.mockReturnThis()
    fetchChain.eq.mockReturnThis()
    fetchChain.single.mockResolvedValue({ data: null, error: null })

    supabase.from.mockImplementation(table => {
      if (table === 'users') return usersChain
      return fetchChain
    })

    const res = await request(app).patch('/api/orders/999/advance').set(authHeader)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Order not found')
  })
})
