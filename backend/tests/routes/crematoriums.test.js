import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader, adminKeyHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

// Set ADMIN_API_KEY before app imports so the route can read it
process.env.ADMIN_API_KEY = 'test-admin-key'

const { default: app } = await import('../../server.js')

// ── Fixtures ──────────────────────────────────────────────────────────────────

const dbRow = {
  id: 'CRM-000001',
  name: 'Passage Cremation Services',
  location: 'Toronto, ON',
  street_address: '123 King St W',
  city: 'Toronto',
  state: 'ON',
  zip: 'M5H 1J9',
  distance: '12 km',
  active_orders: 3,
  active: 3,
  completed_ytd: 42,
  avg_turnaround: '2.1 days',
  avg_fee: '$520',
  base_fee: 520,
  passage_revenue_share: 0.08,
  status: 'active',
  network_status: 'passage_network',
  contact_name: 'Marie Tremblay',
  contact: 'Marie Tremblay',
  contact_email: 'marie@passagecrem.ca',
  phone: '(416) 555-0110',
  partner_since: '2021',
  since: '2021',
  license_number: 'ON-1234',
  vetting_notes: null,
  deleted_at: null,
  connected_funeral_home_ids: ['test-user-id'],
}

const shaped = {
  id: 'CRM-000001',
  name: 'Passage Cremation Services',
  location: 'Toronto, ON',
  streetAddress: '123 King St W',
  city: 'Toronto',
  state: 'ON',
  zip: 'M5H 1J9',
  distance: '12 km',
  activeOrders: 3,
  completedYTD: 42,
  avgTurnaround: '2.1 days',
  avgFee: '$520',
  baseFee: 520,
  passageRevenueShare: 0.08,
  status: 'active',
  networkStatus: 'passage_network',
  contactName: 'Marie Tremblay',
  contactEmail: 'marie@passagecrem.ca',
  phone: '(416) 555-0110',
  website: null,
  rating: null,
  userRatingCount: null,
  weekdayDescriptions: null,
  partnerSince: '2021',
  licenseNumber: 'ON-1234',
  vettingNotes: null,
  connectedFuneralHomeIds: ['test-user-id'],
}

const dbRecord = {
  id: 'uuid-001',
  google_place_id: 'ChIJabc123',
  name: 'Vancouver Cremation Centre',
  address: '789 Granville St, Vancouver, BC V6Z 1K3, Canada',
  city: 'Vancouver',
  state: 'BC',
  zip: 'V6Z 1K3',
  phone: '(604) 555-0300',
  website: 'https://vcc.example.ca',
  lat: 49.2827,
  lng: -123.1207,
  rating: 4.3,
  user_ratings_total: 112,
  opening_hours: {
    periods: [{ open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } }],
    weekday_text: ['Monday: 9:00 AM – 5:00 PM'],
  },
  is_passage_network: false,
  passage_tier: null,
  needs_review: false,
  last_verified_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
}

// ── GET /api/crematoriums — connected partners ────────────────────────────────

describe('GET /api/crematoriums', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.is.mockReturnThis()
    chain.contains.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbRow], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/crematoriums')
    expect(res.status).toBe(401)
  })

  it('returns 200 with shaped crematoriums for authed user', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).get('/api/crematoriums').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shaped])
  })

  it('filters by connected_funeral_home_ids via contains', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    await request(app).get('/api/crematoriums').set(authHeader)
    expect(chain.contains).toHaveBeenCalledWith('connected_funeral_home_ids', ['test-user-id'])
  })

  it('returns 500 on DB error', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/crematoriums').set(authHeader)
    expect(res.status).toBe(500)
  })
})

// ── GET /api/crematoriums/nearby ──────────────────────────────────────────────

