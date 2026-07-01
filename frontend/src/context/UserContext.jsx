/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { fetchCurrentUser } from '../lib/api.js'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileError(false)
      setLoading(false)
      return
    }
    // Reset error and start loading before the async fetch so the render
    // that fires between onAuthStateChange and this effect doesn't flash
    // the "not set up" screen.
    setProfileError(false)
    setLoading(true)
    fetchCurrentUser()
      .then(data => { setProfile(data); setProfileError(false) })
      .catch(() => { setProfile(null); setProfileError(true) })
      .finally(() => setLoading(false))
  }, [session])

  const isAdmin = profile?.role === 'admin'
  const canWrite = profile?.role !== 'read_only'

  return (
    <UserContext.Provider value={{ profile, loading, profileError, isAdmin, canWrite, setProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
