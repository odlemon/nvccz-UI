"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, RefreshCw, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { toast } from "sonner"
import { vatApi } from "@/lib/api/vat-api"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"

export function VatReportView() {
  const currencies = useSelector((state: RootState) => state.accounting.currencies)

  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
  const [currencyId, setCurrencyId] = useState("")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await vatApi.getOutputTaxAuditReport({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        currencyId: currencyId && currencyId !== "all" ? currencyId : undefined,
      })
      if (response.success && response.data) {
        setData(response.data)
      } else {
        throw new Error(response.error || "Failed to load VAT report")
      }
    } catch (error: any) {
      toast.error("Failed to generate VAT report", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val
    return (num ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleExport = (rows: any[]) => {
    const csvContent = [
      ['Date', 'Reference', 'Invoice #', 'Customer', 'Description', 'Type', 'Amount', 'VAT Amount'].join(','),
      ...rows.map(r => [
        r.date || '', r.reference || '', r.invoiceNumber || '', r.customerName || '',
        `"${(r.description || '').replace(/"/g, '""')}"`, r.type || '', r.amount || 0, r.vatAmount || 0
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vat-output-tax-audit-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} records`)
  }

  const lines: any[] = data?.lines || []
  const totalOutputTax = data?.totalOutputTax ?? 0
  const period = data?.period

  const columns: Column<any>[] = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (value) => <span className="text-sm">{value || "-"}</span>,
    },
    {
      key: "reference",
      label: "Reference",
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value || "-"}</span>,
    },
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (value) => <span className="text-sm">{value || "-"}</span>,
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (value) => <span className="text-sm">{value || "-"}</span>,
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      render: (value) => <span className="text-sm max-w-[200px] truncate block">{value || "-"}</span>,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (value) => <Badge variant="outline" className="text-xs">{value || "-"}</Badge>,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value) => <span className="tabular-nums">{formatAmount(value)}</span>,
    },
    {
      key: "vatAmount",
      label: "VAT Amount",
      sortable: true,
      render: (value) => (
        <span className={`tabular-nums font-medium ${(value || 0) < 0 ? "text-red-600" : ""}`}>
          {formatAmount(value)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-44 justify-start text-left font-normal rounded-full">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(startDate, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus />
          </PopoverContent>
        </Popover>
        <span className="text-gray-500">to</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-44 justify-start text-left font-normal rounded-full">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(endDate, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus />
          </PopoverContent>
        </Popover>
        <Select value={currencyId} onValueChange={setCurrencyId}>
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue placeholder="All Currencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Currencies</SelectItem>
            {currencies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={loading} className="rounded-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Generate
        </Button>
      </div>

      {/* Period & Total Summary */}
      {data && (
        <div className="flex items-center gap-4">
          {period && (
            <Badge variant="outline" className="text-sm">
              {period.startDate} to {period.endDate} {period.quarter ? `(${period.quarter})` : ""}
            </Badge>
          )}
          <Card className="inline-flex">
            <CardContent className="py-2 px-4">
              <span className="text-sm text-gray-500 mr-2">Total Output Tax:</span>
              <span className="font-bold text-lg">{formatAmount(totalOutputTax)}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lines Data Table */}
      <ProcurementDataTable
        data={lines}
        columns={columns}
        title="VAT Output Tax Audit"
        searchPlaceholder="Search by invoice, customer, reference..."
        loading={loading}
        emptyMessage="Select a date range and click Generate to view the VAT output tax audit."
        onExport={handleExport}
      />
    </div>
  )
}
