"use client"

import type { ReactNode } from "react"
import { FundraisingKycLayout } from "@/components/layout/fundraising-kyc-layout"

export default function FundraisingKycRootLayout({ children }: { children: ReactNode }) {
  return <FundraisingKycLayout>{children}</FundraisingKycLayout>
}
