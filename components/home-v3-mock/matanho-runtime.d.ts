declare module "@/components/home-v3-mock/matanho-runtime" {
  export function startMatanhoRuntime(
    rootEl: HTMLElement,
    options?: {
      data?: unknown
      initialRoute?: string
      initialDetail?: {
        selectedNews?: string | null
        forumThread?: string | null
        selectedNewsletter?: string | null
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
        selectedNews?: string | null
        forumThread?: string | null
        selectedNewsletter?: string | null
        newsletterMode?: string
      }
    ) => void
    setSessionUser: (user: {
      id: string
      name: string
      firstName: string
      lastName: string
      role: string
      location: string
      email: string
      initials: string
      image?: string
    }) => void
    /**
     * Feeds a real assistant reply (or an error message) back into the mounted runtime's own AI
     * conversation state, replacing the pending "Thinking…" placeholder aiRespond() pushes when
     * the user sends a message. No hydrate() API exists on this runtime, so this is the one place
     * a host->runtime data path was added deliberately, rather than falling back to a full reload
     * (which would lose the conversation entirely). `sourcesUsed` (Phase 9) names the real data
     * sources that actually informed the reply, rendered as provenance chips beneath it.
     */
    receiveAssistantReply: (text: string, isError?: boolean, sourcesUsed?: string[]) => void
    destroy: () => void
  }
}
