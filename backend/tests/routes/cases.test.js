import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeChain, makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

// Full DB row as returned by Supabase with joins
const dbCase = {
  id: 'PSG-2024-0001',
  // Legacy flat columns
  deceased: 'Margaret Chen',
  family: 'The Chen Family',
  contact_name: 'Linda Chen',
  contact_phone: '(415) 555-0182',
  contact_email: 'linda@example.com',
  relationship: 'Daughter',
  dob: '1935-04-12',
  dop: '2024-03-15',
  location: 'UCSF Medical Center',
  time_of_death: null,
  wristband_id: null,
  removal_staff: null,
  removal_time: null,
  package_name: 'Comfort Package',
  package_price: 2400,
  addon_names: ['Memorial Jewelry'],
  status: 'pending',
  date: 'March 15, 2024',
  amount: 2550,
  amount_billed: null,
  case_date: null,
  crematorium_name: null,
  documents: [],
  deleted_at: null,
  // Joined relations (null/empty = legacy path)
  deceased_record: null,
  case_contacts: [],
  case_addons: [],
  case_documents: [],
  case_notes: [],
}

// Expected shape — falls back to legacy columns when joins are empty
const shapedCase = {
  id: 'PSG-2024-0001',
  deceased: 'Margaret Chen',
  family: 'The Chen Family',
  contactName: 'Linda Chen',
  contactPhone: '(415) 555-0182',
  contactEmail: 'linda@example.com',
  relationship: 'Daughter',
  dob: '1935-04-12',
  dop: '2024-03-15',
  location: 'UCSF Medical Center',
  timeOfDeath: null,
  wristbandId: null,
  package: 'Comfort Package',
  packagePrice: 2400,
  addons: ['Memorial Jewelry'],
  status: 'pending',
  date: 'March 15, 2024',
  amount: 2550,
  crematorium: null,
  removalStaff: null,
  removalTime: null,
  folderId: null,
  folderName: null,
  documents: [],
  notes: [],
}

describe('GET /api/cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.is.mockReturnThis()
    chain.order.mockResolvedValue({ data: [dbCase], error: null })
  })

  it('returns 200 with shaped cases array', async () => {
    const res = await request(app).get('/api/cases')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([shapedCase])
  })

  it('prefers normalized deceased_record over legacy deceased column', async () => {
    const normalized = {
      ...dbCase,
      deceased_record: { first_name: 'Jane', last_name: 'Doe', date_of_birth: '1940-01-01', date_of_passing: '2024-03-15', place_of_death: 'Home', time_of_death: null, wristband_id: null },
    }
    chain.order.mockResolvedValue({ data: [normalized], error: null })

    const res = await request(app).get('/api/cases')
    expect(res.status).toBe(200)
    expect(res.body[0].deceased).toBe('Jane Doe')
    expect(res.body[0].dob).toBe('1940-01-01')
    expect(res.body[0].location).toBe('Home')
  })

  it('prefers primary case_contact over legacy contact columns', async () => {
    const normalized = {
      ...dbCase,
      case_contacts: [{ name: 'Bob Smith', phone: '555-1234', email: 'bob@test.com', relationship: 'Son', is_primary: true }],
    }
    chain.order.mockResolvedValue({ data: [normalized], error: null })

    const res = await request(app).get('/api/cases')
    expect(res.body[0].contactName).toBe('Bob Smith')
    expect(res.body[0].family).toBe('Bob Smith')
  })

  it('returns 500 on DB error', async () => {
    chain.order.mockResolvedValue({ data: null, error: new Error('DB error') })
    const res = await request(app).get('/api/cases')
    expect(res.status).toBe(500)
  })
})

describe('GET /api/cases/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbCase, error: null })
  })

  it('returns 200 with shaped case when found', async () => {
    const res = await request(app).get('/api/cases/PSG-2024-0001')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedCase)
  })

  it('returns 404 when case not found', async () => {
    chain.single.mockResolvedValue({ data: null, error: null })
    const res = await request(app).get('/api/cases/PSG-0000-0000')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Case not found')
  })
})

