import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const USER_ID = authedUser.data.user.id

function dbPartner(overrides = {}) {
  return {
    id: 'SHP-000001',
    name: 'Test Shipping',
    location: 'San Francisco, CA',
    street_address: '1 Market St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    contact_name: 'Pat Jones',
    contact_email: 'pat@ship.test',
    phone: '555-0100',
    website: null,
    active_orders: 0,
    completed_ytd: 0,
    partner_since: '2026',
    status: 'active',
    network_status: 'private',
    license_number: null,
    vetting_notes: null,
    connected_funeral_home_ids: [USER_ID],
    deleted_at: null,
    ...overrides,
  }
}

describe('GET /api/shipping-partners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.is.mockReturnThis()
    chain.contains.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/shipping-partners')
    expect(res.status).toBe(401)
  })

  it('returns shaped partners for the authed user', async () => {
    chain.order.mockResolvedValue({ data: [dbPartner()], error: null })

    const res = await request(app).get('/api/shipping-partners').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe('SHP-000001')
    expect(res.body[0].contactName).toBe('Pat Jones')
    expect(chain.contains).toHaveBeenCalledWith('connected_funeral_home_ids', [USER_ID])
  })
})

describe('GET /api/shipping-partners/nearby', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.is.mockReturnThis()
    chain.not.mockReturnThis()
    chain.or.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/shipping-partners/nearby')
    expect(res.status).toBe(401)
  })

  it('excludes already-connected partners via .not', async () => {
    chain.order.mockResolvedValue({ data: [dbPartner({ connected_funeral_home_ids: [] })], error: null })

    const res = await request(app).get('/api/shipping-partners/nearby?query=ship').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body[0].onPassage).toBe(true)
    expect(chain.not).toHaveBeenCalledWith('connected_funeral_home_ids', 'cs', `{${USER_ID}}`)
  })
})

describe('POST /api/shipping-partners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.insert.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/shipping-partners').send({ name: 'New Ship Co' })
    expect(res.status).toBe(401)
  })

  it('creates a partner with the funeral home pre-connected and dropped columns absent', async () => {
    chain.single.mockResolvedValue({ data: dbPartner(), error: null })

    const res = await request(app).post('/api/shipping-partners')
      .set(authHeader)
      .send({ name: 'New Ship Co', location: 'SF', contactName: 'Pat', contactEmail: 'pat@test', phone: '555' })

    expect(res.status).toBe(201)
    const insertArgs = chain.insert.mock.calls[0][0]
    expect(insertArgs.contact_name).toBe('Pat')
    expect(insertArgs.contact).toBeUndefined() // dropped column should not be written
    expect(insertArgs.since).toBeUndefined()
    expect(insertArgs.active).toBeUndefined()
    expect(insertArgs.connected_funeral_home_ids).toEqual([USER_ID])
  })
})

describe('POST /api/shipping-partners/:id/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.is.mockReturnThis()
  })

  it('returns 404 when the partner does not exist', async () => {
    chain.single
      .mockResolvedValueOnce({ data: null, error: null })

    const res = await request(app).post('/api/shipping-partners/SHP-X/connect').set(authHeader)
    expect(res.status).toBe(404)
  })

  it('appends the user to connected_funeral_home_ids', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { connected_funeral_home_ids: ['other-user'] }, error: null })
      .mockResolvedValueOnce({ data: dbPartner({ connected_funeral_home_ids: ['other-user', USER_ID] }), error: null })

    const res = await request(app).post('/api/shipping-partners/SHP-000001/connect').set(authHeader)
    expect(res.status).toBe(200)
    const updateArgs = chain.update.mock.calls.at(-1)[0]
    expect(updateArgs.connected_funeral_home_ids).toContain(USER_ID)
    expect(updateArgs.connected_funeral_home_ids).toContain('other-user')
  })
})

describe('DELETE /api/shipping-partners/:id/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.is.mockReturnThis()
  })

  it('removes the user from connected_funeral_home_ids', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { connected_funeral_home_ids: [USER_ID, 'other-user'] }, error: null })
      .mockResolvedValueOnce({ data: dbPartner({ connected_funeral_home_ids: ['other-user'] }), error: null })

    const res = await request(app).delete('/api/shipping-partners/SHP-000001/connect').set(authHeader)
    expect(res.status).toBe(200)
    const updateArgs = chain.update.mock.calls.at(-1)[0]
    expect(updateArgs.connected_funeral_home_ids).toEqual(['other-user'])
  })
})

describe('PATCH /api/shipping-partners/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
  })

  it('does not write to dropped legacy columns', async () => {
    chain.single.mockResolvedValue({ data: dbPartner({ name: 'Renamed' }), error: null })

    const res = await request(app).patch('/api/shipping-partners/SHP-000001')
      .set(authHeader)
      .send({ name: 'Renamed', contactName: 'New Pat' })

    expect(res.status).toBe(200)
    const updateArgs = chain.update.mock.calls[0][0]
    expect(updateArgs.contact_name).toBe('New Pat')
    expect(updateArgs).not.toHaveProperty('contact')
  })
})

describe('DELETE /api/shipping-partners/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.update.mockReturnThis()
    chain.eq.mockReturnValue({ error: null })
  })

  it('returns 204 and soft-deletes', async () => {
    const res = await request(app).delete('/api/shipping-partners/SHP-000001').set(authHeader)
    expect(res.status).toBe(204)
    const updateArgs = chain.update.mock.calls[0][0]
    expect(typeof updateArgs.deleted_at).toBe('string')
  })
})

describe('GET /api/shipping-partners/db (no auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.ilike.mockReturnThis()
  })

  it('returns canonical partner rows without auth', async () => {
    chain.order.mockResolvedValue({ data: [{ id: 'db-1', name: 'DB Partner' }], error: null })

    const res = await request(app).get('/api/shipping-partners/db')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('PATCH /api/shipping-partners/db/:id/network — admin key', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    process.env.ADMIN_API_KEY = 'test-admin-key'
  })

  it('returns 401 when the admin key is wrong', async () => {
    const res = await request(app).patch('/api/shipping-partners/db/db-1/network')
      .set('x-admin-key', 'nope')
      .send({ is_passage_network: true, passage_tier: 'gold' })
    expect(res.status).toBe(401)
  })

  it('updates when the admin key matches', async () => {
    chain.single.mockResolvedValue({ data: { id: 'db-1', is_passage_network: true }, error: null })

    const res = await request(app).patch('/api/shipping-partners/db/db-1/network')
      .set('x-admin-key', 'test-admin-key')
      .send({ is_passage_network: true, passage_tier: 'gold' })
    expect(res.status).toBe(200)
  })
})
