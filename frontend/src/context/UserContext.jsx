import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { fetchCurrentUser } from '../lib/api.js'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchCurrentUser()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [session])

  const isAdmin = profile?.role === 'admin'
  const canWrite = profile?.role !== 'read_only'

  return (
    <UserContext.Provider value={{ profile, loading, isAdmin, canWrite, setProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
