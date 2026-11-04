"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import {
  pathToAc52Page,
  AC52_PAGE_TO_PATH,
} from "@/lib/accounting-v52-mock/nav"
import { startAccountingV52Runtime } from "@/components/accounting-v52-mock/matanho-accounting-runtime"
import { ACCOUNTING_V52_SHELL_HTML } from "@/components/accounting-v52-mock/shell"
import { loadAc52Scopes, scopesForAc52Page, type Ac52DataScope } from "@/lib/accounting-v52/live-loaders"
import { handleAccountingV52Action } from "@/lib/accounting-v52/actions"
import { downloadAc52Export } from "@/lib/accounting-v52/export"
import { toast } from "sonner"
import type { Ac52Account } from "@/lib/accounting-v52/types"
import "@/components/accounting-v52-mock/accounting-v52.css"
import "@/components/accounting-v52-mock/accounting-v52-live.css"
import { apiClient } from "@/lib/api/api-client"
import { getAuthUser, getUserProfile } from "@/lib/utils/cookies"
import { AccountingDashboardV2 } from "@/components/accounting/accounting-dashboard-v2"
import { GeneralLedger } from "@/components/accounting/general-ledger"
import { FinancialReports } from "@/components/accounting/financial-reports"
import { CashbookLegacyContent } from "@/components/accounting/cashbook-legacy-content"
import { PayablesLegacyContent } from "@/components/accounting/payables-legacy-content"
import { ReceivablesLegacyContent } from "@/components/accounting/receivables-legacy-content"
import { BankReconciliationLegacyContent } from "@/components/accounting/bank-reconciliation-legacy-content"
import { LegacyMountHost } from "@/components/accounting-v52-mock/legacy-mount-host"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
  hydrate?: (payload: unknown) => void
  beginLiveLoad?: () => void
  endLiveLoad?: () => void
  failLiveLoad?: (message?: string) => void
  commitSuccess?: (title: string, message?: string, pageId?: string) => void
  commitError?: (err: unknown) => void
}

/** Keep route observation isolated so a pathname transition cannot suspend and replace the
 * Accounting shell/runtime with the module-wide loading fallback. */
function AccountingV52PathnameBridge({ onPathnameChange }: { onPathnameChange: (pathname: string) => void }) {
  const pathname = usePathname()
  useEffect(() => onPathnameChange(pathname), [onPathnameChange, pathname])
  return null
}

