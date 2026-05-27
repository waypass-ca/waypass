import { describe, it, expect } from 'vitest'
import { formatDistance, isOpenNow, normalizeDbRecord } from './crematoriumUtils.js'

// Build a Date for a specific day-of-week / hour / minute.
// Uses the week of 2024-01-07 (Sun) … 2024-01-13 (Sat).
// day: 0=Sun, 1=Mon, …, 6=Sat
function at(day, hour, minute = 0) {
  const d = new Date(2024, 0, 7 + day)
  d.setHours(hour, minute, 0, 0)
  return d
}

// ── formatDistance ────────────────────────────────────────────────────────────

describe('formatDistance', () => {
  it('formats distances under 1 km in metres', () => {
    expect(formatDistance(0.5)).toBe('500 m')
    expect(formatDistance(0.1)).toBe('100 m')
    expect(formatDistance(0.999)).toBe('999 m')
  })

  it('formats distances of exactly 1 km', () => {
    expect(formatDistance(1)).toBe('1.0 km')
  })

  it('formats distances above 1 km to one decimal', () => {
    expect(formatDistance(12.3456)).toBe('12.3 km')
    expect(formatDistance(100)).toBe('100.0 km')
  })

  it('rounds sub-km distances to nearest metre', () => {
    expect(formatDistance(0.0005)).toBe('1 m')
    expect(formatDistance(0.2554)).toBe('255 m')
  })
})

// ── isOpenNow ─────────────────────────────────────────────────────────────────

describe('isOpenNow', () => {
  it('returns null for null periods', () => {
    expect(isOpenNow(null)).toBeNull()
  })

  it('returns null for undefined periods', () => {
    expect(isOpenNow(undefined)).toBeNull()
  })

  it('returns null for empty periods array', () => {
    expect(isOpenNow([])).toBeNull()
  })

  it('returns true for 24/7 (period with no close)', () => {
    const periods = [{ open: { day: 0, time: '0000' } }]
    expect(isOpenNow(periods, at(1, 14))).toBe(true)
    expect(isOpenNow(periods, at(6, 23, 59))).toBe(true)
  })

  it('returns true when current time is within a same-day period', () => {
    // Monday 9am–5pm, checked at Monday 10am
    const periods = [{ open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } }]
    expect(isOpenNow(periods, at(1, 10))).toBe(true)
  })

  it('returns true at the exact open time', () => {
    const periods = [{ open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } }]
    expect(isOpenNow(periods, at(1, 9, 0))).toBe(true)
  })

  it('returns false at the exact close time', () => {
    const periods = [{ open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } }]
    expect(isOpenNow(periods, at(1, 17, 0))).toBe(false)
  })

  it('returns false before open time', () => {
    const periods = [{ open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } }]
    expect(isOpenNow(periods, at(1, 8, 59))).toBe(false)
  })

  it('returns false after close time', () => {
    const periods = [{ open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } }]
    expect(isOpenNow(periods, at(1, 17, 1))).toBe(false)
  })

  it('returns false on a different day with no matching period', () => {
    // Only Monday hours, checked on Wednesday
    const periods = [{ open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } }]
    expect(isOpenNow(periods, at(3, 12))).toBe(false)
  })

  it('returns true for midnight-spanning period: on open day after open time', () => {
    // Friday 9pm to Saturday 2am, checked Friday 10pm
    const periods = [{ open: { day: 5, time: '2100' }, close: { day: 6, time: '0200' } }]
    expect(isOpenNow(periods, at(5, 22))).toBe(true)
  })

  it('returns true for midnight-spanning period: on close day before close time', () => {
    // Friday 9pm to Saturday 2am, checked Saturday 1am
    const periods = [{ open: { day: 5, time: '2100' }, close: { day: 6, time: '0200' } }]
    expect(isOpenNow(periods, at(6, 1))).toBe(true)
  })

  it('returns false for midnight-spanning period: on close day after close time', () => {
    // Friday 9pm to Saturday 2am, checked Saturday 3am
    const periods = [{ open: { day: 5, time: '2100' }, close: { day: 6, time: '0200' } }]
    expect(isOpenNow(periods, at(6, 3))).toBe(false)
  })

  it('returns true when a later period matches', () => {
    const periods = [
      { open: { day: 1, time: '0900' }, close: { day: 1, time: '1200' } },
      { open: { day: 3, time: '0900' }, close: { day: 3, time: '1700' } },
    ]
    expect(isOpenNow(periods, at(3, 11))).toBe(true)
  })

  it('handles multiple days with correct day isolation', () => {
    const periods = [
      { open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } },
      { open: { day: 2, time: '0900' }, close: { day: 2, time: '1700' } },
    ]
    expect(isOpenNow(periods, at(1, 10))).toBe(true)
    expect(isOpenNow(periods, at(2, 10))).toBe(true)
    expect(isOpenNow(periods, at(3, 10))).toBe(false)
  })
})

// ── normalizeDbRecord ─────────────────────────────────────────────────────────