describe('GET /api/crematoriums/nearby', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.is.mockReturnThis()
    chain.not.mockReturnThis()
    chain.order.mockResolvedValue({ data: [{ ...dbRow, connected_funeral_home_ids: [] }], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/crematoriums/nearby')
    expect(res.status).toBe(401)
  })

  it('returns 200 with unconnected crematoriums', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).get('/api/crematoriums/nearby').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body[0]).toHaveProperty('onPassage', true)
  })

  it('filters out user-connected crematoriums via not()', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    await request(app).get('/api/crematoriums/nearby').set(authHeader)
    expect(chain.not).toHaveBeenCalledWith('connected_funeral_home_ids', 'cs', `{test-user-id}`)
  })

  it('applies name/location filter when query param provided', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.or.mockReturnThis()
    chain.order.mockResolvedValue({ data: [], error: null })
    await request(app).get('/api/crematoriums/nearby?query=pacific').set(authHeader)
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('name.ilike.%pacific%'))
  })

  it('returns 500 on DB error', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.order.mockResolvedValue({ data: null, error: new Error('fail') })
    const res = await request(app).get('/api/crematoriums/nearby').set(authHeader)
    expect(res.status).toBe(500)
  })
})

// ── POST /api/crematoriums ────────────────────────────────────────────────────

describe('POST /api/crematoriums', () => {
  const payload = { name: 'Bay Area Cremation', location: 'San Jose, CA', networkStatus: 'private' }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbRow, error: null })
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
    expect(res.body).toEqual(shaped)
  })

  it('auto-connects creating user in connected_funeral_home_ids', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    await request(app).post('/api/crematoriums').set(authHeader).send(payload)
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
      connected_funeral_home_ids: ['test-user-id'],
    }))
  })
})

// ── POST /api/crematoriums/:id/connect ───────────────────────────────────────

describe('POST /api/crematoriums/:id/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.is.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/crematoriums/CRM-000001/connect')
    expect(res.status).toBe(401)
  })

  it('adds user ID to connected_funeral_home_ids', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single
      .mockResolvedValueOnce({ data: { connected_funeral_home_ids: [] }, error: null })
      .mockResolvedValueOnce({ data: dbRow, error: null })
    chain.update.mockReturnThis()
    const res = await request(app)
      .post('/api/crematoriums/CRM-000001/connect')
      .set(authHeader)
    expect(res.status).toBe(200)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ connected_funeral_home_ids: expect.arrayContaining(['test-user-id']) })
    )
  })

  it('does not duplicate if already connected', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single
      .mockResolvedValueOnce({ data: { connected_funeral_home_ids: ['test-user-id'] }, error: null })
      .mockResolvedValueOnce({ data: dbRow, error: null })
    chain.update.mockReturnThis()
    await request(app).post('/api/crematoriums/CRM-000001/connect').set(authHeader)
    const updateCall = chain.update.mock.calls[0][0]
    const ids = updateCall.connected_funeral_home_ids
    expect(ids.filter(id => id === 'test-user-id')).toHaveLength(1)
  })

  it('returns 404 when crematorium not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app).post('/api/crematoriums/NOPE/connect').set(authHeader)
    expect(res.status).toBe(404)
  })
})

// ── DELETE /api/crematoriums/:id/connect ─────────────────────────────────────

describe('DELETE /api/crematoriums/:id/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.is.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).delete('/api/crematoriums/CRM-000001/connect')
    expect(res.status).toBe(401)
  })

  it('removes user ID from connected_funeral_home_ids', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single
      .mockResolvedValueOnce({ data: { connected_funeral_home_ids: ['test-user-id', 'other-id'] }, error: null })
      .mockResolvedValueOnce({ data: { ...dbRow, connected_funeral_home_ids: ['other-id'] }, error: null })
    chain.update.mockReturnThis()
    const res = await request(app).delete('/api/crematoriums/CRM-000001/connect').set(authHeader)
    expect(res.status).toBe(200)
    const updateCall = chain.update.mock.calls[0][0]
    expect(updateCall.connected_funeral_home_ids).not.toContain('test-user-id')
    expect(updateCall.connected_funeral_home_ids).toContain('other-id')
  })

  it('returns 404 when crematorium not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app).delete('/api/crematoriums/NOPE/connect').set(authHeader)
    expect(res.status).toBe(404)
  })
})

