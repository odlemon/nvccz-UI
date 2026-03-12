"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { AccountingLayout } from "@/components/layout/accounting-layout"
import { AccountingDashboard } from "@/components/accounting/accounting-dashboard"
import { fetchCurrencies } from "@/lib/store/slices/accountingSlice"
import { ModuleGuard } from "@/lib/permissions"
import type { AppDispatch } from "@/lib/store/store"

export default function AccountingDashboardPage() {
  const dispatch = useDispatch<AppDispatch>()

  // Ensure currencies are loaded at page level
  useEffect(() => {
    dispatch(fetchCurrencies())
  }, [dispatch])

  return (
    <ModuleGuard moduleId="accounting" subModuleId="accounting-dashboard">
      <AccountingLayout>
        <AccountingDashboard />
      </AccountingLayout>
    </ModuleGuard>
  )
}
