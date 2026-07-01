import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/requireRole.js'
import { sendInviteEmail } from './auth.js'
import crypto from 'crypto'

const router = Router()

function shapeRow(row) {
  return {
    id: row.id,
    funeralHomeId: row.funeral_home_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    status: row.status,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  }
}

// GET /api/users — all active users in the same funeral home
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('funeral_home_id', req.user.funeralHomeId)
      .is('deleted_at', null)
      .order('first_name')
    if (error) throw error
    res.json(data.map(shapeRow))
  } catch (err) {
    next(err)
  }
})

// GET /api/users/me — current user's profile
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()
    if (error) throw error
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// GET /api/users/invites — pending invites (admin only)
router.get('/invites', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('funeral_home_invites')
      .select('id, email, role, expires_at, created_at, accepted_at')
      .eq('funeral_home_id', req.user.funeralHomeId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// POST /api/users/invite — send invite email (admin only)
router.post('/invite', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { email, role } = req.body
    if (!email) return res.status(400).json({ error: 'email is required' })

    const validRoles = ['admin', 'staff', 'read_only']
    const inviteRole = validRoles.includes(role) ? role : 'staff'

    // Check not already a member
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('funeral_home_id', req.user.funeralHomeId)
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()
    if (existing) return res.status(409).json({ error: 'User is already a member' })

    // Check for an existing pending invite
    const { data: existingInvite } = await supabase
      .from('funeral_home_invites')
      .select('id')
      .eq('funeral_home_id', req.user.funeralHomeId)
      .eq('email', email)
      .is('accepted_at', null)
      .maybeSingle()
    if (existingInvite) return res.status(409).json({ error: 'A pending invite already exists for this email' })

    const token = crypto.randomBytes(32).toString('hex')

    const { data: invite, error: invErr } = await supabase
      .from('funeral_home_invites')
      .insert({
        funeral_home_id: req.user.funeralHomeId,
        email,
        role: inviteRole,
        token,
        invited_by: req.user.id,
      })
      .select()
      .single()
    if (invErr) throw invErr

    const { data: home } = await supabase
      .from('funeral_homes')
      .select('name')
      .eq('id', req.user.funeralHomeId)
      .single()

    const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173'
    await sendInviteEmail({
      to: email,
      funeralHomeName: home?.name ?? 'Passage',
      inviteUrl: `${baseUrl}/accept-invite?token=${token}`,
      role: inviteRole,
    }).catch(err => console.error('Failed to send invite email:', err.message))

    res.status(201).json({ id: invite.id, email, role: inviteRole })
  } catch (err) {
    next(err)
  }
})

// POST /api/users/invites/:id/resend — resend invite email (admin only)
router.post('/invites/:id/resend', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { data: invite, error } = await supabase
      .from('funeral_home_invites')
      .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .is('accepted_at', null)
      .select()
      .single()
    if (error) throw error
    if (!invite) return res.status(404).json({ error: 'Invite not found' })

    const { data: home } = await supabase
      .from('funeral_homes').select('name').eq('id', req.user.funeralHomeId).single()
    const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173'
    await sendInviteEmail({
      to: invite.email,
      funeralHomeName: home?.name ?? 'Waypass',
      inviteUrl: `${baseUrl}/accept-invite?token=${invite.token}`,
      role: invite.role,
    }).catch(err => console.error('Failed to resend invite email:', err.message))

    res.status(200).json({ id: invite.id, email: invite.email })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/users/invites/:id — revoke invite (admin only)
router.delete('/invites/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('funeral_home_invites')
      .delete()
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'User not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/:id/role — change role (admin only)
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body
    const validRoles = ['admin', 'staff', 'read_only']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` })
    }
    // Prevent self-demotion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' })
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role, modified_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'User not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/:id — update own profile fields
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot edit another user\'s profile' })
    }

    const ALLOWED = new Set(['first_name', 'last_name', 'phone', 'avatar_url'])
    const patch = {}
    for (const [k, v] of Object.entries(req.body ?? {})) {
      if (ALLOWED.has(k)) patch[k] = v
    }
    patch.modified_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('users')
      .update(patch)
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'User not found' })
    res.json(shapeRow(data))
  } catch (err) {
    next(err)
  }
})

// DELETE /api/users/:id — soft-delete (admin only, cannot delete self)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' })
    }

    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
      .eq('id', req.params.id)
      .eq('funeral_home_id', req.user.funeralHomeId)
    if (error) throw error
    await supabase.auth.admin.signOut(req.params.id).catch(err =>
      console.error('Failed to invalidate session for removed user:', err.message)
    )
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
