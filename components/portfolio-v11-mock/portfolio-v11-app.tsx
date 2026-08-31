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
import { applicationsApi } from "@/lib/api/applications-api"
import { asArray } from "@/lib/portfolio-v11/adapters"
import { getAuthToken } from "@/lib/utils/cookies"
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

declare global {
  interface Window {
    __APPLY_PORTAL_URL__?: string
    __INVESTEE_PORTAL_URL__?: string
    MatanhoPortfolioUI?: {
      hydrate: (payload: unknown) => void
      beginLiveLoad?: () => void
      failLiveLoad?: (message?: string) => void
      getSnapshot?: () => { state?: { selectedDealId?: string; page?: string } }
      setDealDetail?: (detail: unknown) => void
      setDealDetailLoading?: (loading: boolean) => void
      setInvestmentUsers?: (users: unknown[]) => void
      openDdTaskModal?: (users?: unknown[]) => void
      notify?: (title: string, body?: string, tone?: string) => void
      closeOverlays?: () => void
      setActionBusy?: (busy: boolean, message?: string, actionName?: string) => void
      setDealTab?: (tab: string) => void
    }
  }
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
  const paintedLiveRef = useRef(false)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const ensurePageDataRef = useRef<
    null | ((page: string, opts?: { soft?: boolean; hard?: boolean; filters?: PortfolioV11LoadFilters }) => Promise<void>)
  >(null)
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "ready" | "error">("loading")
  const [loadMessage, setLoadMessage] = useState<string | null>("Loading live portfolio…")

  useEffect(() => {
  pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    if (shouldRedirectFundingApplicationToApplyPortal()) {
      window.__APPLY_PORTAL_URL__ = APPLY_PORTAL_EXTERNAL_URL.replace(/\/$/, "")
    } else {
      delete window.__APPLY_PORTAL_URL__
    }
    window.__INVESTEE_PORTAL_URL__ = INVESTEE_PORTAL_EXTERNAL_URL.replace(/\/$/, "")

    const initialPage = pathToPv11Page(pathnameRef.current)

    const runtime = startPortfolioV11Runtime(el, {
      shellHtml: PORTFOLIO_V11_SHELL_HTML,
      initialPage,
      liveOnly: true,
      onNavigate: (page: string) => {
        let path = PV11_PAGE_TO_PATH[page] || "/portfolio-v11"
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
          if (dealId) path = `/portfolio-v11/deals/detail?id=${encodeURIComponent(String(dealId))}`
        }
        const pathOnly = path.split("?")[0]
        if (pathnameRef.current === pathOnly && page !== "deal-detail") return
        pathnameRef.current = pathOnly
        window.history.pushState({ portfolioV11: page }, "", path)
        void ensurePageDataRef.current?.(page, { soft: true })
      },
    })
    apiRef.current = runtime

    const onPopState = () => {
      const nextPath = window.location.pathname
      pathnameRef.current = nextPath
      const page = pathToPv11Page(nextPath)
      const dealId =
        page === "deal-detail"
          ? new URLSearchParams(window.location.search).get("id") ||
            sessionStorage.getItem("pv11.selectedDealId") ||
            undefined
          : undefined
      apiRef.current?.setPage(page, dealId ? { selectedDealId: dealId } : undefined)
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

      const plan = scopesForPage(page)
      const hard = Boolean(opts.hard)
      const soft = Boolean(opts.soft) && paintedLiveRef.current && !hard

      const primary = hard
        ? plan.primary
        : plan.primary.filter((s) => !loadedScopesRef.current.has(s))
      const secondary = hard
        ? plan.secondary
        : plan.secondary.filter((s) => !loadedScopesRef.current.has(s))

      if (!primary.length && !secondary.length) {
        setLoadStatus("ready")
        return
      }

      const gen = ++hydrateGenRef.current

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
        // Primary scopes: hydrate after each so the page paints ASAP.
        for (let i = 0; i < primary.length; i++) {
          const scope = primary[i]
          const primaryPayload = await loadPortfolioV11Scopes([scope], filtersRef.current)
          if (gen !== hydrateGenRef.current) return
          if (apiRef.current !== runtime) return
          applyHydrate(runtime, primaryPayload)
          markScopes([scope])
          paintedLiveRef.current = true
          setLoadStatus("ready")
          setLoadMessage(summarizePayload(page, primaryPayload))
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
      ])
      const actionName = String(detail.action || "")
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

      void handlePortfolioV11Action({ ...detail, action }).then((result) => {
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
          window.MatanhoPortfolioUI?.notify?.(result.message, "Workspace refreshed from API.", "success")
          if (String(detail.action || "").startsWith("api-")) {
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

    window.addEventListener("matanho:before-action", onBeforeAction)
    window.addEventListener("matanho:reload-request", onReload)
    window.addEventListener("matanho:load-deal-detail", onDealDetail)
    window.addEventListener("matanho:prepare-dd-task-modal", onPrepareDdTaskModal)
    window.addEventListener("pv11:retry-live-load", onRetryLiveLoad)
    void ensurePageData(initialPage)

    return () => {
      hydrateGenRef.current += 1
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("matanho:before-action", onBeforeAction)
      window.removeEventListener("matanho:reload-request", onReload)
      window.removeEventListener("matanho:load-deal-detail", onDealDetail)
      window.removeEventListener("matanho:prepare-dd-task-modal", onPrepareDdTaskModal)
      window.removeEventListener("pv11:retry-live-load", onRetryLiveLoad)
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const page = pathToPv11Page(pathname)
    const dealId =
      page === "deal-detail"
        ? new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("id") ||
          (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("pv11.selectedDealId") : null) ||
          undefined
        : undefined
    apiRef.current?.setPage(page, dealId ? { selectedDealId: dealId } : undefined)
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
      data-theme="light"
        data-live={loadStatus === "ready" ? "true" : "false"}
        data-load={loadStatus}
    />
    </div>
  )
}
