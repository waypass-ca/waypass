import { timingSafeEqual } from 'node:crypto'

// Gate for platform-admin operations on the canonical vendor DB (waypass network
// / tier flags). Authenticated by a shared secret in ADMIN_API_KEY, NOT by a
// funeral-home user session. Fails CLOSED: if ADMIN_API_KEY is unset the route is
// unusable rather than open to anyone who omits the header.
export function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY
  if (!expected) {
    return res.status(503).json({ error: 'Admin API not configured' })
  }

  const provided = req.headers['x-admin-key']
  if (typeof provided !== 'string') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}
