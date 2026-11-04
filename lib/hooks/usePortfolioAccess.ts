'use client'

import { useCallback, useEffect, useState } from 'react'
import { rolesApi, type PortfolioEffectiveAccess } from '@/lib/api/roles-api'

/** Server-authoritative Portfolio access. It deliberately has no privileged fixture fallback. */
export function usePortfolioAccess(isAuthenticated = true) {
  const [access, setAccess] = useState<PortfolioEffectiveAccess | null>(null)
  const [loading, setLoading] = useState(isAuthenticated)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setAccess(null); setLoading(false); return }
    setLoading(true)
    try {
      const response = await rolesApi.getPortfolioEffective()
      if (!response?.success || !response.data) throw new Error(response?.message || 'Portfolio access is unavailable')
      setAccess(response.data)
      setError(null)
    } catch (err: any) {
      setAccess(null)
      setError(err?.message || 'Portfolio access is unavailable')
    } finally { setLoading(false) }
  }, [isAuthenticated])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    if (!isAuthenticated) return
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(onFocus, 30000)
    return () => { window.removeEventListener('focus', onFocus); window.clearInterval(timer) }
  }, [isAuthenticated, refresh])
  return { access, loading, error, refresh }
}
