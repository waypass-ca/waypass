import { useCallback, useEffect, useState } from 'react'
import { CommandPalette } from './CommandPalette.jsx'
import { CommandPaletteContext } from './commandPaletteContext.js'

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openPalette = useCallback(() => setOpen(true), [])
  const closePalette = useCallback(() => setOpen(false), [])
  const togglePalette = useCallback(() => setOpen(v => !v), [])

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        togglePalette()
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isTypingTarget(e.target)) return
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [togglePalette])

  return (
    <CommandPaletteContext.Provider value={{ open, openPalette, closePalette }}>
      {children}
      <CommandPalette open={open} onClose={closePalette} />
    </CommandPaletteContext.Provider>
  )
}
