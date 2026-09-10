"use client"

import type { ReactNode } from "react"
import { PayrollV6Layout } from "@/components/layout/payroll-v6-layout"

export default function PayrollV6RootLayout({ children }: { children: ReactNode }) {
  return <PayrollV6Layout>{children}</PayrollV6Layout>
}
