"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  TrendingUp,
  BarChart3,
  DollarSign,
  Wallet,
  Calculator,
  Users,
  Receipt,
  ArrowRightLeft,
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { IncomeStatementView } from "./income-statement-view"
import { BalanceSheetView } from "./balance-sheet-view"
import { CashFlowView } from "./cash-flow-view"
import { CreditorsAgeAnalysis } from "./creditors-age-analysis"
import { VatReportView } from "./vat-report-view"
import { UnrealizedFxGainsView } from "./unrealized-fx-gains-view"
import { GroupConsolidationView } from "./group-consolidation-view"

const tabs = [
  {
    id: "income-statement",
    label: "Income Statement",
    icon: FileText,
    description: "Profit and Loss Report",
    gradient: "from-green-400 to-green-600"
  },
  {
    id: "balance-sheet",
    label: "Balance Sheet", 
    icon: BarChart3,
    description: "Assets, Liabilities & Equity",
    gradient: "from-blue-400 to-blue-600"
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    icon: DollarSign,
    description: "Cash Inflows and Outflows",
    gradient: "from-purple-400 to-purple-600"
  },
  {
    id: "creditors-age",
    label: "Creditors Age Analysis",
    icon: Users,
    description: "Purchase Invoices Aging",
    gradient: "from-orange-400 to-orange-600"
  },
  {
    id: "vat-report",
    label: "VAT Report",
    icon: Receipt,
    description: "Output Tax Audit",
    gradient: "from-red-400 to-red-600"
  },
  {
    id: "unrealized-fx",
    label: "Unrealized FX Gains",
    icon: ArrowRightLeft,
    description: "Foreign Exchange Gains/Losses",
    gradient: "from-teal-400 to-teal-600"
  },
  {
    id: "group-consolidation",
    label: "Group Consolidation",
    icon: Building2,
    description: "Company group results and eliminations",
    gradient: "from-indigo-400 to-indigo-600"
  }
]

export function FinancialReports() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "income-statement"
    if (window.location.pathname === "/accounting/consolidation" || new URLSearchParams(window.location.search).get("tab") === "group-consolidation") return "group-consolidation"
    return "income-statement"
  })

  useEffect(() => {
    if (window.location.pathname === "/accounting/consolidation" || new URLSearchParams(window.location.search).get("tab") === "group-consolidation") {
      setActiveTab("group-consolidation")
    }
  }, [])

  const selectTab = (tabId: string) => {
    setActiveTab(tabId)
    const url = new URL(window.location.href)
    if (tabId === "group-consolidation") url.searchParams.set("tab", tabId)
    else url.searchParams.delete("tab")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "income-statement":
        return <IncomeStatementView />
      case "balance-sheet":
        return <BalanceSheetView />
      case "cash-flow":
        return <CashFlowView />
      case "creditors-age":
        return <CreditorsAgeAnalysis />
      case "vat-report":
        return <VatReportView />
      case "unrealized-fx":
        return <UnrealizedFxGainsView />
      case "group-consolidation":
        return <GroupConsolidationView />
      default:
        return <IncomeStatementView />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">Financial Statements</h1>
          <p className="text-muted-foreground">Generate and view comprehensive financial statements</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-center border-b">
            <div className="flex flex-wrap gap-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                      isActive
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                      isActive ? tab.gradient : "from-gray-300 to-gray-400"
                    )}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {renderTabContent()}
        </CardContent>
      </Card>
    </div>
  )
}