// ── PATCH /api/crematoriums/:id ───────────────────────────────────────────────

describe('PATCH /api/crematoriums/:id', () => {
  const payload = { name: 'Updated Name', status: 'inactive' }

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
    chain.single.mockResolvedValue({ data: dbRow, error: null })
    const res = await request(app).patch('/api/crematoriums/CRM-000001').set(authHeader).send(payload)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shaped)
  })

  it('returns 404 when record not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app).patch('/api/crematoriums/CRM-NOPE').set(authHeader).send(payload)
    expect(res.status).toBe(404)
  })
})

// ── DELETE /api/crematoriums/:id ─────────────────────────────────────────────

describe('DELETE /api/crematoriums/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockResolvedValue({ data: null, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).delete('/api/crematoriums/CRM-000001')
    expect(res.status).toBe(401)
  })

  it('returns 204 and sets deleted_at', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).delete('/api/crematoriums/CRM-000001').set(authHeader)
    expect(res.status).toBe(204)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    )
  })
})

// ── GET /api/crematoriums/db ──────────────────────────────────────────────────

describe('GET /api/crematoriums/db', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.ilike.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbRecord], error: null })
  })

  it('returns 200 with all records', async () => {
    const res = await request(app).get('/api/crematoriums/db')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([dbRecord])
  })

  it('applies state filter', async () => {
    await request(app).get('/api/crematoriums/db?state=CA')
    expect(chain.eq).toHaveBeenCalledWith('state', 'CA')
  })

  it('applies city filter via ilike', async () => {
    await request(app).get('/api/crematoriums/db?city=Oakland')
    expect(chain.ilike).toHaveBeenCalledWith('city', '%Oakland%')
  })

  it('applies is_passage_network=true filter', async () => {
    await request(app).get('/api/crematoriums/db?is_passage_network=true')
    expect(chain.eq).toHaveBeenCalledWith('is_passage_network', true)
  })

  it('applies is_passage_network=false filter', async () => {
    await request(app).get('/api/crematoriums/db?is_passage_network=false')
    expect(chain.eq).toHaveBeenCalledWith('is_passage_network', false)
  })

  it('applies tier filter', async () => {
    await request(app).get('/api/crematoriums/db?tier=preferred')
    expect(chain.eq).toHaveBeenCalledWith('passage_tier', 'preferred')
  })

  it('returns rating and user_ratings_total in response', async () => {
    const res = await request(app).get('/api/crematoriums/db')
    expect(res.body[0]).toHaveProperty('rating', 4.3)
    expect(res.body[0]).toHaveProperty('user_ratings_total', 112)
  })

  it('returns opening_hours with periods and weekday_text in response', async () => {
    const res = await request(app).get('/api/crematoriums/db')
    expect(res.body[0].opening_hours).toHaveProperty('periods')
    expect(res.body[0].opening_hours.periods).toHaveLength(1)
    expect(res.body[0].opening_hours).toHaveProperty('weekday_text')
  })

  it('returns null rating and opening_hours when not set', async () => {
    chain.order.mockResolvedValue({
      data: [{ ...dbRecord, rating: null, user_ratings_total: null, opening_hours: null }],
      error: null,
    })
    const res = await request(app).get('/api/crematoriums/db')
    expect(res.body[0].rating).toBeNull()
    expect(res.body[0].opening_hours).toBeNull()
  })

  it('returns 500 on DB error', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('fail') })
    const res = await request(app).get('/api/crematoriums/db')
    expect(res.status).toBe(500)
  })
})

// ── GET /api/crematoriums/nearby-db ──────────────────────────────────────────

