export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

export function requireWrite(req, res, next) {
  if (req.user?.role === 'read_only') {
    return res.status(403).json({ error: 'Read-only access' })
  }
  next()
}
