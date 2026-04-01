"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RefreshCw, Loader2, Info } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { accountingApi } from "@/lib/api/accounting-api"
import { ProcurementDataTable, Column } from "../procurement/procurement-data-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function CreditorsAgeAnalysis() {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await accountingApi.getCreditorsAgeAnalysis(format(asOfDate, "yyyy-MM-dd"))
      if (response.success && response.data) {
        setData(response.data)
      } else {
        throw new Error(response.error || "Failed to load report")
      }
    } catch (error: any) {
      toast.error("Failed to generate creditors age analysis", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val
    return (num ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const lines: any[] = data?.lines || []
  const totalsByCurrency: Record<string, any> = data?.totalsByCurrency || {}
  const bucketLabels = data?.bucketShortColumnTitles || {
    current: "Current",
    days1To30: "30 Days",
    days31To60: "60 Days",
    days61To90: "90 Days",
    over90: "Over 90",
  }

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case "current": return "bg-green-100 text-green-800"
      case "days1To30": return "bg-yellow-100 text-yellow-800"
      case "days31To60": return "bg-orange-100 text-orange-800"
      case "days61To90": return "bg-red-100 text-red-800"
      case "over90": return "bg-red-200 text-red-900"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const columns: Column<any>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value || "-"}</span>,
    },
    {
      key: "vendorName",
      label: "Vendor",
      sortable: true,
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      render: (value) => <span className="text-sm max-w-[200px] truncate block">{value || "-"}</span>,
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (value) => <span className="text-sm">{value || "-"}</span>,
    },
    {
      key: "currencyCode",
      label: "Currency",
      sortable: true,
      render: (value) => <Badge variant="outline" className="text-xs">{value}</Badge>,
    },
    {
      key: "outstandingAmount",
      label: "Outstanding",
      sortable: true,
      render: (value) => <span className="tabular-nums font-medium">{formatAmount(value)}</span>,
    },
    {
      key: "daysPastDue",
      label: "Days Past Due",
      sortable: true,
      render: (value) => (
        <span className={value > 0 ? "text-red-600 font-medium tabular-nums" : "text-green-600 tabular-nums"}>
          {value}
        </span>
      ),
    },
    {
      key: "bucket",
      label: "Bucket",
      sortable: true,
      render: (value, row) => (
        <Badge className={getBucketColor(value)}>
          {row.reportColumnTitle || value}
        </Badge>
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
        <Button onClick={handleGenerate} disabled={loading} className="rounded-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Generate
        </Button>
      </div>

      {/* Info note */}
      {data?.liabilityGlNote && (
        <div className="flex items-start gap-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <span>{data.liabilityGlNote}</span>
        </div>
      )}

      {/* Invoice Lines Data Table */}
      <ProcurementDataTable
        data={lines}
        columns={columns}
        title="Creditors Age Analysis"
        searchPlaceholder="Search by invoice, vendor..."
        loading={loading}
        emptyMessage="Select a date and click Generate to view the creditors age analysis."
      />

      {/* Totals by Currency */}
      {Object.keys(totalsByCurrency).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totals by Currency</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">{bucketLabels.current}</TableHead>
                  <TableHead className="text-right">{bucketLabels.days1To30}</TableHead>
                  <TableHead className="text-right">{bucketLabels.days31To60}</TableHead>
                  <TableHead className="text-right">{bucketLabels.days61To90}</TableHead>
                  <TableHead className="text-right">{bucketLabels.over90}</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(totalsByCurrency).map(([currency, totals]: [string, any]) => (
                  <TableRow key={currency}>
                    <TableCell className="font-medium">{currency}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAmount(totals.current)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAmount(totals.days1To30)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAmount(totals.days31To60)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAmount(totals.days61To90)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAmount(totals.over90)}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold">{formatAmount(totals.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
