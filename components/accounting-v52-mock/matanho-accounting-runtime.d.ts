declare module "@/components/accounting-v52-mock/matanho-accounting-runtime" {
  export function startAccountingV52Runtime(
    rootEl: HTMLElement,
    runtimeOptions?: {
      shellHtml?: string
      initialPage?: string
      onNavigate?: (page: string) => void
    }
  ): {
    setPage: (page: string) => void
    destroy: () => void
    hydrate?: (payload: unknown) => void
    beginLiveLoad?: () => void
    endLiveLoad?: () => void
    failLiveLoad?: (message?: string) => void
    commitSuccess?: (title: string, message?: string, pageId?: string) => void
    commitError?: (err: unknown) => void
  }
}
