import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import crypto from 'crypto'

const router = Router()

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => HTML_ESCAPES[c])

async function sendInviteEmail({ to, funeralHomeName, inviteUrl, role }) {
  if (process.env.ENABLE_RESEND === 'false') return
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const roleLabel = role === 'admin' ? 'Admin' : role === 'read_only' ? 'Read-Only' : 'Staff'

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'noreply@passagefunerals.com',
    to,
    subject: `You've been invited to join ${funeralHomeName} on Waypass`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:14px;color:#666">Passage Funeral Management</p>
        <h2 style="margin:0 0 12px">You're invited to join ${esc(funeralHomeName)}</h2>
        <p style="font-size:14px;color:#444">
          You've been added as a <strong>${esc(roleLabel)}</strong> member.
          Click the button below to set up your account.
        </p>
        <a href="${esc(inviteUrl)}"
           style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;margin:16px 0">
          Accept Invite →
        </a>
        <p style="font-size:12px;color:#999;margin-top:24px">
          This invite expires in 7 days. If you didn't expect this, you can ignore this email.
        </p>
      </div>
    `,
  })
}

// POST /api/auth/signup
// Creates auth user + funeral home + admin user row atomically
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, funeralHomeName } = req.body

    if (!email || !password || !funeralHomeName) {
      return res.status(400).json({ error: 'email, password, and funeralHomeName are required' })
    }

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authErr) {
      if (authErr.message?.includes('already registered') || authErr.code === 'email_exists') {
        return res.status(409).json({ error: 'An account with this email already exists' })
      }
      throw authErr
    }

    const userId = authData.user.id

    // Create funeral home
    const { data: home, error: homeErr } = await supabase
      .from('funeral_homes')
      .insert({ name: funeralHomeName, email })
      .select()
      .single()
    if (homeErr) {
      await supabase.auth.admin.deleteUser(userId).catch(() => {})
      throw homeErr
    }

    // Create user profile
    const { error: userErr } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        first_name: firstName ?? null,
        last_name: lastName ?? null,
        funeral_home_id: home.id,
        role: 'admin',
        status: 'active',
      })
    if (userErr) {
      await supabase.auth.admin.deleteUser(userId).catch(() => {})
      await supabase.from('funeral_homes').delete().eq('id', home.id).catch(() => {})
      throw userErr
    }

    res.status(201).json({ success: true, email, funeralHomeId: home.id })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/invite-info/:token — public, for the accept-invite page to prefill
router.get('/invite-info/:token', async (req, res, next) => {
  try {
    const { data: invite, error } = await supabase
      .from('funeral_home_invites')
      .select('email, role, expires_at, accepted_at, funeral_home_id, funeral_homes(name)')
      .eq('token', req.params.token)
      .maybeSingle()

    if (error) throw error
    if (!invite) return res.status(404).json({ error: 'Invite not found' })

    res.json({
      email: invite.email,
      role: invite.role,
      funeralHomeName: invite.funeral_homes?.name ?? null,
      expired: new Date(invite.expires_at) < new Date(),
      alreadyAccepted: !!invite.accepted_at,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/accept-invite
router.post('/accept-invite', async (req, res, next) => {
  try {
    const { token, password, firstName, lastName } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'token and password are required' })
    }

    const { data: invite, error: invErr } = await supabase
      .from('funeral_home_invites')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (invErr) throw invErr
    if (!invite) return res.status(404).json({ error: 'Invite not found' })
    if (invite.accepted_at) return res.status(409).json({ error: 'Invite already accepted' })
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Invite expired' })
    }

    // Check if a users row already exists (handles re-attempts after partial failures)
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id, funeral_home_id')
      .eq('email', invite.email)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingProfile) {
      if (existingProfile.funeral_home_id === invite.funeral_home_id) {
        // Profile already exists for this funeral home — idempotent success
        await supabase.from('funeral_home_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)
        return res.json({ success: true, email: invite.email })
      }
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    // Create auth user
    let userId
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    })

    if (authErr) {
      // Auth user exists but no users row — orphaned from a previous failed attempt.
      // Recover by finding the auth user and completing the profile creation.
      const isAlreadyRegistered = authErr.message?.includes('already registered') || authErr.code === 'email_exists'
      if (!isAlreadyRegistered) throw authErr

      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const orphan = listData?.users?.find(u => u.email === invite.email)
      if (!orphan) return res.status(409).json({ error: 'An account with this email already exists' })
      userId = orphan.id
    } else {
      userId = authData.user.id
    }

    const { error: userErr } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: invite.email,
        first_name: firstName ?? null,
        last_name: lastName ?? null,
        funeral_home_id: invite.funeral_home_id,
        role: invite.role,
        status: 'active',
      })
    if (userErr) {
      if (!authErr) await supabase.auth.admin.deleteUser(userId).catch(() => {})
      throw userErr
    }

    await supabase
      .from('funeral_home_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    res.json({ success: true, email: invite.email })
  } catch (err) {
    next(err)
  }
})

export { sendInviteEmail }
export default router
