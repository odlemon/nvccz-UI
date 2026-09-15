"use client"

import type { ReactNode } from "react"
import { ProcurementV23Layout } from "@/components/layout/procurement-v23-layout"

export default function Layout({ children }: { children: ReactNode }) {
  return <ProcurementV23Layout>{children}</ProcurementV23Layout>
}
