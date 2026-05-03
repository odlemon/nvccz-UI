"use client"

import { ReconciliationEntriesTable } from "./reconciliation-entries-table"
import { StatementTransactionsTable } from "./statement-transactions-table"
import { Card } from "@/components/ui/card"
import { AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ReconciliationComparisonViewProps {
  loading?: boolean
  disabled?: boolean
}

export function ReconciliationComparisonView({ loading, disabled }: ReconciliationComparisonViewProps) {
  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200 text-blue-800 py-3">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-sm font-semibold">Side-by-Side Comparison</AlertTitle>
        <AlertDescription className="text-xs">
          Review imported bank statement transactions on the left and match them with ledger entries on the right. 
          Highlighted rows indicate potential matches.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Bank Statement Column */}
        <div className="xl:col-span-2">
          <StatementTransactionsTable className="h-[calc(100vh-400px)] min-h-[500px]" />
        </div>

        {/* Ledger Entries Column */}
        <div className="xl:col-span-3">
          <ReconciliationEntriesTable 
            loading={loading} 
            disabled={disabled}
            className="h-[calc(100vh-400px)] min-h-[500px]"
          />
        </div>
      </div>
    </div>
  )
}
