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
