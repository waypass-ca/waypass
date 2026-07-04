import cloudinary from './cloudinary.js'

async function resolveSourceUrl(domain) {
  const clearbitUrl = `https://logo.clearbit.com/${domain}`
  try {
    const res = await fetch(clearbitUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
    if (res.ok) return clearbitUrl
  } catch { /* fall through */ }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

export async function fetchAndStoreLogo(websiteUrl, { folder = 'crematorium-logos' } = {}) {
  try {
    const normalised = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`
    const domain = new URL(normalised).hostname.replace(/^www\./, '')
    const sourceUrl = await resolveSourceUrl(domain)
    const imgRes = await fetch(sourceUrl, { signal: AbortSignal.timeout(5000) })
    if (!imgRes.ok) return null
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${buffer.toString('base64')}`,
      { folder, public_id: domain, overwrite: true },
    )
    return result.secure_url
  } catch {
    return null
  }
}
