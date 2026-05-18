import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeChain, makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const CASE_ID = 'PSG-2024-0001'

const dbContact = {
  id: 'contact-uuid-1',
  case_id: CASE_ID,
  name: 'Linda Chen',
  relationship: 'Daughter',
  phone: '(415) 555-0182',
  email: 'linda@example.com',
  is_primary: true,
  is_authorizing_nok: false,
  created_at: '2024-03-15T10:00:00Z',
}

const shapedContact = {
  id: 'contact-uuid-1',
  caseId: CASE_ID,
  name: 'Linda Chen',
  relationship: 'Daughter',
  phone: '(415) 555-0182',
  email: 'linda@example.com',
  isPrimary: true,
  isAuthorizingNok: false,
  createdAt: '2024-03-15T10:00:00Z',
}

describe('GET /api/cases/:caseId/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbContact], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get(`/api/cases/${CASE_ID}/contacts`)
    expect(res.status).toBe(401)
  })

  it('returns 200 with shaped contacts array', async () => {
    const res = await request(app).get(`/api/cases/${CASE_ID}/contacts`).set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedContact])
  })

  it('returns 500 on DB error', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get(`/api/cases/${CASE_ID}/contacts`).set(authHeader)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/cases/:caseId/contacts', () => {
  const payload = {
    name: 'Linda Chen',
    relationship: 'Daughter',
    phone: '(415) 555-0182',
    email: 'linda@example.com',
    isPrimary: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbContact, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post(`/api/cases/${CASE_ID}/contacts`).send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/contacts`)
      .set(authHeader)
      .send({ ...payload, name: '' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('name is required')
  })

  it('returns 201 with shaped contact', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/contacts`)
      .set(authHeader)
      .send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toEqual(shapedContact)
  })

  it('unsets existing primary before inserting when isPrimary is true', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)

    // unset primary update
    const updateChain = makeChain()
    updateChain.update.mockReturnThis()
    updateChain.eq.mockResolvedValue({ data: null, error: null })

    // insert new contact
    const insertChain = makeChain()
    insertChain.insert.mockReturnThis()
    insertChain.select.mockReturnThis()
    insertChain.single.mockResolvedValue({ data: dbContact, error: null })

    supabase.from.mockReturnValueOnce(updateChain).mockReturnValueOnce(insertChain)

    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/contacts`)
      .set(authHeader)
      .send({ ...payload, isPrimary: true })
    expect(res.status).toBe(201)
    expect(updateChain.update).toHaveBeenCalledWith({ is_primary: false })
  })
})

describe('PATCH /api/cases/:caseId/contacts/:id', () => {
  const payload = { name: 'Linda Chen Updated', phone: '555-9999' }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).patch(`/api/cases/${CASE_ID}/contacts/contact-uuid-1`).send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated contact', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: dbContact, error: null })
    const res = await request(app)
      .patch(`/api/cases/${CASE_ID}/contacts/contact-uuid-1`)
      .set(authHeader)
      .send(payload)
    expect(res.status).toBe(200)
  })

  it('returns 404 when contact not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app)
      .patch(`/api/cases/${CASE_ID}/contacts/nope`)
      .set(authHeader)
      .send(payload)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Contact not found')
  })
})

describe('DELETE /api/cases/:caseId/contacts/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.delete.mockReturnThis()
    // Two .eq() calls: first returns this, second resolves
    chain.eq
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: null, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).delete(`/api/cases/${CASE_ID}/contacts/contact-uuid-1`)
    expect(res.status).toBe(401)
  })

  it('returns 204 with auth', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .delete(`/api/cases/${CASE_ID}/contacts/contact-uuid-1`)
      .set(authHeader)
    expect(res.status).toBe(204)
  })
})
