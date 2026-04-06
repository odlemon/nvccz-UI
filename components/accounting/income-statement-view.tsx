"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CalendarIcon,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  AlertCircle,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, subDays } from "date-fns"
import { toast } from "sonner"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchIncomeStatement } from "@/lib/store/slices/accountingSlice"
import { accountingApi } from "@/lib/api/accounting-api"
import { exportIncomeStatementToPDF } from "@/lib/utils/export"
import { addLetterhead, addReportInfo, type LetterheadAddress } from "@/lib/utils/pdf-letterhead"
import { companyProfileApi } from "@/lib/api/company-profile-api"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { TransactionsDataTable } from "./transactions-data-table"
import { TransactionViewDrawer } from "./transaction-view-drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { buildConsolidatedIncomeStatement, ConsolidatedIncomeStatement } from "@/lib/utils/consolidation/income-statement"
import { withUsdZwlFallbackRates } from "@/lib/utils/consolidation/fallback-rates"

export function IncomeStatementView() {
  const dispatch = useDispatch<AppDispatch>()
  const {
    incomeStatement,
    incomeStatementLoading,
    incomeStatementError,
    currencies
  } = useSelector((state: RootState) => state.accounting)

  const defaultCurrencyId = currencies.find(c => c.code === "USD")?.id || currencies[0]?.id || ""
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [periodValue, setPeriodValue] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [currencyId, setCurrencyId] = useState(defaultCurrencyId)
  const [reportMode, setReportMode] = useState<"single" | "consolidated">("single")
  const [selectedCurrencyIds, setSelectedCurrencyIds] = useState<string[]>([])
  const [consolidatedIncome, setConsolidatedIncome] = useState<ConsolidatedIncomeStatement | null>(null)
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [activeAddress, setActiveAddress] = useState<LetterheadAddress | null>(null)

  useEffect(() => {
    companyProfileApi.getActiveAddress().then(a => { if (a) setActiveAddress(a) }).catch(() => {})
  }, [])
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
    if (!currencies.length) return
    if (selectedCurrencyIds.length === 0) {
      setSelectedCurrencyIds([defaultCurrencyId])
    }
  }, [currencies, defaultCurrencyId])

  useEffect(() => {
    if (!currencyId) return

    const isValidPeriodValue = periodType === 'custom' ||
      (periodType === 'month' && /^\d{4}-\d{2}$/.test(periodValue)) ||
      (periodType === 'quarter' && /^\d{4}-Q\d$/.test(periodValue)) ||
      (periodType === 'year' && /^\d{4}$/.test(periodValue))

    if (!isValidPeriodValue) return

    if (reportMode === "single") {
      loadIncomeStatement()
    } else {
      loadConsolidatedIncomeStatement()
    }
  }, [periodType, periodValue, startDate, endDate, currencyId, reportMode, selectedCurrencyIds])

  const buildParams = () => {
    if (periodType === 'custom') {
      return {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      }
    }

    return {
      periodType,
      periodValue,
    }
  }

  const loadIncomeStatement = async () => {
    try {
      await dispatch(fetchIncomeStatement({
        ...buildParams(),
        currencyId,
      }))
      setConsolidatedIncome(null)
    } catch (error: any) {
      toast.error("Failed to load income statement", {
        description: error.message
      })
    }
  }

  const loadConsolidatedIncomeStatement = async () => {
    if (!selectedCurrencyIds.length) {
      setConsolidatedIncome(null)
      return
    }

    try {
      setIsConsolidating(true)
      const params = buildParams()
      const reportingCurrency = currencies.find((c) => c.code === "USD") || currencies[0]

      const responses = await Promise.all(
        selectedCurrencyIds.map((id) => accountingApi.getIncomeStatementV2({ ...params, currencyId: id }))
      )

      const statements = responses
        .map((res, idx) => {
          const selectedCurrency = currencies.find((c) => c.id === selectedCurrencyIds[idx])
          if (!res.success || !res.data || !selectedCurrency) return null

          return {
            ...(res.data as any),
            // Trust user-selected source currency for consolidation metadata.
            currency: {
              id: selectedCurrency.id,
              code: selectedCurrency.code,
              name: selectedCurrency.name,
              symbol: selectedCurrency.symbol,
            },
          }
        })
        .filter(Boolean) as any[]

      if (!statements.length) {
        setConsolidatedIncome(null)
        return
      }

      const ratesResponse = await accountingApi.getExchangeRates()
      const ratesRaw = (ratesResponse as any)?.data
      const rates = Array.isArray(ratesRaw)
        ? ratesRaw
        : (ratesRaw?.exchangeRates || [])
      const normalizedRates = withUsdZwlFallbackRates(rates, currencies)

      const consolidated = buildConsolidatedIncomeStatement(
        statements,
        normalizedRates,
        reportingCurrency?.id || currencyId,
        reportingCurrency?.code || "USD"
      )

      setConsolidatedIncome(consolidated)

      if (consolidated && consolidated.missingRates.length > 0) {
        toast.warning("Some rows were excluded due to missing exchange rates", {
          description: `${consolidated.missingRates.length} row(s) have no effective rate for consolidation.`
        })
      }
    } catch (error: any) {
      setConsolidatedIncome(null)
      toast.error("Failed to load consolidated income statement", {
        description: error?.message || "Unexpected error"
      })
    } finally {
      setIsConsolidating(false)
    }
  }

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(accountId)) {
        newSet.delete(accountId)
      } else {
        newSet.add(accountId)
      }
      return newSet
    })
  }

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction)
    setIsTransactionDrawerOpen(true)
  }

  const toggleCurrencySelection = (id: string) => {
    setSelectedCurrencyIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
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
            )}git
          >
            <span>{c.code}</span>
            {c.id === currencyId && <Check className="w-4 h-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const multiCurrencyDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full min-w-[180px] flex justify-between items-center"
        >
          {selectedCurrencyIds.length
            ? selectedCurrencyIds
                .map((id) => currencies.find((c) => c.id === id)?.code)
                .filter(Boolean)
                .join(", ")
            : "Select currencies"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rounded-xl min-w-[220px]">
        {currencies.map((c) => {
          const selected = selectedCurrencyIds.includes(c.id)
          return (
            <DropdownMenuItem
              key={c.id}
              onClick={() => toggleCurrencySelection(c.id)}
              className={cn(
                "flex items-center justify-between rounded-full cursor-pointer",
                selected && "bg-blue-100"
              )}
            >
              <span>{c.code}</span>
              {selected && <Check className="w-4 h-4 text-blue-600" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const handleExportPDF = async () => {
    if (reportMode === "consolidated" && consolidatedIncome) {
      setGeneratingPDF(true)
      try {
        const doc = new jsPDF()
        let startY = await addLetterhead(doc, "Income Statement", undefined, activeAddress)
        startY = addReportInfo(doc, startY, [
          `Consolidated (${consolidatedIncome.reportingCurrencyCode})`,
          `For the period ${format(new Date(consolidatedIncome.period.startDate), "MMMM d, yyyy")} to ${format(new Date(consolidatedIncome.period.endDate), "MMMM d, yyyy")}`,
        ])

        const sectionOrder: Array<"revenue" | "operatingExpenses" | "incomeTax" | "belowTheLine"> = [
          "revenue",
          "operatingExpenses",
          "incomeTax",
          "belowTheLine",
        ]

        const rows: any[] = []
        sectionOrder.forEach((sectionKey) => {
          const sectionRows = consolidatedIncome.rows.filter((r) => r.sectionKey === sectionKey)
          if (!sectionRows.length) return

          rows.push([{ content: sectionRows[0].sectionLabel, colSpan: 4, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }])
          sectionRows.forEach((row) => {
            const isBaseCurrency = row.sourceCurrencyCode === consolidatedIncome.reportingCurrencyCode
            rows.push([
              row.accountName,
              `${row.sourceCurrencyCode} ${Math.abs(row.sourceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              isBaseCurrency ? "BASE" : row.conversionRate.toFixed(6),
              Math.abs(row.consolidatedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            ])
          })

          rows.push([
            { content: `Total ${sectionRows[0].sectionLabel}`, colSpan: 3, styles: { fontStyle: "bold" } },
            {
              content: Math.abs(consolidatedIncome.sectionTotals[sectionKey]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              styles: { fontStyle: "bold" },
            },
          ])
        })

        rows.push([
          { content: `Net ${consolidatedIncome.totals.netIncome >= 0 ? "Income" : "Loss"}`, colSpan: 3, styles: { fontStyle: "bold" } },
          {
            content: Math.abs(consolidatedIncome.totals.netIncome).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            styles: { fontStyle: "bold" },
          },
        ])

        autoTable(doc, {
          head: [["Account", "Source", "Rate", `Consolidated (${consolidatedIncome.reportingCurrencyCode})`]],
          body: rows,
          startY,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
          columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
        })

        doc.save(`IncomeStatement_Consolidated_${format(new Date(consolidatedIncome.period.startDate), "yyyyMMdd")}_${format(new Date(consolidatedIncome.period.endDate), "yyyyMMdd")}.pdf`)
        toast.success("Consolidated income statement PDF generated successfully")
      } catch {
        toast.error("Failed to generate consolidated income statement PDF")
      } finally {
        setGeneratingPDF(false)
      }
      return
    }

    if (!incomeStatement) {
      toast.error("No income statement data to export")
      return
    }
    setGeneratingPDF(true)
    try {
      const doc = new jsPDF()
      let startY = await addLetterhead(doc, "Income Statement", undefined, activeAddress)
      startY = addReportInfo(doc, startY, [
        `For the period ${format(new Date(incomeStatement.period.startDate), "MMMM d, yyyy")} to ${format(new Date(incomeStatement.period.endDate), "MMMM d, yyyy")}`,
        `Currency: ${incomeStatement.currency.name || incomeStatement.currency.code}`,
      ])

      // Prepare rows for PDF
      const rows: any[] = []
      const pushSection = (label: string) => rows.push([{ content: label, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }])
      const pushItem = (label: string, value: number | null) => rows.push([label, value !== null ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) : ""])
      const pushTotal = (label: string, value: number | null, color?: string) => rows.push([
        { content: label, styles: { fontStyle: 'bold', textColor: color ? color : undefined } },
        { content: value !== null ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) : "", styles: { fontStyle: 'bold', textColor: color ? color : undefined } }
      ])

      // Revenue
      pushSection("Revenue")
      incomeStatement.sections.revenue.accounts.forEach((acc: any) => {
        pushItem(acc.accountName, acc.amount)
      })
      pushTotal("Total Revenue", incomeStatement.sections.revenue.total, "#15803d")

      // Operating Expenses
      pushSection("Operating Expenses")
      incomeStatement.sections.operatingExpenses.accounts.forEach((acc: any) => {
        pushItem(acc.accountName, acc.amount)
      })
      pushTotal("Total Operating Expenses", incomeStatement.sections.operatingExpenses.total, "#dc2626")

      // Income Tax
      if (incomeStatement.sections.incomeTax.total > 0) {
        pushSection("Income Tax Expense")
        incomeStatement.sections.incomeTax.accounts.forEach((acc: any) => {
          pushItem(acc.accountName, acc.amount)
        })
        pushTotal("Total Income Tax Expense", incomeStatement.sections.incomeTax.total, "#dc2626")
      }

      // Below the Line Items
      if (incomeStatement.sections.belowTheLine.total !== 0) {
        pushSection("Below-the-Line Items")
        incomeStatement.sections.belowTheLine.accounts.forEach((acc: any) => {
          pushItem(acc.accountName, acc.amount)
        })
        pushTotal("Total Below-the-Line", incomeStatement.sections.belowTheLine.total)
      }

      // Net Income
      pushTotal(
        `Net ${incomeStatement.totals.netIncome >= 0 ? "Income" : "Loss"}`,
        incomeStatement.totals.netIncome,
        incomeStatement.totals.netIncome >= 0 ? "#15803d" : "#dc2626"
      )

      autoTable(doc, {
        head: [["Description", "Amount"]],
        body: rows,
        startY,
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        columnStyles: { 1: { halign: 'right' } }
      })

      doc.save(`IncomeStatement_${format(new Date(incomeStatement.period.startDate), "yyyyMMdd")}_${format(new Date(incomeStatement.period.endDate), "yyyyMMdd")}.pdf`)
      toast.success("Income statement PDF generated successfully")
    } catch (error) {
      toast.error("Failed to generate income statement PDF")
    } finally {
      setGeneratingPDF(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: incomeStatement?.currency.code || 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount))
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount))
  }

  const renderConsolidatedIncomeView = () => {
    if (!consolidatedIncome) return null

    const sections: Array<"revenue" | "operatingExpenses" | "incomeTax" | "belowTheLine"> = [
      "revenue",
      "operatingExpenses",
      "incomeTax",
      "belowTheLine",
    ]

    return (
      <div className="space-y-6">
        <div className="text-center mb-4 border-b-2 border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">National venture capital company of Zimbabwe</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Income Statement (Consolidated)</h2>
          <p className="text-gray-600">
            For the Period from {format(new Date(consolidatedIncome.period.startDate), 'MMMM d, yyyy')} to {format(new Date(consolidatedIncome.period.endDate), 'MMMM d, yyyy')}
          </p>
          <p className="text-sm text-gray-500 mt-1">Reporting Currency: {consolidatedIncome.reportingCurrencyCode}</p>
          {consolidatedIncome.missingRates.length > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              Missing rates for {consolidatedIncome.missingRates.length} row(s). Those rows were excluded from consolidated totals.
            </p>
          )}
        </div>

        {sections.map((sectionKey) => {
          const sectionRows = consolidatedIncome.rows.filter((row) => row.sectionKey === sectionKey)
          if (!sectionRows.length) return null

          return (
            <div key={sectionKey} className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">{sectionRows[0].sectionLabel}</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Account</th>
                      <th className="text-right p-3">Source</th>
                      <th className="text-right p-3">Rate</th>
                      <th className="text-right p-3">Consolidated (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionRows.map((row, idx) => (
                      <tr key={`${sectionKey}-${row.accountName}-${row.sourceCurrencyCode}-${idx}`} className="border-t">
                        <td className="p-3">{row.accountName}</td>
                        <td className="p-3 text-right font-mono">
                          {row.sourceCurrencyCode} {Math.abs(row.sourceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {row.sourceCurrencyCode === consolidatedIncome.reportingCurrencyCode ? "BASE" : row.conversionRate.toFixed(6)}
                        </td>
                        <td className="p-3 text-right font-mono">{formatUSD(row.consolidatedAmount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-semibold bg-gray-50">
                      <td className="p-3" colSpan={3}>Total {sectionRows[0].sectionLabel}</td>
                      <td className="p-3 text-right font-mono">{formatUSD(consolidatedIncome.sectionTotals[sectionKey])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        <div className="flex justify-between py-3 border-t-2 border-b-4 border-gray-900 font-bold text-lg">
          <span className={cn(
            "uppercase tracking-wide",
            consolidatedIncome.totals.netIncome >= 0 ? "text-green-800" : "text-red-800"
          )}>
            Net {consolidatedIncome.totals.netIncome >= 0 ? "Income" : "Loss"}
          </span>
          <span className={cn(
            "font-mono text-right text-xl",
            consolidatedIncome.totals.netIncome >= 0 ? "text-green-700" : "text-red-700"
          )}>
            {consolidatedIncome.totals.netIncome < 0 ? '(' : ''}
            {formatUSD(consolidatedIncome.totals.netIncome)}
            {consolidatedIncome.totals.netIncome < 0 ? ')' : ''}
          </span>
        </div>
      </div>
    )
  }

  if (reportMode === "single" && incomeStatementError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Income Statement</h3>
          <p className="text-gray-600 mb-4">{incomeStatementError}</p>
          <Button onClick={loadIncomeStatement}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Filters */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Income Statement</h2>
          <p className="text-gray-600 mt-1">
            {reportMode === "consolidated"
              ? `Consolidated View (${(currencies.find((c) => c.code === "USD") || currencies[0])?.code || "USD"} reporting)`
              : periodType === 'custom'
              ? `For the period ${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}`
              : `Period: ${getPeriodOptions().find(opt => opt.value === periodValue)?.label || periodValue}`
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <div className="flex items-center gap-1 border rounded-full p-1">
            <Button
              size="sm"
              variant={reportMode === "single" ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setReportMode("single")}
            >
              Single
            </Button>
            <Button
              size="sm"
              variant={reportMode === "consolidated" ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setReportMode("consolidated")}
            >
              Consolidated
            </Button>
          </div>

          {/* Currency Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {reportMode === "single" ? "Currency:" : "Source Currencies:"}
            </span>
            {reportMode === "single" ? currencyDropdown : multiCurrencyDropdown}
          </div>

          {/* Export PDF Button */}
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="rounded-full"
            disabled={(reportMode === "single" && !incomeStatement) || (reportMode === "consolidated" && !consolidatedIncome) || generatingPDF}
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

          <Button
            onClick={reportMode === "single" ? loadIncomeStatement : loadConsolidatedIncomeStatement}
            disabled={incomeStatementLoading || isConsolidating}
            className="rounded-full"
          >
            <RefreshCw className={cn(
              "w-4 h-4 mr-2",
              (incomeStatementLoading || isConsolidating) && "animate-spin"
            )} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Income Statement Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" />
                {reportMode === "single" ? "Profit & Loss Statement" : "Profit & Loss Statement (Consolidated)"}
            </CardTitle>
            <div className="flex items-center gap-3">
              {reportMode === "single" && incomeStatement && (
                <Badge className={cn(
                  "text-sm",
                  incomeStatement.totals.netIncome >= 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                )}>
                  {incomeStatement.totals.netIncome >= 0 ? "Profitable" : "Loss"}
                </Badge>
              )}
              {reportMode === "consolidated" && consolidatedIncome && (
                <Badge className={cn(
                  "text-sm",
                  consolidatedIncome.totals.netIncome >= 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                )}>
                  {consolidatedIncome.totals.netIncome >= 0 ? "Profitable" : "Loss"}
                </Badge>
              )}

              {/* Quick Export Button in Table Header */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExportPDF}
                disabled={(reportMode === "single" && !incomeStatement) || (reportMode === "consolidated" && !consolidatedIncome) || generatingPDF}
                className="text-xs"
              >
                {generatingPDF ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3 mr-1" />
                )}
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(reportMode === "single" && incomeStatementLoading) || (reportMode === "consolidated" && isConsolidating) ? (
            <IncomeStatementSkeleton />
          ) : reportMode === "consolidated" ? (
            consolidatedIncome ? (
              <div className="max-w-6xl mx-auto">{renderConsolidatedIncomeView()}</div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Consolidated Income Statement Data</h3>
                <p className="text-gray-600">No data available for selected currencies and period</p>
              </div>
            )
          ) : incomeStatement ? (
            <div className="max-w-6xl mx-auto">
              {/* Company Header */}
              <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">National venture capital company of Zimbabwe</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Income Statement</h2>
                <p className="text-gray-600">
                  For the Period from {format(new Date(incomeStatement.period.startDate), 'MMMM d, yyyy')} to {format(new Date(incomeStatement.period.endDate), 'MMMM d, yyyy')}
                </p>
              </div>

              <div className="space-y-6">
                {/* Revenue Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2">
                    <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                      {incomeStatement.sections.revenue.label}
                    </h3>
                  </div>

                  <div className="ml-8 space-y-1">
                    {incomeStatement.sections.revenue.accounts.map((account: any) => {
                      const isExpanded = expandedAccounts.has(account.accountId)
                      const hasTransactions = account.transactions && account.transactions.length > 0

                      return (
                        <div key={account.accountId} className="space-y-2">
                          <div
                            className={cn(
                              "flex justify-between py-1 rounded-md px-2 -mx-2",
                              hasTransactions && "cursor-pointer hover:bg-gray-100 transition-colors"
                            )}
                            onClick={() => hasTransactions && toggleAccount(account.accountId)}
                          >
                            <div className="flex items-center gap-2">
                              {hasTransactions && (
                                <div className="h-6 w-6 flex items-center justify-center">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              )}
                              <span className="text-gray-700">{account.accountName}</span>
                              {hasTransactions && (
                                <Badge variant="outline" className="text-xs">
                                  {account.transactions.length} txns
                                </Badge>
                              )}
                            </div>
                            <span className="font-mono text-right w-32 text-green-700">
                              {formatCurrency(account.amount || account.netAmount)}
                            </span>
                          </div>

                          {/* Expandable Transactions */}
                          {isExpanded && hasTransactions && (
                            <div className="ml-8 my-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <TransactionsDataTable
                                transactions={account.transactions}
                                onRowClick={handleTransactionClick}
                                title={`${account.accountName} Transactions`}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {incomeStatement.sections.revenue.accounts.length === 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500 italic">No revenue accounts</span>
                        <span className="font-mono text-right w-32">-</span>
                      </div>
                    )}
                  </div>

                  {/* Total Revenue with underline */}
                  <div className="flex justify-between py-2 border-t border-b-2 border-gray-800 ml-8 font-semibold">
                    <span className="text-gray-900">Total Revenue</span>
                    <span className="font-mono text-right w-32 text-green-700">
                      {formatCurrency(incomeStatement.sections.revenue.total)}
                    </span>
                  </div>
                </div>

                {/* Operating Expenses Section */}
                <div className="space-y-2 mt-8">
                  <div className="flex justify-between items-center py-2">
                    <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                      {incomeStatement.sections.operatingExpenses.label}
                    </h3>
                  </div>

                  <div className="ml-8 space-y-1">
                    {incomeStatement.sections.operatingExpenses.accounts.map((account: any) => {
                      const isExpanded = expandedAccounts.has(account.accountId)
                      const hasTransactions = account.transactions && account.transactions.length > 0

                      return (
                        <div key={account.accountId} className="space-y-2">
                          <div
                            className={cn(
                              "flex justify-between py-1 rounded-md px-2 -mx-2",
                              hasTransactions && "cursor-pointer hover:bg-red-50 transition-colors"
                            )}
                            onClick={() => hasTransactions && toggleAccount(account.accountId)}
                          >
                            <div className="flex items-center gap-2">
                              {hasTransactions && (
                                <div className="h-6 w-6 flex items-center justify-center">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              )}
                              <span className="text-gray-700">{account.accountName}</span>
                              {hasTransactions && (
                                <Badge variant="outline" className="text-xs">
                                  {account.transactions.length} txns
                                </Badge>
                              )}
                            </div>
                            <span className="font-mono text-right w-32 text-red-700">
                              {formatCurrency(account.amount || account.netAmount)}
                            </span>
                          </div>

                          {/* Expandable Transactions */}
                          {isExpanded && hasTransactions && (
                            <div className="ml-8 my-2 p-4 bg-red-50 rounded-lg border border-red-200">
                              <TransactionsDataTable
                                transactions={account.transactions}
                                onRowClick={handleTransactionClick}
                                title={`${account.accountName} Transactions`}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {incomeStatement.sections.operatingExpenses.accounts.length === 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500 italic">No expense accounts</span>
                        <span className="font-mono text-right w-32">-</span>
                      </div>
                    )}
                  </div>

                  {/* Total Operating Expenses with underline */}
                  <div className="flex justify-between py-2 border-t border-b-2 border-gray-800 ml-8 font-semibold">
                    <span className="text-gray-900">Total Operating Expenses</span>
                    <span className="font-mono text-right w-32 text-red-700">
                      {formatCurrency(incomeStatement.sections.operatingExpenses.total)}
                    </span>
                  </div>
                </div>

                {/* Net Income Before Taxes */}
                <div className="flex justify-between py-2 border-t ml-8 font-semibold">
                  <span className="text-gray-900">Net Income Before Taxes</span>
                  <span className={cn(
                    "font-mono text-right w-32",
                    incomeStatement.totals.netIncomeBeforeTaxes >= 0 ? "text-green-700" : "text-red-700"
                  )}>
                    {formatCurrency(Math.abs(incomeStatement.totals.netIncomeBeforeTaxes))}
                  </span>
                </div>

                {/* Income Tax Section (if any) */}
                {incomeStatement.sections.incomeTax.total > 0 && (
                  <div className="space-y-2 mt-8">
                    <div className="flex justify-between items-center py-2">
                      <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                        {incomeStatement.sections.incomeTax.label}
                      </h3>
                    </div>

                    <div className="ml-8 space-y-1">
                      {incomeStatement.sections.incomeTax.accounts.map((account: any) => {
                        const isExpanded = expandedAccounts.has(account.accountId)
                        const hasTransactions = account.transactions && account.transactions.length > 0

                        return (
                          <div key={account.accountId} className="space-y-2">
                            <div
                              className={cn(
                                "flex justify-between py-1 rounded-md px-2 -mx-2",
                                hasTransactions && "cursor-pointer hover:bg-amber-50 transition-colors"
                              )}
                              onClick={() => hasTransactions && toggleAccount(account.accountId)}
                            >
                              <div className="flex items-center gap-2">
                                {hasTransactions && (
                                  <div className="h-6 w-6 flex items-center justify-center">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </div>
                                )}
                                <span className="text-gray-700">{account.accountName}</span>
                                {hasTransactions && (
                                  <Badge variant="outline" className="text-xs">
                                    {account.transactions.length} txns
                                  </Badge>
                                )}
                              </div>
                              <span className="font-mono text-right w-32 text-red-700">
                                {formatCurrency(account.amount || account.netAmount)}
                              </span>
                            </div>

                            {/* Expandable Transactions */}
                            {isExpanded && hasTransactions && (
                              <div className="ml-8 my-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <TransactionsDataTable
                                  transactions={account.transactions}
                                  onRowClick={handleTransactionClick}
                                  title={`${account.accountName} Transactions`}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex justify-between py-2 border-t border-b-2 border-gray-800 ml-8 font-semibold">
                      <span className="text-gray-900">Total Income Tax Expense</span>
                      <span className="font-mono text-right w-32 text-red-700">
                        {formatCurrency(incomeStatement.sections.incomeTax.total)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Below-the-Line Items (if any) */}
                {incomeStatement.sections.belowTheLine.total !== 0 && (
                  <div className="space-y-2 mt-8">
                    <div className="flex justify-between items-center py-2">
                      <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                        {incomeStatement.sections.belowTheLine.label}
                      </h3>
                    </div>

                    <div className="ml-8 space-y-1">
                      {incomeStatement.sections.belowTheLine.accounts.map((account: any) => {
                        const isExpanded = expandedAccounts.has(account.accountId)
                        const hasTransactions = account.transactions && account.transactions.length > 0

                        return (
                          <div key={account.accountId} className="space-y-2">
                            <div
                              className={cn(
                                "flex justify-between py-1 rounded-md px-2 -mx-2",
                                hasTransactions && "cursor-pointer hover:bg-purple-50 transition-colors"
                              )}
                              onClick={() => hasTransactions && toggleAccount(account.accountId)}
                            >
                              <div className="flex items-center gap-2">
                                {hasTransactions && (
                                  <div className="h-6 w-6 flex items-center justify-center">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </div>
                                )}
                                <span className="text-gray-700">{account.accountName}</span>
                                {hasTransactions && (
                                  <Badge variant="outline" className="text-xs">
                                    {account.transactions.length} txns
                                  </Badge>
                                )}
                              </div>
                              <span className="font-mono text-right w-32">
                                {formatCurrency(account.amount || account.netAmount)}
                              </span>
                            </div>

                            {/* Expandable Transactions */}
                            {isExpanded && hasTransactions && (
                              <div className="ml-8 my-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <TransactionsDataTable
                                  transactions={account.transactions}
                                  onRowClick={handleTransactionClick}
                                  title={`${account.accountName} Transactions`}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex justify-between py-2 border-t border-b-2 border-gray-800 ml-8 font-semibold">
                      <span className="text-gray-900">Total Below-the-Line</span>
                      <span className="font-mono text-right w-32">
                        {formatCurrency(incomeStatement.sections.belowTheLine.total)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Net Income Section */}
                <div className="mt-8 pt-4">
                  <div className="flex justify-between py-3 border-t-2 border-b-4 border-gray-900 font-bold text-lg">
                    <span className={cn(
                      "text-gray-900 uppercase tracking-wide",
                      incomeStatement.totals.netIncome >= 0 ? "text-green-800" : "text-red-800"
                    )}>
                      Net {incomeStatement.totals.netIncome >= 0 ? "Income" : "Loss"}
                    </span>
                    <span className={cn(
                      "font-mono text-right w-32 text-xl",
                      incomeStatement.totals.netIncome >= 0 ? "text-green-700" : "text-red-700"
                    )}>
                      {incomeStatement.totals.netIncome < 0 ? '(' : ''}
                      {formatCurrency(Math.abs(incomeStatement.totals.netIncome))}
                      {incomeStatement.totals.netIncome < 0 ? ')' : ''}
                    </span>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="mt-8 pt-6 border-t border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium">Revenue Accounts</div>
                      <div className="text-2xl font-bold text-green-700">
                        {incomeStatement.sections.revenue.accounts.length}
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-sm text-red-600 font-medium">Expense Accounts</div>
                      <div className="text-2xl font-bold text-red-700">
                        {incomeStatement.sections.operatingExpenses.accounts.length}
                      </div>
                    </div>
                    <div className={cn(
                      "rounded-lg p-4",
                      incomeStatement.totals.netIncome >= 0 ? "bg-green-50" : "bg-red-50"
                    )}>
                      <div className={cn(
                        "text-sm font-medium",
                        incomeStatement.totals.netIncome >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        Profit Margin
                      </div>
                      <div className={cn(
                        "text-2xl font-bold",
                        incomeStatement.totals.netIncome >= 0 ? "text-green-700" : "text-red-700"
                      )}>
                        {incomeStatement.sections.revenue.total > 0
                          ? `${((incomeStatement.totals.netIncome / incomeStatement.sections.revenue.total) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Footer */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                  <p>Report generated on {format(new Date(incomeStatement.generatedAt), 'PPP p')}</p>
                  <p>Currency: {incomeStatement.currency.name} ({incomeStatement.currency.code})</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Income Statement Data</h3>
              <p className="text-gray-600">No data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction View Drawer */}
      <TransactionViewDrawer
        isOpen={isTransactionDrawerOpen}
        onClose={() => setIsTransactionDrawerOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  )
}

function IncomeStatementSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="text-right">
          <div className="h-8 w-32 bg-gray-300 rounded ml-auto"></div>
          <div className="h-4 w-24 bg-gray-200 rounded ml-auto mt-2"></div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="text-right">
          <div className="h-8 w-32 bg-gray-300 rounded ml-auto"></div>
          <div className="h-4 w-24 bg-gray-200 rounded ml-auto mt-2"></div>
        </div>
      </div>

      <div className="border-2 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="text-right">
            <div className="h-10 w-40 bg-gray-300 rounded ml-auto"></div>
            <div className="h-4 w-28 bg-gray-200 rounded ml-auto mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
