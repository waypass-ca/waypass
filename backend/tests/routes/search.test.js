import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader, resetDispatch } from '../setup.js'

const { supabase, chain, usersChain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const FH_ID = 'fh-uuid-1'
const USER_ID = authedUser.data.user.id

const caseRow = {
  id: 'PSG-2026-ABC123',
  deceased: 'Jane Smith',
  family: 'Smith Family',
  contact_name: 'John Smith',
  contact_email: 'john@example.com',
  crematorium_name: 'Greenwood',
  status: 'pending',
  case_date: '2026-06-01',
}

const crematoriumRow = {
  id: 'crem-1',
  name: 'Greenwood Crematory',
  city: 'Portland',
  location: 'Portland, OR',
  contact_name: 'Alice',
}

const shippingRow = {
  id: 'ship-1',
  name: 'Speedy Shippers',
  city: 'Seattle',
  location: 'Seattle, WA',
  contact_name: 'Bob',
}

const bookingRow = {
  id: 'book-1',
  case_id: 'PSG-2026-ABC123',
  crematorium_name: 'Greenwood',
  status: 'confirmed',
  created_at: '2026-06-05T00:00:00Z',
}

const inboxRow = {
  id: 'inbox-1',
  subject: 'Smith case update',
  preview: 'A preview',
  sender: 'Greenwood',
  case_id: 'PSG-2026-ABC123',
  created_at: '2026-06-06T00:00:00Z',
}

// The route runs 5 queries in parallel via Promise.all. Each terminates in .limit(),
// so we pre-queue five resolved values in the order they're initiated:
// cases → crematoriums → shippingPartners → bookings → inbox.
function queueAllTables({
  cases = [caseRow],
  crematoriums = [crematoriumRow],
  shipping = [shippingRow],
  bookings = [bookingRow],
  inbox = [inboxRow],
} = {}) {
  chain.limit
    .mockResolvedValueOnce({ data: cases,        error: null })
    .mockResolvedValueOnce({ data: crematoriums, error: null })
    .mockResolvedValueOnce({ data: shipping,     error: null })
    .mockResolvedValueOnce({ data: bookings,     error: null })
    .mockResolvedValueOnce({ data: inbox,        error: null })
}

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.is.mockReturnThis()
    chain.or.mockReturnThis()
    chain.contains.mockReturnThis()
    chain.order.mockReturnThis()
    chain.limit.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/search?q=smith')
    expect(res.status).toBe(401)
  })

  it('returns empty groups for an empty query without hitting the DB', async () => {
    const res = await request(app).get('/api/search?q=').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      cases: [],
      crematoriums: [],
      shippingPartners: [],
      bookings: [],
      inbox: [],
    })
    // Only the requireAuth users lookup should have hit the DB.
    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith('users')
  })

  it('returns empty groups when query only contains filter-injection chars', async () => {
    const res = await request(app).get('/api/search?q=,()*').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body.cases).toEqual([])
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('returns shaped grouped results for a real query', async () => {
    queueAllTables()
    const res = await request(app).get('/api/search?q=smith').set(authHeader)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      cases: [{
        id: 'PSG-2026-ABC123',
        label: 'Jane Smith',
        sublabel: 'PSG-2026-ABC123 · pending',
        href: '/cases/PSG-2026-ABC123',
      }],
      crematoriums: [{
        id: 'crem-1',
        label: 'Greenwood Crematory',
        sublabel: 'Portland',
        href: '/crematoriums/crem-1',
      }],
      shippingPartners: [{
        id: 'ship-1',
        label: 'Speedy Shippers',
        sublabel: 'Seattle',
        href: '/shipping/ship-1',
      }],
      bookings: [{
        id: 'book-1',
        label: 'Greenwood',
        sublabel: 'PSG-2026-ABC123 · confirmed',
        href: '/cases/PSG-2026-ABC123',
      }],
      inbox: [{
        id: 'inbox-1',
        label: 'Smith case update',
        sublabel: 'A preview',
        href: '/inbox',
      }],
    })
  })

  it('scopes cases and bookings by funeral_home_id, inbox by user_id', async () => {
    queueAllTables()
    await request(app).get('/api/search?q=smith').set(authHeader)
    expect(chain.eq).toHaveBeenCalledWith('funeral_home_id', FH_ID)
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
  })

  it('scopes crematoriums and shipping partners to connected funeral homes', async () => {
    queueAllTables()
    await request(app).get('/api/search?q=smith').set(authHeader)
    expect(chain.contains).toHaveBeenCalledWith('connected_funeral_home_ids', [FH_ID])
  })

  it('respects the limit query param clamped to MAX_LIMIT (10)', async () => {
    queueAllTables()
    await request(app).get('/api/search?q=smith&limit=999').set(authHeader)
    // Every group query should have been capped at 10.
    for (const call of chain.limit.mock.calls) {
      expect(call[0]).toBe(10)
    }
  })

  it('defaults limit to 5 per group when not provided', async () => {
    queueAllTables()
    await request(app).get('/api/search?q=smith').set(authHeader)
    for (const call of chain.limit.mock.calls) {
      expect(call[0]).toBe(5)
    }
  })

  it('builds ilike OR filters with the sanitized term', async () => {
    queueAllTables()
    // Sanitize strips , ( ) * \  — so `smi*t,h(x)` becomes `smith` (all meta-chars removed).
    await request(app).get('/api/search?q=' + encodeURIComponent('smi*t,h(x)')).set(authHeader)
    for (const call of chain.or.mock.calls) {
      expect(call[0]).toContain('%smithx%')
      expect(call[0]).not.toContain('*')
      expect(call[0]).not.toContain('(')
      expect(call[0]).not.toContain(')')
    }
  })

  it('falls back to case id when deceased is missing', async () => {
    queueAllTables({
      cases: [{ ...caseRow, deceased: null, family: null }],
    })
    const res = await request(app).get('/api/search?q=smith').set(authHeader)
    expect(res.body.cases[0].label).toBe('PSG-2026-ABC123')
  })

  it('returns 500 when any table query errors', async () => {
    chain.limit
      .mockResolvedValueOnce({ data: [caseRow], error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('boom') })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    const res = await request(app).get('/api/search?q=smith').set(authHeader)
    expect(res.status).toBe(500)
  })
})
