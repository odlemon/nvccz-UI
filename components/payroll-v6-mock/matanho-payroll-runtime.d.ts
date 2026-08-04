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
  }
}
