"use client"

import type { ReactNode } from "react"
import { InvesteePortalV8Layout } from "@/components/layout/investee-portal-v8-layout"

export default function InvesteePortalV8RootLayout({ children }: { children: ReactNode }) {
  return <InvesteePortalV8Layout>{children}</InvesteePortalV8Layout>
}
