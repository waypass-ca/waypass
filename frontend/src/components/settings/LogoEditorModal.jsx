import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/Button'

const MIN_CROP_PX = 20
const HANDLES = ['nw', 'ne', 'sw', 'se']

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

export function LogoEditorModal({ source, onApply, onCancel }) {
  const containerRef = useRef(null)
  const [imageSrc, setImageSrc] = useState(null)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [displayed, setDisplayed] = useState({ w: 0, h: 0 })
  const [crop, setCrop] = useState(null)
  const [drag, setDrag] = useState(null)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const src = source instanceof File ? await fileToDataUrl(source) : source
        if (cancelled) return
        setImageSrc(src)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    init()
    return () => { cancelled = true }
  }, [source])

  function handleImgLoad(e) {
    const img = e.currentTarget
    const naturalDims = { w: img.naturalWidth, h: img.naturalHeight }
    const rect = img.getBoundingClientRect()
    const displayedDims = { w: rect.width, h: rect.height }
    setNatural(naturalDims)
    setDisplayed(displayedDims)
    const inset = Math.min(displayedDims.w, displayedDims.h) * 0.08
    setCrop({
      x: inset,
      y: inset,
      w: displayedDims.w - inset * 2,
      h: displayedDims.h - inset * 2,
    })
  }

  function startDrag(e, mode, corner) {
    e.preventDefault()
    e.stopPropagation()
    setDrag({
      mode,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    })
  }

  useEffect(() => {
    if (!drag) return
    function onMove(e) {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      const c = drag.startCrop

      if (drag.mode === 'move') {
        const x = clamp(c.x + dx, 0, displayed.w - c.w)
        const y = clamp(c.y + dy, 0, displayed.h - c.h)
        setCrop({ ...c, x, y })
        return
      }

      // resize
      let x = c.x, y = c.y, w = c.w, h = c.h
      if (drag.corner === 'nw') {
        const nx = clamp(c.x + dx, 0, c.x + c.w - MIN_CROP_PX)
        const ny = clamp(c.y + dy, 0, c.y + c.h - MIN_CROP_PX)
        x = nx; y = ny
        w = c.w + (c.x - nx); h = c.h + (c.y - ny)
      } else if (drag.corner === 'ne') {
        const nw = clamp(c.w + dx, MIN_CROP_PX, displayed.w - c.x)
        const ny = clamp(c.y + dy, 0, c.y + c.h - MIN_CROP_PX)
        y = ny; w = nw; h = c.h + (c.y - ny)
      } else if (drag.corner === 'sw') {
        const nx = clamp(c.x + dx, 0, c.x + c.w - MIN_CROP_PX)
        const nh = clamp(c.h + dy, MIN_CROP_PX, displayed.h - c.y)
        x = nx; w = c.w + (c.x - nx); h = nh
      } else if (drag.corner === 'se') {
        const nw = clamp(c.w + dx, MIN_CROP_PX, displayed.w - c.x)
        const nh = clamp(c.h + dy, MIN_CROP_PX, displayed.h - c.y)
        w = nw; h = nh
      }
      setCrop({ x, y, w, h })
    }
    function onUp() { setDrag(null) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, displayed])

  async function handleApply() {
    if (!crop || !imageSrc) return
    setApplying(true)
    setError(null)
    try {
      const img = await loadImage(imageSrc)
      const scaleX = natural.w / displayed.w
      const scaleY = natural.h / displayed.h
      const sx = Math.max(0, Math.round(crop.x * scaleX))
      const sy = Math.max(0, Math.round(crop.y * scaleY))
      const sw = Math.max(1, Math.round(crop.w * scaleX))
      const sh = Math.max(1, Math.round(crop.h * scaleY))

      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not encode image')), 'image/png')
      })
      const file = new File([blob], 'logo.png', { type: 'image/png' })
      await onApply(file)
    } catch (err) {
      setError(err.message ?? 'Failed to crop logo')
      setApplying(false)
    }
  }

  const cropStyle = crop
    ? { left: crop.x, top: crop.y, width: crop.w, height: crop.h }
    : { display: 'none' }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
      onClick={applying ? undefined : onCancel}
    >
      <div
        className="bg-white rounded-2xl border border-line shadow-2xl w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <span className="font-sans text-[14px] font-semibold text-ink">Crop logo</span>
          <button
            onClick={onCancel}
            disabled={applying}
            className="w-7 h-7 rounded-lg hover:bg-canvas flex items-center justify-center text-muted cursor-pointer transition-colors disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5">
          <div
            ref={containerRef}
            className="relative bg-white rounded-xl overflow-hidden select-none flex items-center justify-center border border-line"
            style={{ minHeight: 240 }}
          >
            {imageSrc && (
              <div className="relative inline-block">
                <img
                  src={imageSrc}
                  alt="Logo"
                  onLoad={handleImgLoad}
                  draggable={false}
                  className="block max-w-[460px] max-h-[320px] w-auto h-auto"
                  style={{ userSelect: 'none' }}
                />
                {crop && (
                  <>
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        inset: 0,
                        boxShadow: `0 0 0 9999px rgba(28,28,30,0.5) inset`,
                        clipPath: `polygon(
                          0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                          ${crop.x}px ${crop.y}px,
                          ${crop.x}px ${crop.y + crop.h}px,
                          ${crop.x + crop.w}px ${crop.y + crop.h}px,
                          ${crop.x + crop.w}px ${crop.y}px,
                          ${crop.x}px ${crop.y}px
                        )`,
                      }}
                    />
                    <div
                      onPointerDown={e => startDrag(e, 'move')}
                      className="absolute border-2 border-white cursor-move"
                      style={{ ...cropStyle, boxShadow: '0 0 0 1px rgba(0,0,0,0.4)' }}
                    >
                      {HANDLES.map(corner => (
                        <div
                          key={corner}
                          onPointerDown={e => startDrag(e, 'resize', corner)}
                          className="absolute w-3 h-3 bg-white border border-ink rounded-sm"
                          style={{
                            left: corner.includes('w') ? -6 : 'auto',
                            right: corner.includes('e') ? -6 : 'auto',
                            top: corner.includes('n') ? -6 : 'auto',
                            bottom: corner.includes('s') ? -6 : 'auto',
                            cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="font-sans text-[11px] text-muted mt-2">
            Drag the box to reposition. Drag a corner to resize.
          </p>

          {error && <p className="font-sans text-xs text-danger mt-2">{error}</p>}
        </div>

        <div className="px-5 pb-5 pt-1 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={applying}>Cancel</Button>
          <Button variant="primary" onClick={handleApply} disabled={applying || !crop}>
            {applying ? 'Saving…' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  )
}
