// Strip characters that carry meaning inside a PostgREST `.or()` filter string
// (comma separates conditions, parens group them, `*` is the ilike wildcard).
// Without this a crafted `query` could inject extra filter conditions.
export function sanitizeFilterTerm(value) {
  return String(value ?? '').replace(/[,()*\\]/g, '').trim()
}
