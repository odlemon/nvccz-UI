declare module "@/components/portfolio-v11-mock/matanho-portfolio-runtime" {
  export function startPortfolioV11Runtime(
    rootEl: HTMLElement,
    options?: {
      shellHtml?: string
      initialPage?: string
      onNavigate?: (page: string) => void
    }
  ): {
    setPage: (page: string, detail?: Record<string, string>) => void
    destroy: () => void
  }
}
