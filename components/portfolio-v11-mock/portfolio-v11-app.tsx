"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
  pathToPv11Page,
  PV11_PAGE_TO_PATH,
} from "@/lib/portfolio-v11-mock/nav"
import { startPortfolioV11Runtime } from "@/components/portfolio-v11-mock/matanho-portfolio-runtime"
import { PORTFOLIO_V11_SHELL_HTML } from "@/components/portfolio-v11-mock/shell"
import {
  loadPortfolioV11Scopes,
  primaryLoadLabel,
  readCachedApplicationsPayload,
  scopesForPage,
  type PortfolioDataScope,
  type PortfolioV11LoadFilters,
} from "@/lib/portfolio-v11/bootstrap"
import { handlePortfolioV11Action, hydrateDealDetail } from "@/lib/portfolio-v11/actions"
import { downloadAc52Export, type Ac52ExportKind, type Ac52ExportSpec } from "@/lib/accounting-v52/export"
import { ORG_LOGO_PATH, ORG_NAME } from "@/lib/branding"
import { applicationsApi } from "@/lib/api/applications-api"
import { fundsApi } from "@/lib/api/funds-api"
import { distributionsApi } from "@/lib/api/capital-calls-api"
import { portfolioCompaniesApi } from "@/lib/api/portfolio-companies-api"
import { fundraisingApi } from "@/lib/api/fundraising-api"
import { adaptCompanies, asArray } from "@/lib/portfolio-v11/adapters"
import {
  loadPortfolioSessionRbac,
  loadSettingsRbac,
  peekPortfolioSessionRbac,
} from "@/lib/portfolio-v11/live-loaders"
import { getAuthToken, getAuthUser, getUserProfile } from "@/lib/utils/cookies"
import { rolesApi } from "@/lib/api/roles-api"
import { usersApi } from "@/lib/api/users-api"
import {
  APPLY_PORTAL_EXTERNAL_URL,
  INVESTEE_PORTAL_EXTERNAL_URL,
  shouldRedirectFundingApplicationToApplyPortal,
} from "@/lib/portal/config"
import "@/components/portfolio-v11-mock/portfolio-v11.css"
import "@/components/portfolio-v11-mock/portfolio-v11-overrides.css"

type RuntimeApi = {
  setPage: (page: string, detail?: Record<string, string>) => void
  destroy: () => void
  beginLiveLoad?: () => void
  failLiveLoad?: (message?: string) => void
  hydrate?: (payload: unknown) => void
}

function applyHydrate(runtime: RuntimeApi, payload: unknown) {
  if (typeof runtime.hydrate === "function") {
    runtime.hydrate(payload)
  } else if (window.MatanhoPortfolioUI?.hydrate) {
    window.MatanhoPortfolioUI.hydrate(payload)
  } else {
    throw new Error("Portfolio UI was not ready to receive live data. Refresh the page.")
  }
}

