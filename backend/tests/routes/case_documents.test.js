import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const CASE_ID = 'PSG-2024-0001'

const dbDocument = {
  id: 'doc-uuid-1',
  case_id: CASE_ID,
  uploaded_by: 'user-uuid-1',
  document_type: 'death_certificate',
  file_url: 'https://storage.example.com/docs/cert.pdf',
  file_name: 'death_certificate.pdf',
  storage_path: 'cases/PSG-2024-0001/cert.pdf',
  status: 'pending',
  visible_to_family: false,
  uploaded_at: '2024-03-15T10:00:00Z',
}

const shapedDocument = {
  id: 'doc-uuid-1',
  caseId: CASE_ID,
  uploadedBy: 'user-uuid-1',
  documentType: 'death_certificate',
  fileUrl: 'https://storage.example.com/docs/cert.pdf',
  fileName: 'death_certificate.pdf',
  storagePath: 'cases/PSG-2024-0001/cert.pdf',
  status: 'pending',
  visibleToFamily: false,
  uploadedAt: '2024-03-15T10:00:00Z',
}

describe('GET /api/cases/:caseId/documents/structured', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbDocument], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get(`/api/cases/${CASE_ID}/documents/structured`)
    expect(res.status).toBe(401)
  })

  it('returns 200 with shaped documents', async () => {
    const res = await request(app).get(`/api/cases/${CASE_ID}/documents/structured`).set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedDocument])
  })

  it('returns 500 on DB error', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get(`/api/cases/${CASE_ID}/documents/structured`).set(authHeader)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/cases/:caseId/documents/structured', () => {
  const payload = {
    fileUrl: 'https://storage.example.com/docs/cert.pdf',
    fileName: 'death_certificate.pdf',
    documentType: 'death_certificate',
    storagePath: 'cases/PSG-2024-0001/cert.pdf',
    visibleToFamily: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbDocument, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post(`/api/cases/${CASE_ID}/documents/structured`).send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 400 when fileUrl or fileName is missing', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/documents/structured`)
      .set(authHeader)
      .send({ fileUrl: 'https://example.com/file.pdf' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('fileUrl and fileName are required')
  })

  it('returns 201 with shaped document', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .post(`/api/cases/${CASE_ID}/documents/structured`)
      .set(authHeader)
      .send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toEqual(shapedDocument)
  })
})

describe('PATCH /api/cases/:caseId/documents/structured/:id', () => {
  const payload = { status: 'verified', visibleToFamily: true }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app)
      .patch(`/api/cases/${CASE_ID}/documents/structured/doc-uuid-1`)
      .send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated document', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: { ...dbDocument, status: 'verified', visible_to_family: true }, error: null })
    const res = await request(app)
      .patch(`/api/cases/${CASE_ID}/documents/structured/doc-uuid-1`)
      .set(authHeader)
      .send(payload)
    expect(res.status).toBe(200)
  })

  it('returns 404 when document not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app)
      .patch(`/api/cases/${CASE_ID}/documents/structured/nope`)
      .set(authHeader)
      .send(payload)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Document not found')
  })
})

describe('DELETE /api/cases/:caseId/documents/structured/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    // Two .eq() calls: first returns this, second resolves
    chain.eq
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: null, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).delete(`/api/cases/${CASE_ID}/documents/structured/doc-uuid-1`)
    expect(res.status).toBe(401)
  })

  it('returns 204 — soft deletes via deleted_at', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .delete(`/api/cases/${CASE_ID}/documents/structured/doc-uuid-1`)
      .set(authHeader)
    expect(res.status).toBe(204)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ deleted_at: expect.any(String) }))
  })
})
