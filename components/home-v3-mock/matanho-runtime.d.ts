declare module "@/components/home-v3-mock/matanho-runtime" {
  export function startMatanhoRuntime(
    rootEl: HTMLElement,
    options?: {
      data?: unknown
      initialRoute?: string
      initialDetail?: {
        selectedNews?: number | null
        forumThread?: number | null
        selectedNewsletter?: number | null
        newsletterMode?: string
      }
      config?: { useMockData?: boolean; apiBaseUrl?: string }
      onNavigate?: (route: string) => void
    }
  ): {
    setRoute: (
      route: string,
      detail?: {
        selectedNews?: number | null
        forumThread?: number | null
        selectedNewsletter?: number | null
        newsletterMode?: string
      }
    ) => void
    destroy: () => void
  }
}
