import { safeJsonStringify } from '@/lib/utils/safe-json'

// Cookie utility functions
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const trimmed = cookie.trim()
    if (trimmed.startsWith(`${name}=`)) {
      return trimmed.slice(name.length + 1)
    }
  }
  return null
}

export const setCookie = (
  name: string, 
  value: string, 
  options: {
    maxAge?: number
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    path?: string
  } = {}
): void => {
  if (typeof document === 'undefined') {
    return
  }

  const {
    maxAge = 7 * 24 * 60 * 60, // 7 days default
    secure = window.location.protocol === 'https:',
    sameSite = 'lax',
    path = '/'
  } = options

  let cookieString = `${name}=${value}; path=${path}; max-age=${maxAge}; samesite=${sameSite}`
  
  if (secure) {
    cookieString += '; secure'
  }

  document.cookie = cookieString
}

export const deleteCookie = (name: string, path: string = '/'): void => {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export const getAuthToken = (): string | null => {
  const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token'
  const fromCookie = getCookie(tokenKey)
  if (fromCookie) return fromCookie
  if (typeof window !== 'undefined') {
    try {
      const fromLs = window.localStorage.getItem(tokenKey) || window.localStorage.getItem('token')
      if (fromLs) return fromLs
    } catch {
      /* ignore */
    }
  }
  return null
}

export const getAuthUser = (): any | null => {
  const userKey = process.env.NEXT_PUBLIC_AUTH_USER_KEY || 'user'
  const userCookie = getCookie(userKey)
  
  if (userCookie) {
    try {
      return JSON.parse(decodeURIComponent(userCookie))
    } catch (error) {
      console.error('Failed to parse user cookie:', error)
      return null
    }
  }
  
  return null
}

export interface CookieOptions {
  maxAge?: number
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

// Store user profile (full details with role and permissions)
export const setUserProfile = (profile: any): void => {
  const profileKey = process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile'
  const maxAge = parseInt(process.env.NEXT_PUBLIC_AUTH_COOKIE_MAX_AGE || '604800') // 7 days
  setCookie(profileKey, encodeURIComponent(safeJsonStringify(profile)), { maxAge })
}

// Get user profile
export const getUserProfile = (): any | null => {
  if (typeof document === 'undefined') return null
  
  const profileKey = process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile'
  const profile = getCookie(profileKey)
  
  if (profile) {
    try {
      return JSON.parse(decodeURIComponent(profile))
    } catch {
      return null
    }
  }
  
  return null
}

// Clear user profile
export const clearUserProfile = (): void => {
  const profileKey = process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile'
  deleteCookie(profileKey)
}

// Update clearAuthCookies to include profile
export const clearAuthCookies = (): void => {
  const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token'
  const userKey = process.env.NEXT_PUBLIC_AUTH_USER_KEY || 'user'
  const profileKey = process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile'
  
  deleteCookie(tokenKey)
  deleteCookie(userKey)
  deleteCookie(profileKey)
}
