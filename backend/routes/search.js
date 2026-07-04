import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { sanitizeFilterTerm } from '../lib/searchHelpers.js'

const router = Router()

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 10

function parseLimit(raw) {
  const n = parseInt(raw, 10)
  if (isNaN(n) || n <= 0) return DEFAULT_LIMIT
  return Math.min(n, MAX_LIMIT)
}

const EMPTY = {
  cases: [],
  crematoriums: [],
  shippingPartners: [],
  bookings: [],
  inbox: [],
}

// GET /api/search?q=<term>&limit=<n>
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const term = sanitizeFilterTerm(req.query.q)
    if (!term) return res.json(EMPTY)

    const limit = parseLimit(req.query.limit)
    const like = `%${term}%`
    const { funeralHomeId, id: userId } = req.user

    const [
      casesRes,
      crematoriumsRes,
      shippingRes,
      bookingsRes,
      inboxRes,
    ] = await Promise.all([
      supabase
        .from('cases')
        .select('id, deceased, family, contact_name, contact_email, crematorium_name, status, case_date')
        .eq('funeral_home_id', funeralHomeId)
        .or(
          `deceased.ilike.${like},family.ilike.${like},id.ilike.${like},contact_name.ilike.${like},contact_email.ilike.${like},crematorium_name.ilike.${like}`
        )
        .order('case_date', { ascending: false, nullsFirst: false })
        .limit(limit),

      supabase
        .from('crematoriums')
        .select('id, name, city, location, contact_name')
        .is('deleted_at', null)
        .contains('connected_funeral_home_ids', [funeralHomeId])
        .or(
          `name.ilike.${like},city.ilike.${like},location.ilike.${like},contact_name.ilike.${like}`
        )
        .order('name')
        .limit(limit),

      supabase
        .from('shipping_partners')
        .select('id, name, city, location, contact_name')
        .is('deleted_at', null)
        .contains('connected_funeral_home_ids', [funeralHomeId])
        .or(
          `name.ilike.${like},city.ilike.${like},location.ilike.${like},contact_name.ilike.${like}`
        )
        .order('name')
        .limit(limit),

      supabase
        .from('cremation_bookings')
        .select('id, case_id, crematorium_name, status, created_at')
        .eq('funeral_home_id', funeralHomeId)
        .or(
          `crematorium_name.ilike.${like},status.ilike.${like},case_id.ilike.${like}`
        )
        .order('created_at', { ascending: false })
        .limit(limit),

      supabase
        .from('inbox_items')
        .select('id, subject, preview, sender, case_id, created_at')
        .eq('user_id', userId)
        .is('archived_at', null)
        .or(
          `subject.ilike.${like},preview.ilike.${like},sender.ilike.${like}`
        )
        .order('created_at', { ascending: false })
        .limit(limit),
    ])

    for (const r of [casesRes, crematoriumsRes, shippingRes, bookingsRes, inboxRes]) {
      if (r.error) throw r.error
    }

    res.json({
      cases: (casesRes.data ?? []).map(row => ({
        id: row.id,
        label: row.deceased || row.family || row.id,
        sublabel: [row.id, row.status].filter(Boolean).join(' · '),
        href: `/cases/${row.id}`,
      })),
      crematoriums: (crematoriumsRes.data ?? []).map(row => ({
        id: row.id,
        label: row.name,
        sublabel: row.city || row.location || row.contact_name || '',
        href: `/crematoriums/${row.id}`,
      })),
      shippingPartners: (shippingRes.data ?? []).map(row => ({
        id: row.id,
        label: row.name,
        sublabel: row.city || row.location || row.contact_name || '',
        href: `/shipping/${row.id}`,
      })),
      bookings: (bookingsRes.data ?? []).map(row => ({
        id: row.id,
        label: row.crematorium_name || `Booking ${row.id}`,
        sublabel: [row.case_id, row.status].filter(Boolean).join(' · '),
        href: row.case_id ? `/cases/${row.case_id}` : '/calendar',
      })),
      inbox: (inboxRes.data ?? []).map(row => ({
        id: row.id,
        label: row.subject || row.sender || 'Inbox message',
        sublabel: row.preview || row.sender || '',
        href: '/inbox',
      })),
    })
  } catch (err) {
    next(err)
  }
})

export default router
