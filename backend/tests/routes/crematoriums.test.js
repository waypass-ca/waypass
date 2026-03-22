import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const dbCrematorium = {
  id: 'CRM-000001',
  name: 'Pacific Cremation',
  location: 'Oakland, CA',
  distance: '12 miles',
  active: 3,
  completed_ytd: 42,
  avg_turnaround: '2.1 days',
  avg_fee: '$520',
  status: 'active',
  contact: 'James Park',
  phone: '(510) 555-0110',
  since: '2021',
}

const shapedCrematorium = {
  id: 'CRM-000001',
  name: 'Pacific Cremation',
  location: 'Oakland, CA',
  distance: '12 miles',
  active: 3,
  completedYTD: 42,
  avgTurnaround: '2.1 days',
  avgFee: '$520',
  status: 'active',
  contact: 'James Park',
  phone: '(510) 555-0110',
  since: '2021',
}

describe('GET /api/crematoriums', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbCrematorium], error: null })
  })

  it('returns 200 with shaped crematoriums', async () => {
    const res = await request(app).get('/api/crematoriums')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedCrematorium])
  })

  it('returns 500 on DB error', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/crematoriums')
    expect(res.status).toBe(500)
  })
})

describe('POST /api/crematoriums', () => {
  const payload = { name: 'Bay Area Cremation', location: 'San Jose, CA' }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbCrematorium, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/crematoriums').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 201 with shaped crematorium', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).post('/api/crematoriums').set(authHeader).send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toEqual(shapedCrematorium)
  })
})

describe('PATCH /api/crematoriums/:id', () => {
  const payload = { name: 'Pacific Cremation Updated', location: 'Oakland, CA', status: 'active' }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).patch('/api/crematoriums/CRM-000001').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated crematorium', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: dbCrematorium, error: null })

    const res = await request(app).patch('/api/crematoriums/CRM-000001').set(authHeader).send(payload)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedCrematorium)
  })

  it('returns 404 when crematorium not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })

    const res = await request(app).patch('/api/crematoriums/CRM-NOPE').set(authHeader).send(payload)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Crematorium not found')
  })
})

describe('DELETE /api/crematoriums/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.delete.mockReturnThis()
    chain.eq.mockResolvedValue({ data: null, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).delete('/api/crematoriums/CRM-000001')
    expect(res.status).toBe(401)
  })

  it('returns 204 with auth', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).delete('/api/crematoriums/CRM-000001').set(authHeader)
    expect(res.status).toBe(204)
  })
})
