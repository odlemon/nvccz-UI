"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { checkAuthStatus } from '@/lib/store/slices/authSlice'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const { isLoading, isFetchingDetails } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Check if user is already authenticated on app load
    dispatch(checkAuthStatus())
  }, [dispatch])

  const waitingForSession = isLoading || isFetchingDetails

  // Show loading state while checking authentication, but not on login page
  if (waitingForSession && pathname !== '/login') {
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
