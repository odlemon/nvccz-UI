"use client"

import type { ReactNode } from "react"
import { PortfolioV11Layout } from "@/components/layout/portfolio-v11-layout"

export default function PortfolioV11RootLayout({ children }: { children: ReactNode }) {
  return <PortfolioV11Layout>{children}</PortfolioV11Layout>
}
