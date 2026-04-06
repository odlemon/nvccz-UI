"use client"

import React, { useEffect, useState, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
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
  Building2,
  Wallet,
  CreditCard,
  BarChart3,
  AlertCircle,
  Scale,
  Download,
  FileText,
  Loader2,
  Eye,
  Check
} from "lucide-react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { CiSearch, CiFilter, CiReceipt } from "react-icons/ci"
import { TransactionsDataTable } from "./transactions-data-table"
import { TransactionViewDrawer } from "./transaction-view-drawer"
import { CurrencyFilter } from "./CurrencyFilter"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchTrialBalance, fetchTrialBalanceSummary } from "@/lib/store/slices/accountingSlice"
import { accountingApi } from "@/lib/api/accounting-api"
import { exportTrialBalanceToCSV, exportTrialBalanceToPDF } from "@/lib/utils/export"
import { buildConsolidatedTrialBalance, ConsolidatedTrialBalance } from "@/lib/utils/consolidation/trial-balance"
import { withUsdZwlFallbackRates } from "@/lib/utils/consolidation/fallback-rates"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addLetterhead, addReportInfo, type LetterheadAddress } from "@/lib/utils/pdf-letterhead"
import { companyProfileApi } from "@/lib/api/company-profile-api"

function TrialBalanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-4 h-[80px] flex items-center">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-7 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-100 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
        <div className="w-48 h-10 bg-gray-200 rounded"></div>
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></th>
                  <th className="text-left py-3 px-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></th>
                  <th className="text-left py-3 px-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></th>
                  <th className="text-right py-3 px-4"><div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div></th>
                  <th className="text-right py-3 px-4"><div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div></th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-40 bg-gray-200 rounded"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-4 bg-gray-200 rounded"></div></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-gray-50 font-semibold">
                  <td colSpan={3} className="py-4 px-4"><div className="h-5 w-20 bg-gray-300 rounded"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-5 w-28 bg-gray-300 rounded ml-auto"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-5 w-28 bg-gray-300 rounded ml-auto"></div></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TrialBalanceView() {
  const dispatch = useDispatch<AppDispatch>()
  const {
    trialBalance,
    trialBalanceSummary,
    trialBalanceLoading,
    trialBalanceSummaryLoading,
    trialBalanceError,
    trialBalanceSummaryError,
    selectedCurrencyId,
    currencies
  } = useSelector((state: RootState) => state.accounting)

  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year'>('month')
  const [periodValue, setPeriodValue] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [reportMode, setReportMode] = useState<"single" | "consolidated">("single")
  const [selectedCurrencyIds, setSelectedCurrencyIds] = useState<string[]>([])
  const [consolidatedTrialBalance, setConsolidatedTrialBalance] = useState<ConsolidatedTrialBalance | null>(null)
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [activeAddress, setActiveAddress] = useState<LetterheadAddress | null>(null)

  useEffect(() => {
    companyProfileApi.getActiveAddress().then(a => { if (a) setActiveAddress(a) }).catch(() => {})
  }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAccountType, setFilterAccountType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // track which account rows are expanded to show transaction details
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
  }, [periodType])

  useEffect(() => {
    if (!currencies.length) return
    if (selectedCurrencyIds.length === 0) {
      const defaultCurrencyId = currencies.find(c => c.code === "USD")?.id || currencies[0]?.id
      if (defaultCurrencyId) setSelectedCurrencyIds([defaultCurrencyId])
    }
  }, [currencies, selectedCurrencyIds.length])

  useEffect(() => {
    // Only load data when we have a valid periodValue for the current periodType
    const isValidPeriodValue = 
      (periodType === 'month' && /^\d{4}-\d{2}$/.test(periodValue)) ||
      (periodType === 'quarter' && /^\d{4}-Q\d$/.test(periodValue)) ||
      (periodType === 'year' && /^\d{4}$/.test(periodValue))
    
    if (isValidPeriodValue) {
      if (reportMode === "single") {
        loadTrialBalanceData()
      } else {
        loadConsolidatedTrialBalance()
      }
    }
  }, [periodType, periodValue, selectedCurrencyId, reportMode, selectedCurrencyIds])

  const loadTrialBalanceData = async () => {
    try {
      await Promise.all([
        dispatch(fetchTrialBalance({ 
          periodType, 
          periodValue,
          currencyId: selectedCurrencyId || undefined
        })),
        dispatch(fetchTrialBalanceSummary({ 
          periodType, 
          periodValue,
          currencyId: selectedCurrencyId || undefined
        }))
      ])
      setConsolidatedTrialBalance(null)
    } catch (error: any) {
      toast.error("Failed to load trial balance data", {
        description: error.message
      })
    }
  }

  const loadConsolidatedTrialBalance = async () => {
    if (!selectedCurrencyIds.length) {
      setConsolidatedTrialBalance(null)
      return
    }

    try {
      setIsConsolidating(true)
      const reportingCurrency = currencies.find((c) => c.code === "USD") || currencies[0]

      const responses = await Promise.all(
        selectedCurrencyIds.map((id) =>
          accountingApi.getTrialBalanceV2({
            periodType,
            periodValue,
            currencyId: id,
          })
        )
      )

      const statements = responses
        .map((res, idx) => ({
          ok: res.success && res.data,
          data: res.data as any,
          currency: currencies.find((c) => c.id === selectedCurrencyIds[idx]),
        }))
        .filter((x) => x.ok && x.data && x.currency)
        .map((x) => ({ currency: x.currency!, trialBalance: x.data }))

      if (!statements.length) {
        setConsolidatedTrialBalance(null)
        return
      }

      const ratesResponse = await accountingApi.getExchangeRates()
      const ratesRaw = (ratesResponse as any)?.data
      const rates = Array.isArray(ratesRaw)
        ? ratesRaw
        : (ratesRaw?.exchangeRates || [])
      const normalizedRates = withUsdZwlFallbackRates(rates, currencies)

      const consolidated = buildConsolidatedTrialBalance(
        statements,
        normalizedRates,
        { id: reportingCurrency?.id || selectedCurrencyId || "", code: reportingCurrency?.code || "USD" }
      )
      setConsolidatedTrialBalance(consolidated)

      if (consolidated && consolidated.missingRates.length > 0) {
        toast.warning("Some accounts were excluded due to missing exchange rates", {
          description: `${consolidated.missingRates.length} row(s) have no effective rate for consolidation.`,
        })
      }
    } catch (error: any) {
      setConsolidatedTrialBalance(null)
      toast.error("Failed to load consolidated trial balance", {
        description: error?.message || "Unexpected error",
      })
    } finally {
      setIsConsolidating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const currencyCode = currencies.find(c => c.id === selectedCurrencyId)?.code || 'USD'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount)
  }

  const toggleAccountExpand = (accountId: string) => {
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

  const toggleCurrencySelection = (id: string) => {
    setSelectedCurrencyIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
  }

  // Filter and search
  const sourceAccounts = reportMode === "single"
    ? (trialBalance?.accounts || [])
    : (consolidatedTrialBalance?.rows || [])

  const filteredAccounts = sourceAccounts.filter((account: any) => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.accountNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterAccountType === 'all' || account.accountType.toLowerCase() === filterAccountType.toLowerCase()
    return matchesSearch && matchesFilter
  }) || []

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterAccountType])

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case 'current asset':
      case 'fixed asset':
        return 'bg-blue-100 text-blue-800'
      case 'current liability':
      case 'long-term liability':
        return 'bg-red-100 text-red-800'
      case 'revenue':
        return 'bg-green-100 text-green-800'
      case 'expense':
        return 'bg-orange-100 text-orange-800'
      case 'equity':
        return 'bg-purple-100 text-purple-800'
      case 'contra-asset':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExportCSV = () => {
    if (reportMode === "consolidated" && consolidatedTrialBalance) {
      const headers = ['Account No.', 'Account Name', 'Account Type', 'Source Currency', 'Source Debit', 'Source Credit', 'Rate', `Consolidated Debit (${consolidatedTrialBalance.reportingCurrencyCode})`, `Consolidated Credit (${consolidatedTrialBalance.reportingCurrencyCode})`]
      const rows = consolidatedTrialBalance.rows.map((row) => [
        row.accountNo,
        `"${row.accountName}"`,
        row.accountType,
        row.sourceCurrencyCode,
        row.sourceDebit.toFixed(2),
        row.sourceCredit.toFixed(2),
        row.conversionRate.toFixed(6),
        row.consolidatedDebit.toFixed(2),
        row.consolidatedCredit.toFixed(2),
      ])

      rows.push([
        '', '', 'TOTALS', '', '', '', '',
        consolidatedTrialBalance.totals.totalDebits.toFixed(2),
        consolidatedTrialBalance.totals.totalCredits.toFixed(2),
      ])

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = `trial-balance-consolidated-${consolidatedTrialBalance.date}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Consolidated trial balance exported to CSV successfully")
      return
    }

    if (!trialBalance) {
      toast.error("No trial balance data to export")
      return
    }
    
    try {
      exportTrialBalanceToCSV(trialBalance)
      toast.success("Trial balance exported to CSV successfully")
    } catch (error) {
      toast.error("Failed to export trial balance to CSV")
    }
  }

  const handleExportPDF = async () => {
    if (reportMode === "consolidated" && consolidatedTrialBalance) {
      try {
        setGeneratingPDF(true)
        const doc = new jsPDF()
        let startY = await addLetterhead(doc, 'Trial Balance', undefined, activeAddress)
        startY = addReportInfo(doc, startY, [
          `Consolidated (${consolidatedTrialBalance.reportingCurrencyCode})`,
          `As of ${format(new Date(consolidatedTrialBalance.date), 'MMMM d, yyyy')}`,
          `Status: ${consolidatedTrialBalance.totals.isBalanced ? 'Balanced' : 'Unbalanced'}`,
        ])

        const rows: any[] = consolidatedTrialBalance.rows.map((row) => [
          row.accountNo,
          row.accountName,
          row.accountType,
          `${row.sourceCurrencyCode} D:${row.sourceDebit.toFixed(2)} C:${row.sourceCredit.toFixed(2)}`,
          row.conversionRate.toFixed(6),
          row.consolidatedDebit.toFixed(2),
          row.consolidatedCredit.toFixed(2),
        ])

        rows.push([
          { content: 'TOTALS', colSpan: 5, styles: { fontStyle: 'bold' } },
          { content: consolidatedTrialBalance.totals.totalDebits.toFixed(2), styles: { fontStyle: 'bold', textColor: [21, 128, 61] } },
          { content: consolidatedTrialBalance.totals.totalCredits.toFixed(2), styles: { fontStyle: 'bold', textColor: [220, 38, 38] } },
        ])

        autoTable(doc, {
          head: [[
            'Account No.',
            'Account Name',
            'Account Type',
            'Source',
            'Rate',
            `Debit (${consolidatedTrialBalance.reportingCurrencyCode})`,
            `Credit (${consolidatedTrialBalance.reportingCurrencyCode})`,
          ]],
          body: rows,
          startY,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
          columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
        })

        doc.save(`TrialBalance_Consolidated_${consolidatedTrialBalance.date}.pdf`)
        toast.success("Consolidated trial balance PDF generated successfully")
      } catch (error) {
        console.error('PDF generation error:', error)
        toast.error("Failed to generate consolidated trial balance PDF")
      } finally {
        setGeneratingPDF(false)
      }
      return
    }

    if (!trialBalance) {
      toast.error("No trial balance data to export")
      return
    }
    
    try {
      setGeneratingPDF(true)
      await exportTrialBalanceToPDF(trialBalance)
      toast.success("Trial balance PDF generated successfully")
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error("Failed to generate trial balance PDF")
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (reportMode === "single" && (trialBalanceError || trialBalanceSummaryError)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Trial Balance</h3>
          <p className="text-gray-600 mb-4">{trialBalanceError || trialBalanceSummaryError}</p>
          <Button onClick={loadTrialBalanceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Trial Balance</h2>
          <p className="text-gray-600 mt-1">
            {reportMode === "single"
              ? `Period: ${getPeriodOptions().find(opt => opt.value === periodValue)?.label || periodValue} - Currency: ${currencies.find(c => c.id === selectedCurrencyId)?.code || 'USD'}`
              : `Consolidated View (${(currencies.find(c => c.code === 'USD') || currencies[0])?.code || 'USD'} reporting)`}
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
            </SelectContent>
          </Select>
          
          {/* Period Value Selector */}
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

          {reportMode === "single" ? (
            <CurrencyFilter />
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-full min-w-[180px]">
                  {selectedCurrencyIds.length
                    ? selectedCurrencyIds
                        .map((id) => currencies.find((c) => c.id === id)?.code)
                        .filter(Boolean)
                        .join(", ")
                    : "Select currencies"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  {currencies.map((c) => {
                    const selected = selectedCurrencyIds.includes(c.id)
                    return (
                      <Button
                        key={c.id}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className="w-full justify-between"
                        onClick={() => toggleCurrencySelection(c.id)}
                      >
                        <span>{c.code}</span>
                        {selected ? <Check className="w-4 h-4" /> : null}
                      </Button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {/* Export Buttons */}
          <Button 
            onClick={handleExportCSV}
            variant="outline" 
            className="rounded-full"
            disabled={reportMode === "single" ? !trialBalance : !consolidatedTrialBalance}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Button 
            onClick={handleExportPDF}
            variant="outline" 
            className="rounded-full"
            disabled={(reportMode === "single" ? !trialBalance : !consolidatedTrialBalance) || generatingPDF}
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
            onClick={reportMode === "single" ? loadTrialBalanceData : loadConsolidatedTrialBalance} 
            disabled={trialBalanceLoading || trialBalanceSummaryLoading || isConsolidating}
            className="rounded-full"
          >
            <RefreshCw className={cn(
              "w-4 h-4 mr-2",
              (trialBalanceLoading || trialBalanceSummaryLoading || isConsolidating) && "animate-spin"
            )} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {reportMode === "single" && trialBalanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary">
            <CardContent className="p-4 h-[80px] flex items-center">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-normal text-white">
                    {trialBalanceSummary.totalAccounts}
                  </div>
                  <div className="text-white/80 text-sm">Total Accounts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
            <CardContent className="p-4 h-[80px] flex items-center">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-normal text-gray-900">
                    {formatCurrency(trialBalanceSummary.totalDebits)}
                  </div>
                  <div className="text-gray-600 text-sm">Total Debits</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary">
            <CardContent className="p-4 h-[80px] flex items-center">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-normal text-white">
                    {formatCurrency(trialBalanceSummary.totalCredits)}
                  </div>
                  <div className="text-white/80 text-sm">Total Credits</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
            <CardContent className="p-4 h-[80px] flex items-center">
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  trialBalanceSummary.isBalanced 
                    ? "bg-green-500" 
                    : "bg-red-500"
                )}>
                  <Scale className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "text-2xl font-normal",
                    trialBalanceSummary.isBalanced ? "text-green-600" : "text-red-600"
                  )}>
                    {trialBalanceSummary.isBalanced ? "Balanced" : "Unbalanced"}
                  </div>
                  <div className="text-gray-600 text-sm">Trial Balance Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trial Balance Cards Grid */}
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search accounts by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterAccountType} onValueChange={setFilterAccountType}>
            <SelectTrigger className="w-full sm:w-56">
              <CiFilter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Account Types</SelectItem>
              <SelectItem value="current asset">Current Asset</SelectItem>
              <SelectItem value="fixed asset">Fixed Asset</SelectItem>
              <SelectItem value="current liability">Current Liability</SelectItem>
              <SelectItem value="long-term liability">Long-Term Liability</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="contra-asset">Contra-Asset</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Accounts Grid */}
        {(reportMode === "single" && trialBalanceLoading) || (reportMode === "consolidated" && isConsolidating) ? (
          <TrialBalanceSkeleton />
        ) : paginatedAccounts.length > 0 ? (
          <>
            {/* Trial Balance Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Account No.</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Account Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Account Type</th>
                        {reportMode === "single" ? (
                          <>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Debit Balance</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Credit Balance</th>
                          </>
                        ) : (
                          <>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Source</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Rate</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Debit (USD)</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Credit (USD)</th>
                          </>
                        )}
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAccounts.map((account: any) => {
                        const isExpanded = expandedAccounts.has(account.accountId)
                        const hasTransactions = account.transactions && account.transactions.length > 0

                        return (
                          <React.Fragment key={account.accountId}>
                            <tr 
                              className={cn(
                                "border-b hover:bg-gray-50 transition-colors",
                                hasTransactions && "cursor-pointer"
                              )}
                              onClick={() => hasTransactions && toggleAccountExpand(account.accountId)}
                            >
                              <td className="py-3 px-4">
                                <span className="font-mono text-sm text-blue-600 font-semibold">
                                  {account.accountNo}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-900">{account.accountName}</span>
                                  {hasTransactions && (
                                    <Badge variant="outline" className="text-xs">
                                      {account.transactions.length} txns
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={cn("text-xs", getAccountTypeColor(account.accountType))}>
                                  {account.accountType}
                                </Badge>
                              </td>
                              {reportMode === "single" ? (
                                <>
                                  <td className="py-3 px-4 text-right">
                                    <span className={cn(
                                      "font-mono text-sm",
                                      account.debitBalance > 0 ? "text-green-700 font-semibold" : "text-gray-400"
                                    )}>
                                      {formatCurrency(account.debitBalance || 0)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={cn(
                                      "font-mono text-sm",
                                      account.creditBalance > 0 ? "text-red-700 font-semibold" : "text-gray-400"
                                    )}>
                                      {formatCurrency(account.creditBalance || 0)}
                                    </span>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3 px-4 text-right font-mono text-sm text-gray-700">
                                    {account.sourceCurrencyCode} D:{Number(account.sourceDebit || 0).toFixed(2)} C:{Number(account.sourceCredit || 0).toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-sm text-gray-700">
                                    {Number(account.conversionRate || 0).toFixed(6)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={cn(
                                      "font-mono text-sm",
                                      account.consolidatedDebit > 0 ? "text-green-700 font-semibold" : "text-gray-400"
                                    )}>
                                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(account.consolidatedDebit || 0)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={cn(
                                      "font-mono text-sm",
                                      account.consolidatedCredit > 0 ? "text-red-700 font-semibold" : "text-gray-400"
                                    )}>
                                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(account.consolidatedCredit || 0)}
                                    </span>
                                  </td>
                                </>
                              )}
                              <td className="py-3 px-4">
                                {reportMode === "single" && hasTransactions && (
                                  <div className="flex items-center justify-center">
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-600" />
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                            {/* Expanded Transaction Row */}
                            {reportMode === "single" && isExpanded && hasTransactions && (
                              <tr>
                                <td colSpan={reportMode === "single" ? 6 : 8} className="p-0 bg-blue-50">
                                  <div className="px-4 py-4">
                                    <TransactionsDataTable
                                      transactions={account.transactions}
                                      onRowClick={handleTransactionClick}
                                      loading={false}
                                    />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                    {/* Totals Row */}
                    {(reportMode === "single" ? !!trialBalance : !!consolidatedTrialBalance) && (
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                          <td colSpan={3} className="py-3 px-4 text-sm text-gray-900">
                            TOTALS
                          </td>
                          {reportMode === "single" ? (
                            <>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono text-sm text-green-700">
                                  {formatCurrency(trialBalance.totals?.totalDebits || 0)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono text-sm text-red-700">
                                  {formatCurrency(trialBalance.totals?.totalCredits || 0)}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4"></td>
                              <td className="py-3 px-4"></td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono text-sm text-green-700">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(consolidatedTrialBalance?.totals.totalDebits || 0)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono text-sm text-red-700">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(consolidatedTrialBalance?.totals.totalCredits || 0)}
                                </span>
                              </td>
                            </>
                          )}
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <CiReceipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
            <p className="text-gray-600">
              {searchTerm || filterAccountType !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No account data available for the selected date.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Transaction View Drawer */}
      <TransactionViewDrawer
        transaction={selectedTransaction}
        isOpen={isTransactionDrawerOpen}
        onClose={() => setIsTransactionDrawerOpen(false)}
      />
    </div>
  )
}
