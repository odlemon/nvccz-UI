"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToFrKycStep,
  frKycStepToPath,
} from "@/lib/fundraising-kyc-mock/nav"
import { startFundraisingKycRuntime } from "@/components/fundraising-kyc-mock/matanho-fundraising-kyc-runtime"
import { FUNDRAISING_KYC_SHELL_HTML } from "@/components/fundraising-kyc-mock/shell"
import "@/components/fundraising-kyc-mock/fundraising-kyc.css"
import "@/components/fundraising-kyc-mock/fundraising-kyc-overrides.css"

type RuntimeApi = {
  setStep: (step: number) => void
  destroy: () => void
}

export function FundraisingKycApp() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialStep = pathToFrKycStep(pathnameRef.current)
    apiRef.current = startFundraisingKycRuntime(el, {
      shellHtml: FUNDRAISING_KYC_SHELL_HTML,
      initialStep,
      onNavigate: (step: number) => {
        const path = frKycStepToPath(step)
        if (pathnameRef.current !== path) router.push(path)
      },
    })

    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    apiRef.current?.setStep(pathToFrKycStep(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="fundraising-kyc-root h-full min-h-0"
    />
  )
}
