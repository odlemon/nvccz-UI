import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROLE_PERMISSIONS_MAP, type RoleCode } from '@/lib/config/role-permissions'

// Helper function to check if role has access to a module
function hasModuleAccess(roleCode: RoleCode | null, moduleId: string): boolean {
  if (!roleCode) return false

  // Admin role has access to everything
  if (roleCode === 'OPS_MGR') return true

  const permissions = ROLE_PERMISSIONS_MAP[roleCode]
  if (!permissions) return false

  const modulePermission = permissions.modules.find(m => m.moduleId === moduleId)
  return modulePermission ? modulePermission.access !== 'none' : false
}

// Helper function to check sub-module access
function hasSubModuleAccess(roleCode: RoleCode | null, moduleId: string, subModuleId: string): boolean {
  if (!roleCode) return false

  // Admin role has access to everything
  if (roleCode === 'OPS_MGR') return true

  const permissions = ROLE_PERMISSIONS_MAP[roleCode]
  if (!permissions) return false

  const modulePermission = permissions.modules.find(m => m.moduleId === moduleId)
  if (!modulePermission || modulePermission.access === 'none') return false

  if (!modulePermission.subModules) return true // If no submodules defined, allow access to module

  const subModuleAccess = modulePermission.subModules[subModuleId]
  return subModuleAccess ? subModuleAccess !== 'none' : false
}

