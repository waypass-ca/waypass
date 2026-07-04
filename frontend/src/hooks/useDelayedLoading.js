import { useState, useEffect } from 'react'

export function useDelayedLoading(isLoading, delay = 250) {
  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset skeleton immediately when loading ends
      setShowSkeleton(false)
      return
    }
    const timer = setTimeout(() => setShowSkeleton(true), delay)
    return () => clearTimeout(timer)
  }, [isLoading, delay])

  return showSkeleton
}
