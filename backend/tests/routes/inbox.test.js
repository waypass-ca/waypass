import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader , resetDispatch } from '../setup.js'

const { supabase, chain, usersChain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

// .limit() and .lt() aren't in the shared mock; add them here.
chain.limit = vi.fn().mockReturnThis()
chain.lt = vi.fn().mockReturnThis()

const { default: app } = await import('../../server.js')

const USER_ID = authedUser.data.user.id

const dbRow = {
  id: 'inbox-1',
  user_id: USER_ID,
  type: 'schedule',
  sender: 'Greenwood Crematory',
  subject: 'Smith Booking confirmed',
  preview: 'Smith · Confirmed',
  body: 'A body',
  case_id: 'case-1',
  booking_id: 'booking-1',
  severity: 'info',
  scheduled_for: '2026-06-15T14:00:00Z',
  read: false,
  starred: false,
  archived_at: null,
  created_at: '2026-06-10T12:00:00Z',
}

const shapedRow = {
  id: 'inbox-1',
  type: 'schedule',
  from: 'Greenwood Crematory',
  subject: 'Smith Booking confirmed',
  preview: 'Smith · Confirmed',
  body: 'A body',
  caseId: 'case-1',
  bookingId: 'booking-1',
  severity: 'info',
  scheduledFor: '2026-06-15T14:00:00Z',
  read: false,
  starred: false,
  archivedAt: null,
  createdAt: '2026-06-10T12:00:00Z',
}

describe('GET /api/inbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.order.mockReturnThis()
    chain.is.mockReturnThis()
    chain.not.mockReturnThis()
    chain.lt.mockReturnThis()
    // .limit() is the terminal once everything else is chained.
    chain.limit.mockResolvedValue({ data: [dbRow], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/inbox')
    expect(res.status).toBe(401)
  })

  it('returns shaped rows scoped to the authed user', async () => {
    const res = await request(app).get('/api/inbox').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedRow])
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(chain.is).toHaveBeenCalledWith('archived_at', null)
    expect(chain.limit).toHaveBeenCalledWith(50)
  })

  it('applies a custom limit (clamped to 100)', async () => {
    await request(app).get('/api/inbox?limit=200').set(authHeader)
    expect(chain.limit).toHaveBeenCalledWith(100)
  })

  it('uses ?before for cursor pagination', async () => {
    await request(app).get('/api/inbox?before=2026-06-09T00:00:00Z').set(authHeader)
    expect(chain.lt).toHaveBeenCalledWith('created_at', '2026-06-09T00:00:00Z')
  })

  it('returns archived items when ?archived=true', async () => {
    await request(app).get('/api/inbox?archived=true').set(authHeader)
    expect(chain.not).toHaveBeenCalledWith('archived_at', 'is', null)
  })

  it('returns 500 on DB error', async () => {
    chain.limit.mockResolvedValue({ data: null, error: new Error('boom') })
    const res = await request(app).get('/api/inbox').set(authHeader)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/inbox/unread-count', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    // .is() is the last chained call before await, so it resolves here.
    chain.is.mockResolvedValue({ count: 7, error: null })
  })

  it('returns the unread count for the authed user', async () => {
    const res = await request(app).get('/api/inbox/unread-count').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ count: 7 })
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(chain.eq).toHaveBeenCalledWith('read', false)
  })

  it('coerces null count to 0', async () => {
    chain.is.mockResolvedValue({ count: null, error: null })
    const res = await request(app).get('/api/inbox/unread-count').set(authHeader)
    expect(res.body).toEqual({ count: 0 })
  })
})

describe('PATCH /api/inbox/mark-all-read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.is.mockResolvedValue({ error: null })
  })

  it('marks all unread non-archived items as read for the authed user', async () => {
    const res = await request(app).patch('/api/inbox/mark-all-read').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({ read: true })
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(chain.eq).toHaveBeenCalledWith('read', false)
    expect(chain.is).toHaveBeenCalledWith('archived_at', null)
  })
})

describe('PATCH /api/inbox/:id/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.update.mockReturnThis()
    chain.eq.mockImplementation(function (col, val) {
      // Final .eq() resolves; intermediate ones still chain.
      if (col === 'user_id') return Promise.resolve({ error: null })
      return chain
    })
  })

  it('marks an item as read by default, scoped to authed user', async () => {
    const res = await request(app).patch('/api/inbox/inbox-1/read').set(authHeader)
    expect(res.status).toBe(200)
    expect(chain.update).toHaveBeenCalledWith({ read: true })
    expect(chain.eq).toHaveBeenCalledWith('id', 'inbox-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
  })

  it('accepts { read: false } to mark unread', async () => {
    const res = await request(app)
      .patch('/api/inbox/inbox-1/read')
      .set(authHeader)
      .send({ read: false })
    expect(res.status).toBe(200)
    expect(chain.update).toHaveBeenCalledWith({ read: false })
  })
})

describe('PATCH /api/inbox/:id/star', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.update.mockReturnThis()
    chain.eq.mockImplementation(function (col) {
      if (col === 'user_id') return Promise.resolve({ error: null })
      return chain
    })
  })

  it('toggles starred', async () => {
    const res = await request(app)
      .patch('/api/inbox/inbox-1/star')
      .set(authHeader)
      .send({ starred: true })
    expect(res.status).toBe(200)
    expect(chain.update).toHaveBeenCalledWith({ starred: true })
  })
})

describe('DELETE /api/inbox/:id (soft archive)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.update.mockReturnThis()
    chain.eq.mockImplementation(function (col) {
      if (col === 'user_id') return Promise.resolve({ error: null })
      return chain
    })
  })

  it('soft-archives by setting archived_at, scoped to authed user', async () => {
    const res = await request(app).delete('/api/inbox/inbox-1').set(authHeader)
    expect(res.status).toBe(204)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ archived_at: expect.any(String) })
    )
    expect(chain.eq).toHaveBeenCalledWith('id', 'inbox-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
  })
})

describe('POST /api/inbox/:id/unarchive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.update.mockReturnThis()
    chain.eq.mockImplementation(function (col) {
      if (col === 'user_id') return Promise.resolve({ error: null })
      return chain
    })
  })

  it('clears archived_at', async () => {
    const res = await request(app).post('/api/inbox/inbox-1/unarchive').set(authHeader)
    expect(res.status).toBe(200)
    expect(chain.update).toHaveBeenCalledWith({ archived_at: null })
  })
})
