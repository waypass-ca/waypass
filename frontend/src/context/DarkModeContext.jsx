import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext()

function resolveIsDark(mode) {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function DarkModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    const stored = localStorage.getItem('passage-theme')
    const m = stored ?? 'system'
    document.documentElement.classList.toggle('dark', resolveIsDark(m))
    return m
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolveIsDark(mode))
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => document.documentElement.classList.toggle('dark', mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  const setMode = (m) => {
    localStorage.setItem('passage-theme', m)
    setModeState(m)
  }

  return (
    <Ctx.Provider value={{ mode, setMode, isDark: resolveIsDark(mode) }}>
      {children}
    </Ctx.Provider>
  )
}

export const useDarkMode = () => useContext(Ctx)
