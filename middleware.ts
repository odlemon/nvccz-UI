import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROLE_PERMISSIONS_MAP, type RoleCode } from '@/lib/config/role-permissions'
import {
  PORTAL_ID,
  LP_PORTAL_EXTERNAL_URL,
  INVESTEE_PORTAL_EXTERNAL_URL,
  APPLY_PORTAL_EXTERNAL_URL,
  VENDOR_PORTAL_EXTERNAL_URL,
  EVENTS_PORTAL_EXTERNAL_URL,
  isPathAllowedForPortal,
  portalHomePath,
  isAuthRoute,
  isStaffPublicPassThrough,
  shouldRedirectFundingApplicationToApplyPortal,
  shouldRedirectVendorToPortal,
  shouldRedirectEventsToPortal,
} from '@/lib/portal/config'

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

  // Procurement V23 client design port
  '/procurement-v23': { module: 'procurement-v23', subModule: 'pr23-dashboard' },
  '/procurement-v23/plan': { module: 'procurement-v23', subModule: 'pr23-plan' },
  '/procurement-v23/approvals': { module: 'procurement-v23', subModule: 'pr23-approvals' },
  '/procurement-v23/requisitions': { module: 'procurement-v23', subModule: 'pr23-requisitions' },
  '/procurement-v23/tenders': { module: 'procurement-v23', subModule: 'pr23-tenders' },
  '/procurement-v23/evaluation': { module: 'procurement-v23', subModule: 'pr23-evaluation' },
  '/procurement-v23/vendors': { module: 'procurement-v23', subModule: 'pr23-vendors' },
  '/procurement-v23/contracts': { module: 'procurement-v23', subModule: 'pr23-contracts' },
  '/procurement-v23/purchase-orders': { module: 'procurement-v23', subModule: 'pr23-orders' },
  '/procurement-v23/goods-received': { module: 'procurement-v23', subModule: 'pr23-receiving' },
  '/procurement-v23/invoices': { module: 'procurement-v23', subModule: 'pr23-invoices' },
  '/procurement-v23/accounts': { module: 'procurement-v23', subModule: 'pr23-accounts' },
  '/procurement-v23/documents': { module: 'procurement-v23', subModule: 'pr23-documents' },
  '/procurement-v23/reports': { module: 'procurement-v23', subModule: 'pr23-reports' },
  '/procurement-v23/audit': { module: 'procurement-v23', subModule: 'pr23-audit' },
  '/procurement-v23/settings': { module: 'procurement-v23', subModule: 'pr23-settings' },

  // Accounting V52 client design port
  '/accounting-v52': { module: 'accounting-v52', subModule: 'ac52-overview' },
  '/accounting-v52/approvals': { module: 'accounting-v52', subModule: 'ac52-approvals' },
  '/accounting-v52/close': { module: 'accounting-v52', subModule: 'ac52-close' },
  '/accounting-v52/general-ledger': { module: 'accounting-v52', subModule: 'ac52-ledger' },
  '/accounting-v52/journals': { module: 'accounting-v52', subModule: 'ac52-journals' },
  '/accounting-v52/cash-book': { module: 'accounting-v52', subModule: 'ac52-cash' },
  '/accounting-v52/bank-reconciliation': { module: 'accounting-v52', subModule: 'ac52-recon' },
  '/accounting-v52/payables': { module: 'accounting-v52', subModule: 'ac52-payables' },
  '/accounting-v52/receivables': { module: 'accounting-v52', subModule: 'ac52-receivables' },
  '/accounting-v52/expenses': { module: 'accounting-v52', subModule: 'ac52-expenses' },
  '/accounting-v52/inventory': { module: 'accounting-v52', subModule: 'ac52-inventory' },
  '/accounting-v52/assets': { module: 'accounting-v52', subModule: 'ac52-assets' },
  '/accounting-v52/short-term-investments': { module: 'accounting-v52', subModule: 'ac52-investments' },
  '/accounting-v52/reports': { module: 'accounting-v52', subModule: 'ac52-reports' },
  '/accounting-v52/tax': { module: 'accounting-v52', subModule: 'ac52-compliance' },
  '/accounting-v52/fx-revaluation': { module: 'accounting-v52', subModule: 'ac52-fx' },
  '/accounting-v52/consolidation': { module: 'accounting-v52', subModule: 'ac52-consolidation' },
  '/accounting-v52/chart-governance': { module: 'accounting-v52', subModule: 'ac52-coa' },
  '/accounting-v52/vault': { module: 'accounting-v52', subModule: 'ac52-vault' },
  '/accounting-v52/audit': { module: 'accounting-v52', subModule: 'ac52-audit' },
  '/accounting-v52/access': { module: 'accounting-v52', subModule: 'ac52-access' },
  '/accounting-v52/integrations': { module: 'accounting-v52', subModule: 'ac52-integrations' },
  '/accounting-v52/settings': { module: 'accounting-v52', subModule: 'ac52-settings' },

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

  // Portfolio V11 / V23 client design (live wire target)
  '/portfolio-v11': { module: 'portfolio-v11', subModule: 'pv11-dashboard' },
  '/portfolio-v11/deals': { module: 'portfolio-v11', subModule: 'pv11-deals' },
  '/portfolio-v11/funds': { module: 'portfolio-v11', subModule: 'pv11-funds' },
  '/portfolio-v11/capital-calls': { module: 'portfolio-v11', subModule: 'pv11-capital-calls' },
  '/portfolio-v11/companies': { module: 'portfolio-v11', subModule: 'pv11-companies' },
  '/portfolio-v11/cash-accounts': { module: 'portfolio-v11', subModule: 'pv11-cash-accounts' },
  '/portfolio-v11/cash-overview': { module: 'portfolio-v11', subModule: 'pv11-cash-accounts' },
  '/portfolio-v11/cash-ledger': { module: 'portfolio-v11', subModule: 'pv11-cash-accounts' },
  '/portfolio-v11/cash-reservations': { module: 'portfolio-v11', subModule: 'pv11-cash-accounts' },
  '/portfolio-v11/statement-imports': { module: 'portfolio-v11', subModule: 'pv11-cash-accounts' },
  '/portfolio-v11/reconciliations': { module: 'portfolio-v11', subModule: 'pv11-cash-accounts' },
  '/portfolio-v11/exceptions': { module: 'portfolio-v11', subModule: 'pv11-cash-accounts' },
  '/portfolio-v11/period-close': { module: 'portfolio-v11', subModule: 'pv11-cash-accounts' },
  '/portfolio-v11/reporting': { module: 'portfolio-v11', subModule: 'pv11-reporting' },
  '/portfolio-v11/fund-performance': { module: 'portfolio-v11', subModule: 'pv11-reporting' },
  '/portfolio-v11/lps': { module: 'portfolio-v11', subModule: 'pv11-lps' },
  '/portfolio-v11/documents': { module: 'portfolio-v11', subModule: 'pv11-documents' },
  '/portfolio-v11/reports-vault': { module: 'portfolio-v11', subModule: 'pv11-documents' },
  '/portfolio-v11/e-signatures': { module: 'portfolio-v11', subModule: 'pv11-documents' },
  '/portfolio-v11/mailer-lists': { module: 'portfolio-v11', subModule: 'pv11-documents' },
  '/portfolio-v11/settings': { module: 'portfolio-v11', subModule: 'pv11-settings' },
  '/portfolio-v11/analytics': { module: 'portfolio-v11', subModule: 'pv11-dashboard' },
  '/portfolio-v11/applicant-portal': { module: 'portfolio-v11', subModule: 'pv11-deals' },

  // Application Portal routes
  '/application-portal': { module: 'application-portal' },

  // Events Management routes
  '/events': { module: 'events-management' },
  '/events/my-events': { module: 'events-management', subModule: 'my-events' },

  // FP&A / Forecasting routes
  '/forecasting': { module: 'forecasting', subModule: 'fpa-home' },
  '/forecasting/models': { module: 'forecasting', subModule: 'fpa-models' },
  '/forecasting/budget': { module: 'forecasting', subModule: 'fpa-budget' },
  '/forecasting/rolling-forecast': { module: 'forecasting', subModule: 'fpa-rolling' },
  '/forecasting/scenarios': { module: 'forecasting', subModule: 'fpa-scenarios' },
  '/forecasting/drivers': { module: 'forecasting', subModule: 'fpa-drivers' },
  '/forecasting/workforce': { module: 'forecasting', subModule: 'fpa-workforce' },
  '/forecasting/revenue': { module: 'forecasting', subModule: 'fpa-revenue' },
  '/forecasting/expenses': { module: 'forecasting', subModule: 'fpa-expenses' },
  '/forecasting/cash-flow': { module: 'forecasting', subModule: 'fpa-cashflow' },
  '/forecasting/variance': { module: 'forecasting', subModule: 'fpa-variance' },
  '/forecasting/reports': { module: 'forecasting', subModule: 'fpa-reports' },
  '/forecasting/workflow': { module: 'forecasting', subModule: 'fpa-workflow' },
  '/forecasting/model-builder': { module: 'forecasting', subModule: 'fpa-model-builder' },
  '/forecasting/settings': { module: 'forecasting', subModule: 'fpa-settings' },
  '/forecasting/audit': { module: 'forecasting', subModule: 'fpa-home' },

  // Fundraising & Investor Relations
  '/fundraising': { module: 'fundraising', subModule: 'fr-dashboard' },
  '/fundraising/campaigns': { module: 'fundraising', subModule: 'fr-campaigns' },
  '/fundraising/investors': { module: 'fundraising', subModule: 'fr-investors' },
  '/fundraising/contacts': { module: 'fundraising', subModule: 'fr-contacts' },
  '/fundraising/pipeline': { module: 'fundraising', subModule: 'fr-pipeline' },
  '/fundraising/mandates': { module: 'fundraising', subModule: 'fr-mandates' },
  '/fundraising/due-diligence': { module: 'fundraising', subModule: 'fr-due-diligence' },
  '/fundraising/data-rooms': { module: 'fundraising', subModule: 'fr-data-rooms' },
  '/fundraising/communications': { module: 'fundraising', subModule: 'fr-communications' },
  '/fundraising/meetings': { module: 'fundraising', subModule: 'fr-meetings' },
  '/fundraising/documents': { module: 'fundraising', subModule: 'fr-documents' },
  '/fundraising/agreements': { module: 'fundraising', subModule: 'fr-agreements' },
  '/fundraising/commitments': { module: 'fundraising', subModule: 'fr-commitments' },
  '/fundraising/onboarding': { module: 'fundraising', subModule: 'fr-onboarding' },
  '/fundraising/placement-agents': { module: 'fundraising', subModule: 'fr-placement-agents' },
  '/fundraising/forecasts': { module: 'fundraising', subModule: 'fr-forecasts' },
  '/fundraising/reports': { module: 'fundraising', subModule: 'fr-reports' },
  '/fundraising/approvals': { module: 'fundraising', subModule: 'fr-approvals' },
  '/fundraising/audit': { module: 'fundraising', subModule: 'fr-audit' },
  '/fundraising/settings': { module: 'fundraising', subModule: 'fr-settings' },

  // Admin Management routes
  '/admin': { module: 'admin-management' },
  '/admin/users': { module: 'admin-management', subModule: 'user-management' },
  '/admin/roles': { module: 'admin-management', subModule: 'role-management' },
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token')
  const userProfile = request.cookies.get(process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile')

  const { pathname } = request.nextUrl

  // External LP / investee / apply portals: strict route allowlist (separate deployments).
  if (PORTAL_ID === 'lp' || PORTAL_ID === 'investee') {
    if (pathname === '/') {
      const dest = token ? portalHomePath(PORTAL_ID) : '/login'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    if (!isPathAllowedForPortal(pathname, PORTAL_ID)) {
      return NextResponse.redirect(new URL(portalHomePath(PORTAL_ID), request.url))
    }
  }

  // Apply portal: public funding form only — no auth, no staff chrome.
  if (PORTAL_ID === 'apply') {
    if (pathname === '/' || pathname === '') {
      return NextResponse.redirect(new URL('/funding-application', request.url))
    }
    if (!isPathAllowedForPortal(pathname, PORTAL_ID)) {
      return NextResponse.redirect(new URL('/funding-application', request.url))
    }
    return NextResponse.next()
  }

  // Vendor portal: public vendor workflows - no auth, no staff chrome.
  if (PORTAL_ID === 'vendor') {
    if (!isPathAllowedForPortal(pathname, PORTAL_ID)) {
      return NextResponse.redirect(new URL('/vendor-portal', request.url))
    }
    return NextResponse.next()
  }

  // Events portal: public events workflows - no auth, no staff chrome.
  if (PORTAL_ID === 'events') {
    if (!isPathAllowedForPortal(pathname, PORTAL_ID)) {
      return NextResponse.redirect(new URL('/events/public', request.url))
    }
    return NextResponse.next()
  }

  // Staff portal: send external portal paths to their dedicated domains.
  if (PORTAL_ID === 'staff') {
    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL(portalHomePath(PORTAL_ID), request.url))
    }
    if (pathname.startsWith('/lp-portal')) {
      const suffix = pathname.replace(/^\/lp-portal/, '') || ''
      return NextResponse.redirect(`${LP_PORTAL_EXTERNAL_URL}${suffix}`)
    }
    if (pathname.startsWith('/application-portal') || pathname.startsWith('/investee-portal-v8')) {
      const suffix = pathname.startsWith('/investee-portal-v8')
        ? pathname.replace(/^\/investee-portal-v8/, '')
        : pathname.replace(/^\/application-portal/, '')
      const base = INVESTEE_PORTAL_EXTERNAL_URL.replace(/\/$/, '')
      return NextResponse.redirect(`${base}/investee-portal-v8${suffix}`)
    }
    if (
      shouldRedirectVendorToPortal() &&
      (pathname.startsWith('/vendor-portal') || pathname.startsWith('/vendor/') || pathname.startsWith('/vendor-quotations') || pathname.startsWith('/public-tenders'))
    ) {
      const suffix = pathname.replace(/^\/(vendor-portal|vendor|vendor-quotations|public-tenders)/, '') || ''
      return NextResponse.redirect(`${VENDOR_PORTAL_EXTERNAL_URL}${suffix}`)
    }
    if (
      shouldRedirectEventsToPortal() &&
      (pathname.startsWith('/events/rsvp') || pathname.startsWith('/events/public') || pathname.startsWith('/events/feedback'))
    ) {
      const suffix = pathname.replace(/^\/events/, '') || ''
      return NextResponse.redirect(`${EVENTS_PORTAL_EXTERNAL_URL}/events${suffix}`)
    }

    if (
      shouldRedirectFundingApplicationToApplyPortal() &&
      (pathname === '/funding-application' || pathname.startsWith('/funding-application/'))
    ) {
      const suffix = pathname.replace(/^\/funding-application/, '') || ''
      return NextResponse.redirect(
        `${APPLY_PORTAL_EXTERNAL_URL.replace(/\/$/, '')}/funding-application${suffix}`,
      )
    }
  }

  // Investee deployment: legacy application-portal → V8 UI
  if (PORTAL_ID === 'investee' && pathname.startsWith('/application-portal')) {
    const suffix = pathname.replace(/^\/application-portal/, '') || ''
    return NextResponse.redirect(new URL(`/investee-portal-v8${suffix}`, request.url))
  }

  // Legacy /performance → current Performance Management (V22)
  if (
    pathname === "/performance" ||
    (pathname.startsWith("/performance/") && !pathname.startsWith("/performance-v22"))
  ) {
    return NextResponse.redirect(new URL("/performance-v22", request.url))
  }

  // Pass-through routes (staff portal only — public/token pages stay on staff domain).
  if (PORTAL_ID === 'staff' && isStaffPublicPassThrough(pathname)) {
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

      if (PORTAL_ID === 'lp') {
        return NextResponse.redirect(new URL('/lp-portal', request.url))
      }
      if (PORTAL_ID === 'investee' || roleName === 'applicant') {
        return NextResponse.redirect(new URL('/investee-portal-v8', request.url))
      }

      return NextResponse.redirect(new URL(portalHomePath(PORTAL_ID), request.url))
    } catch (error) {
      console.error('Error parsing user profile:', error)
    }
  }

  // LP / investee portals: require auth; investee also rejects non-applicant cookies at the edge.
  if (PORTAL_ID === 'lp' || PORTAL_ID === 'investee') {
    if (!token && !isAuthRoute(pathname)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (PORTAL_ID === 'investee' && token && userProfile && !isAuthRoute(pathname)) {
      try {
        const profile = JSON.parse(decodeURIComponent(userProfile.value))
        const roleName = String(profile.role?.name || profile.roleCode || '').toLowerCase()
        if (roleName !== 'applicant' && profile.roleCode?.toLowerCase() !== 'applicant') {
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('from', pathname)
          const res = NextResponse.redirect(loginUrl)
          res.cookies.delete(process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token')
          res.cookies.delete(process.env.NEXT_PUBLIC_AUTH_USER_KEY || 'user')
          res.cookies.delete(process.env.NEXT_PUBLIC_AUTH_PROFILE_KEY || 'userProfile')
          return res
        }
      } catch {
        /* fall through — client will resolve session */
      }
    }

    return NextResponse.next()
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
      const isHomePage = pathname === '/admin' || pathname === '/' || pathname === '/home-v3'

      // Applicants can only access application portal
      if (roleName === 'applicant') {
        const applicantAllowedRoutes = ['/application-portal', '/profile', '/settings', '/help', '/notifications']
        const hasAccess = applicantAllowedRoutes.some(route => pathname.startsWith(route))

        if (!hasAccess) {
          return NextResponse.redirect(new URL('/application-portal', request.url))
        }
      }

      // Admin / ops manager bypass RBAC map (JWT may use roleCode "admin")
      if (roleName === 'admin' || roleCode === 'OPS_MGR' || (roleCode as string)?.toLowerCase() === 'admin') {
        return NextResponse.next()
      }

      // Only check route permissions if user has roleCode and not already on error page
      if (roleCode && !isErrorRedirect) {
        // Find matching route permission
        const isFpaWorksheet =
          /^\/forecasting\/models\/[^/]+\/worksheet(?:\/|$)/.test(pathname)
        let matchedRoute: { module: string; subModule?: string } | null = isFpaWorksheet
          ? { module: 'forecasting', subModule: 'fpa-worksheet' }
          : null
        let matchedPath = isFpaWorksheet ? pathname : ''

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
