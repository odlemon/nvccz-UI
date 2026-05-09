"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Copy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CashbookEntry {
  id: string
  transactionDate: string
  description: string
  reference: string
  type: "RECEIPT" | "PAYMENT"
  amount: number
  status: string
  balance: number
}

interface CashbookDataTableProps {
  entries: CashbookEntry[]
  loading: boolean
  onAddReceipt: () => void
  onAddPayment: () => void
  onViewEntry: (entry: CashbookEntry) => void
  onExport: () => void
  readOnly?: boolean // New prop to enable read-only mode
}

export function CashbookDataTable({
  entries,
  loading,
  onAddReceipt,
  onAddPayment,
  onViewEntry,
  onExport,
  readOnly = true, // Default to false for backward compatibility
}: CashbookDataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const sortedEntries = useMemo(() => {
    if (!sortColumn) return Array.isArray(entries) ? entries : []
    const safeEntries = Array.isArray(entries) ? entries : []
    return [...safeEntries].sort((a, b) => {
      const aValue = a[sortColumn as keyof CashbookEntry]
      const bValue = b[sortColumn as keyof CashbookEntry]
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [entries, sortColumn, sortDirection])

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedEntries.slice(start, start + itemsPerPage)
  }, [sortedEntries, currentPage])

  const totalPages = Math.ceil((Array.isArray(sortedEntries) ? sortedEntries.length : 0) / itemsPerPage)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Reference copied to clipboard")
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="mt-6 border rounded-xl bg-white overflow-x-auto animate-pulse">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-left font-medium">Description</th>
              <th className="p-3 text-left font-medium">Reference</th>
              <th className="p-3 text-right text-green-700 font-medium">Receipts (Dr)</th>
              <th className="p-3 text-right text-red-700 font-medium">Payments (Cr)</th>
              <th className="p-3 text-right font-medium">Balance</th>
              <th className="p-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="border-b">
                <td className="p-3"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                <td className="p-3"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                <td className="p-3"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                <td className="p-3 text-right"><div className="h-4 w-20 bg-green-200 rounded ml-auto"></div></td>
                <td className="p-3 text-right"><div className="h-4 w-20 bg-red-200 rounded ml-auto"></div></td>
                <td className="p-3 text-right"><div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div></td>
                <td className="p-3"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="mt-6 border rounded-xl bg-white overflow-x-auto">
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Cashbook Entries</h2>
        <Button onClick={onExport} variant="outline">
          Export to Excel
        </Button>
      </div>
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("transactionDate")}>
              Date <SortIcon column="transactionDate" />
            </th>
            <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("description")}>
              Description <SortIcon column="description" />
            </th>
            <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("reference")}>
              Reference <SortIcon column="reference" />
            </th>
            <th className="p-3 text-right text-green-700 font-medium cursor-pointer" onClick={() => handleSort("amount")}>
              Receipts (Dr) <SortIcon column="amount" />
            </th>
            <th className="p-3 text-right text-red-700 font-medium cursor-pointer" onClick={() => handleSort("amount")}>
              Payments (Cr) <SortIcon column="amount" />
            </th>
            <th className="p-3 text-right font-medium cursor-pointer" onClick={() => handleSort("balance")}>
              Balance <SortIcon column="balance" />
            </th>
            <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("status")}>
              Status <SortIcon column="status" />
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Conditionally render Add New Entry Row only if not readOnly */}
          {!readOnly && (
            <tr className="border-b bg-blue-50">
              <td colSpan={7} className="p-3 text-center">
                <Button
                  onClick={onAddReceipt}
                  className="mr-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Receipt
                </Button>
                <Button
                  onClick={onAddPayment}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              </td>
            </tr>
          )}
          {paginatedEntries.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-400">No entries found</td>
            </tr>
          ) : (
            paginatedEntries.map((entry, index) => (
              <tr
                key={entry.id}
                className={cn("border-b hover:bg-gray-50 cursor-pointer", index % 2 === 0 ? "bg-gray-50" : "")}
                onClick={() => onViewEntry(entry)}
              >
                <td className="p-3 font-mono">{format(new Date(entry.transactionDate || entry.date), "yyyy-MM-dd")}</td>
                <td className="p-3">{entry.description}</td>
                <td className="p-3 font-mono flex items-center gap-2">
                  {entry.reference}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(entry.reference)
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </td>
                <td className="p-3 text-right text-green-700 font-mono text-lg" style={{ fontFamily: "monospace" }}>
                  {entry.type === "RECEIPT" ? Number(entry.amount).toLocaleString() : ""}
                </td>
                <td className="p-3 text-right text-red-700 font-mono text-lg" style={{ fontFamily: "monospace" }}>
                  {entry.type === "PAYMENT" ? Number(entry.amount).toLocaleString() : ""}
                </td>
                <td className="p-3 text-right font-mono text-lg">{entry.balance.toLocaleString()}</td>
                <td className="p-3">
                  <Badge className={entry.status === "POSTED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {entry.status}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between border-t border-gray-100">
          <div className="text-sm text-gray-600 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, Array.isArray(entries) ? entries.length : 0)} of {Array.isArray(entries) ? entries.length : 0} Entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={cn(
                "rounded-full w-9 h-9 p-0",
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                const isActive = currentPage === pageNum
                
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 p-0 rounded-full",
                      isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-gray-100"
                    )}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className={cn(
                "rounded-full w-9 h-9 p-0",
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
