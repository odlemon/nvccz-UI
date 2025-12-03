import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get(process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token')
  const userProfile = request.cookies.get(process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile')
  
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/applications/form']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If accessing public route and authenticated, redirect to appropriate dashboard
  if (isPublicRoute && token && userProfile) {
    try {
      const profile = JSON.parse(decodeURIComponent(userProfile.value))
      const roleName = profile.role?.name?.toLowerCase()
      
      // Redirect applicants to their portal, everyone else to admin
      if (roleName === 'applicant') {
        return NextResponse.redirect(new URL('/application-portal', request.url))
      }
      
      return NextResponse.redirect(new URL('/admin', request.url))
    } catch (error) {
      console.error('Error parsing user profile:', error)
    }
  }

  // If accessing protected route without auth, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  if (!isPublicRoute && token && userProfile) {
    try {
      const profile = JSON.parse(decodeURIComponent(userProfile.value))
      const roleName = profile.role?.name?.toLowerCase()

      // Applicants can only access application portal
      if (roleName === 'applicant') {
        const applicantAllowedRoutes = ['/application-portal', '/profile', '/settings', '/help', '/notifications']
        const hasAccess = applicantAllowedRoutes.some(route => pathname.startsWith(route))
        
        if (!hasAccess) {
          return NextResponse.redirect(new URL('/application-portal', request.url))
        }
      }

      // All other users (admin, investment_manager, etc.) have full access
      // No restrictions for non-applicant roles
    } catch (error) {
      console.error('Error checking route access:', error)
      // If there's an error parsing profile, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
