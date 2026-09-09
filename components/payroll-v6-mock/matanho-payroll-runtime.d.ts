declare module "@/components/payroll-v6-mock/matanho-payroll-runtime" {
  export function startPayrollV6Runtime(
    rootEl: HTMLElement,
    options?: {
      shellHtml?: string
      initialPage?: string
      onNavigate?: (page: string) => void
    }
  ): {
    setPage: (page: string) => void
    destroy: () => void
    /** Added by scripts/patch-payroll-runtime.mjs — replaces fixtures with live data. */
    hydrate?: (payload: unknown) => void
  }
}
