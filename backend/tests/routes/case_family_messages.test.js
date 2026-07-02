import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader , resetDispatch } from '../setup.js'

const { supabase, chain, usersChain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const CASE_ID = 'PSG-2024-0001'

const dbMessage = {
  id: 'msg-uuid-1',
  case_id: CASE_ID,
  sender_type: 'family',
  sender_id: null,
  sender_name: 'Linda Chen',
  body: 'When will the ashes be ready?',
  read_by_staff: false,
  read_by_family: true,
  created_at: '2024-03-16T09:00:00Z',
}

const shapedMessage = {
  id: 'msg-uuid-1',
  caseId: CASE_ID,
  senderType: 'family',
  senderId: null,
  senderName: 'Linda Chen',
  body: 'When will the ashes be ready?',
  readByStaff: false,
  readByFamily: true,
  createdAt: '2024-03-16T09:00:00Z',
}

describe('GET /api/cases/:caseId/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    // callerOwnsCase() ownership lookup on the cases table
    chain.maybeSingle.mockResolvedValue({ data: { id: CASE_ID }, error: null })
    chain.order.mockResolvedValue({ data: [dbMessage], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get(`/api/cases/${CASE_ID}/messages`)
    expect(res.status).toBe(401)
  })

  it('returns 200 with shaped messages', async () => {
    const res = await request(app).get(`/api/cases/${CASE_ID}/messages`).set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedMessage])
  })

  it('returns 500 on DB error', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get(`/api/cases/${CASE_ID}/messages`).set(authHeader)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/cases/:caseId/messages', () => {
  const staffMessage = { ...dbMessage, sender_type: 'staff', sender_id: 'test-user-id', sender_name: 'admin@acme.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    // callerOwnsCase() ownership lookup on the cases table
    chain.maybeSingle.mockResolvedValue({ data: { id: CASE_ID }, error: null })
    chain.single.mockResolvedValue({ data: staffMessage, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/messages`)
      .send({ body: 'Hello' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is missing', async () => {
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/messages`)
      .set(authHeader)
      .send({ body: '   ' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('body is required')
  })

  it('returns 404 when the case is not in the caller\'s funeral home', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/messages`)
      .set(authHeader)
      .send({ body: 'Hello' })
    expect(res.status).toBe(404)
  })

  it('derives sender from the token, ignoring body-supplied identity', async () => {
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/messages`)
      .set(authHeader)
      .send({ senderType: 'family', senderId: 'spoofed', senderName: 'Spoofed', body: 'We expect tomorrow.' })
    expect(res.status).toBe(201)
    expect(res.body.senderType).toBe('staff')
    // Body-supplied sender_id/sender_name must not be persisted
    const inserted = chain.insert.mock.calls.at(-1)[0]
    expect(inserted.sender_id).toBe('test-user-id')
    expect(inserted.sender_name).toBe('admin@acme.com')
    expect(inserted.sender_type).toBe('staff')
  })
})

describe('PATCH /api/cases/:caseId/messages/:id/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
    // callerOwnsCase() ownership lookup on the cases table
    chain.maybeSingle.mockResolvedValue({ data: { id: CASE_ID }, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app)
      .patch(`/api/cases/${CASE_ID}/messages/msg-uuid-1/read`)
      .send({ readByStaff: true })
    expect(res.status).toBe(401)
  })

  it('returns 200 when marking as read by staff', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: { ...dbMessage, read_by_staff: true }, error: null })
    const res = await request(app)
      .patch(`/api/cases/${CASE_ID}/messages/msg-uuid-1/read`)
      .set(authHeader)
      .send({ readByStaff: true })
    expect(res.status).toBe(200)
    expect(res.body.readByStaff).toBe(true)
  })

  it('returns 404 when message not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app)
      .patch(`/api/cases/${CASE_ID}/messages/nope/read`)
      .set(authHeader)
      .send({ readByStaff: true })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Message not found')
  })
})
