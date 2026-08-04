declare module "@/components/fundraising-kyc-mock/matanho-fundraising-kyc-runtime" {
  export function startFundraisingKycRuntime(
    rootEl: HTMLElement,
    options?: {
      shellHtml?: string
      initialStep?: number
      preview?: string | null
      onNavigate?: (step: number) => void
    }
  ): {
    setStep: (step: number) => void
    destroy: () => void
  }
}
