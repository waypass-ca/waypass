const NEAR_WHITE = 235
const NEAR_BLACK = 25
const MIN_ALPHA = 200
const CANVAS_SIZE = 40

function hex(n) {
  return n.toString(16).padStart(2, '0')
}

export async function extractDominantColor(url) {
  if (typeof document === 'undefined') return null
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = CANVAS_SIZE
        canvas.height = CANVAS_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
        const { data } = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
        const counts = new Map()
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
          if (a < MIN_ALPHA) continue
          if (r > NEAR_WHITE && g > NEAR_WHITE && b > NEAR_WHITE) continue
          if (r < NEAR_BLACK && g < NEAR_BLACK && b < NEAR_BLACK) continue
          const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
          const entry = counts.get(key)
          if (entry) { entry.count++; entry.r += r; entry.g += g; entry.b += b }
          else counts.set(key, { count: 1, r, g, b })
        }
        if (counts.size === 0) return resolve(null)
        let best = null
        for (const entry of counts.values()) {
          if (!best || entry.count > best.count) best = entry
        }
        const r = Math.round(best.r / best.count)
        const g = Math.round(best.g / best.count)
        const b = Math.round(best.b / best.count)
        resolve(`#${hex(r)}${hex(g)}${hex(b)}`)
      } catch {
        resolve(null)
      }
    }
    img.src = url
  })
}
