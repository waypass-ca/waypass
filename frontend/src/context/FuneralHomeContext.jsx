/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useUser } from './UserContext.jsx'
import { fetchFuneralHome } from '../lib/api.js'

const FuneralHomeContext = createContext(null)

export function FuneralHomeProvider({ children }) {
  const { profile } = useUser()
  const funeralHomeId = profile?.funeralHomeId ?? null
  const [funeralHome, setFuneralHome] = useState(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!funeralHomeId) return null
    setLoading(true)
    try {
      const data = await fetchFuneralHome()
      setFuneralHome(data)
      return data
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [funeralHomeId])

  useEffect(() => {
    if (!funeralHomeId) {
      setFuneralHome(null)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchFuneralHome()
      .then(data => setFuneralHome(data))
      .catch(() => setFuneralHome(null))
      .finally(() => setLoading(false))
  }, [funeralHomeId])

  return (
    <FuneralHomeContext.Provider value={{ funeralHome, loading, refresh, setFuneralHome }}>
      {children}
    </FuneralHomeContext.Provider>
  )
}

export function useFuneralHome() {
  const ctx = useContext(FuneralHomeContext)
  if (!ctx) throw new Error('useFuneralHome must be used within FuneralHomeProvider')
  return ctx
}
