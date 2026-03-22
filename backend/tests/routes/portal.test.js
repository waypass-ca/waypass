import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { makeSupabaseMock, authedUser, badToken, authHeader } from '../setup.js'

const { supabase, chain } = makeSupabaseMock()
vi.mock('../../lib/supabase.js', () => ({ supabase }))

const { default: app } = await import('../../server.js')

const dbSettings = {
  id: 'default',
  funeral_home_name: 'Evergreen Memorial',
  tagline: 'Compassionate care',
  logo_url: 'https://res.cloudinary.com/example/logo.png',
  primary_color: '#6B8F71',
  accent_color: '#C4965A',
  background_color: '#F7F3EE',
  card_color: '#FDFAF7',
  text_color: '#1C1C1E',
  font_style: 'serif',
  section_progress_tracker: true,
  section_deceased_details: true,
  section_coordinator: true,
  section_documents: false,
  section_personal_message: true,
  personal_message: 'We are here for you.',
  updated_at: '2024-03-15T00:00:00Z',
}

const shapedSettings = {
  funeralHomeName: 'Evergreen Memorial',
  tagline: 'Compassionate care',
  logoUrl: 'https://res.cloudinary.com/example/logo.png',
  primaryColor: '#6B8F71',
  accentColor: '#C4965A',
  backgroundColor: '#F7F3EE',
  cardColor: '#FDFAF7',
  textColor: '#1C1C1E',
  fontStyle: 'serif',
  sections: {
    progressTracker: true,
    deceasedDetails: true,
    coordinator: true,
    documents: false,
    personalMessage: true,
  },
  personalMessage: 'We are here for you.',
}

describe('GET /api/portal-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
  })

  it('returns 200 with shaped settings when row exists', async () => {
    chain.maybeSingle.mockResolvedValue({ data: dbSettings, error: null })

    const res = await request(app).get('/api/portal-settings')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(shapedSettings)
  })

  it('returns 200 with defaults when no row exists', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })

    const res = await request(app).get('/api/portal-settings')
    expect(res.status).toBe(200)
    // Defaults should always be present
    expect(res.body.primaryColor).toBe('#6B8F71')
    expect(res.body.fontStyle).toBe('serif')
    expect(res.body.sections).toBeDefined()
  })
})

describe('PUT /api/portal-settings', () => {
  const payload = {
    funeralHomeName: 'Bay Area Memorial',
    tagline: 'With dignity',
    logoUrl: '',
    primaryColor: '#334455',
    accentColor: '#C4965A',
    backgroundColor: '#F7F3EE',
    cardColor: '#FDFAF7',
    textColor: '#1C1C1E',
    fontStyle: 'sans',
    sections: {
      progressTracker: true,
      deceasedDetails: false,
      coordinator: true,
      documents: true,
      personalMessage: false,
    },
    personalMessage: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    chain.upsert.mockReturnThis()
    chain.select.mockReturnThis()
    chain.single.mockResolvedValue({ data: dbSettings, error: null })
  })

  it('returns 401 without auth', async () => {
    supabase.auth.getUser.mockResolvedValue(badToken)
    const res = await request(app).put('/api/portal-settings').send(payload)
    expect(res.status).toBe(401)
  })

  it('returns 200 with saved settings', async () => {
    supabase.auth.getUser.mockResolvedValue(authedUser)
    const res = await request(app).put('/api/portal-settings').set(authHeader).send(payload)
    expect(res.status).toBe(200)
    expect(res.body.funeralHomeName).toBeDefined()
  })
})