describe('GET /api/crematoriums/nearby-db', () => {
  const nearbyResult = [{ ...dbRecord, distance_miles: 4.2 }]

  beforeEach(() => {
    vi.clearAllMocks()
    supabase.rpc.mockResolvedValue({ data: nearbyResult, error: null })
  })

  it('returns 400 without lat/lng', async () => {
    const res = await request(app).get('/api/crematoriums/nearby-db')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('lat and lng required')
  })

  it('returns 200 with distance-sorted results', async () => {
    const res = await request(app).get('/api/crematoriums/nearby-db?lat=37.77&lng=-122.41')
    expect(res.status).toBe(200)
    expect(res.body[0]).toHaveProperty('distance_miles', 4.2)
  })

  it('calls nearby_crematoriums RPC with correct args', async () => {
    await request(app).get('/api/crematoriums/nearby-db?lat=37.77&lng=-122.41&radius_miles=25')
    expect(supabase.rpc).toHaveBeenCalledWith('nearby_crematoriums', {
      user_lat: 37.77,
      user_lng: -122.41,
      radius_m: 25 * 1609.34,
    })
  })

  it('defaults radius_miles to 50', async () => {
    await request(app).get('/api/crematoriums/nearby-db?lat=37.77&lng=-122.41')
    expect(supabase.rpc).toHaveBeenCalledWith('nearby_crematoriums', expect.objectContaining({
      radius_m: 50 * 1609.34,
    }))
  })

  it('returns rating and opening_hours from RPC results', async () => {
    const res = await request(app).get('/api/crematoriums/nearby-db?lat=49.28&lng=-123.12')
    expect(res.body[0]).toHaveProperty('rating', 4.3)
    expect(res.body[0]).toHaveProperty('user_ratings_total', 112)
    expect(res.body[0].opening_hours).toHaveProperty('periods')
  })

  it('returns 500 on RPC error', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: new Error('rpc fail') })
    const res = await request(app).get('/api/crematoriums/nearby-db?lat=37.77&lng=-122.41')
    expect(res.status).toBe(500)
  })
})

// ── GET /api/crematoriums/db/:id ─────────────────────────────────────────────

describe('GET /api/crematoriums/db/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
  })

  it('returns 200 with the record', async () => {
    chain.single.mockResolvedValue({ data: dbRecord, error: null })
    const res = await request(app).get('/api/crematoriums/db/uuid-001')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(dbRecord)
  })

  it('returns 404 when not found', async () => {
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app).get('/api/crematoriums/db/nope')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })

  it('returns 500 on DB error', async () => {
    chain.single.mockResolvedValue({ data: null, error: new Error('fail') })
    const res = await request(app).get('/api/crematoriums/db/uuid-001')
    expect(res.status).toBe(500)
  })
})

// ── PATCH /api/crematoriums/db/:id/network ───────────────────────────────────

describe('PATCH /api/crematoriums/db/:id/network', () => {
  const payload = { is_passage_network: true, passage_tier: 'preferred' }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
  })

  it('returns 401 without x-admin-key header', async () => {
    const res = await request(app)
      .patch('/api/crematoriums/db/uuid-001/network')
      .send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong admin key', async () => {
    const res = await request(app)
      .patch('/api/crematoriums/db/uuid-001/network')
      .set('x-admin-key', 'wrong-key')
      .send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 200 and updates network fields with valid admin key', async () => {
    chain.single.mockResolvedValue({ data: { ...dbRecord, is_passage_network: true, passage_tier: 'preferred' }, error: null })
    const res = await request(app)
      .patch('/api/crematoriums/db/uuid-001/network')
      .set(adminKeyHeader)
      .send(payload)
    expect(res.status).toBe(200)
    expect(chain.update).toHaveBeenCalledWith({ is_passage_network: true, passage_tier: 'preferred' })
  })

  it('returns 500 on DB error', async () => {
    chain.single.mockResolvedValue({ data: null, error: new Error('fail') })
    const res = await request(app)
      .patch('/api/crematoriums/db/uuid-001/network')
      .set(adminKeyHeader)
      .send(payload)
    expect(res.status).toBe(500)
  })
})
