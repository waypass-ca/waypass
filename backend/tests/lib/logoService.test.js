import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/cloudinary.js', () => ({
  default: {
    uploader: { upload: vi.fn() },
  },
}))

const { default: cloudinary } = await import('../../lib/cloudinary.js')
const { fetchAndStoreLogo } = await import('../../lib/logoService.js')

const LOGO_URL = 'https://res.cloudinary.com/dv7iv29qj/image/upload/crematorium-logos/example.com.png'
const BUFFER = new ArrayBuffer(8)

function okImageFetch() {
  return { ok: true, arrayBuffer: () => Promise.resolve(BUFFER) }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

// ── Clearbit path ─────────────────────────────────────────────────────────────

describe('fetchAndStoreLogo — Clearbit path', () => {
  it('returns Cloudinary URL when Clearbit HEAD succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })           // Clearbit HEAD
      .mockResolvedValueOnce(okImageFetch()),         // image download
    )
    cloudinary.uploader.upload.mockResolvedValue({ secure_url: LOGO_URL })

    const result = await fetchAndStoreLogo('https://example.com')

    expect(result).toBe(LOGO_URL)
  })

  it('sends HEAD to Clearbit with the extracted domain', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce(okImageFetch()),
    )
    cloudinary.uploader.upload.mockResolvedValue({ secure_url: LOGO_URL })

    await fetchAndStoreLogo('https://example.com')

    expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(
      1,
      'https://logo.clearbit.com/example.com',
      expect.objectContaining({ method: 'HEAD' }),
    )
  })

  it('uploads to Cloudinary with correct folder and public_id', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce(okImageFetch()),
    )
    cloudinary.uploader.upload.mockResolvedValue({ secure_url: LOGO_URL })

    await fetchAndStoreLogo('https://example.com')

    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
      expect.stringContaining('base64'),
      expect.objectContaining({ folder: 'crematorium-logos', public_id: 'example.com', overwrite: true }),
    )
  })
})

// ── Google Favicon fallback ───────────────────────────────────────────────────

describe('fetchAndStoreLogo — Google Favicon fallback', () => {
  it('falls back to Google Favicon when Clearbit HEAD returns non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false })           // Clearbit fails
      .mockResolvedValueOnce(okImageFetch()),
    )
    cloudinary.uploader.upload.mockResolvedValue({ secure_url: LOGO_URL })

    await fetchAndStoreLogo('https://example.com')

    const [[, ], [secondUrl]] = vi.mocked(fetch).mock.calls
    expect(secondUrl).toContain('google.com/s2/favicons')
    expect(secondUrl).toContain('domain=example.com')
  })

  it('falls back to Google Favicon when Clearbit HEAD throws', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockRejectedValueOnce(new Error('network error'))  // Clearbit throws
      .mockResolvedValueOnce(okImageFetch()),
    )
    cloudinary.uploader.upload.mockResolvedValue({ secure_url: LOGO_URL })

    const result = await fetchAndStoreLogo('https://example.com')

    expect(result).toBe(LOGO_URL)
  })
})

// ── Domain normalisation ──────────────────────────────────────────────────────

describe('fetchAndStoreLogo — domain normalisation', () => {
  it('strips www. from domain', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce(okImageFetch()),
    )
    cloudinary.uploader.upload.mockResolvedValue({ secure_url: LOGO_URL })

    await fetchAndStoreLogo('https://www.example.com')

    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ public_id: 'example.com' }),
    )
  })

  it('normalises URLs without a protocol prefix', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce(okImageFetch()),
    )
    cloudinary.uploader.upload.mockResolvedValue({ secure_url: LOGO_URL })

    const result = await fetchAndStoreLogo('example.com')
    expect(result).toBe(LOGO_URL)
  })
})

// ── Failure cases ─────────────────────────────────────────────────────────────

describe('fetchAndStoreLogo — failure cases', () => {
  it('returns null when image download is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })    // Clearbit HEAD ok
      .mockResolvedValueOnce({ ok: false }),   // image download fails
    )

    const result = await fetchAndStoreLogo('https://example.com')

    expect(result).toBeNull()
    expect(cloudinary.uploader.upload).not.toHaveBeenCalled()
  })

  it('returns null when Cloudinary upload throws', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce(okImageFetch()),
    )
    cloudinary.uploader.upload.mockRejectedValue(new Error('upload failed'))

    const result = await fetchAndStoreLogo('https://example.com')
    expect(result).toBeNull()
  })

  it('returns null for an unparseable URL', async () => {
    const result = await fetchAndStoreLogo('')
    expect(result).toBeNull()
  })
})
