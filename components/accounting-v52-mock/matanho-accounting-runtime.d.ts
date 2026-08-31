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
  }
}
