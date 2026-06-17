import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const shouldEmail = vi.fn().mockResolvedValue(false)
const createInboxItem = vi.fn().mockResolvedValue(null)
vi.mock('../../lib/notifications.js', () => ({ shouldEmail, createInboxItem }))

process.env.ENABLE_RESEND = 'false'

const { default: app } = await import('../../server.js')

const USER_ID = authedUser.data.user.id

const slot = (date, hour) => ({
  date,
  start: `${String(hour).padStart(2, '0')}:00`,
  end: `${String(hour + 1).padStart(2, '0')}:00`,
})

function dbBooking(overrides = {}) {
  return {
    id: 'booking-1',
    case_id: 'CASE-1',
    crematorium_id: 'crem-1',
    crematorium_email: 'crem@example.com',
    crematorium_name: 'Test Crem',
    funeral_home_id: USER_ID,
    status: 'pending',
    proposed_slots: [slot('2026-07-01', 9)],
    crematorium_slots: null,
    confirmed_slot: null,
    response_token: 'token-old',
    shipping_partner_id: null,
    shipping_partner_email: null,
    shipping_partner_name: null,
    shipping_response_token: null,
    shipping_slots: null,
    shipping_responded_at: null,
    deceased_name: 'Jane Doe',
    created_at: '2026-06-01T00:00:00Z',
    responded_at: null,
    confirmed_at: null,
    ...overrides,
  }
}

describe('POST /api/bookings — one-active-per-case enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.insert.mockReturnThis()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.neq.mockReturnThis()
    chain.is.mockReturnThis()
    shouldEmail.mockResolvedValue(false)
    createInboxItem.mockResolvedValue(null)
  })

  const validPayload = {
    caseId: 'CASE-1',
    crematoriumId: 'crem-1',
    crematoriumEmail: 'crem@example.com',
    crematoriumName: 'Test Crem',
    proposedSlots: [slot('2026-07-01', 9)],
    deceasedName: 'Jane Doe',
  }

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/bookings')
      .set(authHeader)
      .send({ caseId: 'CASE-1' })
    expect(res.status).toBe(400)
  })

  it('returns 409 when case already has an active booking', async () => {
    chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'existing-booking' }, error: null })

    const res = await request(app).post('/api/bookings')
      .set(authHeader)
      .send(validPayload)

    expect(res.status).toBe(409)
    expect(res.body.bookingId).toBe('existing-booking')
    expect(chain.neq).toHaveBeenCalledWith('status', 'cancelled')
  })

  it('returns 201 when no active booking exists', async () => {
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    chain.single.mockResolvedValueOnce({ data: dbBooking(), error: null })

    const res = await request(app).post('/api/bookings')
      .set(authHeader)
      .send(validPayload)

    expect(res.status).toBe(201)
    expect(res.body.id).toBe('booking-1')
  })

  it('returns 201 when only a cancelled booking exists for the case', async () => {
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    chain.single.mockResolvedValueOnce({ data: dbBooking({ status: 'pending' }), error: null })

    const res = await request(app).post('/api/bookings')
      .set(authHeader)
      .send(validPayload)

    expect(res.status).toBe(201)
  })
})

describe('POST /api/bookings/:id/reschedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    shouldEmail.mockResolvedValue(false)
    createInboxItem.mockResolvedValue(null)
  })

  const newSlots = [slot('2026-08-15', 10), slot('2026-08-15', 11)]

  it('returns 400 when proposedSlots is missing', async () => {
    const res = await request(app).post('/api/bookings/booking-1/reschedule')
      .set(authHeader)
      .send({})
    expect(res.status).toBe(400)
  })

  it('returns 400 when proposedSlots is empty', async () => {
    const res = await request(app).post('/api/bookings/booking-1/reschedule')
      .set(authHeader)
      .send({ proposedSlots: [] })
    expect(res.status).toBe(400)
  })

  it('returns 404 when booking does not exist', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    const res = await request(app).post('/api/bookings/missing/reschedule')
      .set(authHeader)
      .send({ proposedSlots: newSlots })

    expect(res.status).toBe(404)
  })

  it('rotates response_token and resets state for a no-shipping booking', async () => {
    chain.single
      .mockResolvedValueOnce({ data: dbBooking({ status: 'confirmed', confirmed_slot: slot('2026-07-01', 9) }), error: null })
      .mockResolvedValueOnce({
        data: dbBooking({ status: 'pending', proposed_slots: newSlots, response_token: 'token-new', confirmed_slot: null }),
        error: null,
      })

    const res = await request(app).post('/api/bookings/booking-1/reschedule')
      .set(authHeader)
      .send({ proposedSlots: newSlots })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('pending')
    expect(res.body.responseToken).toBe('token-new')

    const updateArgs = chain.update.mock.calls.at(-1)[0]
    expect(updateArgs.status).toBe('pending')
    expect(updateArgs.proposed_slots).toEqual(newSlots)
    expect(updateArgs.crematorium_slots).toBeNull()
    expect(updateArgs.shipping_slots).toBeNull()
    expect(updateArgs.confirmed_slot).toBeNull()
    expect(updateArgs.responded_at).toBeNull()
    expect(updateArgs.confirmed_at).toBeNull()
    expect(updateArgs.shipping_responded_at).toBeNull()
    expect(typeof updateArgs.response_token).toBe('string')
    expect(updateArgs.response_token).not.toBe('token-old')
    expect(updateArgs.shipping_response_token).toBeUndefined()
  })

  it('rotates shipping_response_token when booking has a shipping partner', async () => {
    const withShipping = dbBooking({
      status: 'responded',
      shipping_partner_id: 'ship-1',
      shipping_response_token: 'ship-token-old',
      crematorium_slots: [slot('2026-07-01', 9)],
      shipping_slots: [slot('2026-07-01', 9)],
      responded_at: '2026-06-02T00:00:00Z',
      shipping_responded_at: '2026-06-03T00:00:00Z',
    })
    chain.single
      .mockResolvedValueOnce({ data: withShipping, error: null })
      .mockResolvedValueOnce({
        data: { ...withShipping, status: 'pending', proposed_slots: newSlots, response_token: 'token-new', shipping_response_token: 'ship-token-new', crematorium_slots: null, shipping_slots: null, responded_at: null, shipping_responded_at: null },
        error: null,
      })

    const res = await request(app).post('/api/bookings/booking-1/reschedule')
      .set(authHeader)
      .send({ proposedSlots: newSlots })

    expect(res.status).toBe(200)

    const updateArgs = chain.update.mock.calls.at(-1)[0]
    expect(typeof updateArgs.shipping_response_token).toBe('string')
    expect(updateArgs.shipping_response_token).not.toBe('ship-token-old')
    expect(updateArgs.shipping_response_token).not.toBe(updateArgs.response_token)
  })

  it('writes a rescheduled inbox item on success', async () => {
    chain.single
      .mockResolvedValueOnce({ data: dbBooking(), error: null })
      .mockResolvedValueOnce({ data: dbBooking({ status: 'pending', response_token: 'token-new' }), error: null })

    await request(app).post('/api/bookings/booking-1/reschedule')
      .set(authHeader)
      .send({ proposedSlots: newSlots })

    expect(createInboxItem).toHaveBeenCalledTimes(1)
    const inbox = createInboxItem.mock.calls[0][0]
    expect(inbox.userId).toBe(USER_ID)
    expect(inbox.bookingId).toBe('booking-1')
    expect(inbox.subject).toMatch(/rescheduled/i)
  })
})
