"use client"

import type React from "react"
import { Suspense, useEffect } from "react"
import { FundraisingKycApp } from "@/components/fundraising-kyc-mock/fundraising-kyc-app"
import { useBrandLogoOverride } from "@/lib/client-design-mock/brand-logo-override"

export function FundraisingKycLayout({ children }: { children: React.ReactNode }) {
  useBrandLogoOverride()

  useEffect(() => {
    const html = document.documentElement
    const { overflow: prevHtml } = html.style
    const { overflow: prevBody } = document.body.style
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  return (
    <div className="h-dvh overflow-hidden bg-[#f4f7f6]" data-portal="fundraising-kyc">
      <div className="h-full">
        <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading Investor KYC…</div>}>
          <FundraisingKycApp />
        </Suspense>
      </div>
      <div className="sr-only" aria-hidden>{children}</div>
    </div>
  )
}
