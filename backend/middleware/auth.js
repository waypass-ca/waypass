import { supabase } from '../lib/supabase.js'

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' })
  }

  try {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('funeral_home_id, role, status')
      .eq('id', user.id)
      .maybeSingle()

    if (profileErr) return res.status(500).json({ error: 'Failed to load user profile' })

    if (!profile || !profile.funeral_home_id) {
      return res.status(403).json({ error: 'account_not_setup' })
    }

    if (profile.status !== 'active') {
      return res.status(403).json({ error: 'Account suspended' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      funeralHomeId: profile.funeral_home_id,
      role: profile.role,
      token,
    }
    next()
  } catch (err) {
    next(err)
  }
}
