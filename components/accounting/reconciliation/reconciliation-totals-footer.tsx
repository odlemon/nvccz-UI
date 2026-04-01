"use client"

import { useSelector } from "react-redux"
import { selectReconciliationTotals } from "@/lib/store/slices/reconciliationSlice"
import { cn } from "@/lib/utils"

export function ReconciliationTotalsFooter() {
  const totals = useSelector(selectReconciliationTotals)

  const maxAmount = Math.max(totals.totalReceived, totals.totalPaid, 1)
  const receivedProgress = (totals.totalReceived / maxAmount) * 100
  const paidProgress = (totals.totalPaid / maxAmount) * 100

  const formatAmount = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const differenceIsZero = Math.abs(totals.difference) < 0.01

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Progress bars */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Total Received</span>
              <span className="text-sm font-semibold tabular-nums text-green-700">
                {formatAmount(totals.totalReceived)}
              </span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${receivedProgress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Total Paid</span>
              <span className="text-sm font-semibold tabular-nums text-red-700">
                {formatAmount(totals.totalPaid)}
              </span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${paidProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Balance summary */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Starting Balance</span>
            <span className="text-sm font-semibold tabular-nums">{formatAmount(totals.openingBalance)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Target Balance</span>
            <span className="text-sm font-semibold tabular-nums">{formatAmount(totals.statementEndBalance)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Reconciled Balance</span>
            <span className="text-sm font-semibold tabular-nums">{formatAmount(totals.reconciledBalance)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Difference</span>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                differenceIsZero ? "text-green-600" : "text-red-600"
              )}
            >
              {formatAmount(totals.difference)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
