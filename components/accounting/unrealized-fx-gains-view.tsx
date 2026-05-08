"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { accountingApi } from "@/lib/api/accounting-api"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"

export function UnrealizedFxGainsView() {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await accountingApi.getUnrealizedFxGainsReport(format(asOfDate, "yyyy-MM-dd"))
      if (response.success && response.data) {
        setData(response.data)
      } else {
        throw new Error(response.error || "Failed to load FX report")
      }
    } catch (error: any) {
      toast.error("Failed to generate unrealized FX gains report", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val
    return (num ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getGainLossIcon = (type: string) => {
    switch (type) {
      case "GAIN": return <TrendingUp className="w-4 h-4 text-green-600" />
      case "LOSS": return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getGainLossColor = (type: string) => {
    switch (type) {
      case "GAIN": return "text-green-700"
      case "LOSS": return "text-red-700"
      default: return "text-gray-600"
    }
  }

  const handleExport = (rows: any[]) => {
    const csvContent = [
      ['Invoice #', 'Customer', 'Status', 'Currency', 'Outstanding', 'Original Value', 'Current Value', 'Gain/Loss', 'Type'].join(','),
      ...rows.map(r => [
        r.invoiceNumber, r.customerName || '', r.status, r.invoiceCurrencyCode,
        r.outstandingAmount, r.originalFunctionalValue, r.currentFunctionalValue,
        r.unrealizedGainLoss, r.gainLossType
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unrealized-fx-gains-${format(asOfDate, 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} records`)
  }

  const lines: any[] = data?.lines || []
  const totals = data?.totals
  const functionalCurrency = data?.functionalCurrencyCode || ""
  const valuationCurrency = data?.valuationCurrencyCode || ""
  const excludedItems: any[] = data?.excludedOpenItems || []

  const columns: Column<any>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (value) => <span className="text-sm">{value || "-"}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => <Badge variant="outline" className="text-xs">{value}</Badge>,
    },
    {
      key: "invoiceCurrencyCode",
      label: "Currency",
      sortable: true,
      render: (value) => <Badge variant="outline" className="text-xs">{value}</Badge>,
    },
    {
      key: "outstandingAmount",
      label: "Outstanding",
      sortable: true,
      render: (value) => <span className="tabular-nums">{formatAmount(value)}</span>,
    },
    {
      key: "originalFunctionalValue",
      label: `Original (${valuationCurrency})`,
      sortable: true,
      render: (value) => <span className="tabular-nums">{formatAmount(value)}</span>,
    },
    {
      key: "currentFunctionalValue",
      label: `Current (${valuationCurrency})`,
      sortable: true,
      render: (value) => <span className="tabular-nums">{formatAmount(value)}</span>,
    },
    {
      key: "unrealizedGainLoss",
      label: "Gain/Loss",
      sortable: true,
      render: (value, row) => (
        <span className={`tabular-nums font-medium ${getGainLossColor(row.gainLossType)}`}>
          {formatAmount(value)}
        </span>
      ),
    },
    {
      key: "gainLossType",
      label: "Type",
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          {getGainLossIcon(value)}
          <span className={`text-xs ${getGainLossColor(value)}`}>{value}</span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-48 justify-start text-left font-normal rounded-full">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(asOfDate, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={asOfDate} onSelect={(d) => d && setAsOfDate(d)} initialFocus />
          </PopoverContent>
        </Popover>
        <Button onClick={handleGenerate} disabled={loading} variant="gradient-create" className="rounded-full h-10 px-6">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Generate
        </Button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="flex flex-wrap items-center gap-3">
          {functionalCurrency && (
            <Badge variant="outline" className="text-sm">
              Functional: {functionalCurrency} | Valuation: {valuationCurrency}
            </Badge>
          )}
          {totals && (
            <>
              <Card className="inline-flex">
                <CardContent className="py-2 px-4">
                  <span className="text-sm text-gray-500 mr-2">Unrealized Gain:</span>
                  <span className="font-bold text-green-700">{formatAmount(totals.unrealizedGain)}</span>
                </CardContent>
              </Card>
              <Card className="inline-flex">
                <CardContent className="py-2 px-4">
                  <span className="text-sm text-gray-500 mr-2">Unrealized Loss:</span>
                  <span className="font-bold text-red-700">{formatAmount(totals.unrealizedLoss)}</span>
                </CardContent>
              </Card>
              <Card className="inline-flex">
                <CardContent className="py-2 px-4">
                  <span className="text-sm text-gray-500 mr-2">Net:</span>
                  <span className={`font-bold ${parseFloat(totals.netUnrealized) >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {formatAmount(totals.netUnrealized)}
                  </span>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Lines Data Table */}
      <ProcurementDataTable
        data={lines}
        columns={columns}
        title="Unrealized FX Gains/Losses"
        searchPlaceholder="Search by invoice, customer..."
        loading={loading}
        emptyMessage="Select a date and click Generate to view unrealized FX gains/losses."
        onExport={handleExport}
      />

      {/* Excluded Items */}
      {excludedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Excluded Items ({excludedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {excludedItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-mono">{item.invoiceNumber}</span>
                  <span>-</span>
                  <span>{item.reason}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
