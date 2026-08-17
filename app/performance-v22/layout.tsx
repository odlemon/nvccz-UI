"use client"

import type { ReactNode } from "react"
import { PerformanceV22Layout } from "@/components/layout/performance-v22-layout"

export default function PerformanceV22RootLayout({ children }: { children: ReactNode }) {
  return <PerformanceV22Layout>{children}</PerformanceV22Layout>
}