export function PortfolioV11App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const filtersRef = useRef<PortfolioV11LoadFilters>({})
  const actionBusyRef = useRef(false)
  const hydrateGenRef = useRef(0)
  const loadedScopesRef = useRef<Set<PortfolioDataScope>>(new Set())
  const rbacSessionLoadedRef = useRef(false)
  const rbacSessionPermissionsRef = useRef<Set<string>>(new Set())
  const paintedLiveRef = useRef(false)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const ensurePageDataRef = useRef<
    null | ((page: string, opts?: { soft?: boolean; hard?: boolean; filters?: PortfolioV11LoadFilters }) => Promise<void>)
  >(null)
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "ready" | "error">("loading")
  const [loadMessage, setLoadMessage] = useState<string | null>("Loading live portfolio…")

  // The embedded runtime owns the Portfolio markup, so it hands its export spec
  // here and the shared Accounting writer produces the PDF / Excel / CSV — the same
  // letterhead and branding as the Accounting Command Centre export.
  useEffect(() => {
    window.__PORTFOLIO_EXPORT__ = (kind: Ac52ExportKind, spec: unknown) =>
      downloadAc52Export(kind, spec as Ac52ExportSpec)
    return () => {
      delete window.__PORTFOLIO_EXPORT__
    }
  }, [])

  useEffect(() => {
  pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    // React can preserve refs while rebuilding the embedded runtime (Fast Refresh).
    // The new runtime has empty collections and must load its own scopes again.
    loadedScopesRef.current.clear()
    rbacSessionLoadedRef.current = false
    rbacSessionPermissionsRef.current.clear()
    paintedLiveRef.current = false
    hydrateGenRef.current += 1

    if (shouldRedirectFundingApplicationToApplyPortal()) {
      window.__APPLY_PORTAL_URL__ = APPLY_PORTAL_EXTERNAL_URL.replace(/\/$/, "")
    } else {
      delete window.__APPLY_PORTAL_URL__
    }
    window.__INVESTEE_PORTAL_URL__ = INVESTEE_PORTAL_EXTERNAL_URL.replace(/\/$/, "")

    // On a direct refresh Next can mount this client component before its
    // pathname hook has caught up with the browser URL. Use the location as
    // the source of truth so deep links such as /portfolio/settings do not
    // briefly initialise as the dashboard.
    // The pathname, not the full URL: pathToPv11Page matches '/portfolio/...'
    // prefixes, so an href fell through to the dashboard on every remount.
    const initialPath =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : pathnameRef.current
    const initialPage = initialPath.includes("/portfolio/settings")
      ? "settings"
      : pathToPv11Page(initialPath)
    const loadCompanyDetail = async (companyId: string) => {
      if (!companyId) return
      window.MatanhoPortfolioUI?.setCompanyDetailLoading?.(true)
      try {
        const [companyResponse, companyDocumentsResponse, organisationResponse, activityResponse, reportsResponse] = await Promise.all([
          portfolioCompaniesApi.getById(companyId),
          portfolioCompaniesApi.getCompanyDocuments(companyId),
          portfolioCompaniesApi.getDocumentOrganisation(companyId).catch(() => null),
          portfolioCompaniesApi.getCompanyActivity(companyId),
          portfolioCompaniesApi.getFinancialReports(companyId).catch(() => null),
        ])
        if (!companyResponse?.success || !companyResponse.data) throw new Error("The company record could not be loaded.")
        const documentData = { ...(companyDocumentsResponse?.data || {}), reporting: organisationResponse?.data || null }
        const activityData: unknown = activityResponse?.data
        const activityEvents = Array.isArray(activityData)
          ? activityData
          : activityData && typeof activityData === "object" && "events" in activityData && Array.isArray((activityData as { events?: unknown[] }).events)
            ? (activityData as { events: unknown[] }).events
            : []
        window.MatanhoPortfolioUI?.setCompanyDetail?.({
          company: companyResponse.data,
          documents: documentData || [],
          activity: activityEvents as any[],
          financialReports: Array.isArray(reportsResponse?.data) ? reportsResponse.data : [],
        })
      } catch (error) {
        window.MatanhoPortfolioUI?.setCompanyDetailLoading?.(false, error instanceof Error ? error.message : "Company detail could not be loaded.")
      }
    }

    // The vendored shell hardcodes the Matanho wordmark and an "m" monogram.
    // Point both at the configured brand so the client deployment shows its own
    // logo in the app chrome, not just on the login page. Also drop the
    // sidebar-collapsed class so the module opens expanded.
    const brandedShellHtml = PORTFOLIO_V11_SHELL_HTML.replace(
      '/portfolio/assets/matanho-logo.png',
      ORG_LOGO_PATH,
    )
      .replace(
        'alt="Matanho Investment Management ERP"',
        `alt="${ORG_NAME} Investment Management ERP"`,
      )
      .replace(
        '<span class="brand-logo-collapsed brand-monogram" aria-hidden="true">m</span>',
        `<span class="brand-logo-collapsed brand-monogram" aria-hidden="true">${(ORG_NAME[0] || "M").toLowerCase()}</span>`,
      )
      .replace('class="app-shell sidebar-collapsed"', 'class="app-shell"')

    const getPortfolioRoleState = async (roleId: string) => {
      const rolesResponse = await rolesApi.getPortfolioRoles()
      const role = (rolesResponse.data || []).find((item) => item.id === roleId)
      if (!role) throw new Error("The Portfolio role could not be refreshed.")
      return role
    }

    const runtime = startPortfolioV11Runtime(el, {
      shellHtml: brandedShellHtml,
      initialPage,
      liveOnly: true,
      currentUser: getAuthUser(),
      managerLegalEntity: ORG_NAME,
      allowSyntheticFixtures: process.env.NODE_ENV !== "production",
      localUatFundId: process.env.NODE_ENV !== "production" ? process.env.NEXT_PUBLIC_LOCAL_UAT_FUND_ID : undefined,
      // The shell already resolved this policy before it rendered the module,
      // so hand it over up front: the first paint then has the real navigation
      // and the deep-linked page instead of an empty sidebar.
      sessionRbac: peekPortfolioSessionRbac() ?? undefined,
      // Resolve these callbacks against the latest server grants each time the
      // embedded runtime paints or handles an action. Role labels are not an
      // authorization source in live Portfolio RBAC mode.
      canCreateFund: () => rbacSessionPermissionsRef.current.has("portfolio.funds.create") || rbacSessionPermissionsRef.current.has("portfolio.funds.manage"),
      canInviteLp: () => rbacSessionPermissionsRef.current.has("portfolio.lp_management.create") || rbacSessionPermissionsRef.current.has("portfolio.lp_management.manage"),
      onRbacGrantsChanged: async (roleId: string, permissions: string[]) => {
        const rolesResponse = await rolesApi.getPortfolioRoles()
        const role = (rolesResponse.data || []).find((item) => item.id === roleId)
        const catalogueResponse = await rolesApi.getPortfolioCatalogue()
        const keys = (catalogueResponse.data?.resources || []).flatMap((resource) => resource.permissions || [])
        const permissionSet = new Set(permissions)
        const resolved = Object.fromEntries(keys.map((key) => [key, permissionSet.has(key)]))
        const response = await rolesApi.savePortfolioDraft(roleId, resolved, role?.revision ?? 0)
        if (!response?.success) throw new Error(response?.message || "The role grants were not saved.")
        return getPortfolioRoleState(roleId)
      },
      onRbacAssignmentPeople: async () => {
        const [usersResponse, rolesResponse] = await Promise.all([
          usersApi.getAll(),
          rolesApi.getPortfolioRoles(),
        ])
        if (!usersResponse?.success || !Array.isArray(usersResponse.data)) {
          throw new Error(usersResponse?.message || "The staff directory could not be loaded.")
        }
        if (!rolesResponse?.success || !Array.isArray(rolesResponse.data)) {
          throw new Error(rolesResponse?.message || "Current Portfolio role assignments could not be loaded.")
        }
        const portfolioRoleByUser = new Map<string, string>()
        for (const role of rolesResponse.data) {
          for (const member of role.members || []) portfolioRoleByUser.set(member.id, role.id)
        }
        return usersResponse.data.map((user) => ({
          ...user,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          department: typeof user.department === "string" ? user.department : user.department?.name || "",
          roleName: user.role?.name || "",
          portfolioRoleId: portfolioRoleByUser.get(user.id) || "",
        }))
      },
      onRbacRoleAssigned: async (userId: string, roleId: string) => {
        const response = await rolesApi.assignPortfolioRole(userId, roleId)
        if (!response?.success) throw new Error(response?.message || "The role was not assigned.")
        return { assignment: response.data, rbac: await loadSettingsRbac() }
      },
      onRbacRoleCreated: async (input: { name: string; description?: string; cloneFromId?: string; permissions: Record<string, boolean> }) => {
        const response = await rolesApi.createPortfolioRole(input)
        if (!response?.success) throw new Error(response?.message || "The role was not created.")
        if (!response.data) throw new Error("The role was created without a response payload.")
        return response.data
      },
      onRbacConfigurationExported: async () => {
        const [rolesResponse, catalogueResponse] = await Promise.all([
          rolesApi.getPortfolioRoles(),
          rolesApi.getPortfolioCatalogue(),
        ])
        if (!rolesResponse?.success || !Array.isArray(rolesResponse.data)) {
          throw new Error(rolesResponse?.message || "Portfolio roles could not be loaded for export.")
        }
        if (!catalogueResponse?.success || !catalogueResponse.data) {
          throw new Error(catalogueResponse?.message || "The Portfolio permission catalogue could not be loaded for export.")
        }
        return {
          schema: "matanho.portfolio-rbac/v1",
          exportedAt: new Date().toISOString(),
          catalogue: catalogueResponse.data,
          roles: rolesResponse.data.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            globalRoleId: role.globalRoleId || null,
            globalRole: role.globalRole ? { id: role.globalRole.id, name: role.globalRole.name } : null,
            status: role.status,
            revision: role.revision,
            activeVersion: role.activeVersion || null,
            draftVersion: role.draftVersion || null,
          })),
        }
      },
      onRbacRecordDetail: async ({ roleId, resource }: { roleId: string; resource: string }) => {
        const [rolesResponse, catalogueResponse, historyResponse] = await Promise.all([
          rolesApi.getPortfolioRoles(),
          rolesApi.getPortfolioCatalogue(),
          rolesApi.getPortfolioHistory(roleId),
        ])
        if (!rolesResponse?.success || !Array.isArray(rolesResponse.data)) {
          throw new Error(rolesResponse?.message || "Portfolio roles could not be loaded.")
        }
        if (!catalogueResponse?.success || !catalogueResponse.data) {
          throw new Error(catalogueResponse?.message || "The Portfolio permission catalogue could not be loaded.")
        }
        if (!historyResponse?.success || !Array.isArray(historyResponse.data)) {
          throw new Error(historyResponse?.message || "Portfolio audit history could not be loaded.")
        }
        const role = rolesResponse.data.find((item) => item.id === roleId)
        if (!role) throw new Error("The selected Portfolio role no longer exists.")
        const resourceDefinition = catalogueResponse.data.resources.find((item) => item.key === resource)
        if (!resourceDefinition) throw new Error("The selected page is not in the Portfolio permission catalogue.")
        const legacyPermissions = new Set(role.legacyPermissions || [])
        const permissions = resourceDefinition.permissions.map((key) => {
          const action = key.slice(key.lastIndexOf(".") + 1)
          return {
            key,
            action,
            activeConfigured: Boolean(role.activeVersion),
            active: role.activeVersion?.permissions[key] === true,
            draftConfigured: Boolean(role.draftVersion),
            draft: role.draftVersion?.permissions[key] === true,
            legacy: legacyPermissions.has(key),
          }
        })
        const policyState = role.status === "disabled" ? "Disabled" : role.activeVersion ? "Active" : role.draftVersion ? "Draft" : "Legacy"
        const dateLabel = (value?: string | Date | null) => value ? new Date(value).toLocaleString() : "—"
        return {
          role,
          resourceLabel: resourceDefinition.label,
          policyState,
          createdAt: dateLabel((role as any).createdAt),
          updatedAt: dateLabel((role as any).updatedAt),
          source: "Portfolio RBAC API · portfolio_access_roles",
          sourceDescription: "Role metadata, linked global role, active and draft policies are read from the backend; activity is read from the RBAC audit history endpoint.",
          permissions,
          activity: historyResponse.data
            .filter((entry: any) => entry.entityId === roleId)
            .slice(0, 8)
            .map((entry: any) => ({
              action: entry.action,
              actorId: entry.userId,
              createdAt: dateLabel(entry.createdAt),
              summary: entry.newValues?.version ? `Policy version ${entry.newValues.version}` : entry.newValues?.status ? `Status: ${entry.newValues.status}` : "",
            })),
        }
      },
      onRbacRoleRefreshed: async (roleId: string) => getPortfolioRoleState(roleId),
      onRbacRoleAudit: async (roleId: string) => {
        const response = await rolesApi.getPortfolioHistory(roleId)
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error(response?.message || "Portfolio role audit history could not be loaded.")
        }
        return response.data
      },
      onRbacRoleActivated: async (roleId: string, expectedRevision: number) => {
        const response = await rolesApi.activatePortfolioRole(roleId, expectedRevision)
        if (!response?.success) throw new Error(response?.message || "The Portfolio policy was not activated.")
        return getPortfolioRoleState(roleId)
      },
      onRbacRoleDisabled: async (roleId: string, expectedRevision: number) => {
        const response = await rolesApi.disablePortfolioRole(roleId, expectedRevision)
        if (!response?.success) throw new Error(response?.message || "The Portfolio policy was not disabled.")
        return getPortfolioRoleState(roleId)
      },
      onRbacRoleRestored: async (roleId: string, expectedRevision: number) => {
        const response = await rolesApi.restorePortfolioRole(roleId, expectedRevision)
        if (!response?.success) throw new Error(response?.message || "The Portfolio policy was not restored.")
        return getPortfolioRoleState(roleId)
      },
      onRbacPolicyPreview: async (roleId: string) => {
        const response = await rolesApi.previewPortfolioRole(roleId)
        if (!response?.success || !response.data) throw new Error(response?.message || "The policy preview was unavailable.")
        return response.data
      },
      onRbacRoleDeleted: async (roleId: string) => {
        const response = await rolesApi.deletePortfolioRole(roleId)
        if (!response?.success || !response.data) throw new Error(response?.message || "The role was not deleted.")
        return response.data
      },
      onNavigate: (page: string) => {
        let path = PV11_PAGE_TO_PATH[page] || "/portfolio"
        if (page === "companies") void window.MatanhoPortfolioUI?.loadCompaniesPage?.(1)
        if (page === "company-detail") {
          const companyId = String(window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.selectedCompanyId || "")
          const companyTab = String(window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.companyTab || "overview")
          if (companyId) path = `/portfolio/companies/${encodeURIComponent(companyId)}?tab=${encodeURIComponent(companyTab)}`
          if (companyId) void loadCompanyDetail(companyId)
        }
        if (page === "deal-detail") {
          let dealId = ""
          try {
            dealId =
              window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.selectedDealId ||
              new URLSearchParams(window.location.search).get("id") ||
              sessionStorage.getItem("pv11.selectedDealId") ||
              ""
          } catch {
            dealId = ""
          }
          if (dealId) path = `/portfolio/deals/detail?id=${encodeURIComponent(String(dealId))}`
        }
        if (page === "lp-detail") {
          let lpId = ""
          try {
            lpId =
              window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.selectedLPId ||
              new URLSearchParams(window.location.search).get("id") ||
              ""
          } catch {
            lpId = ""
          }
          if (lpId) path = `/portfolio/lps/detail?id=${encodeURIComponent(String(lpId))}`
        }
        const pathOnly = path.split("?")[0]
        const samePath = pathnameRef.current === pathOnly && page !== "deal-detail" && page !== "lp-detail" && page !== "company-detail"
        pathnameRef.current = pathOnly
        if (!samePath) {
          // pv11:client-nav
          // Next 14 patches history.pushState so that any push coming from
          // outside the router is treated as a route change: it dispatches
          // ACTION_RESTORE, re-renders the route tree for the new URL and
          // remounts this shell (and the whole runtime) about half a second
          // after the click. Portfolio owns its pages, so keep the router's
          // own history keys on the entry — exactly what the router writes
          // when it pushes — and the App Router leaves the tree in place.
          const historyState = {
            ...(window.history.state || {}),
            portfolioV11: page,
            __NA: true,
          }
          window.history.pushState(historyState, "", path)
        }
        // Keep the embedded runtime in sync even when the host route is
        // already mounted. This is important for workspace pages such as
        // Settings, which are rendered inside the same portfolio shell.
        apiRef.current?.setPage(page)
        window.setTimeout(() => {
          if (apiRef.current === runtime) apiRef.current.setPage(page)
        }, 0)
        void ensurePageDataRef.current?.(page, { soft: true })
        if (page === "deal-detail") {
          let dealIdForDetail = ""
          try {
            dealIdForDetail =
              new URLSearchParams(window.location.search).get("id") ||
              window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.selectedDealId ||
              sessionStorage.getItem("pv11.selectedDealId") ||
              ""
          } catch {
            dealIdForDetail = ""
          }
          if (dealIdForDetail) {
            window.MatanhoPortfolioUI?.setDealDetailLoading?.(true)
            void hydrateDealDetail(String(dealIdForDetail)).finally(() => {
              window.MatanhoPortfolioUI?.setDealDetailLoading?.(false)
            })
          }
        }
      },
      onCompaniesPage: async (filters) => {
        const response = await portfolioCompaniesApi.getWithInvestmentsPage(filters)
        if (!response?.success || !Array.isArray(response.data) || !response.pagination) {
          throw new Error("The paginated company register could not be loaded from the Portfolio API.")
        }
        return { rows: adaptCompanies(response.data), pagination: response.pagination }
      },
      onCompanyDocumentUpload: async ({ companyId, file, folder }: { companyId: string; file: File; folder: string }) => {
        const response = await portfolioCompaniesApi.uploadCompanyDocument(companyId, file, folder)
        if (!response?.success) throw new Error("The company document was not saved.")
        await loadCompanyDetail(companyId)
        return response.data
      },
      onCompanyDocumentRequest: async ({ companyId, title, folder, dueDate }: { companyId: string; title: string; folder: string; dueDate?: string }) => {
        const response = await portfolioCompaniesApi.requestCompanyDocument(companyId, { title, folder, dueDate })
        if (!response?.success) throw new Error("The document request was not saved.")
        await loadCompanyDetail(companyId)
        return response.data
      },
    })
    apiRef.current = runtime
    if (initialPage === "company-detail") {
      const companyId = window.location.pathname.match(/^\/portfolio\/companies\/([^/]+)\/?$/)?.[1]
      if (companyId) void loadCompanyDetail(decodeURIComponent(companyId))
    }
    // The host layout can preserve this component while changing the URL.
    // Re-assert the deep-link page after the runtime API is available.
    runtime.setPage(initialPage)
    if (initialPage === "companies") void window.MatanhoPortfolioUI?.loadCompaniesPage?.(1)
    if (initialPage === "settings") {
      window.setTimeout(() => {
        if (apiRef.current === runtime) runtime.setPage("settings")
      }, 250)
    }

    const onPopState = () => {
      const nextPath = window.location.pathname
      // Next's own popstate listener was registered when the app booted, so it
      // always runs first and restores the route tree for the new URL; the
      // matched /portfolio/* route is then re-rendered with a fresh runtime.
      // That runtime re-reads the URL, so this listener only has to keep the
      // live runtime in sync when the host reuses it instead of remounting.
      // (A capture-phase listener cannot pre-empt Next here: popstate is
      // dispatched at window, so both listeners are AT_TARGET and fire in
      // registration order.)
      pathnameRef.current = nextPath
      const page = pathToPv11Page(nextPath)
      const dealId =
        page === "deal-detail"
          ? new URLSearchParams(window.location.search).get("id") ||
            sessionStorage.getItem("pv11.selectedDealId") ||
            undefined
          : undefined
      const lpId =
        page === "lp-detail"
          ? new URLSearchParams(window.location.search).get("id") || undefined
          : undefined
      const companyId = page === "company-detail" ? window.location.pathname.match(/^\/portfolio\/companies\/([^/]+)\/?$/)?.[1] : undefined
      const companyTab = page === "company-detail" ? new URLSearchParams(window.location.search).get("tab") || "overview" : undefined
      apiRef.current?.setPage(page, {
        ...(dealId ? { selectedDealId: dealId } : {}),
        ...(lpId ? { selectedLPId: lpId } : {}),
        ...(companyId ? { selectedCompanyId: decodeURIComponent(companyId), companyTab: companyTab || "overview" } : {}),
      })
      if (companyId) void loadCompanyDetail(decodeURIComponent(companyId))
      void ensurePageDataRef.current?.(page, { soft: true })
      if (page === "deal-detail" && dealId) {
        window.MatanhoPortfolioUI?.setDealDetailLoading?.(true)
        void hydrateDealDetail(dealId).finally(() => {
          window.MatanhoPortfolioUI?.setDealDetailLoading?.(false)
        })
      }
    }
    window.addEventListener("popstate", onPopState)

    const markScopes = (scopes: PortfolioDataScope[]) => {
      for (const s of scopes) loadedScopesRef.current.add(s)
    }

    const summarizePayload = (page: string, payload: { data?: any; meta?: any }) => {
      const deals = payload.data?.deals?.length ?? 0
      const funds = payload.data?.funds?.length ?? 0
      const companies = payload.data?.companies?.length ?? 0
      const capitalCalls = payload.data?.capitalCalls?.length ?? 0
      const lps = payload.data?.lps?.length ?? 0
      const errs = payload.meta?.errors || []
      const when = new Date(payload.meta?.loadedAt || Date.now()).toLocaleTimeString()
      if (errs.length) return `Live data loaded with ${errs.length} partial error(s).`
      if (page === "deals" || page === "deal-detail") return `Applications loaded · ${deals} deals · ${when}`
      if (page === "funds" || page === "fund-detail" || page === "fund-performance") {
        return `Funds loaded · ${funds} funds · ${when}`
      }
      if (page === "companies" || page === "company-detail") {
        return `Companies loaded · ${companies} · ${when}`
      }
      if (page === "capital-calls" || page === "capital-call-detail") {
        return capitalCalls
          ? `Capital calls loaded · ${capitalCalls} · ${when}`
          : `Funds loaded · ${funds} funds · ${when}`
      }
      if (page === "lps" || page === "lp-detail") return `LPs loaded · ${lps} · ${when}`
      if (page === "dashboard") return `Dashboard loaded · ${when}`
      return `Live data loaded · ${when}`
    }

    ensurePageDataRef.current = async (
      page: string,
      opts: { soft?: boolean; hard?: boolean; filters?: PortfolioV11LoadFilters } = {},
    ) => {
      const token = getAuthToken()
      if (!token) {
        setLoadStatus("error")
        setLoadMessage("Sign in required for live portfolio data.")
        runtime.failLiveLoad?.("Sign in required for live portfolio data.")
        window.MatanhoPortfolioUI?.notify?.(
          "Sign in required",
          "Live portfolio data needs an authenticated session.",
          "error",
        )
        return
      }

      if (opts.filters) {
        filtersRef.current = { ...filtersRef.current, ...opts.filters }
      }

      // Load the signed-in user's effective Portfolio policy before any page
      // renders. The app switcher uses the same policy, and the embedded
      // Portfolio runtime must not fall back to its demonstration persona.
      if (!rbacSessionLoadedRef.current) {
        try {
          const rbac = await loadPortfolioSessionRbac()
          rbacSessionPermissionsRef.current = new Set(rbac.effectivePermissions)
          if (apiRef.current === runtime) runtime.hydrate?.({ data: { rbac } })
          rbacSessionLoadedRef.current = true
        } catch (error) {
          console.warn("[portfolio-v11] effective access could not be loaded; denying Portfolio page access", error)
          rbacSessionPermissionsRef.current.clear()
          if (apiRef.current === runtime) runtime.hydrate?.({ data: { rbac: { canManagePolicies: false, effectiveSource: "unavailable", effectivePermissions: [] } } })
          rbacSessionLoadedRef.current = true
        }
      }

      // The role directory is administrator-only and is loaded separately from
      // the signed-in user's effective permissions.
      if (page === "settings") {
        try {
          const rbac = await loadSettingsRbac()
          if (apiRef.current === runtime) runtime.hydrate?.({ data: { rbac } })
        } catch (error) {
          console.warn("[portfolio-v11] shared RBAC settings could not be loaded", error)
          if (apiRef.current === runtime) runtime.failRbacSettings?.(error instanceof Error ? error.message : "The Portfolio role directory could not be loaded.")
        }
      }

      const rawPlan = scopesForPage(page)
      const scopeResource: Partial<Record<PortfolioDataScope, string>> = {
        applications: "deals",
        funds: "funds",
        companies: "companies",
        capitalCalls: "capital_calls",
        distributions: "distributions",
        lps: "lp_management",
        cashAccounts: "cash_accounts",
        cashLedger: "cash_ledger",
        cashReservations: "reservations",
        statementImports: "statement_imports",
        recon: "reconciliations",
        exceptions: "exceptions",
        periodClose: "period_close",
        documents: "documents_vault",
        agreements: "e_signatures",
        reporting: "reporting_schedules",
        mailer: "mailer_lists",
        settings: "settings",
      }
      const canLoadScope = (scope: PortfolioDataScope) => {
        if (scope === "dashboard") return rbacSessionPermissionsRef.current.has("portfolio.dashboard.view")
        const resource = scopeResource[scope]
        return Boolean(resource && (
          rbacSessionPermissionsRef.current.has(`portfolio.${resource}.view`) ||
          rbacSessionPermissionsRef.current.has(`portfolio.${resource}.manage`)
        ))
      }
      // Page plans include related scopes for rich charts and filters. Only
      // request those datasets when this user can access their feature; a
      // dashboard-only policy must not fan out to denied fund/deal APIs.
      const plan = {
        primary: rawPlan.primary.filter(canLoadScope),
        secondary: rawPlan.secondary.filter(canLoadScope),
      }
      const hard = Boolean(opts.hard)
      const soft = Boolean(opts.soft) && paintedLiveRef.current && !hard

      const primary = hard
        ? plan.primary
        : plan.primary.filter((s) => !loadedScopesRef.current.has(s))
      const secondary = hard
        ? plan.secondary
        : plan.secondary.filter((s) => !loadedScopesRef.current.has(s))

      if (!primary.length && !secondary.length) {
        window.MatanhoPortfolioUI?.setPageLoading?.(false)
        setLoadStatus("ready")
        return
      }

      // Soft nav onto already-hydrated primary: drop any prior page skeleton.
      if (soft && !primary.length) {
        window.MatanhoPortfolioUI?.setPageLoading?.(false)
      }

      const gen = ++hydrateGenRef.current

      // Soft nav into unloaded scopes: page skeleton only — never beginLiveLoad (clears all collections).
      if (soft && primary.length) {
        window.MatanhoPortfolioUI?.setPageLoading?.(true)
      }

      if (!soft) {
        paintedLiveRef.current = false
        setLoadStatus("loading")
        setLoadMessage(primaryLoadLabel(page))
        // beginLiveLoad once — MatanhoPortfolioUI.beginLiveLoad is the same runtime method.
        ;(window.MatanhoPortfolioUI?.beginLiveLoad || runtime.beginLiveLoad)?.()
        if (hard) {
          for (const s of [...plan.primary, ...plan.secondary]) {
            loadedScopesRef.current.delete(s)
          }
        }
        // Instant paint from session cache while the remote DB request is in flight.
        if (primary.includes("applications")) {
          const cached = readCachedApplicationsPayload()
          if (cached) {
            applyHydrate(runtime, cached)
            paintedLiveRef.current = true
            setLoadStatus("ready")
            setLoadMessage("Showing cached deals · refreshing…")
          }
        }
      }

      try {
        // Primary scopes: request them concurrently, but hydrate each response as
        // it arrives so the first completed scope can still paint immediately.
        // The old serial loop made multi-scope pages wait for every preceding
        // request, multiplying latency on otherwise healthy connections.
        await Promise.all(
          primary.map(async (scope) => {
            const primaryPayload = await loadPortfolioV11Scopes([scope], filtersRef.current)
            if (gen !== hydrateGenRef.current) return
            if (apiRef.current !== runtime) return
            applyHydrate(runtime, primaryPayload)
            markScopes([scope])
            paintedLiveRef.current = true
            setLoadStatus("ready")
            setLoadMessage(summarizePayload(page, primaryPayload))
          }),
        )

        if (soft && primary.length) {
          window.MatanhoPortfolioUI?.setPageLoading?.(false)
        }

        if (!primary.length && !soft) {
          paintedLiveRef.current = true
          setLoadStatus("ready")
        }

        if (secondary.length) {
          // Secondary: fire each scope independently so one slow API does not block others.
          for (const scope of secondary) {
            void loadPortfolioV11Scopes([scope], filtersRef.current)
              .then((secondaryPayload) => {
                if (gen !== hydrateGenRef.current) return
                if (apiRef.current !== runtime) return
                applyHydrate(runtime, secondaryPayload)
                markScopes([scope])
              })
              .catch((err) => {
                console.warn(`[portfolio-v11] secondary scope ${scope} failed`, err)
              })
          }
        }
      } catch (err: any) {
        if (gen !== hydrateGenRef.current) return
        const msg = err?.message || "Failed to load portfolio data from API"
        setLoadStatus("error")
        setLoadMessage(msg)
        window.MatanhoPortfolioUI?.setPageLoading?.(false)
        if (!soft) {
          runtime.failLiveLoad?.(msg)
        }
        window.MatanhoPortfolioUI?.notify?.("Live data failed", msg, "error")
      }
    }

    const ensurePageData = (
      page: string,
      opts?: { soft?: boolean; hard?: boolean; filters?: PortfolioV11LoadFilters },
    ) => ensurePageDataRef.current?.(page, opts)

    const onBeforeAction = (event: Event) => {
      const ce = event as CustomEvent
      const detail = ce.detail || {}
      const named = new Set([
        "send-capital-call-notices",
        "capital-call-preview",
        "capital-call-preview-notice",
        "capital-call-submit-approval",
        "capital-call-approve",
        "capital-call-reject",
        "capital-call-activity",
        "capital-call-update",
        "send-notices",
        "run-recon-batch",
        "start-reconciliation",
        "approve-reservation",
        "release-reservation",
        "period-precheck",
        "run-pre-check",
        "run-close-precheck",
        "period-close",
        "close-period",
        "request-close-approval",
        "create-gl-export",
        "export-gl",
        "confirm-match",
        "manual-match",
        "manual-recon-match",
        "unmatch",
        "reverse-match",
        "change-deal-stage",
        // Phase 0/1 aliases (bridge usually emits api-* after form capture)
        "submit-capital-call",
        "submit-create-capital-call",
        "submit-lp",
        "add-lp",
        "submit-add-lp",
        "submit-create-fund",
        "create-fund-submit",
        "submit-company",
        "submit-add-deal",
        "submit-cash-account",
        "api-create-cash-account",
        "api-create-application",
        "api-create-fund",
        "api-add-lp",
        "api-create-company",
        "api-create-capital-call",
        "start-due-diligence",
        "complete-due-diligence",
        "submit-create-term-sheet",
        "submit-cash-account",
        "submit-start-board-review",
        "start-implementation",
        "submit-dd-assessment",
        "confirm-shortlist",
        "rerun-screening",
        "screen-reject",
        "human-review",
        "vote-approve",
        "vote-conditions",
        "vote-reject",
        "vote-defer",
        "final-vote",
        "finalize-term-sheet",
        "investor-sign-term-sheet",
        "complete-board-review",
        "confirm-release-tranche",
        "approve-disbursement",
        "api-create-envelope",
      ])
      const actionName = String(detail.action || "")
      const canInviteLp = rbacSessionPermissionsRef.current.has("portfolio.lp_management.create") || rbacSessionPermissionsRef.current.has("portfolio.lp_management.manage")
      const canCreateFund = rbacSessionPermissionsRef.current.has("portfolio.funds.create") || rbacSessionPermissionsRef.current.has("portfolio.funds.manage")
      if (['manage-lp-access', 'submit-lp-invite', 'api-invite-lp'].includes(actionName) && !canInviteLp) {
        event.preventDefault()
        window.MatanhoPortfolioUI?.notify?.('Access denied', 'GP operations or admin access is required to invite portal users.', 'error')
        return
      }
      if (
        ["create-fund", "submit-create-fund", "create-fund-submit", "api-create-fund"].includes(actionName) &&
        !canCreateFund
      ) {
        event.preventDefault()
        window.MatanhoPortfolioUI?.notify?.("Access denied", "Your Portfolio role does not have permission to create funds.", "error")
        return
      }
      // Form-backed submits need the runtime handleAction to gather FormData first.
      // Those handlers re-emit api-* which this listener then services.
      const formFirst = new Set([
        "submit-capital-call",
        "submit-lp",
        "add-lp",
        "submit-create-fund",
        "submit-company",
        "submit-add-deal",
        "submit-create-term-sheet",
        "submit-start-board-review",
        "submit-dd-assessment",
        "create-term-sheet",
        "start-board-review",
        "complete-due-diligence",
        "open-dd-assessment",
      ])
      if (formFirst.has(actionName)) return
      if (!named.has(actionName) && !actionName.startsWith("api-")) return
      event.preventDefault()
      if (actionBusyRef.current) return

      const action =
        detail.action === "run-close-precheck"
          ? "run-pre-check"
          : detail.action === "request-close-approval"
            ? "period-close"
            : detail.action === "api-create-fund"
              ? "submit-create-fund"
              : detail.action === "api-add-lp"
                ? "submit-add-lp"
                : detail.action === "api-create-capital-call"
                  ? "submit-create-capital-call"
                  : detail.action === "submit-capital-call"
                    ? "submit-create-capital-call"
                    : detail.action === "submit-lp" || detail.action === "add-lp"
                      ? "submit-add-lp"
                      : detail.action

      const busyLabel =
        String(action).includes("create") ||
        String(action).includes("submit") ||
        String(action).startsWith("api-")
          ? "Saving…"
          : String(action).includes("precheck") || String(action).includes("pre-check")
            ? "Running pre-check…"
            : String(action).includes("close")
              ? "Closing…"
              : "Working…"

      actionBusyRef.current = true
      const uiAction =
        detail.uiAction ||
        (detail.action === "api-complete-due-diligence"
          ? "complete-due-diligence"
          : detail.action === "api-update-due-diligence"
            ? "submit-dd-assessment"
            : detail.action === "api-create-term-sheet"
              ? "submit-create-term-sheet"
              : String(detail.action || ""))
      window.MatanhoPortfolioUI?.setActionBusy?.(true, busyLabel, uiAction)
      setLoadStatus("loading")
      setLoadMessage(busyLabel)

      const actionDetail =
        action === "api-initiate-implementation" || action === "start-implementation"
          ? {
              ...detail,
              action,
              fundId:
                detail.fundId ||
                (process.env.NODE_ENV !== "production"
                  ? process.env.NEXT_PUBLIC_LOCAL_UAT_FUND_ID || "cmvago6yv002punqkm0qbniwa"
                  : undefined),
            }
          : { ...detail, action }
      void handlePortfolioV11Action(actionDetail).then((result) => {
        actionBusyRef.current = false
        const uiAction =
          detail.uiAction ||
          (detail.action === "api-complete-due-diligence"
            ? "complete-due-diligence"
            : detail.action)
        window.MatanhoPortfolioUI?.setActionBusy?.(false, "", uiAction)
        if (result.error) {
          setLoadStatus("error")
          setLoadMessage(result.error)
          window.MatanhoPortfolioUI?.notify?.("Request failed", result.error, "error")
          return
        }
        if (!result.handled) {
          setLoadStatus("ready")
          return
        }
        setLoadStatus("ready")
        if (result.message) {
          setLoadMessage(result.message)
          window.MatanhoPortfolioUI?.notify?.(result.message, "Workspace refreshed from API.", result.tone || "success")
          if (String(detail.action || "").startsWith("api-") || detail.action === "submit-cash-account") {
            window.MatanhoPortfolioUI?.closeOverlays?.()
          }
          if (detail.action === "api-complete-due-diligence") {
            window.MatanhoPortfolioUI?.setDealTab?.("term")
          }
          if (detail.action === "api-create-term-sheet") {
            window.MatanhoPortfolioUI?.setDealTab?.("term")
          }
        }
        // Refresh only the page scopes that may have changed (e.g. new application → deals).
        const page = pathToPv11Page(pathnameRef.current)
        const actionStr = String(detail.action || "")
        if (
          actionStr.includes("application") ||
          actionStr.includes("deal") ||
          actionStr.includes("due-diligence") ||
          actionStr.includes("term-sheet") ||
          actionStr.includes("board-review") ||
          actionStr.includes("implementation") ||
          actionStr === "change-deal-stage"
        ) {
          loadedScopesRef.current.delete("applications")
          void ensurePageData(page, { soft: true })
        }
      })
    }

    const onReload = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      if (detail.reason === "add-deal") return
      const page = pathToPv11Page(pathnameRef.current)
      void ensurePageData(page, {
        hard: true,
        filters: {
          fundName: detail.fundName,
          asOfDate: detail.asOfDate,
          currencyCode: detail.currencyCode,
          geography: detail.geography,
          closePeriod: detail.closePeriod,
        },
      })
    }

    const onDealDetail = (event: Event) => {
      const id = (event as CustomEvent).detail?.applicationId
      if (!id) return
      window.MatanhoPortfolioUI?.setDealDetailLoading?.(true)
      void hydrateDealDetail(id)
        .then((detail) => {
          if (detail.errors?.length) {
            setLoadMessage(`Deal detail partial: ${detail.errors.join("; ")}`)
          }
        })
        .finally(() => {
          window.MatanhoPortfolioUI?.setDealDetailLoading?.(false)
        })
    }

    const onFundDetail = (event: Event) => {
      const fundId = (event as CustomEvent).detail?.fundId
      if (!fundId) return
      // Fetch the related detail collections together and publish one snapshot so
      // each response cannot independently replace the visible page.
      const snapshots = fundsApi
        .getPerformanceSnapshots(fundId)
        .then((res) => res?.data || [])
        .catch(() => [])
      const documents = fundsApi
        .getDocuments(fundId)
        .then((res) => res?.data || [])
        .catch(() => [])
      // The fund register carries no distribution column, so the profile reads the
      // fund's own declared distributions. Publishing the rows lets the Capital tab
      // render the register and derive the headline from the same records.
      const distributions = distributionsApi
        .list(fundId)
        .then((res) => asArray((res as any)?.data ?? res))
        .catch(() => null)
      void Promise.all([snapshots, documents, distributions]).then(([snapshotRows, documentRows, distributionRows]) => {
        window.MatanhoPortfolioUI?.setFundDetailData?.(fundId, snapshotRows, documentRows, distributionRows)
      })
    }

    const onUploadFundDocument = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const { fundId, file, category } = detail
      if (!fundId || !file) return
      window.MatanhoPortfolioUI?.notify?.('Uploading…', file.name, 'info')
      void fundsApi
        .uploadDocument(fundId, file, category)
        .then(() => {
          window.MatanhoPortfolioUI?.notify?.('Document uploaded', file.name, 'success')
          return fundsApi.getDocuments(fundId)
        })
        .then((res) => {
          if (res) window.MatanhoPortfolioUI?.setFundDocuments?.(fundId, res.data || [])
        })
        .catch((err: any) => {
          window.MatanhoPortfolioUI?.notify?.('Upload failed', err?.message || 'Could not upload document', 'error')
        })
    }

    const onPrepareDdTaskModal = () => {
      void applicationsApi
        .getInvestmentUsers()
        .then((res) => {
          const users = asArray((res as any)?.data ?? res)
          window.MatanhoPortfolioUI?.openDdTaskModal?.(users)
        })
        .catch((err: any) => {
          window.MatanhoPortfolioUI?.notify?.(
            "Could not load investment users",
            err?.message || "Assign-task user list failed",
            "error",
          )
          window.MatanhoPortfolioUI?.openDdTaskModal?.([])
        })
    }

    const onRetryLiveLoad = () => {
      loadedScopesRef.current.clear()
      paintedLiveRef.current = false
      const page = pathToPv11Page(pathnameRef.current)
      void ensurePageData(page, { hard: true })
    }

    const onLoadSignatureTemplates = () => {
      void fundraisingApi
        .listAgreementTemplates()
        .then((templates) => {
          window.MatanhoPortfolioUI?.openSignatureTemplatesModal?.(asArray(templates))
        })
        .catch((err: any) => {
          window.MatanhoPortfolioUI?.notify?.(
            "Could not load signature templates",
            err?.message || "Template list failed to load.",
            "error",
          )
          window.MatanhoPortfolioUI?.openSignatureTemplatesModal?.([])
        })
    }

    window.addEventListener("matanho:before-action", onBeforeAction)
    window.addEventListener("matanho:reload-request", onReload)
    window.addEventListener("matanho:load-deal-detail", onDealDetail)
    window.addEventListener("matanho:load-fund-detail", onFundDetail)
    window.addEventListener("matanho:upload-fund-document", onUploadFundDocument)
    window.addEventListener("matanho:prepare-dd-task-modal", onPrepareDdTaskModal)
    window.addEventListener("matanho:load-signature-templates", onLoadSignatureTemplates)
    window.addEventListener("pv11:retry-live-load", onRetryLiveLoad)
    void ensurePageData(initialPage)
    if (initialPage === "deal-detail") {
      const dealId =
        new URLSearchParams(window.location.search).get("id") ||
        sessionStorage.getItem("pv11.selectedDealId") ||
        ""
      if (dealId) {
        window.MatanhoPortfolioUI?.setDealDetailLoading?.(true)
        void hydrateDealDetail(dealId).finally(() => {
          window.MatanhoPortfolioUI?.setDealDetailLoading?.(false)
        })
      }
    }

    return () => {
      hydrateGenRef.current += 1
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("matanho:before-action", onBeforeAction)
      window.removeEventListener("matanho:reload-request", onReload)
      window.removeEventListener("matanho:load-deal-detail", onDealDetail)
      window.removeEventListener("matanho:load-fund-detail", onFundDetail)
      window.removeEventListener("matanho:upload-fund-document", onUploadFundDocument)
      window.removeEventListener("matanho:prepare-dd-task-modal", onPrepareDdTaskModal)
      window.removeEventListener("matanho:load-signature-templates", onLoadSignatureTemplates)
      window.removeEventListener("pv11:retry-live-load", onRetryLiveLoad)
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Pathname only — see the note on initialPath above.
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : pathname
    const page = currentPath.includes("/portfolio/settings") ? "settings" : pathToPv11Page(currentPath)
    const dealId =
      page === "deal-detail"
        ? new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("id") ||
          (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("pv11.selectedDealId") : null) ||
          undefined
        : undefined
    const lpId =
      page === "lp-detail"
        ? new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("id") || undefined
        : undefined
    apiRef.current?.setPage(page, {
      ...(dealId ? { selectedDealId: dealId } : {}),
      ...(lpId ? { selectedLPId: lpId } : {}),
    })
    // Soft ensure when URL changes (sidebar soft-nav already calls ensure; this covers
    // direct path / Next router changes without remounting the layout host).
    void ensurePageDataRef.current?.(page, { soft: true })
    if (page === "deal-detail" && dealId) {
      window.MatanhoPortfolioUI?.setDealDetailLoading?.(true)
      void hydrateDealDetail(dealId).finally(() => {
        window.MatanhoPortfolioUI?.setDealDetailLoading?.(false)
      })
    }
  }, [pathname])

  return (
    <div className="relative h-full">
    <div
      ref={rootRef}
        className={`portfolio-v11-root h-full${loadStatus === "loading" ? " is-host-loading" : ""}`}
        data-live={loadStatus === "ready" ? "true" : "false"}
        data-load={loadStatus}
    />
    </div>
  )
}
