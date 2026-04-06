"use client"

import { Fragment, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RefreshCw, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { accountingApi } from "@/lib/api/accounting-api"

export function CreditorsAgeAnalysis() {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set())

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await accountingApi.getCreditorsAgeAnalysis(format(asOfDate, "yyyy-MM-dd"))
      if (response.success && response.data) {
        setData(response.data)
        setExpandedVendors(new Set())
      } else {
        throw new Error(response.error || "Failed to load report")
      }
    } catch (error: any) {
      toast.error("Failed to generate creditors age analysis", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const fmt = (val: number | string | null | undefined) => {
    const num = typeof val === "string" ? parseFloat(val) : (val ?? 0)
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const toggleVendor = (vendorId: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev)
      if (next.has(vendorId)) next.delete(vendorId)
      else next.add(vendorId)
      return next
    })
  }

  const vendors: any[] = data?.vendors || []
  const grandTotal = data?.grandTotal
  const totalsByCurrency: Record<string, any> = data?.totalsByCurrency || {}
  const bucketLabels = data?.bucketShortColumnTitles || {
    current: "Current",
    days1To30: "30 Days",
    days31To60: "60 Days",
    days61To90: "90 Days",
    over90: "Over 90",
  }

  const thCls = "text-xs font-semibold text-gray-600 px-3 py-3 whitespace-nowrap"
  const tdAmt = "text-right tabular-nums px-3 py-3"

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

      {/* Report card */}
      <Card className="overflow-hidden">
        {/* Report header */}
        <div className="px-6 pt-5 pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Aged Creditors</h2>
          {data?.asOfDate ? (
            <p className="text-sm text-gray-500 mt-0.5">
              As at {format(new Date(data.asOfDate + "T00:00:00"), "dd MMM yy")} ageing by bill date
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">Select a date and click Generate</p>
          )}
        </div>

        <CardContent className="p-0">
          {/* Fixed-height scrollable area — totals stick to bottom */}
          <div
            className="overflow-auto"
            style={{ height: "calc(100vh - 300px)", minHeight: "420px" }}
          >
            <table className="w-full text-sm border-collapse">
              {/* Sticky column headers */}
              <thead className="sticky top-0 z-10 bg-white border-b">
                <tr>
                  <th className={`text-left ${thCls} w-[240px]`}>Supplier/Bill</th>
                  <th className={`text-left ${thCls}`}>Bill date</th>
                  <th className={`text-left ${thCls}`}>Due date</th>
                  <th className={`text-right ${thCls}`}>Total</th>
                  <th className={`text-right ${thCls}`}>VAT</th>
                  <th className={`text-right ${thCls}`}>{bucketLabels.current}</th>
                  <th className={`text-right ${thCls}`}>{bucketLabels.days1To30}</th>
                  <th className={`text-right ${thCls}`}>{bucketLabels.days31To60}</th>
                  <th className={`text-right ${thCls}`}>{bucketLabels.days61To90}</th>
                  <th className={`text-right ${thCls}`}>{bucketLabels.over90}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="text-center py-20">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </td>
                  </tr>
                )}

                {!loading && vendors.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-20 text-gray-400 text-sm">
                      No data available. Select a date and click Generate.
                    </td>
                  </tr>
                )}

                {vendors.map((vendor) => {
                  const isExpanded = expandedVendors.has(vendor.vendorId)
                  return (
                    <Fragment key={vendor.vendorId}>
                      {/* Vendor summary row */}
                      <tr
                        className="border-b cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleVendor(vendor.vendorId)}
                      >
                        <td className="px-4 py-3 font-medium text-blue-600">
                          <div className="flex items-center gap-1.5">
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
                              : <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" />
                            }
                            {vendor.vendorName}
                          </div>
                        </td>
                        <td className="px-3 py-3" />
                        <td className="px-3 py-3" />
                        <td className={`${tdAmt} font-medium`}>{fmt(vendor.total)}</td>
                        <td className={tdAmt}>{fmt(vendor.vatTotal)}</td>
                        <td className={tdAmt}>{fmt(vendor.current)}</td>
                        <td className={tdAmt}>{fmt(vendor.days1To30)}</td>
                        <td className={tdAmt}>{fmt(vendor.days31To60)}</td>
                        <td className={tdAmt}>{fmt(vendor.days61To90)}</td>
                        <td className={tdAmt}>{fmt(vendor.over90)}</td>
                      </tr>

                      {/* Expanded individual bill rows */}
                      {isExpanded && vendor.bills?.map((bill: any) => (
                        <tr
                          key={bill.purchaseInvoiceId}
                          className="border-b bg-gray-50/50 text-gray-600"
                        >
                          <td className="pl-11 pr-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{bill.invoiceNumber}</span>
                              {bill.currencyCode && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-700 shrink-0">
                                  {bill.currencyCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs">{bill.invoiceDate || "–"}</td>
                          <td className="px-3 py-2 text-xs">{bill.dueDate || "–"}</td>
                          <td className="text-right tabular-nums px-3 py-2 text-xs">{fmt(bill.outstandingAmount)}</td>
                          <td className="text-right tabular-nums px-3 py-2 text-xs">{fmt(bill.vatAmount)}</td>
                          <td className="text-right tabular-nums px-3 py-2 text-xs">
                            {bill.bucket === "current" ? fmt(bill.outstandingAmount) : "–"}
                          </td>
                          <td className="text-right tabular-nums px-3 py-2 text-xs">
                            {bill.bucket === "days1To30" ? fmt(bill.outstandingAmount) : "–"}
                          </td>
                          <td className="text-right tabular-nums px-3 py-2 text-xs">
                            {bill.bucket === "days31To60" ? fmt(bill.outstandingAmount) : "–"}
                          </td>
                          <td className="text-right tabular-nums px-3 py-2 text-xs">
                            {bill.bucket === "days61To90" ? fmt(bill.outstandingAmount) : "–"}
                          </td>
                          <td className="text-right tabular-nums px-3 py-2 text-xs">
                            {bill.bucket === "over90" ? fmt(bill.outstandingAmount) : "–"}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>

              {/* Sticky footer: per-currency totals + Grand Total */}
              {(grandTotal || Object.keys(totalsByCurrency).length > 0) && (
                <tfoot className="sticky bottom-0 z-10 bg-white">
                  {/* Per-currency rows */}
                  {Object.entries(totalsByCurrency).map(([currency, totals]: [string, any], i) => (
                    <tr
                      key={currency}
                      className={`text-gray-700 text-xs ${i === 0 ? "border-t-2 border-gray-300" : "border-t border-gray-100"}`}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                            {currency}
                          </span>
                          <span className="text-gray-400 text-[11px]">subtotal</span>
                        </div>
                      </td>
                      <td />
                      <td />
                      <td className="text-right tabular-nums px-3 py-2 font-medium">{fmt(totals.total)}</td>
                      <td className="text-right tabular-nums px-3 py-2">–</td>
                      <td className="text-right tabular-nums px-3 py-2">{fmt(totals.current)}</td>
                      <td className="text-right tabular-nums px-3 py-2">{fmt(totals.days1To30)}</td>
                      <td className="text-right tabular-nums px-3 py-2">{fmt(totals.days31To60)}</td>
                      <td className="text-right tabular-nums px-3 py-2">{fmt(totals.days61To90)}</td>
                      <td className="text-right tabular-nums px-3 py-2">{fmt(totals.over90)}</td>
                    </tr>
                  ))}
                  {/* Grand Total */}
                  {grandTotal && (
                    <tr className="font-bold text-gray-900 border-t-2 border-gray-400">
                      <td className="px-4 py-3 text-sm">Grand Total</td>
                      <td />
                      <td />
                      <td className={tdAmt}>{fmt(grandTotal.total)}</td>
                      <td className={tdAmt}>{fmt(grandTotal.vatTotal)}</td>
                      <td className={tdAmt}>{fmt(grandTotal.current)}</td>
                      <td className={tdAmt}>{fmt(grandTotal.days1To30)}</td>
                      <td className={tdAmt}>{fmt(grandTotal.days31To60)}</td>
                      <td className={tdAmt}>{fmt(grandTotal.days61To90)}</td>
                      <td className={tdAmt}>{fmt(grandTotal.over90)}</td>
                    </tr>
                  )}
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
