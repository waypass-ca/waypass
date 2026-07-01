import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader , resetDispatch } from '../setup.js'

const { supabase, chain, usersChain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const USER_ID = authedUser.data.user.id

const dbNotification = {
  id: 'notif-uuid-1',
  user_id: USER_ID,
  new_case_submitted: true,
  case_status_updated: true,
  document_uploaded: false,
  case_marked_complete: true,
  new_crematorium_request: true,
  weekly_revenue_summary: true,
  family_message_received: true,
}

const shapedNotification = {
  id: 'notif-uuid-1',
  userId: USER_ID,
  newCaseSubmitted: true,
  caseStatusUpdated: true,
  documentUploaded: false,
  caseMarkedComplete: true,
  newCrematoriumRequest: true,
  weeklyRevenueSummary: true,
  familyMessageReceived: true,
}

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.maybeSingle.mockResolvedValue({ data: dbNotification, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/notifications')
    expect(res.status).toBe(401)
  })

  it('returns 200 with shaped notification prefs for the authed user', async () => {
    const res = await request(app).get('/api/notifications').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedNotification)
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
  })

  it('returns 200 with null when no prefs exist yet', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await request(app).get('/api/notifications').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })

  it('returns 500 on DB error', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/notifications').set(authHeader)
    expect(res.status).toBe(500)
  })
})

describe('PUT /api/notifications', () => {
  const payload = {
    newCaseSubmitted: true,
    caseStatusUpdated: false,
    documentUploaded: true,
    caseMarkedComplete: true,
    newCrematoriumRequest: false,
    weeklyRevenueSummary: true,
    familyMessageReceived: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    chain.upsert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbNotification, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).put('/api/notifications').send(payload)
    expect(res.status).toBe(401)
  })

  it('upserts with user_id from auth context, not URL', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .put('/api/notifications')
      .set(authHeader)
      .send(payload)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedNotification)
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID }),
      expect.objectContaining({ onConflict: 'user_id' })
    )
  })

  it('returns 500 on DB error', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app)
      .put('/api/notifications')
      .set(authHeader)
      .send(payload)
    expect(res.status).toBe(500)
  })
})
