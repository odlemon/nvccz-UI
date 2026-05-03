"use client"

import { useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store/store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, CircleDashed } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

interface StatementTransactionsTableProps {
  className?: string
}

export function StatementTransactionsTable({ className }: StatementTransactionsTableProps) {
  const { importedStatement, matchedMapping } = useSelector((state: RootState) => state.reconciliation)
  const transactions = importedStatement?.transactions || []

  const formatAmount = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy")
    } catch {
      return dateStr
    }
  }

  if (transactions.length === 0) {
    return (
      <div className={cn("border rounded-lg bg-gray-50 flex items-center justify-center py-12 text-muted-foreground", className)}>
        No statement transactions imported
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg bg-white overflow-hidden flex flex-col h-full", className)}>
      <div className="bg-gray-50 border-b px-4 py-2 text-xs font-semibold uppercase text-gray-500 tracking-wider">
        Bank Statement Transactions
      </div>
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-[90px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px] text-right">Amount</TableHead>
              <TableHead className="w-[40px] text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, idx) => {
              const matchedEntryId = matchedMapping[tx.id]
              const isMatched = !!matchedEntryId

              return (
                <TableRow 
                  key={tx.id || idx} 
                  className={cn(
                    "hover:bg-gray-50/50 group transition-colors",
                    isMatched ? "bg-blue-50/30" : ""
                  )}
                >
                  <TableCell className="text-[11px] py-2">{formatDate(tx.transactionDate)}</TableCell>
                  <TableCell className="py-2">
                    <div className="font-medium text-[11px] line-clamp-1">{tx.description}</div>
                    {tx.reference && <div className="text-[9px] text-gray-400 font-mono">{tx.reference}</div>}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right text-[11px] tabular-nums font-medium py-2",
                    tx.type === "RECEIPT" ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {tx.type === "RECEIPT" ? "+" : "-"}{formatAmount(tx.amount)}
                  </TableCell>
                  <TableCell className="text-center py-2">
                    {isMatched ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mx-auto" />
                    ) : (
                      <CircleDashed className="w-3.5 h-3.5 text-gray-200 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-[11px] text-gray-500 font-medium">
        <span>Total: {transactions.length}</span>
        <span className="flex items-center gap-1">
          Matched: <span className="text-blue-600">{Object.keys(matchedMapping).length}</span>
        </span>
      </div>
    </div>
  )
}