describe('POST /api/cases', () => {
  const payload = {
    deceased: 'John Doe',
    family: 'The Doe Family',
    contact_name: 'Jane Doe',
    contact_phone: '555-0000',
    contact_email: 'jane@example.com',
    relationship: 'Spouse',
    package_name: 'Essential',
    package_price: 1200,
    amount: 1200,
    status: 'pending',
    date: 'March 20, 2024',
  }

  const fullCaseData = { ...dbCase, ...payload, case_notes: [], case_contacts: [], case_addons: [], case_documents: [], deceased_record: null }

  function setupPostMocks() {
    // 1. deceased insert
    const deceasedChain = makeChain()
    deceasedChain.insert.mockReturnThis()
    deceasedChain.select.mockReturnThis()
    deceasedChain.single.mockResolvedValue({ data: { id: 'deceased-uuid' }, error: null })

    // 2. cases insert
    const caseInsertChain = makeChain()
    caseInsertChain.insert.mockResolvedValue({ error: null })

    // 3. case_contacts insert
    const contactsChain = makeChain()
    contactsChain.insert.mockResolvedValue({ error: null })

    // 4. final cases fetch
    const caseFetchChain = makeChain()
    caseFetchChain.select.mockReturnThis()
    caseFetchChain.eq.mockReturnThis()
    caseFetchChain.single.mockResolvedValue({ data: fullCaseData, error: null })

    supabase.from
      .mockReturnValueOnce(deceasedChain)
      .mockReturnValueOnce(caseInsertChain)
      .mockReturnValueOnce(contactsChain)
      .mockReturnValueOnce(caseFetchChain)
  }

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/cases').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 201 with auto-generated PSG- ID', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    setupPostMocks()
    const res = await request(app).post('/api/cases').set(authHeader).send(payload)
    expect(res.status).toBe(201)
    expect(res.body.deceased).toBe('John Doe')
  })

  it('returns 500 when deceased insert fails', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const deceasedChain = makeChain()
    deceasedChain.insert.mockReturnThis()
    deceasedChain.select.mockReturnThis()
    deceasedChain.single.mockResolvedValue({ data: null, error: new Error('DB error') })
    supabase.from.mockReturnValueOnce(deceasedChain)

    const res = await request(app).post('/api/cases').set(authHeader).send(payload)
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/cases/:id/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.update.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: { ...dbCase, status: 'transit' }, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).patch('/api/cases/PSG-2024-0001/status').send({ status: 'transit' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid status', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .patch('/api/cases/PSG-2024-0001/status')
      .set(authHeader)
      .send({ status: 'transit' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('transit')
  })

  it('accepts cancelled as a valid status', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    chain.single.mockResolvedValue({ data: { ...dbCase, status: 'cancelled' }, error: null })
    const res = await request(app)
      .patch('/api/cases/PSG-2024-0001/status')
      .set(authHeader)
      .send({ status: 'cancelled' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
  })

  it('returns 400 with invalid status', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .patch('/api/cases/PSG-2024-0001/status')
      .set(authHeader)
      .send({ status: 'unknown' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/status must be one of/)
  })
})

describe('POST /api/cases/:id/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.insert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({
      data: { author: 'You', author_label: 'You', text: 'Test note', time: 'Mar 20, 12:00 PM' },
      error: null,
    })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).post('/api/cases/PSG-2024-0001/notes').send({ text: 'Hello' })
    expect(res.status).toBe(401)
  })

  it('returns 400 with empty text', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .post('/api/cases/PSG-2024-0001/notes')
      .set(authHeader)
      .send({ text: '   ' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('text is required')
  })

  it('returns 201 and uses author_label in response', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .post('/api/cases/PSG-2024-0001/notes')
      .set(authHeader)
      .send({ text: 'Test note', author: 'You' })
    expect(res.status).toBe(201)
    expect(res.body.text).toBe('Test note')
    expect(res.body.author).toBe('You')
  })
})

describe('GET /api/cases/:id/custody', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.order.mockResolvedValue({
      data: [
        { stage: 0, completed: true, staff_label: 'Dr. Jones', staff: null, timestamp: '2024-03-15T09:00:00Z' },
        { stage: 1, completed: false, staff_label: null, staff: null, timestamp: null },
      ],
      error: null,
    })
  })

  it('returns 200 with 9 stages', async () => {
    const res = await request(app).get('/api/cases/PSG-2024-0001/custody')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(9)
  })

  it('uses staff_label when available', async () => {
    const res = await request(app).get('/api/cases/PSG-2024-0001/custody')
    expect(res.body[0].completed).toBe(true)
    expect(res.body[0].staff).toBe('Dr. Jones')
  })

  it('fills missing stages with completed: false', async () => {
    const res = await request(app).get('/api/cases/PSG-2024-0001/custody')
    expect(res.body[5].completed).toBe(false)
    expect(res.body[5].staff).toBe(null)
  })
})

describe('PUT /api/cases/:id/custody/:stage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.upsert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({
      data: { stage: 2, completed: true, staff: 'Jane', staff_label: 'Jane', timestamp: '2024-03-15T10:00:00Z' },
      error: null,
    })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).put('/api/cases/PSG-2024-0001/custody/2').send({ completed: true })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid stage', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .put('/api/cases/PSG-2024-0001/custody/9')
      .set(authHeader)
      .send({ completed: true })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/stage must be 0/)
  })

  it('returns 200 and uses staff_label in response', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app)
      .put('/api/cases/PSG-2024-0001/custody/2')
      .set(authHeader)
      .send({ completed: true, staff: 'Jane' })
    expect(res.status).toBe(200)
    expect(res.body.completed).toBe(true)
    expect(res.body.staff).toBe('Jane')
  })
})
