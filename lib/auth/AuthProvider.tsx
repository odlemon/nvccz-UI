"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { checkAuthStatus } from '@/lib/store/slices/authSlice'
import { PORTAL_ID } from '@/lib/portal/config'

interface AuthProviderProps {
  children: React.ReactNode
}

const AUTH_BOOT_TIMEOUT_MS = 10000

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const { isLoading } = useAppSelector((state) => state.auth)
  const [bootTimedOut, setBootTimedOut] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated on app load
    dispatch(checkAuthStatus())
  }, [dispatch])

  useEffect(() => {
    const timer = setTimeout(() => setBootTimedOut(true), AUTH_BOOT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  // Only block the app on initial session resolution — not on background profile refresh
  const waitingForSession = isLoading && !bootTimedOut

  const isPublicDesignPreview =
    PORTAL_ID === 'staff' &&
    (pathname === '/home' ||
      (pathname?.startsWith('/home/') ?? false) ||
      pathname === '/portfolio-v11' ||
      (pathname?.startsWith('/portfolio-v11/') ?? false) ||
      pathname === '/payroll-v6' ||
      (pathname?.startsWith('/payroll-v6/') ?? false) ||
      pathname === '/performance-v22' ||
      (pathname?.startsWith('/performance-v22/') ?? false) ||
      pathname === '/fundraising-kyc' ||
      (pathname?.startsWith('/fundraising-kyc/') ?? false) ||
      pathname === '/investee-portal-v8' ||
      (pathname?.startsWith('/investee-portal-v8/') ?? false) ||
      pathname === '/funding-application' ||
      (pathname?.startsWith('/funding-application/') ?? false) ||
      pathname === '/applications/form' ||
      (pathname?.startsWith('/applications/form/') ?? false))

  const skipAuthBoot = pathname === '/login' || isPublicDesignPreview

  // Show loading state while checking authentication, but not on login page
  if (waitingForSession && !skipAuthBoot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