const baseRow = {
  id: 'uuid-001',
  google_place_id: 'ChIJabc123',
  name: 'Toronto Cremation Centre',
  address: '100 King St W, Toronto, ON M5X 1A9, Canada',
  city: 'Toronto',
  state: 'ON',
  zip: 'M5X 1A9',
  lat: 43.6481,
  lng: -79.3831,
  phone: '(416) 555-0200',
  website: 'https://tcc.example.ca',
  rating: 4.5,
  user_ratings_total: 73,
  opening_hours: {
    periods: [{ open: { day: 1, time: '0900' }, close: { day: 1, time: '1700' } }],
    weekday_text: ['Monday: 9:00 AM – 5:00 PM'],
  },
  is_passage_network: false,
  passage_tier: null,
  distance_miles: null,
}

describe('normalizeDbRecord', () => {
  it('maps core identity fields', () => {
    const out = normalizeDbRecord(baseRow)
    expect(out.id).toBe('uuid-001')
    expect(out.googlePlaceId).toBe('ChIJabc123')
    expect(out.name).toBe('Toronto Cremation Centre')
    expect(out.lat).toBe(43.6481)
    expect(out.lng).toBe(-79.3831)
  })

  it('uses address as location when present', () => {
    const out = normalizeDbRecord(baseRow)
    expect(out.location).toBe('100 King St W, Toronto, ON M5X 1A9, Canada')
    expect(out.streetAddress).toBe('100 King St W, Toronto, ON M5X 1A9, Canada')
  })

  it('falls back to city+state for location when address is null', () => {
    const out = normalizeDbRecord({ ...baseRow, address: null })
    expect(out.location).toBe('Toronto, ON')
  })

  it('returns empty string location when both address and city/state are null', () => {
    const out = normalizeDbRecord({ ...baseRow, address: null, city: null, state: null })
    expect(out.location).toBe('')
  })

  it('maps contact fields', () => {
    const out = normalizeDbRecord(baseRow)
    expect(out.phone).toBe('(416) 555-0200')
    expect(out.website).toBe('https://tcc.example.ca')
    expect(out.city).toBe('Toronto')
    expect(out.state).toBe('ON')
    expect(out.zip).toBe('M5X 1A9')
  })

  it('maps rating and userRatingCount', () => {
    const out = normalizeDbRecord(baseRow)
    expect(out.rating).toBe(4.5)
    expect(out.userRatingCount).toBe(73)
  })

  it('returns null rating and userRatingCount when absent', () => {
    const out = normalizeDbRecord({ ...baseRow, rating: null, user_ratings_total: null })
    expect(out.rating).toBeNull()
    expect(out.userRatingCount).toBeNull()
  })

  it('maps weekdayDescriptions from opening_hours.weekday_text', () => {
    const out = normalizeDbRecord(baseRow)
    expect(out.weekdayDescriptions).toEqual(['Monday: 9:00 AM – 5:00 PM'])
  })

  it('returns null weekdayDescriptions when opening_hours is null', () => {
    const out = normalizeDbRecord({ ...baseRow, opening_hours: null })
    expect(out.weekdayDescriptions).toBeNull()
  })

  it('returns null openNow when opening_hours is null', () => {
    const out = normalizeDbRecord({ ...baseRow, opening_hours: null })
    expect(out.openNow).toBeNull()
  })

  it('returns null openNow when periods array is empty', () => {
    const out = normalizeDbRecord({ ...baseRow, opening_hours: { periods: [], weekday_text: [] } })
    expect(out.openNow).toBeNull()
  })

  it('computes openNow as a boolean when periods are present', () => {
    const out = normalizeDbRecord(baseRow)
    expect(typeof out.openNow).toBe('boolean')
  })

  it('maps is_passage_network to onPassage', () => {
    expect(normalizeDbRecord({ ...baseRow, is_passage_network: true }).onPassage).toBe(true)
    expect(normalizeDbRecord({ ...baseRow, is_passage_network: false }).onPassage).toBe(false)
    expect(normalizeDbRecord({ ...baseRow, is_passage_network: null }).onPassage).toBe(false)
  })

  it('maps passage_tier', () => {
    expect(normalizeDbRecord({ ...baseRow, passage_tier: 'preferred' }).passageTier).toBe('preferred')
    expect(normalizeDbRecord({ ...baseRow, passage_tier: null }).passageTier).toBeNull()
  })

  it('formats distance from miles to km', () => {
    const out = normalizeDbRecord({ ...baseRow, distance_miles: 1 })
    expect(out.distance).toBe('1.6 km')
  })

  it('formats small distance in metres', () => {
    const out = normalizeDbRecord({ ...baseRow, distance_miles: 0.1 })
    // 0.1 miles * 1.60934 = 0.160934 km → 161 m
    expect(out.distance).toBe('161 m')
  })

  it('returns null distance when distance_miles is null', () => {
    const out = normalizeDbRecord({ ...baseRow, distance_miles: null })
    expect(out.distance).toBeNull()
  })

  it('returns empty photos array always', () => {
    expect(normalizeDbRecord(baseRow).photos).toEqual([])
  })

  it('returns fixed non-nullable fields', () => {
    const out = normalizeDbRecord(baseRow)
    expect(out.primaryType).toBeNull()
    expect(out.status).toBe('active')
    expect(out.contactName).toBeNull()
  })
})
