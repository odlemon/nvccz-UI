"use client"

import type { ReactNode } from "react"
import { AccountingV52Layout } from "@/components/layout/accounting-v52-layout"

export default function Layout({ children }: { children: ReactNode }) {
  return <AccountingV52Layout>{children}</AccountingV52Layout>
}
