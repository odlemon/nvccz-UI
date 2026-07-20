"use client"

import * as React from "react"
import {
  lpFunds,
  lpPortalUnreadCounts,
  type FundOperatingModel,
  type LpFund,
  type ValuationStatus,
} from "@/lib/lp-portal/mock-data"

export type LpFundContextId = "all" | string

interface LpPortalContextValue {
  funds: LpFund[]
  selectedFundId: LpFundContextId
  selectedFund: LpFund | null
  operatingModel: FundOperatingModel | "MIXED"
  asOfDate: string
  valuationStatus: ValuationStatus
  unreadCounts: typeof lpPortalUnreadCounts
  setSelectedFundId: (fundId: LpFundContextId) => void
  setAsOfDate: (date: string) => void
}

const LpPortalContext = React.createContext<LpPortalContextValue | null>(null)

export function LpPortalProvider({ children }: { children: React.ReactNode }) {
  const [selectedFundId, setSelectedFundId] = React.useState<LpFundContextId>("all")
  const [asOfDate, setAsOfDate] = React.useState("2025-05-31")

  const selectedFund = React.useMemo(
    () => lpFunds.find((fund) => fund.id === selectedFundId) ?? null,
    [selectedFundId],
  )

  React.useEffect(() => {
    if (selectedFund) {
      setAsOfDate(selectedFund.asOfDate)
      return
    }
    setAsOfDate("2025-05-31")
  }, [selectedFund])

  const value = React.useMemo<LpPortalContextValue>(
    () => ({
      funds: lpFunds,
      selectedFundId,
      selectedFund,
      operatingModel: selectedFund?.operatingModel ?? "MIXED",
      asOfDate,
      valuationStatus: selectedFund?.valuationStatus ?? "FINAL",
      unreadCounts: lpPortalUnreadCounts,
      setSelectedFundId,
      setAsOfDate,
    }),
    [asOfDate, selectedFund, selectedFundId],
  )

  return <LpPortalContext.Provider value={value}>{children}</LpPortalContext.Provider>
}

export function useLpPortal() {
  const context = React.useContext(LpPortalContext)
  if (!context) {
    throw new Error("useLpPortal must be used within LpPortalProvider")
  }
  return context
}
