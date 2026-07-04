const KEY = 'waypass.recentSearches'
const MAX = 5

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(v => typeof v === 'string').slice(0, MAX)
  } catch {
    return []
  }
}

export function addRecentSearch(query) {
  const q = (query ?? '').trim()
  if (!q) return getRecentSearches()
  const current = getRecentSearches()
  const next = [q, ...current.filter(v => v.toLowerCase() !== q.toLowerCase())].slice(0, MAX)
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

export function clearRecentSearches() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  return []
}
