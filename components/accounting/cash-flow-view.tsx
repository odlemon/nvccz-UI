"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, RefreshCw, FileText, Loader2, AlertCircle, Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, subDays } from "date-fns"
import { toast } from "sonner"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchCashFlow } from "@/lib/store/slices/accountingSlice"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addLetterhead, addReportInfo } from "@/lib/utils/pdf-letterhead"
import { TransactionsDataTable } from "./transactions-data-table"
import { TransactionViewDrawer } from "./transaction-view-drawer"

function formatMoney(v: number | string) {
  return (
    <span className="font-mono tabular-nums">
      {Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

function CashFlowSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
        <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
        <div className="h-5 w-32 bg-gray-100 rounded mx-auto mb-2"></div>
        <div className="h-4 w-40 bg-gray-100 rounded mx-auto"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2">Description</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(20)].map((_, i) => (
              <tr key={i}>
                <td className={cn("py-1 pl-2", i % 6 === 0 && "pt-4 pb-1")}>
                  <div className={cn("h-4 rounded", i % 6 === 0 ? "w-32 bg-gray-100" : "w-56 bg-gray-200")}></div>
                </td>
                <td className="py-1 pr-2 text-right">
                  <div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CashFlowView() {
  const dispatch = useDispatch<AppDispatch>()
  const { cashFlow, cashFlowLoading, cashFlowError, currencies } = useSelector((s: RootState) => s.accounting)

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear(), 11, 31)
  const defaultCurrencyId = currencies.find(c => c.code === "USD")?.id || currencies[0]?.id || ""

  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [periodValue, setPeriodValue] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [startDate, setStartDate] = useState<Date>(startOfYear)
  const [endDate, setEndDate] = useState<Date>(endOfYear)
  const [currencyId, setCurrencyId] = useState(defaultCurrencyId)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false)

  // Generate period options based on period type
  const getPeriodOptions = () => {
    const currentYear = new Date().getFullYear()
    const options: { label: string; value: string }[] = []

    if (periodType === 'month') {
      // Generate last 24 months
      for (let i = 0; i < 24; i++) {
        const date = new Date(currentYear, new Date().getMonth() - i, 1)
        const value = format(date, 'yyyy-MM')
        const label = format(date, 'MMMM yyyy')
        options.push({ label, value })
      }
    } else if (periodType === 'quarter') {
      // Generate last 8 quarters
      for (let i = 0; i < 8; i++) {
        const year = currentYear - Math.floor(i / 4)
        const quarter = 4 - (i % 4)
        options.push({
          label: `Q${quarter} ${year}`,
          value: `${year}-Q${quarter}`
        })
      }
    } else if (periodType === 'year') {
      // Generate last 5 years
      for (let i = 0; i < 5; i++) {
        const year = currentYear - i
        options.push({
          label: year.toString(),
          value: year.toString()
        })
      }
    }

    return options
  }

  // Update period value when period type changes
  useEffect(() => {
    if (periodType !== 'custom') {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()

      if (periodType === 'month') {
        const newValue = format(new Date(), 'yyyy-MM')
        setPeriodValue(newValue)
      } else if (periodType === 'quarter') {
        const quarter = Math.ceil((currentMonth + 1) / 3)
        const newValue = `${currentYear}-Q${quarter}`
        setPeriodValue(newValue)
      } else if (periodType === 'year') {
        const newValue = currentYear.toString()
        setPeriodValue(newValue)
      }
    }
  }, [periodType])

  useEffect(() => {
    if (currencies.length && !currencyId) setCurrencyId(defaultCurrencyId)
  }, [currencies])

  useEffect(() => {
    if (currencyId) {
      // Only load data when we have a valid periodValue for the current periodType (or when in custom mode)
      const isValidPeriodValue = periodType === 'custom' ||
        (periodType === 'month' && /^\d{4}-\d{2}$/.test(periodValue)) ||
        (periodType === 'quarter' && /^\d{4}-Q\d$/.test(periodValue)) ||
        (periodType === 'year' && /^\d{4}$/.test(periodValue))

      if (isValidPeriodValue) {
        loadCashFlow()
      }
    }
  }, [periodType, periodValue, startDate, endDate, currencyId])

  const loadCashFlow = async () => {
    try {
      if (periodType === 'custom') {
        // Use date range for custom period
        await dispatch(fetchCashFlow({
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          currencyId
        }) as any)
      } else {
        // Use period type and value
        await dispatch(fetchCashFlow({
          periodType,
          periodValue,
          currencyId
        }) as any)
      }
    } catch (error: any) {
      toast.error("Failed to load cash flow statement", { description: error.message })
    }
  }

  const handleGenerate = async () => {
    await loadCashFlow()
  }

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev)
      if (next.has(accountId)) {
        next.delete(accountId)
      } else {
        next.add(accountId)
      }
      return next
    })
  }

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction)
    setIsTransactionDrawerOpen(true)
  }

  // Custom dropdown for currency selection
  const currencyDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full min-w-[90px] flex justify-between items-center"
        >
          {currencies.find(c => c.id === currencyId)?.code || "Select"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rounded-xl min-w-[120px]">
        {currencies.map(c => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => setCurrencyId(c.id)}
            className={cn(
              "flex items-center justify-between rounded-full cursor-pointer",
              c.id === currencyId && "bg-blue-100"
            )}
          >
            <span>{c.code} <span className="text-xs text-gray-400 ml-1">{c.name}</span></span>
            {c.id === currencyId && <Check className="w-4 h-4 text-blue-600 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Export to PDF implementation
  const handleExportPDF = async () => {
    if (!cashFlow) {
      toast.error("No cash flow data to export")
      return
    }
    setGeneratingPDF(true)
    try {
      const doc = new jsPDF()
      let startY = await addLetterhead(doc, "Cash Flow Statement")
      startY = addReportInfo(doc, startY, [
        `For the period ${format(new Date(cashFlow.period.startDate), "MMMM d, yyyy")} to ${format(new Date(cashFlow.period.endDate), "MMMM d, yyyy")}`,
        `Currency: ${cashFlow.currency.name}`,
      ])

      const rows: any[] = []
      const pushSection = (label: string) => rows.push([{ content: label, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }])
      const pushItem = (label: string, value: number) => rows.push([`  ${label}`, value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })])
      const pushTotal = (label: string, value: number) => rows.push([{ content: label, styles: { fontStyle: 'bold' } }, { content: value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold' } }])

      // Operating Activities
      pushSection("Operating Activities")
      cashFlow.operatingActivities.accounts?.forEach((account: any) =>
        pushItem(`${account.accountNo} - ${account.accountName}`, account.netAmount)
      )
      pushTotal("Total Operating Activities", cashFlow.operatingActivities.total)

      // Investing Activities
      pushSection("Investing Activities")
      cashFlow.investingActivities.accounts?.forEach((account: any) =>
        pushItem(`${account.accountNo} - ${account.accountName}`, account.netAmount)
      )
      pushTotal("Total Investing Activities", cashFlow.investingActivities.total)

      // Financing Activities
      pushSection("Financing Activities")
      cashFlow.financingActivities.accounts?.forEach((account: any) =>
        pushItem(`${account.accountNo} - ${account.accountName}`, account.netAmount)
      )
      pushTotal("Total Financing Activities", cashFlow.financingActivities.total)

      // Summary
      pushTotal("Net Change in Cash", cashFlow.netCashFlow)
      pushItem("Beginning Cash Balance", cashFlow.beginningCashBalance)
      pushItem("Ending Cash Balance", cashFlow.endingCashBalance)

      autoTable(doc, {
        head: [["Description", "Amount"]],
        body: rows,
        startY,
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        columnStyles: { 1: { halign: 'right' } }
      })

      doc.save(`CashFlow_${cashFlow.period.startDate}_${cashFlow.period.endDate}.pdf`)
      toast.success("Cash flow PDF generated successfully")
    } catch (err) {
      toast.error("Failed to generate cash flow PDF")
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (cashFlowError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Cash Flow Statement</h3>
          <p className="text-gray-600 mb-4">{cashFlowError}</p>
          <Button onClick={handleGenerate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  function renderTraditionalCashFlow() {
    if (!cashFlow) return null

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Company Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">National venture capital company of Zimbabwe</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Cash Flow Statement</h2>
          <p className="text-gray-600">
            For the period {format(new Date(cashFlow.period.startDate), "MMMM d, yyyy")} to {format(new Date(cashFlow.period.endDate), "MMMM d, yyyy")}
          </p>
          <p className="text-sm text-gray-500 mt-1">Currency: {cashFlow.currency.name} ({cashFlow.currency.code})</p>
        </div>

        {/* Operating Activities Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
            Operating Activities
          </h3>
          {cashFlow.operatingActivities.accounts && cashFlow.operatingActivities.accounts.length > 0 ? (
            cashFlow.operatingActivities.accounts.map((account: any) => {
              const hasTransactions = account.transactions && account.transactions.length > 0
              const isExpanded = expandedAccounts.has(account.accountId)

              return (
                <div key={account.accountId} className="space-y-2">
                  <div
                    className={cn(
                      "flex items-center justify-between py-2 rounded-lg px-2",
                      hasTransactions && "cursor-pointer hover:bg-blue-50 transition-colors"
                    )}
                    onClick={() => hasTransactions && toggleAccount(account.accountId)}
                  >
                    <div className="flex items-center gap-3">
                      {hasTransactions && (
                        <div className="h-6 w-6 flex items-center justify-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{account.accountNo}</span>
                        <span className="text-sm font-medium">{account.accountName}</span>
                        {hasTransactions && (
                          <Badge variant="outline" className="text-xs">
                            {account.transactions.length} transactions
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "font-mono text-sm",
                        account.netAmount < 0 ? "text-red-600" : "text-gray-900"
                      )}>
                        {formatMoney(account.netAmount)}
                      </span>
                    </div>
                  </div>
                  {isExpanded && hasTransactions && (
                    <div className="bg-blue-50 rounded-lg p-4 ml-8">
                      <TransactionsDataTable
                        transactions={account.transactions}
                        onRowClick={handleTransactionClick}
                        loading={false}
                      />
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-500 italic pl-4">No operating activities</p>
          )}
          <div className="flex justify-between border-t-2 border-gray-400 pt-2 font-bold">
            <span className="text-sm">Total Operating Activities</span>
            <span className={cn(
              "font-mono text-sm",
              cashFlow.operatingActivities.total < 0 ? "text-red-600" : "text-blue-700"
            )}>
              {formatMoney(cashFlow.operatingActivities.total)}
            </span>
          </div>
        </div>

        {/* Investing Activities Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
            Investing Activities
          </h3>
          {cashFlow.investingActivities.accounts && cashFlow.investingActivities.accounts.length > 0 ? (
            cashFlow.investingActivities.accounts.map((account: any) => {
              const hasTransactions = account.transactions && account.transactions.length > 0
              const isExpanded = expandedAccounts.has(account.accountId)

              return (
                <div key={account.accountId} className="space-y-2">
                  <div
                    className={cn(
                      "flex items-center justify-between py-2 rounded-lg px-2",
                      hasTransactions && "cursor-pointer hover:bg-green-50 transition-colors"
                    )}
                    onClick={() => hasTransactions && toggleAccount(account.accountId)}
                  >
                    <div className="flex items-center gap-3">
                      {hasTransactions && (
                        <div className="h-6 w-6 flex items-center justify-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{account.accountNo}</span>
                        <span className="text-sm font-medium">{account.accountName}</span>
                        {hasTransactions && (
                          <Badge variant="outline" className="text-xs">
                            {account.transactions.length} transactions
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "font-mono text-sm",
                        account.netAmount < 0 ? "text-red-600" : "text-gray-900"
                      )}>
                        {formatMoney(account.netAmount)}
                      </span>
                    </div>
                  </div>
                  {isExpanded && hasTransactions && (
                    <div className="bg-green-50 rounded-lg p-4 ml-8">
                      <TransactionsDataTable
                        transactions={account.transactions}
                        onRowClick={handleTransactionClick}
                        loading={false}
                      />
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-500 italic pl-4">No investing activities</p>
          )}
          <div className="flex justify-between border-t-2 border-gray-400 pt-2 font-bold">
            <span className="text-sm">Total Investing Activities</span>
            <span className={cn(
              "font-mono text-sm",
              cashFlow.investingActivities.total < 0 ? "text-red-600" : "text-blue-700"
            )}>
              {formatMoney(cashFlow.investingActivities.total)}
            </span>
          </div>
        </div>

        {/* Financing Activities Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
            Financing Activities
          </h3>
          {cashFlow.financingActivities.accounts && cashFlow.financingActivities.accounts.length > 0 ? (
            cashFlow.financingActivities.accounts.map((account: any) => {
              const hasTransactions = account.transactions && account.transactions.length > 0
              const isExpanded = expandedAccounts.has(account.accountId)

              return (
                <div key={account.accountId} className="space-y-2">
                  <div
                    className={cn(
                      "flex items-center justify-between py-2 rounded-lg px-2",
                      hasTransactions && "cursor-pointer hover:bg-amber-50 transition-colors"
                    )}
                    onClick={() => hasTransactions && toggleAccount(account.accountId)}
                  >
                    <div className="flex items-center gap-3">
                      {hasTransactions && (
                        <div className="h-6 w-6 flex items-center justify-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{account.accountNo}</span>
                        <span className="text-sm font-medium">{account.accountName}</span>
                        {hasTransactions && (
                          <Badge variant="outline" className="text-xs">
                            {account.transactions.length} transactions
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "font-mono text-sm",
                        account.netAmount < 0 ? "text-red-600" : "text-gray-900"
                      )}>
                        {formatMoney(account.netAmount)}
                      </span>
                    </div>
                  </div>
                  {isExpanded && hasTransactions && (
                    <div className="bg-amber-50 rounded-lg p-4 ml-8">
                      <TransactionsDataTable
                        transactions={account.transactions}
                        onRowClick={handleTransactionClick}
                        loading={false}
                      />
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-500 italic pl-4">No financing activities</p>
          )}
          <div className="flex justify-between border-t-2 border-gray-400 pt-2 font-bold">
            <span className="text-sm">Total Financing Activities</span>
            <span className={cn(
              "font-mono text-sm",
              cashFlow.financingActivities.total < 0 ? "text-red-600" : "text-blue-700"
            )}>
              {formatMoney(cashFlow.financingActivities.total)}
            </span>
          </div>
        </div>

        {/* Cash Flow Summary */}
        <div className="space-y-3 border-t-2 border-gray-500 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold">Net Change in Cash</span>
            <span className={cn(
              "font-mono text-base font-bold",
              cashFlow.netCashFlow < 0 ? "text-red-600" : "text-blue-700"
            )}>
              {formatMoney(cashFlow.netCashFlow)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="pl-4">Beginning Cash Balance</span>
            <span className="font-mono">{formatMoney(cashFlow.beginningCashBalance)}</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-gray-500 pt-2">
            <span className="text-base font-bold">Ending Cash Balance</span>
            <span className="font-mono text-base font-bold text-blue-700">
              {formatMoney(cashFlow.endingCashBalance)}
            </span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Generated on {format(new Date(cashFlow.generatedAt), "PPP 'at' p")}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Cash Flow Statement</h2>
          <p className="text-gray-600">
            {periodType === 'custom'
              ? `For the period ${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}`
              : `Period: ${getPeriodOptions().find(opt => opt.value === periodValue)?.label || periodValue}`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Type Selector */}
          <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
            <SelectTrigger className="w-[140px] rounded-full">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {periodType !== 'custom' ? (
            /* Period Value Selector */
            <Select value={periodValue} onValueChange={setPeriodValue}>
              <SelectTrigger className="w-[180px] rounded-full">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {getPeriodOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            /* Custom Date Range */
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">From:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">To:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
          {/* Custom currency dropdown */}
          <div>
            {currencyDropdown}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={cashFlowLoading}
            className="rounded-full"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", cashFlowLoading && "animate-spin")} />
            Generate
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="rounded-full"
            disabled={generatingPDF || !cashFlow}
          >
            {generatingPDF ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cash Flow Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Cash Flow Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cashFlowLoading ? (
            <CashFlowSkeleton />
          ) : cashFlow ? (
            renderTraditionalCashFlow()
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Cash Flow Data</h3>
              <p className="text-gray-600">No data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction View Drawer */}
      <TransactionViewDrawer
        transaction={selectedTransaction}
        isOpen={isTransactionDrawerOpen}
        onClose={() => setIsTransactionDrawerOpen(false)}
      />
    </div>
  )
}