// Map routes to modules and sub-modules
const routePermissions: Record<string, { module: string; subModule?: string }> = {
  // Procurement routes
  '/procurement': { module: 'procurement', subModule: 'procurement-dashboard' },
  '/procurement/requisitions': { module: 'procurement', subModule: 'purchase-requisitions' },
  '/procurement/rfq': { module: 'procurement', subModule: 'rfq' },
  '/procurement/quotations': { module: 'procurement', subModule: 'quotations' },
  '/procurement/purchase-orders': { module: 'procurement', subModule: 'purchase-orders' },
  '/procurement/invoices': { module: 'procurement', subModule: 'procurement-invoices' },
  '/procurement/grn': { module: 'procurement', subModule: 'goods-received-notes' },
  '/procurement/goods-received': { module: 'procurement', subModule: 'goods-received-notes' },
  '/procurement/payments': { module: 'procurement', subModule: 'payments' },
  '/procurement/approvals': { module: 'procurement', subModule: 'my-approvals' },
  '/procurement/approval-configs': { module: 'procurement', subModule: 'approval-configurations' },

  // Performance Management routes
  '/performance': { module: 'performance-management', subModule: 'performance-dashboard' },
  '/performance/departments': { module: 'performance-management', subModule: 'departments-management' },
  '/performance/kpis': { module: 'performance-management', subModule: 'kpi-management' },
  '/performance/goals': { module: 'performance-management', subModule: 'goals-management' },
  '/performance/tasks': { module: 'performance-management', subModule: 'taskManagement' },
  '/performance/user-scorecards': { module: 'performance-management', subModule: 'userScorecard' },
  '/performance/department-scorecards': { module: 'performance-management', subModule: 'departmentScorecard' },
  '/performance/ceo-scorecards': { module: 'performance-management', subModule: 'performance-dashboard' },
  '/performance/board-scorecards': { module: 'performance-management', subModule: 'performance-dashboard' },
  '/performance/org-bsc': { module: 'performance-management', subModule: 'performance-dashboard' },

  // Payroll routes
  '/payroll': { module: 'payroll', subModule: 'payroll-dashboard' },
  '/payroll/employees': { module: 'payroll', subModule: 'payroll-employees' },
  '/payroll/payroll-runs': { module: 'payroll', subModule: 'payroll-runs' },
  '/payroll/payslips': { module: 'payroll', subModule: 'payroll-payslips' },

  // Accounting routes
  '/accounting': { module: 'accounting', subModule: 'accounting-dashboard' },
  '/accounting/general-ledger': { module: 'accounting', subModule: 'general-ledger' },
  '/accounting/cash-book': { module: 'accounting', subModule: 'cash-book' },
  '/accounting/invoices': { module: 'accounting', subModule: 'invoices' },
  '/accounting/expenses': { module: 'accounting', subModule: 'expenses' },

  // Portfolio Management routes
  '/portfolio': { module: 'portfolio-management' },
  '/portfolio/funds': { module: 'portfolio-management', subModule: 'funds' },
  '/portfolio/companies': { module: 'portfolio-management', subModule: 'companies' },

  // Application Portal routes
  '/application-portal': { module: 'application-portal' },

  // Events Management routes
  '/events': { module: 'events-management' },
  '/events/my-events': { module: 'events-management', subModule: 'my-events' },

  // Forecasting routes
  '/forecasting': { module: 'forecasting', subModule: 'forecasting-dashboard' },
  '/forecasting/scenarios': { module: 'forecasting', subModule: 'scenarios' },
  '/forecasting/audit': { module: 'forecasting', subModule: 'forecasting-audit' },
  '/forecasting/settings': { module: 'forecasting', subModule: 'forecasting-settings' },

  // Admin Management routes
  '/admin': { module: 'admin-management' },
  '/admin/users': { module: 'admin-management', subModule: 'user-management' },
  '/admin/roles': { module: 'admin-management', subModule: 'role-management' },
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token')
  const userProfile = request.cookies.get(process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile')

  const { pathname } = request.nextUrl

  // Pass-through routes: always render regardless of auth state.
  // These are public-facing pages reached via shared links (RSVP tokens,
  // vendor quotation submissions, public tenders, KYC token forms, etc.)
  // Logged-in users opening these links must NOT be bounced to /admin.
  const passThroughRoutes = [
    '/permissions-matrix',
    '/events/rsvp',           // /events/rsvp/[token] — invitee RSVP page
    '/events/public',         // /events/public/[id] — public event details
    '/vendor/quotation/submit', // legacy vendor quotation form
    '/vendor/invoice/submit',   // legacy vendor invoice form
    '/vendor-quote',          // /vendor-quote/[rfqNumber]/[requisitionId] — quote submission via shared link
    '/vendor-portal',         // vendor portal incl. /kyc/[token], /rfq/[rfqNumber], /register
    '/public-tenders',        // public tender browsing
    '/applications/form',     // public application form
    '/vendor-quotations',     // vendor quotation submission routes
    '/[token]'
  ]
  if (passThroughRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Auth-only public routes: redirect to dashboard if user is already logged in.
  // (Login/register/forgot-password don't make sense for authenticated users.)
  const authOnlyPublicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]
  const isAuthOnlyPublic = authOnlyPublicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isAuthOnlyPublic && token && userProfile) {
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
  if (!isAuthOnlyPublic && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  if (!isAuthOnlyPublic && token && userProfile) {
    try {
      const profile = JSON.parse(decodeURIComponent(userProfile.value))
      const roleName = profile.role?.name?.toLowerCase()
      const roleCode = profile.roleCode as RoleCode | null

      // Skip permission checks if already on an error page or accessing homepage
      const isErrorRedirect = request.nextUrl.searchParams.has('error')
      const isHomePage = pathname === '/admin' || pathname === '/'

      // Applicants can only access application portal
      if (roleName === 'applicant') {
        const applicantAllowedRoutes = ['/application-portal', '/profile', '/settings', '/help', '/notifications']
        const hasAccess = applicantAllowedRoutes.some(route => pathname.startsWith(route))

        if (!hasAccess) {
          return NextResponse.redirect(new URL('/application-portal', request.url))
        }
      }

      // Only check route permissions if user has roleCode and not already on error page
      if (roleCode && !isErrorRedirect) {
        // Find matching route permission
        let matchedRoute: { module: string; subModule?: string } | null = null
        let matchedPath = ''

        // Find the most specific matching route
        for (const [routePath, permission] of Object.entries(routePermissions)) {
          if (pathname.startsWith(routePath) && routePath.length > matchedPath.length) {
            matchedRoute = permission
            matchedPath = routePath
          }
        }

        // If we found a route that requires permissions
        if (matchedRoute) {
          const { module, subModule } = matchedRoute

          // Check if user has access to the module
          const hasAccess = hasModuleAccess(roleCode, module)

          if (!hasAccess) {
            // For /admin route specifically, allow access but client-side will show proper UI
            if (pathname === '/admin') {
              return NextResponse.next()
            }

            // For other routes, redirect to homepage with error message
            const homeUrl = new URL('/', request.url)
            homeUrl.searchParams.set('error', 'access_denied')
            homeUrl.searchParams.set('module', module)
            return NextResponse.redirect(homeUrl)
          }

          // If subModule is specified, check sub-module access
          if (subModule) {
            const hasSubAccess = hasSubModuleAccess(roleCode, module, subModule)

            if (!hasSubAccess) {
              // Redirect to module homepage or main page
              const baseModulePath = matchedPath.split('/').slice(0, 2).join('/')
              const moduleUrl = new URL(baseModulePath || '/', request.url)
              moduleUrl.searchParams.set('error', 'access_denied')
              moduleUrl.searchParams.set('submodule', subModule)
              return NextResponse.redirect(moduleUrl)
            }
          }
        }
      }

      // All other users (admin, investment_manager, etc.) have full access if not restricted above
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)',
  ],
}
