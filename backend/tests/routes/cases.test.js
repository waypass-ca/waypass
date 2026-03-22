import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

// A DB row as Supabase would return it
const dbCase = {
  id: 'PSG-2024-0001',
  deceased: 'Margaret Chen',
  family: 'The Chen Family',
  contact_name: 'Linda Chen',
  contact_phone: '(415) 555-0182',
  contact_email: 'linda@example.com',
  relationship: 'Daughter',
  dob: '1935-04-12',
  dop: '2024-03-15',
  location: 'UCSF Medical Center',
  package_name: 'Comfort Package',
  package_price: 2400,
  addon_names: ['Memorial Jewelry'],
  status: 'pending',
  date: 'March 15, 2024',
  amount: 2550,
  crematorium_name: null,
  documents: [],
  case_notes: [],
}

// Expected camelCase shape after shapeRow()
const shapedCase = {
  id: 'PSG-2024-0001',
  deceased: 'Margaret Chen',
  family: 'The Chen Family',
  contactName: 'Linda Chen',
  contactPhone: '(415) 555-0182',
  contactEmail: 'linda@example.com',
  relationship: 'Daughter',
  dob: '1935-04-12',
  dop: '2024-03-15',
  location: 'UCSF Medical Center',
  package: 'Comfort Package',
  packagePrice: 2400,
  addons: ['Memorial Jewelry'],
  status: 'pending',
  date: 'March 15, 2024',
  amount: 2550,
  crematorium: null,
  documents: [],
  notes: [],
}

describe('GET /api/cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
  })

  it('returns 200 with shaped cases array', async () => {
    chain.select.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbCase], error: null })

    const res = await request(app).get('/api/cases')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedCase])
  })

  it('returns 500 on DB error', async () => {
    chain.select.mockReturnThis()
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })

    const res = await request(app).get('/api/cases')
    expect(res.status).toBe(500)
  })
})

describe('GET /api/cases/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
  })

  it('returns 200 with shaped case when found', async () => {
    chain.single.mockResolvedValue({ data: dbCase, error: null })

    const res = await request(app).get('/api/cases/PSG-2024-0001')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedCase)
  })

  it('returns 404 when case not found', async () => {
    chain.single.mockResolvedValue({ data: null, error: null })

    const res = await request(app).get('/api/cases/PSG-0000-0000')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Case not found')
  })
})

describe('POST /api/cases', () => {
  const payload = {
    deceased: 'John Doe',
    family: 'The Doe Family',
    package_name: 'Essential',
    package_price: 1200,
    amount: 1200,
    status: 'pending',
    date: 'March 20, 2024',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({
      data: { ...dbCase, ...payload, case_notes: [], addon_names: [], documents: [] },
      error: null,
    })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/cases').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 201 with auth and auto-generated PSG- ID', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).post('/api/cases').set(authHeader).send(payload)
    expect(res.status).toBe(201)
    expect(res.body.deceased).toBe('John Doe')
  })
})

describe('PATCH /api/cases/:id/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: { ...dbCase, status: 'transit' }, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app)
      .patch('/api/cases/PSG-2024-0001/status')
      .send({ status: 'transit' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid status', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .patch('/api/cases/PSG-2024-0001/status')
      .set(authHeader)
      .send({ status: 'transit' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('transit')
  })

  it('returns 400 with invalid status', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .patch('/api/cases/PSG-2024-0001/status')
      .set(authHeader)
      .send({ status: 'unknown' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/status must be one of/)
  })
})

describe('POST /api/cases/:id/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({
      data: { author: 'You', text: 'Test note', time: 'Mar 20, 12:00 PM' },
      error: null,
    })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app)
      .post('/api/cases/PSG-2024-0001/notes')
      .send({ text: 'Hello' })
    expect(res.status).toBe(401)
  })

  it('returns 400 with empty text', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .post('/api/cases/PSG-2024-0001/notes')
      .set(authHeader)
      .send({ text: '   ' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('text is required')
  })

  it('returns 201 with valid note', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .post('/api/cases/PSG-2024-0001/notes')
      .set(authHeader)
      .send({ text: 'Test note', author: 'You' })
    expect(res.status).toBe(201)
    expect(res.body.text).toBe('Test note')
  })
})
