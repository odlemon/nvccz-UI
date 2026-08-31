export type PortalId = 'staff' | 'lp' | 'investee' | 'apply' | 'vendor' | 'events'

/** Baked at build time — which portal this deployment serves. */
export const PORTAL_ID: PortalId =
  (process.env.NEXT_PUBLIC_PORTAL as PortalId) || 'staff'

function portalExternalUrl(
  envKey: string,
  localDevPort: number,
  productionDefault: string,
): string {
  if (process.env[envKey]) return process.env[envKey] as string
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:${localDevPort}`
  }
  return productionDefault
}

export const LP_PORTAL_EXTERNAL_URL = portalExternalUrl(
  'NEXT_PUBLIC_LP_PORTAL_URL',
  3110,
  '',
)

export const INVESTEE_PORTAL_EXTERNAL_URL = portalExternalUrl(
  'NEXT_PUBLIC_INVESTEE_PORTAL_URL',
  3120,
  '',
)

/**
 * Public funding-application portal (no login).
 * When set on the staff build, `/funding-application` redirects here.
 * Set via NEXT_PUBLIC_APPLY_PORTAL_URL at build time — no production default.
 */
export const APPLY_PORTAL_EXTERNAL_URL = portalExternalUrl(
  'NEXT_PUBLIC_APPLY_PORTAL_URL',
  3130,
  '',
)

/**
 * Vendor portal — vendor registration, KYC, RFQ access, quotation/invoice submission.
 * Set via NEXT_PUBLIC_VENDOR_PORTAL_URL at build time.
 */
export const VENDOR_PORTAL_EXTERNAL_URL = portalExternalUrl(
  'NEXT_PUBLIC_VENDOR_PORTAL_URL',
  3140,
  '',
)

/**
 * Events portal — public events, RSVP, feedback.
 * Set via NEXT_PUBLIC_EVENTS_PORTAL_URL at build time.
 */
export const EVENTS_PORTAL_EXTERNAL_URL = portalExternalUrl(
  'NEXT_PUBLIC_EVENTS_PORTAL_URL',
  3150,
  '',
)

const AUTH_ROUTES = ['/login', '/forgot-password', '/reset-password', '/verify-email']

/** Routes that never require login — staff portal only. */
export const STAFF_PUBLIC_PASS_THROUGH = [
  '/permissions-matrix',
  '/applications/form',
  '/home-v3',
  '/portfolio-v11',
  '/payroll-v6',
  '/accounting-v52',
  '/procurement-v23',
  '/performance-v22',
  '/fundraising-kyc',
  '/broker-instruction',
] as const

const LP_PREFIXES = ['/lp-portal', ...AUTH_ROUTES]
const INVESTEE_PREFIXES = ['/investee-portal-v8', ...AUTH_ROUTES]
/** Apply portal: public form only (no staff chrome, no auth). */
const APPLY_PREFIXES = ['/funding-application']
/** Vendor portal: public vendor workflows (no staff chrome, no auth). */
const VENDOR_PREFIXES = ['/vendor-portal', '/vendor', '/vendor-quotations', '/public-tenders', ...AUTH_ROUTES]
/** Events portal: public events workflows (no staff chrome, no auth). */
const EVENTS_PREFIXES = ['/events/rsvp', '/events/public', '/events/feedback', ...AUTH_ROUTES]

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))
}

export function isStaffPublicPassThrough(pathname: string): boolean {
  return STAFF_PUBLIC_PASS_THROUGH.some((route) => pathname.startsWith(route))
}

/** True when staff should bounce public apply traffic to the dedicated apply domain. */
export function shouldRedirectFundingApplicationToApplyPortal(): boolean {
  if (PORTAL_ID !== 'staff') return false
  const explicit = process.env.NEXT_PUBLIC_APPLY_PORTAL_REDIRECT
  if (explicit === '0' || explicit === 'false') return false
  if (explicit === '1' || explicit === 'true') return true
  if (process.env.NEXT_PUBLIC_APPLY_PORTAL_URL) return true
  // Local dev: dedicated apply portal on :3130 (see scripts/run-portal-dev.mjs).
  return process.env.NODE_ENV === 'development'
}

/** True when staff should bounce vendor traffic to the dedicated vendor domain. */
export function shouldRedirectVendorToPortal(): boolean {
  if (PORTAL_ID !== 'staff') return false
  const explicit = process.env.NEXT_PUBLIC_VENDOR_PORTAL_REDIRECT
  if (explicit === '0' || explicit === 'false') return false
  if (explicit === '1' || explicit === 'true') return true
  if (process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL) return true
  return process.env.NODE_ENV === 'development'
}

/** True when staff should bounce events traffic to the dedicated events domain. */
export function shouldRedirectEventsToPortal(): boolean {
  if (PORTAL_ID !== 'staff') return false
  const explicit = process.env.NEXT_PUBLIC_EVENTS_PORTAL_REDIRECT
  if (explicit === '0' || explicit === 'false') return false
  if (explicit === '1' || explicit === 'true') return true
  if (process.env.NEXT_PUBLIC_EVENTS_PORTAL_URL) return true
  return process.env.NODE_ENV === 'development'
}

export function fundingApplicationPublicUrl(path = '/funding-application'): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  if (PORTAL_ID === 'apply') return suffix
  if (shouldRedirectFundingApplicationToApplyPortal()) {
    return `${APPLY_PORTAL_EXTERNAL_URL.replace(/\/$/, '')}${suffix}`
  }
  return suffix
}

export function isPathAllowedForPortal(pathname: string, portal: PortalId): boolean {
  if (isAuthRoute(pathname)) return true

  if (portal === 'staff') {
    if (pathname.startsWith('/lp-portal')) return false
    if (pathname.startsWith('/application-portal')) return false
    if (pathname.startsWith('/investee-portal-v8')) return false
    return true
  }

  if (portal === 'lp') {
    return LP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }

  if (portal === 'investee') {
    return INVESTEE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }

  if (portal === 'apply') {
    return APPLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }

  if (portal === 'vendor') {
    return VENDOR_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }

  if (portal === 'events') {
    return EVENTS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }

  return false
}

export function portalHomePath(portal: PortalId): string {
  switch (portal) {
    case 'lp':
      return '/lp-portal'
    case 'investee':
      return '/investee-portal-v8'
    case 'apply':
      return '/funding-application'
    case 'vendor':
      return '/vendor-portal'
    case 'events':
      return '/events/public'
    default:
      return '/home-v3'
  }
}

export function portalLoginMeta(portal: PortalId): {
  title: string
  subtitle: string
} {
  switch (portal) {
    case 'lp':
      return {
        title: 'LP Portal',
        subtitle: 'Sign in to view fund performance, documents, and capital activity.',
      }
    case 'investee':
      return {
        title: 'Investee Portal',
        subtitle: 'Sign in to manage your application and portfolio company information.',
      }
    case 'apply':
      return {
        title: 'Funding application',
        subtitle: 'Submit a funding application. No login required.',
      }
    case 'vendor':
      return {
        title: 'Vendor Portal',
        subtitle: 'Access RFQs, submit quotations, and manage your vendor registration.',
      }
    case 'events':
      return {
        title: 'Events Portal',
        subtitle: 'Browse events and manage your RSVPs.',
      }
    default:
      return {
        title: 'Sign in',
        subtitle: 'Access your organisation workspace.',
      }
  }
}
