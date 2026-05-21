import { vi } from 'vitest'

/**
 * Creates a fresh chainable Supabase mock.
 *
 * Chain methods that return `this` (for chaining):
 *   select, insert, update, upsert, delete, eq, is, not, or, contains, ilike
 *
 * Terminal methods (resolve to { data, error }):
 *   order, single, maybeSingle
 *
 * Top-level supabase methods:
 *   supabase.from(table) → chain
 *   supabase.rpc(fn, args) → vi.fn() — mock directly per test
 *   supabase.auth.getUser(token) → vi.fn()
 *
 * Usage in a test file:
 *   const { supabase, chain } = makeSupabaseMock()
 *   vi.mock('../../lib/supabase.js', () => ({ supabase }))
 *
 *   // Set terminal return value:
 *   chain.order.mockResolvedValue({ data: [...], error: null })
 *   chain.single.mockResolvedValue({ data: {...}, error: null })
 *
 *   // For rpc calls:
 *   supabase.rpc.mockResolvedValue({ data: [...], error: null })
 */
export function makeChain() {
  const chain = {
    select:   vi.fn().mockReturnThis(),
    insert:   vi.fn().mockReturnThis(),
    update:   vi.fn().mockReturnThis(),
    upsert:   vi.fn().mockReturnThis(),
    delete:   vi.fn().mockReturnThis(),
    eq:       vi.fn().mockReturnThis(),
    is:       vi.fn().mockReturnThis(),
    not:      vi.fn().mockReturnThis(),
    or:       vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    ilike:    vi.fn().mockReturnThis(),
    order:    vi.fn(),
    single:   vi.fn(),
    maybeSingle: vi.fn(),
  }
  return chain
}

export function makeSupabaseMock() {
  const chain = makeChain()
  const supabase = {
    from: vi.fn(() => chain),
    rpc:  vi.fn(),
    auth: { getUser: vi.fn() },
  }
  return { supabase, chain }
}

/** auth.getUser result for a valid session */
export const authedUser = { data: { user: { id: 'test-user-id' } }, error: null }

/** auth.getUser result for a bad/expired token */
export const badToken = { data: { user: null }, error: new Error('Invalid token') }

/** Bearer header for authenticated requests */
export const authHeader = { Authorization: 'Bearer test-token' }

/** Admin key header for /db/:id/network */
export const adminKeyHeader = { 'x-admin-key': 'test-admin-key' }
