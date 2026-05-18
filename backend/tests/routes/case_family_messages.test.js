import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
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
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
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
  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbMessage, error: null })
  })

  it('returns 400 when body is missing', async () => {
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/messages`)
      .send({ senderType: 'family', body: '   ' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('body is required')
  })

  it('returns 400 for invalid senderType', async () => {
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/messages`)
      .send({ senderType: 'admin', body: 'Hello' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('senderType must be family or staff')
  })

  it('returns 201 — family can post without auth', async () => {
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/messages`)
      .send({ senderType: 'family', senderName: 'Linda Chen', body: 'When will the ashes be ready?' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual(shapedMessage)
  })

  it('returns 201 — staff can also post', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const staffMessage = { ...dbMessage, sender_type: 'staff', sender_id: 'user-uuid-1', sender_name: 'Alice' }
    chain.single.mockResolvedValue({ data: staffMessage, error: null })

    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/messages`)
      .set(authHeader)
      .send({ senderType: 'staff', senderId: 'user-uuid-1', senderName: 'Alice', body: 'We expect tomorrow.' })
    expect(res.status).toBe(201)
    expect(res.body.senderType).toBe('staff')
  })
})

describe('PATCH /api/cases/:caseId/messages/:id/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
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
