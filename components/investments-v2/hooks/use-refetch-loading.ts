'use client'

import { useCallback, useState } from 'react'

/** Tracks in-flight refetches triggered by filter changes (distinct from initial page load). */
export function useRefetchLoading() {
  const [isRefetching, setIsRefetching] = useState(false)

  const withRefetch = useCallback(async (fn: () => Promise<void>) => {
    setIsRefetching(true)
    try {
      await fn()
    } finally {
      setIsRefetching(false)
    }
  }, [])

  return { isRefetching, withRefetch }
}
