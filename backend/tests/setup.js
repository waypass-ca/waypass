import { vi } from 'vitest'

/**
 * Creates a fresh chainable Supabase mock.
 *
 * Chain methods that return `this` (for chaining):
 *   select, insert, update, upsert, delete, eq, neq, is, not, gt, lt, or, contains, ilike, limit
 *
 * Terminal methods (resolve to { data, error }):
 *   order, single, maybeSingle
 *
 * Top-level supabase methods:
 *   supabase.from(table) → chain (table-aware, see makeSupabaseMock)
 *   supabase.rpc(fn, args) → vi.fn() — mock directly per test
 *   supabase.auth.getUser(token) → vi.fn()
 *   supabase.auth.admin.createUser(payload) → vi.fn()
 *   supabase.auth.admin.deleteUser(id) → vi.fn()
 *
 * Usage in a test file:
 *   const { supabase, chain, usersChain } = makeSupabaseMock()
 *   vi.mock('../../lib/supabase.js', () => ({ supabase }))
 *
 *   // Set terminal return value:
 *   chain.order.mockResolvedValue({ data: [...], error: null })
 *   chain.single.mockResolvedValue({ data: {...}, error: null })
 *
 *   // For user routes, mock usersChain instead:
 *   usersChain.order.mockResolvedValue({ data: [...], error: null })
 */
export function makeChain() {
  const chain = {
    select:     vi.fn().mockReturnThis(),
    insert:     vi.fn().mockReturnThis(),
    update:     vi.fn().mockReturnThis(),
    upsert:     vi.fn().mockReturnThis(),
    delete:     vi.fn().mockReturnThis(),
    eq:         vi.fn().mockReturnThis(),
    neq:        vi.fn().mockReturnThis(),
    is:         vi.fn().mockReturnThis(),
    not:        vi.fn().mockReturnThis(),
    gt:         vi.fn().mockReturnThis(),
    lt:         vi.fn().mockReturnThis(),
    or:         vi.fn().mockReturnThis(),
    contains:   vi.fn().mockReturnThis(),
    ilike:      vi.fn().mockReturnThis(),
    limit:      vi.fn().mockReturnThis(),
    order:      vi.fn(),
    single:     vi.fn(),
    maybeSingle: vi.fn(),
  }
  return chain
}

/** The profile row that requireAuth loads for all authenticated requests. */
export const dbProfile = {
  funeral_home_id: 'fh-uuid-1',
  role: 'admin',
  status: 'active',
}

/**
 * Creates a table-aware Supabase mock.
 *
 * `from('users')` → `usersChain` (pre-wired with a valid profile for requireAuth)
 * `from(<anything-else>)` → `chain`
 *
 * Tests for user-management routes should mock `usersChain`.
 * Tests for all other routes should mock `chain`.
 * Tests that use `supabase.from.mockReturnValueOnce` need to add the users
 * chain FIRST (since requireAuth queries it before the route handler runs).
 */
export function makeSupabaseMock() {
  const chain = makeChain()
  const usersChain = makeChain()

  // Pre-wire the profile lookup that requireAuth always does
  usersChain.maybeSingle.mockResolvedValue({ data: dbProfile, error: null })
  // Default user list / single for user-management route tests (override per test)
  usersChain.order.mockResolvedValue({ data: [], error: null })
  usersChain.single.mockResolvedValue({ data: null, error: null })

  const supabase = {
    from: vi.fn(table => (table === 'users' ? usersChain : chain)),
    rpc:  vi.fn(),
    auth: {
      getUser: vi.fn(),
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  }
  return { supabase, chain, usersChain }
}

/**
 * Reset supabase.from to the table-aware dispatch. Call this in beforeEach
 * after vi.clearAllMocks() to undo any lingering mockImplementation overrides.
 */
export function resetDispatch(supabase, usersChain, chain) {
  supabase.from.mockImplementation(table => (table === 'users' ? usersChain : chain))
  usersChain.maybeSingle.mockResolvedValue({ data: dbProfile, error: null })
}

/** auth.getUser result for a valid session */
export const authedUser = { data: { user: { id: 'test-user-id', email: 'admin@acme.com' } }, error: null }

/** auth.getUser result for a bad/expired token */
export const badToken = { data: { user: null }, error: new Error('Invalid token') }

/** Bearer header for authenticated requests */
export const authHeader = { Authorization: 'Bearer test-token' }

/** Admin key header for /db/:id/network */
export const adminKeyHeader = { 'x-admin-key': 'test-admin-key' }