export function AccountingV52App() {
  const rootRef = useRef<HTMLDivElement>(null)
  // The portal container has to be a node whose identity survives the runtime's render passes. The live layer
  // re-emits its page HTML on every render, so #ac52LegacyDashboardSlot / #ac52LegacyLedgerSlot are replaced a
  // few times while a page comes up; portalling straight into the slot remounted the legacy screen on each
  // replacement (measured: three mounts on the General Ledger, so three register fetches racing the
  // currency-filtered one, a visible skeleton flash, and the register able to settle on the un-filtered
  // response). These persistent host divs are re-homed into whatever the current slot element is, so the
  // portalled tree mounts exactly once per visit, the same as it does on the standalone legacy route.
  const legacyDashboardHostRef = useRef<HTMLElement | null>(null)
  const legacyLedgerHostRef = useRef<HTMLElement | null>(null)
  const legacyReportsHostRef = useRef<HTMLElement | null>(null)
  const legacyCashHostRef = useRef<HTMLElement | null>(null)
  const legacyPayablesHostRef = useRef<HTMLElement | null>(null)
  const legacyReceivablesHostRef = useRef<HTMLElement | null>(null)
  const legacyReconciliationHostRef = useRef<HTMLElement | null>(null)
  const [legacyDashboardHost, setLegacyDashboardHost] = useState<HTMLElement | null>(null)
  const [legacyLedgerHost, setLegacyLedgerHost] = useState<HTMLElement | null>(null)
  const [legacyReportsHost, setLegacyReportsHost] = useState<HTMLElement | null>(null)
  const [legacyCashHost, setLegacyCashHost] = useState<HTMLElement | null>(null)
  const [legacyPayablesHost, setLegacyPayablesHost] = useState<HTMLElement | null>(null)
  const [legacyReceivablesHost, setLegacyReceivablesHost] = useState<HTMLElement | null>(null)
  const [legacyReconciliationHost, setLegacyReconciliationHost] = useState<HTMLElement | null>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const [pathname, setPathname] = useState(() => typeof window === "undefined" ? "/accounting" : window.location.pathname)
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const loadedScopesRef = useRef<Set<Ac52DataScope>>(new Set())
  // Scopes with a fetch in flight right now, mapped to that fetch. loadedScopesRef is only
  // written after the await resolves, so without this a scope requested again in the
  // meantime refetches instead of joining the request already running.
  const pendingScopesRef = useRef<Map<Ac52DataScope, Promise<void>>>(new Map())
  const accountsCacheRef = useRef<Ac52Account[]>([])
  const busyRef = useRef(false)
  const ensurePageDataRef = useRef<null | ((page: string) => Promise<void>)>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToAc52Page(pathnameRef.current)
    // The runtime fires a couple of internal render passes at startup before its
    // page state settles on `initialPage` (early version-layer setup code renders
    // against the constructor's default page first). Each render calls onNavigate,
    // so without this guard a deep link (initialPage !== 'overview') gets bounced
    // to the root route before the runtime ever shows the real page. Ignore nav
    // calls that don't match initialPage until we've seen one that does.
    let hasSettledOnInitialPage = initialPage === "overview"
    // While the runtime starts it renders against pages that are not registered yet (the live layer adds Payment Runs
    // and Scheduled Jobs last), so a deep link to one of those briefly reads as the Command Centre. Nothing it reports
    // before it has finished starting is a navigation; the requested page is opened once it has.
    let starting = true
    // Pages patched for live data (scripts/patch-accounting-v52-runtime.mjs) render the records instead of samples.
    ;(window as any).__AC52_LIVE__ = true
    ;(window as any).__AC52_LEGACY_DASHBOARD__ = pathnameRef.current === "/accounting"
    // The live layer (scripts/accounting-live, synced into the runtime) reads and writes through these: every call carries
    // the signed-in user's token, and the server decides what that user may do.
    ;(window as any).__AC52_HTTP__ = {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api",
      get: (p: string) => apiClient.get<any>(p),
      post: (p: string, b?: unknown) => apiClient.post<any>(p, b ?? {}),
      put: (p: string, b?: unknown) => apiClient.put<any>(p, b ?? {}),
      patch: (p: string, b?: unknown) => apiClient.patch<any>(p, b ?? {}),
      del: (p: string) => apiClient.delete<any>(p),
      text: (p: string) => apiClient.get<string>(p, { responseType: "text" }),
      form: (p: string, fd: FormData) => apiClient.postFormData<any>(p, fd),
    }
    // Page exports (PDF / Excel / CSV): the live layer builds a plain spec of what the page shows and this writes the
    // file using the client-supplied NVCCZ branding in every environment.
    ;(window as any).__AC52_EXPORT__ = downloadAc52Export
    ;(window as any).__AC52_ME__ = () => {
      const u: any = getUserProfile() ?? getAuthUser() ?? {}
      return { id: u.id ?? null, name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "", email: u.email ?? "", role: u.role?.name ?? u.roleName ?? "" }
    }
    const runtime = startAccountingV52Runtime(el, {
      shellHtml: ACCOUNTING_V52_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        if (starting) return
        if (!hasSettledOnInitialPage) {
          if (page !== initialPage) return
          hasSettledOnInitialPage = true
        }
        // Pages with no entry (e.g. the V11 Period Close system's internal drill-down ids
        // like 'v11ws'/'v11task') are client-side-only sub-views nested inside a mapped
        // page's URL (e.g. '/accounting/close') — the runtime re-renders in place without
        // changing the Next.js route, so there's nothing to push here.
        const path = AC52_PAGE_TO_PATH[page]
        if (path && `${window.location.pathname}${window.location.search}` !== path) {
          // Accounting pages share this persistent client shell. Use the App Router's
          // native-history integration so the URL and back button stay in sync without
          // suspending/remounting the whole module during a sidebar click.
          window.history.pushState(window.history.state, "", path)
          setPathname(path.split("?")[0])
        }
        void ensurePageDataRef.current?.(page)
      },
    })
    apiRef.current = runtime
    starting = false
    runtime.setPage(initialPage)

    // Keep the current V52 shell and navigation, but render the established legacy
    // dashboard React screen inside the overview content slot on /accounting only.
    // The General Ledger is restored the same way: the live layer's ledger page emits an
    // empty mount point (#ac52LegacyLedgerSlot) and the legacy React <GeneralLedger/> is
    // portalled into it, so the old UI and its accountingApi integration come back intact
    // while the V52 nav rail, topbar and app switcher stay in place around them.
    const hostFor = (slotSelector: string, ref: { current: HTMLElement | null }) => {
      const slot = el.querySelector<HTMLElement>(slotSelector)
      // Absent means the runtime is mid-render of another pass; keep the current host and let the next
      // mutation tick re-home it. Unmounting is driven by the route effect below, never by this.
      if (!slot) return null
      let host = ref.current
      if (!host) {
        host = document.createElement("div")
        host.dataset.ac52LegacyHost = slotSelector.slice(1)
        ref.current = host
      }
      if (host.parentElement !== slot) slot.appendChild(host)
      return host
    }
    const syncLegacySlots = () => {
      const dash = hostFor("#ac52LegacyDashboardSlot", legacyDashboardHostRef)
      if (dash) setLegacyDashboardHost((current) => (current === dash ? current : dash))
      const ledger = hostFor("#ac52LegacyLedgerSlot", legacyLedgerHostRef)
      if (ledger) setLegacyLedgerHost((current) => (current === ledger ? current : ledger))
      const reports = hostFor("#ac52LegacyReportsSlot", legacyReportsHostRef)
      if (reports) setLegacyReportsHost((current) => (current === reports ? current : reports))
      const cash = hostFor("#ac52LegacyCashSlot", legacyCashHostRef)
      if (cash) setLegacyCashHost((current) => (current === cash ? current : cash))
      const payables = hostFor("#ac52LegacyPayablesSlot", legacyPayablesHostRef)
      if (payables) setLegacyPayablesHost((current) => (current === payables ? current : payables))
      const receivables = hostFor("#ac52LegacyReceivablesSlot", legacyReceivablesHostRef)
      if (receivables) setLegacyReceivablesHost((current) => (current === receivables ? current : receivables))
      const reconciliation = hostFor("#ac52LegacyReconciliationSlot", legacyReconciliationHostRef)
      if (reconciliation) setLegacyReconciliationHost((current) => (current === reconciliation ? current : reconciliation))
    }
    const dashboardSlotObserver = new MutationObserver(syncLegacySlots)
    dashboardSlotObserver.observe(el, { childList: true, subtree: true })
    syncLegacySlots()

    // Every Accounting style is scoped to .accounting-v52-root, but the runtime appends its drawers, focus and deep
    // views, toolbar and menus to <body>, where they rendered unstyled below the page (and the sidebar covered
    // Payables' Pay button). Keep each of them inside the module root, as it is added.
    const belongsInRoot = (node: Element) =>
      /^v\d+[A-Z]/.test(node.id) || Array.from(node.classList).some((c) => /^v\d+-/.test(c))
    const adoptRuntimeLayers = () => {
      for (const child of Array.from(document.body.children)) {
        if (child.tagName !== "SCRIPT" && belongsInRoot(child)) el.appendChild(child)
      }
    }
    adoptRuntimeLayers()
    const bodyObserver = new MutationObserver(adoptRuntimeLayers)
    bodyObserver.observe(document.body, { childList: true })

    ensurePageDataRef.current = async (page: string) => {
      const plan = scopesForAc52Page(page)
      // Three call sites reach this on a single cold load — the mount call below, the
      // pathname effect, and the runtime's own onNavigate callback — and the runtime can
      // fire onNavigate more than once while it boots. Filtering on loadedScopesRef alone
      // deduplicated none of them, because that set is only written after the fetch
      // resolves: measured live, every endpoint on Command Centre was fetched 6x per load.
      // Skipping scopes that are already in flight collapses that back to one fetch each.
      const primary = plan.primary.filter(
        (s) => !loadedScopesRef.current.has(s) && !pendingScopesRef.current.has(s),
      )
      if (!primary.length) {
        // Nothing new to fetch, but a fetch this page depends on may still be running —
        // await it so callers that refresh after a write (invalidateScopes below) observe
        // the hydrated data rather than returning before it lands.
        const inFlight = plan.primary
          .map((s) => pendingScopesRef.current.get(s))
          .filter((p): p is Promise<void> => Boolean(p))
        if (inFlight.length) await Promise.all(inFlight)
        return
      }
      runtime.beginLiveLoad?.()
      // Declared up front (rather than `const run = (async () => ...)()`) so the finally
      // block below can compare against it — TS cannot prove definite assignment for a const
      // referenced from inside the very expression that initialises it.
      let run: Promise<void> | undefined
      run = (async () => {
        try {
          const payload = await loadAc52Scopes(primary)
          if (apiRef.current !== runtime) return
          if (Array.isArray(payload.data?.accounts)) accountsCacheRef.current = payload.data!.accounts!
          runtime.hydrate?.(payload)
          for (const s of primary) loadedScopesRef.current.add(s)
          runtime.endLiveLoad?.()
          if (payload.meta.errors.length) {
            runtime.failLiveLoad?.(payload.meta.errors.join("; "))
          }
        } catch (err: any) {
          runtime.failLiveLoad?.(err?.message || "Failed to load live accounting data.")
        } finally {
          // Only clear our own entry: an invalidation during this fetch drops it from the
          // map and starts a newer one under the same key, which must not be evicted here.
          for (const s of primary) {
            if (pendingScopesRef.current.get(s) === run) pendingScopesRef.current.delete(s)
          }
        }
      })()
      // Safe to register after starting `run`: it runs synchronously only up to its first
      // await, so no other caller can observe an empty pending map before this loop.
      for (const s of primary) pendingScopesRef.current.set(s, run!)
      await run
    }

    const onBeforeAction = (event: Event) => {
      const ce = event as CustomEvent
      const detail = ce.detail || {}
      const action = String(detail.action || "")
      const LIVE_ACTIONS = new Set([
        "coa-save",
        "upload-document",
        "close-task-complete",
        "timesheet-approve",
        "timesheet-return",
        "create-tax-pack",
        "approval-decision",
        "journal-submit",
        "ap-pay-bill",
        "invoice-create",
        "customer-create",
        "cash-post",
        "receipt-post",
        "expense-create",
        "stock-adjust",
        "asset-create",
        "recurring-run",
        "recurring-run-due",
        "recon-signoff",
      ])
      if (!LIVE_ACTIONS.has(action)) return
      event.preventDefault()
      if (busyRef.current) return
      busyRef.current = true

      const payload = { ...(detail.payload || {}) }
      if (action === "coa-save" && payload.original) {
        const match = accountsCacheRef.current.find((a) => a.code === payload.original)
        if (match?.backendId) payload.backendId = match.backendId
      }

      void handleAccountingV52Action({ action, payload }).then(async (result) => {
        busyRef.current = false
        if (result.error) {
          // The runtime’s commitError/commitSuccess look for handlers that live in another of its closures, so on their own they
          // showed nothing: every Accounting write was silent, success or failure. Say it here as well.
          toast.error(result.error)
          runtime.commitError?.(new Error(result.error))
          return
        }
        if (!result.handled) return
        // Re-fetch so the UI reflects the authoritative saved row (server-assigned ids, validation-normalised fields).
        // A journal's status (submit/post/void) feeds many other pages that all read the same
        // ledger — Command Centre and General Ledger both list recent journals, Cash/Reconciliation
        // derive bank balances from posted lines, and Financial Reports/Trial Balance are built
        // from the full journal set. Any action that touches a journal must invalidate all of them,
        // not just the scope of the page the action was triggered from — a prior version of this
        // only invalidated "approvals" on approval-decision, leaving Command Centre showing a
        // journal as "Submitted" for the rest of the session after it had actually been voided.
        const JOURNAL_DEPENDENT_SCOPES: Ac52DataScope[] = ["journals", "approvals", "cash", "reconciliation", "statements"]
        const ACTION_SCOPE: Record<string, { scopes: Ac52DataScope[]; title: string }> = {
          "coa-save": { scopes: ["coa"], title: "Chart of Accounts updated" },
          "upload-document": { scopes: ["vault"], title: "Document uploaded" },
          "close-task-complete": { scopes: ["close"], title: "Close task completed" },
          "timesheet-approve": { scopes: ["timesheets"], title: "Timesheet approved" },
          "timesheet-return": { scopes: ["timesheets"], title: "Timesheet returned" },
          "create-tax-pack": { scopes: ["compliance"], title: "Tax pack created" },
          // Approving/rejecting can post or void a journal, execute a payment (cash/payables),
          // book an investment, or apply a CoA change — invalidate broadly rather than guess which.
          "approval-decision": { scopes: [...JOURNAL_DEPENDENT_SCOPES, "coa", "payables", "investments"], title: "Approval processed" },
          "journal-submit": { scopes: JOURNAL_DEPENDENT_SCOPES, title: "Journal submitted" },
          // A supplier payment posts a journal and a cashbook entry, and reduces the bill (and the procurement invoice).
          "ap-pay-bill": { scopes: ["payables", ...JOURNAL_DEPENDENT_SCOPES], title: "Supplier payment" },
          "invoice-create": { scopes: ["receivables", ...JOURNAL_DEPENDENT_SCOPES], title: "Customer invoice created" },
          "customer-create": { scopes: ["receivables"], title: "Customer created" },
          "cash-post": { scopes: ["cash", ...JOURNAL_DEPENDENT_SCOPES], title: "Cashbook entry posted" },
          "receipt-post": { scopes: ["receivables", "cash", ...JOURNAL_DEPENDENT_SCOPES], title: "Customer receipt posted" },
          "expense-create": { scopes: ["expenses", ...JOURNAL_DEPENDENT_SCOPES], title: "Expense recorded" },
          "stock-adjust": { scopes: ["inventory", ...JOURNAL_DEPENDENT_SCOPES], title: "Inventory updated" },
          "asset-create": { scopes: ["assets", ...JOURNAL_DEPENDENT_SCOPES], title: "Fixed asset created" },
          "recurring-run": { scopes: ["recurring", ...JOURNAL_DEPENDENT_SCOPES], title: "Recurring schedule run" },
          "recurring-run-due": { scopes: ["recurring", ...JOURNAL_DEPENDENT_SCOPES], title: "Due schedules processed" },
          "recon-signoff": { scopes: ["reconciliation", "cash", ...JOURNAL_DEPENDENT_SCOPES], title: "Reconciliation signed off" },
        }
        const meta = ACTION_SCOPE[action] || { scopes: ["coa"] as Ac52DataScope[], title: "Updated" }
        // Drop the in-flight entry too, not just the loaded flag: a fetch issued before this
        // write would return pre-write data, and leaving it registered would make the refresh
        // below join that stale request instead of issuing a new one.
        for (const scope of meta.scopes) {
          loadedScopesRef.current.delete(scope)
          pendingScopesRef.current.delete(scope)
        }
        if (action === "ap-pay-bill") {
          // Say the bill is paid (and close the Pay dialog) as soon as the payment is recorded, then reload the six
          // registers it touches behind the message. Waiting for them first left the dialog open with no word for over
          // two minutes on dev, after the payment had already been made.
          toast.success(meta.title, { description: result.message })
          runtime.commitSuccess?.(meta.title, result.message, meta.scopes[0])
          await ensurePageDataRef.current?.(pathToAc52Page(pathnameRef.current))
          return
        }
        await ensurePageDataRef.current?.(pathToAc52Page(pathnameRef.current))
        toast.success(meta.title, { description: result.message })
        runtime.commitSuccess?.(meta.title, result.message, meta.scopes[0])
      })
    }

    window.addEventListener("matanho:before-action", onBeforeAction)
    void ensurePageDataRef.current(initialPage)

    return () => {
      window.removeEventListener("matanho:before-action", onBeforeAction)
      delete (window as any).__AC52_HTTP__
      delete (window as any).__AC52_EXPORT__
      delete (window as any).__AC52_ME__
      delete (window as any).__AC52_LEGACY_DASHBOARD__
      dashboardSlotObserver.disconnect()
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const page = pathToAc52Page(pathname)
    ;(window as any).__AC52_LEGACY_DASHBOARD__ = pathname === "/accounting"
    apiRef.current?.setPage(page)
    void ensurePageDataRef.current?.(page)
    // Leaving the screen that hosts a portalled legacy module is the only thing that tears it down; the
    // slot churning underneath it during a render pass must not (see hostFor above).
    if (pathname !== "/accounting") setLegacyDashboardHost(null)
    if (pathname !== "/accounting/general-ledger") setLegacyLedgerHost(null)
    if (pathname !== "/accounting/reports" && pathname !== "/accounting/consolidation") setLegacyReportsHost(null)
    if (pathname !== "/accounting/cash-book") setLegacyCashHost(null)
    if (pathname !== "/accounting/payables") setLegacyPayablesHost(null)
    if (pathname !== "/accounting/receivables") setLegacyReceivablesHost(null)
    if (pathname !== "/accounting/bank-reconciliation") setLegacyReconciliationHost(null)
  }, [pathname])

  return (
    <>
      <Suspense fallback={null}>
        <AccountingV52PathnameBridge onPathnameChange={setPathname} />
      </Suspense>
      <div ref={rootRef} className="accounting-v52-root h-full" />
      {legacyDashboardHost && createPortal(<LegacyMountHost><AccountingDashboardV2 /></LegacyMountHost>, legacyDashboardHost)}
      {legacyLedgerHost && createPortal(<LegacyMountHost><GeneralLedger /></LegacyMountHost>, legacyLedgerHost)}
      {legacyReportsHost && createPortal(<LegacyMountHost><FinancialReports /></LegacyMountHost>, legacyReportsHost)}
      {legacyCashHost && createPortal(<LegacyMountHost><CashbookLegacyContent enhanced /></LegacyMountHost>, legacyCashHost)}
      {legacyPayablesHost && createPortal(<LegacyMountHost><PayablesLegacyContent enhanced /></LegacyMountHost>, legacyPayablesHost)}
      {legacyReceivablesHost && createPortal(<LegacyMountHost><ReceivablesLegacyContent enhanced /></LegacyMountHost>, legacyReceivablesHost)}
      {legacyReconciliationHost && createPortal(<LegacyMountHost><BankReconciliationLegacyContent /></LegacyMountHost>, legacyReconciliationHost)}
    </>
  )
}
