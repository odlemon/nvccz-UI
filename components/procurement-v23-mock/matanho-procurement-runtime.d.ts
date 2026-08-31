declare module "@/components/procurement-v23-mock/matanho-procurement-runtime" {
  export function startProcurementV23Runtime(
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
