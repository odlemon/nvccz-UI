"use client"

import type { ReactNode } from "react"
import { PORTAL_ID } from "@/lib/portal/config"
import { InvesteePortalV8Layout } from "@/components/layout/investee-portal-v8-layout"
import { InvesteePortalV8AuthLayout } from "@/components/layout/investee-portal-v8-auth-layout"

export default function InvesteePortalV8RootLayout({ children }: { children: ReactNode }) {
  if (PORTAL_ID === "investee") {
    return <InvesteePortalV8AuthLayout>{children}</InvesteePortalV8AuthLayout>
  }
  return <InvesteePortalV8Layout>{children}</InvesteePortalV8Layout>
}
