import { vi } from 'vitest'

/**
 * Creates a fresh chainable Supabase mock.
 * Call this inside beforeEach so each test gets a clean instance.
 *
 * Usage:
 *   const { supabase, chain } = makeSupabaseMock()
 *   vi.mock('../lib/supabase.js', () => ({ supabase }))
 *
 *   // In a test, control what the terminal method resolves to:
 *   chain.single.mockResolvedValue({ data: { id: '1' }, error: null })
 *   chain.maybeSingle.mockResolvedValue({ data: null, error: null })
 *
 *   // For list queries that end with .order() (no terminal method):
 *   chain.order.mockResolvedValue({ data: [...], error: null })
 *
 *   // For DELETE that ends with .eq():
 *   chain.eq.mockResolvedValue({ data: null, error: null })
 */
export function makeChain() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return chain
}

export function makeSupabaseMock() {
  const chain = makeChain()
  const supabase = {
    from: vi.fn(() => chain),
    auth: {
      getUser: vi.fn(),
    },
  }
  return { supabase, chain }
}

/** Convenience: returns auth.getUser mock result for an authenticated user */
export const authedUser = { data: { user: { id: 'test-user-id' } }, error: null }

/** Convenience: returns auth.getUser mock result for a bad/expired token */
export const badToken = { data: { user: null }, error: new Error('Invalid token') }

/** Bearer header used in authenticated requests */
export const authHeader = { Authorization: 'Bearer test-token' }
