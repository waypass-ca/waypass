import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { requireAdminKey } from '../../middleware/requireAdminKey.js'

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
  }
}

describe('requireAdminKey', () => {
  const original = process.env.ADMIN_API_KEY

  beforeEach(() => {
    process.env.ADMIN_API_KEY = 'the-secret'
  })
  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_API_KEY
    else process.env.ADMIN_API_KEY = original
  })

  it('fails closed with 503 when ADMIN_API_KEY is unset', () => {
    delete process.env.ADMIN_API_KEY
    const res = mockRes()
    const next = vi.fn()
    requireAdminKey({ headers: {} }, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(503)
  })

  it('rejects a missing header with 401 (does not fall open)', () => {
    const res = mockRes()
    const next = vi.fn()
    requireAdminKey({ headers: {} }, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
  })

  it('rejects a wrong key with 401', () => {
    const res = mockRes()
    const next = vi.fn()
    requireAdminKey({ headers: { 'x-admin-key': 'wrong' } }, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
  })

  it('calls next() when the key matches', () => {
    const res = mockRes()
    const next = vi.fn()
    requireAdminKey({ headers: { 'x-admin-key': 'the-secret' } }, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.statusCode).toBe(null)
  })
})
