import { describe, it, expect } from 'vitest'
import { sanitizeFilterTerm } from '../../lib/searchHelpers.js'

describe('sanitizeFilterTerm', () => {
  it('trims whitespace', () => {
    expect(sanitizeFilterTerm('  hello  ')).toBe('hello')
  })

  it('strips PostgREST filter meta-chars: , ( ) * \\', () => {
    expect(sanitizeFilterTerm('a,b(c)*d\\e')).toBe('abcde')
  })

  it('returns empty string for null / undefined / empty input', () => {
    expect(sanitizeFilterTerm(null)).toBe('')
    expect(sanitizeFilterTerm(undefined)).toBe('')
    expect(sanitizeFilterTerm('')).toBe('')
    expect(sanitizeFilterTerm('   ')).toBe('')
  })

  it('reduces an all-meta-char query to empty (defends the .or() filter)', () => {
    expect(sanitizeFilterTerm(',()*\\')).toBe('')
  })

  it('coerces non-string values before sanitizing', () => {
    expect(sanitizeFilterTerm(42)).toBe('42')
    expect(sanitizeFilterTerm(true)).toBe('true')
  })

  it('preserves % and _ (SQL LIKE wildcards) since they are legal inside .ilike()', () => {
    // These aren't PostgREST filter-string separators, so they pass through.
    expect(sanitizeFilterTerm('50%_of')).toBe('50%_of')
  })
})
