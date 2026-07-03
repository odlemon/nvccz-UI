"use client"

import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setExecuteTradeModalOpen, runIngest, runValuation } from "@/lib/store/slices/investmentsSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, FileText, RefreshCw, Calculator, ChevronRight } from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

export function TerminalQuickActions() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { hasSubModuleAccess } = useRolePermissions()
  const isAdmin = hasSubModuleAccess("investments", "investments-market-data")
  const { selectedFundId, ingestRunning, valuationRunning } = useAppSelector((s) => s.investments)

  const actions = [
    {
      label: "Execute Trade",
      desc: "New BUY / SELL order",
      icon: Zap,
      onClick: () => dispatch(setExecuteTradeModalOpen(true)),
      style: "gradient-primary text-white hover:opacity-90",
      disabled: false,
    },
    {
      label: "View Trade Blotter",
      desc: "All executions and routing status",
      icon: FileText,
      onClick: () => router.push("/investments/trades"),
      style: "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200",
      disabled: false,
    },
    ...(isAdmin
      ? [{
          label: "Force Aggregation Run",
          desc: ingestRunning ? "Running…" : "Refresh prices from all sources",
          icon: RefreshCw,
          onClick: () => dispatch(runIngest("ALL")),
          style: "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200",
          disabled: ingestRunning,
        }]
      : []),
    {
      label: "Run Valuation",
      desc: valuationRunning ? "Running…" : "Recompute fund NAV and P&L",
      icon: Calculator,
      onClick: () => selectedFundId && dispatch(runValuation(selectedFundId)),
      style: "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200",
      disabled: valuationRunning || !selectedFundId,
    },
  ]

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100">
        <CardTitle className="text-sm font-semibold text-gray-800">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${action.style}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              action.style.includes("gradient") ? "bg-white/20" : "bg-white shadow-sm"
            }`}>
              <action.icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">{action.label}</p>
              <p className={`text-[11px] mt-0.5 truncate ${
                action.style.includes("gradient") ? "opacity-75" : "text-muted-foreground"
              }`}>{action.desc}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0 opacity-50" />
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
