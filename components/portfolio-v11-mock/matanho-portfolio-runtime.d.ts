declare module "@/components/portfolio-v11-mock/matanho-portfolio-runtime" {
  export function startPortfolioV11Runtime(
    rootEl: HTMLElement,
    options?: {
      shellHtml?: string
      initialPage?: string
      /** When true (default), Matanho fixtures never paint — API / empty only. */
      liveOnly?: boolean
      onNavigate?: (page: string) => void
    }
  ): {
    setPage: (page: string, detail?: Record<string, string>) => void
    destroy: () => void
    beginLiveLoad?: () => void
    failLiveLoad?: (message?: string) => void
    hydrate?: (payload: unknown) => void
  }
}

/**
 * Single source of truth for the runtime's public JS bridge
 * (window.MatanhoPortfolioUI, set by matanho-portfolio-runtime.js).
 * Do not redeclare this in individual .ts/.tsx files — import nothing,
 * it applies ambiently once this file is part of the program.
 */
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
      setPageLoading?: (loading: boolean) => void
      setInvestmentUsers?: (users: unknown[]) => void
      openDdTaskModal?: (users?: unknown[]) => void
      openSignatureTemplatesModal?: (templates?: unknown[]) => void
      notify?: (title: string, body?: string, tone?: string) => void
      closeOverlays?: () => void
      setActionBusy?: (busy: boolean, message?: string, actionName?: string) => void
      setDealTab?: (tab: string) => void
      setFundPerformanceSnapshots?: (fundId: string, snapshots: unknown[]) => void
      setFundDocuments?: (fundId: string, documents: unknown[]) => void
    }
  }
}

export {}
