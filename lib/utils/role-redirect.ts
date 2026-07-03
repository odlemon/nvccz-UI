import { UserDetails } from '@/lib/api/auth-api'

export interface RedirectConfig {
  path: string
  shouldRedirect: boolean
}

export const getRoleBasedRedirect = (
  userDetails: UserDetails | null,
  isApplicant: boolean
): RedirectConfig => {
  // Default redirect for unauthenticated users
  if (!userDetails) {
    return {
      path: '/login',
      shouldRedirect: true
    }
  }

  const roleName = userDetails.role.name.toLowerCase()

  // Role-based redirect mapping
  const roleRedirects: Record<string, string> = {
    'applicant': '/application-portal',
    'limited_partner': '/lp-portal',
    'admin': '/',
    'investment_manager': '/',
    'board_member': '/',
    'analyst': '/',
    'finance': '/',
    'compliance': '/',
    'default': '/'
  }

  // Check if user is applicant (either from isApplicant flag or role name)
  if (isApplicant || roleName === 'applicant') {
    return {
      path: roleRedirects['applicant'],
      shouldRedirect: true
    }
  }

  // Get redirect path based on role, fallback to default
  const redirectPath = roleRedirects[roleName] || roleRedirects['default']

  return {
    path: redirectPath,
    shouldRedirect: true
  }
}

export const canAccessRoute = (
  userDetails: UserDetails | null,
  requestedPath: string
): boolean => {
  if (!userDetails) {
    return false
  }

  const roleName = userDetails.role.name.toLowerCase()

  // Define route access patterns for each role
  const roleRouteAccess: Record<string, string[]> = {
    'applicant': [
      '/application-portal',
      '/profile',
      '/settings'
    ],
    'admin': [
      '/admin',
      '/users',
      '/roles',
      '/settings',
      '/applications',
      '/investments',
      '/portfolio',
      '/reports'
    ],
    'investment_manager': [
      '/investments',
      '/applications',
      '/portfolio',
      '/due-diligence',
      '/board-review',
      '/term-sheets',
      '/reports',
      '/profile',
      '/settings'
    ],
    'board_member': [
      '/board',
      '/applications',
      '/portfolio',
      '/reports',
      '/profile',
      '/settings'
    ],
    'analyst': [
      '/analytics',
      '/applications',
      '/portfolio',
      '/reports',
      '/profile',
      '/settings'
    ],
    'finance': [
      '/finance',
      '/investments',
      '/portfolio',
      '/reports',
      '/profile',
      '/settings'
    ],
    'compliance': [
      '/compliance',
      '/applications',
      '/portfolio',
      '/reports',
      '/profile',
      '/settings'
    ]
  }

  // Get allowed routes for user's role
  const allowedRoutes = roleRouteAccess[roleName] || []

  // Public routes accessible to all authenticated users
  const publicRoutes = ['/profile', '/settings', '/help', '/notifications']

  // Check if requested path matches any allowed route
  const hasAccess = allowedRoutes.some(route => 
    requestedPath.startsWith(route)
  ) || publicRoutes.some(route => 
    requestedPath.startsWith(route)
  )

  return hasAccess
}

export const hasPermission = (
  userDetails: UserDetails | null,
  resource: string,
  action: string
): boolean => {
  if (!userDetails || !userDetails.role.permissions) {
    return false
  }

  const permissions = userDetails.role.permissions[resource]
  
  if (!permissions || !Array.isArray(permissions)) {
    return false
  }

  return permissions.includes(action)
}

export const getUserAccessibleRoutes = (
  userDetails: UserDetails | null
): string[] => {
  if (!userDetails) {
    return []
  }

  const roleName = userDetails.role.name.toLowerCase()

  const roleRouteAccess: Record<string, string[]> = {
    'applicant': ['/application-portal', '/profile', '/settings'],
    'admin': ['/admin', '/users', '/roles', '/settings', '/applications', '/investments', '/portfolio', '/reports'],
    'investment_manager': ['/investments', '/applications', '/portfolio', '/due-diligence', '/board-review', '/term-sheets', '/reports', '/profile', '/settings'],
    'board_member': ['/board', '/applications', '/portfolio', '/reports', '/profile', '/settings'],
    'analyst': ['/analytics', '/applications', '/portfolio', '/reports', '/profile', '/settings'],
    'finance': ['/finance', '/investments', '/portfolio', '/reports', '/profile', '/settings'],
    'compliance': ['/compliance', '/applications', '/portfolio', '/reports', '/profile', '/settings']
  }

  return roleRouteAccess[roleName] || []
}
