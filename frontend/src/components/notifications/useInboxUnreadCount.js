import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { fetchInboxUnreadCount } from '../../lib/api.js'

/**
 * Live count of the current user's unread, non-archived inbox items.
 * Fetches once on mount, then watches inbox_items realtime events to
 * recompute without round-tripping the server on every change.
 */
export function useInboxUnreadCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function refresh() {
      try {
        const { count } = await fetchInboxUnreadCount()
        if (!cancelled) setCount(count ?? 0)
      } catch (err) {
        console.error('inbox unread-count failed:', err.message)
      }
    }

    refresh()

    const channel = supabase
      .channel(`inbox-unread-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'inbox_items',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (!payload.new.read && !payload.new.archived_at) {
          setCount(c => c + 1)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'inbox_items',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        // Read/archive transitions are messy to track from the delta alone
        // (we'd need the old row). Cheap re-fetch keeps the badge honest.
        refresh()
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'inbox_items',
        filter: `user_id=eq.${user.id}`,
      }, refresh)
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [user])

  return count
}
