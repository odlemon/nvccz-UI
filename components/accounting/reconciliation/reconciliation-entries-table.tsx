"use client"

import { useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import {
  toggleEntrySelection,
  selectAllEntries,
  unselectAllEntries,
  selectSelectedEntryIdsSet,
} from "@/lib/store/slices/reconciliationSlice"
import { ReconciliationEntry } from "@/lib/api/reconciliation-api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ReconciliationEntriesTableProps {
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function ReconciliationEntriesTable({ loading, disabled, className }: ReconciliationEntriesTableProps) {
  const dispatch = useDispatch<AppDispatch>()
  const entries = useSelector((state: RootState) => state.reconciliation.entries)
  const selectedSet = useSelector(selectSelectedEntryIdsSet)

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize))
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return entries.slice(start, start + pageSize)
  }, [entries, currentPage, pageSize])

  const handlePageSizeChange = (val: string) => {
    setPageSize(parseInt(val))
    setCurrentPage(1)
  }

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

  if (loading) {
    return (
      <div className={cn("border rounded-lg bg-white", className)}>
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg bg-white flex flex-col", className)}>
      <div className="bg-gray-50 border-b px-4 py-2 text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center justify-between">
        <span>Ledger Entries (Cashbook)</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(selectAllEntries())}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            disabled={disabled}
          >
            Reconcile all
          </button>
          <button
            onClick={() => dispatch(unselectAllEntries())}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            disabled={disabled}
          >
            Unreconcile all
          </button>
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            <TableRow>
            <TableHead className="w-[110px]">Date</TableHead>
            <TableHead className="w-[120px]">Reference</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[130px]">Category</TableHead>
            <TableHead className="w-[110px] text-right">Received</TableHead>
            <TableHead className="w-[110px] text-right">Paid</TableHead>
            <TableHead className="w-[80px] text-center">Cleared</TableHead>
            <TableHead className="w-[90px] text-center">Reconciled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedEntries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                {entries.length === 0
                  ? "No entries found. Click 'Apply' to load entries for the selected statement date."
                  : "No entries on this page."}
              </TableCell>
            </TableRow>
          ) : (
            paginatedEntries.map((entry) => {
              const isSelected = selectedSet.has(entry.id)
              return (
                <TableRow
                  key={entry.id}
                  className={isSelected ? "bg-green-50/50" : ""}
                >
                  <TableCell className="text-sm">{formatDate(entry.transactionDate)}</TableCell>
                  <TableCell className="text-sm font-mono">{entry.reference || "-"}</TableCell>
                  <TableCell className="text-sm">{entry.counterparty || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {entry.type === "RECEIPT" ? "Receipt" : "Payment"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {entry.received > 0 ? formatAmount(entry.received) : "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {entry.paid > 0 ? formatAmount(entry.paid) : "0.00"}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.isReconciled ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    ) : null}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => dispatch(toggleEntrySelection(entry.id))}
                      disabled={disabled}
                    />
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>

      {/* Pagination */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[70px] h-8 rounded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>records</span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <span>{entries.length} records</span>
        </div>
      )}
    </div>
  )
}
