import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const dbFolder = {
  id: 'folder-uuid-1',
  funeral_home_id: 'fh-uuid-1',
  name: 'Active Cases',
  type: 'cases',
  color: '#6B8F71',
  sort_order: 0,
  created_at: '2024-01-01T00:00:00Z',
}

const shapedFolder = {
  id: 'folder-uuid-1',
  funeralHomeId: 'fh-uuid-1',
  name: 'Active Cases',
  type: 'cases',
  color: '#6B8F71',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('GET /api/folders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.is.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbFolder], error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).get('/api/folders')
    expect(res.status).toBe(401)
  })

  it('returns 200 with all folders', async () => {
    const res = await request(app).get('/api/folders').set(authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedFolder])
  })

  it('filters by type when provided', async () => {
    chain.eq.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbFolder], error: null })
    const res = await request(app).get('/api/folders?type=cases').set(authHeader)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('type', 'cases')
  })

  it('returns 500 on DB error', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/folders').set(authHeader)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/folders', () => {
  const payload = { name: 'Active Cases', type: 'cases', color: '#6B8F71', funeralHomeId: 'fh-uuid-1' }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbFolder, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/folders').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).post('/api/folders').set(authHeader).send({ ...payload, name: '' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('name is required')
  })

  it('returns 400 for invalid type', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).post('/api/folders').set(authHeader).send({ ...payload, type: 'invalid' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('type must be cases or documents')
  })

  it('returns 201 with shaped folder', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).post('/api/folders').set(authHeader).send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toEqual(shapedFolder)
  })
})

describe('PATCH /api/folders/:id', () => {
  const payload = { name: 'Renamed Folder', color: '#C4965A' }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).patch('/api/folders/folder-uuid-1').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated folder', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: dbFolder, error: null })
    const res = await request(app).patch('/api/folders/folder-uuid-1').set(authHeader).send(payload)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedFolder)
  })

  it('returns 404 when folder not found', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app).patch('/api/folders/nope').set(authHeader).send(payload)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Folder not found')
  })
})

describe('DELETE /api/folders/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockResolvedValue({ data: null, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).delete('/api/folders/folder-uuid-1')
    expect(res.status).toBe(401)
  })

  it('returns 204 — soft deletes via deleted_at', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).delete('/api/folders/folder-uuid-1').set(authHeader)
    expect(res.status).toBe(204)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ deleted_at: expect.any(String) }))
  })
})
