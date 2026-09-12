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
      onSignOut?: () => void | Promise<void>
      liveSession?: boolean
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
    setSessionUser: (user: {
      name: string
      firstName: string
      role: string
      location: string
      email: string
      initials: string
      image?: string
    }) => void
    destroy: () => void
  }
}
