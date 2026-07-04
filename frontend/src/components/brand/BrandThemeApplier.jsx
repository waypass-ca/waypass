import { useEffect } from 'react'
import { useFuneralHome } from '../../context/FuneralHomeContext.jsx'

function parseHex(hex) {
  if (typeof hex !== 'string') return null
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function toHex({ r, g, b }) {
  const h = v => v.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function tint(hex, ratio = 0.12) {
  const c = parseHex(hex)
  if (!c) return null
  return toHex({
    r: Math.round(c.r * ratio + 255 * (1 - ratio)),
    g: Math.round(c.g * ratio + 255 * (1 - ratio)),
    b: Math.round(c.b * ratio + 255 * (1 - ratio)),
  })
}

function contrastFor(hex) {
  const c = parseHex(hex)
  if (!c) return null
  const [r, g, b] = [c.r, c.g, c.b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return L > 0.55 ? '#1C1C1E' : '#FFFFFF'
}

export function BrandThemeApplier() {
  const { funeralHome } = useFuneralHome()
  const accent = funeralHome?.accentColor ?? null

  useEffect(() => {
    const root = document.documentElement
    if (!accent) {
      root.style.removeProperty('--color-primary')
      root.style.removeProperty('--color-primary-light')
      root.style.removeProperty('--color-primary-contrast')
      return
    }
    root.style.setProperty('--color-primary', accent)
    const light = tint(accent)
    if (light) root.style.setProperty('--color-primary-light', light)
    const contrast = contrastFor(accent)
    if (contrast) root.style.setProperty('--color-primary-contrast', contrast)
    return () => {
      root.style.removeProperty('--color-primary')
      root.style.removeProperty('--color-primary-light')
      root.style.removeProperty('--color-primary-contrast')
    }
  }, [accent])

  return null
}
