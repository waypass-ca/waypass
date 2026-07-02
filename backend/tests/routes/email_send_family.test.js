import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader, resetDispatch } from '../setup.js'

const { supabase, chain, usersChain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

process.env.ENABLE_RESEND = 'false'

const { default: app } = await import('../../server.js')

const CASE_ID = 'PSG-2024-0001'
const RECIPIENT = 'linda.chen@email.com'

const validBody = {
  caseId: CASE_ID,
  to: RECIPIENT,
  subject: 'Status update',
  html: '<p>Hello</p>',
}

describe('POST /api/email-template/send-family', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDispatch(supabase, usersChain, chain)
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.is.mockReturnThis()
    // Ownership lookup: a case owned by the caller with the recipient as contact
    chain.maybeSingle.mockResolvedValue({ data: { id: CASE_ID, contact_email: RECIPIENT }, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/email-template/send-family').send(validBody)
    expect(res.status).toBe(401)
  })

  it('returns 400 when caseId is missing', async () => {
    const res = await request(app)
      .post('/api/email-template/send-family')
      .set(authHeader)
      .send({ to: RECIPIENT, subject: 's', html: '<p>h</p>' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when recipient is not a valid email', async () => {
    const res = await request(app)
      .post('/api/email-template/send-family')
      .set(authHeader)
      .send({ ...validBody, to: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when the case is not owned by the caller', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await request(app)
      .post('/api/email-template/send-family')
      .set(authHeader)
      .send(validBody)
    expect(res.status).toBe(404)
  })

  it('returns 403 when recipient is not a contact on the case', async () => {
    chain.maybeSingle.mockResolvedValue({ data: { id: CASE_ID, contact_email: 'someone.else@email.com' }, error: null })
    const res = await request(app)
      .post('/api/email-template/send-family')
      .set(authHeader)
      .send(validBody)
    expect(res.status).toBe(403)
  })

  it('returns 200 when recipient matches the case contact', async () => {
    const res = await request(app)
      .post('/api/email-template/send-family')
      .set(authHeader)
      .send(validBody)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ sent: true })
  })
})
