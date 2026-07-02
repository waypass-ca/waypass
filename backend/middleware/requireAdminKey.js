import crypto from 'crypto'

// Guards the internal /db/:id/network endpoints. The comparison is timing-safe,
// and — critically — the endpoint is refused outright when ADMIN_API_KEY is not
// configured. Without that guard, an unset env var would make an empty/absent
// header compare equal to `undefined` and silently open the endpoint.
export function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY
  if (!expected) {
    return res.status(503).json({ error: 'Admin API is not configured' })
  }

  const provided = req.headers['x-admin-key']
  if (typeof provided !== 'string') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
