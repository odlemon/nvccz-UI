"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, RefreshCw, FileText, Loader2, AlertCircle, Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { generateBalanceSheet } from "@/lib/store/slices/accountingSlice"
import { accountingApi } from "@/lib/api/accounting-api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addLetterhead, addReportInfo, type LetterheadAddress } from "@/lib/utils/pdf-letterhead"
import { companyProfileApi } from "@/lib/api/company-profile-api"
import { TransactionsDataTable } from "./transactions-data-table"
import { TransactionViewDrawer } from "./transaction-view-drawer"
import { ConsolidatedBalanceSheet, buildConsolidatedBalanceSheet } from "@/lib/utils/consolidation/balance-sheet"
import { withUsdZwlFallbackRates } from "@/lib/utils/consolidation/fallback-rates"

function formatMoney(v: number | string) {
  return (
    <span className="font-mono tabular-nums">
      {Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

function BalanceSheetSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
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
            {[...Array(12)].map((_, i) => (
              <tr key={i}>
                <td className={cn("py-1 pl-2", i % 4 === 0 && "pt-4 pb-1")}>
                  <div className={cn("h-4 rounded", i % 4 === 0 ? "w-32 bg-gray-100" : "w-48 bg-gray-200")}></div>
                </td>
                <td className="py-1 pr-2 text-right">
                  <div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 text-center text-xs">
          <div className="h-4 w-24 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  )
}

export function BalanceSheetView() {
  const dispatch = useDispatch<AppDispatch>()
  const { balanceSheet, balanceSheetLoading, balanceSheetError, currencies } = useSelector((s: RootState) => s.accounting)
  // Default to USD if available, else first currency
  const defaultCurrencyId = currencies.find(c => c.code === "USD")?.id || currencies[0]?.id || ""
  const [asOfDate, setAsOfDate] = useState<Date>(new Date())
  const [currencyId, setCurrencyId] = useState(defaultCurrencyId)
  const [reportMode, setReportMode] = useState<"single" | "consolidated">("single")
  const [selectedCurrencyIds, setSelectedCurrencyIds] = useState<string[]>([])
  const [consolidatedBalance, setConsolidatedBalance] = useState<ConsolidatedBalanceSheet | null>(null)
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year' | 'custom'>('custom')
  const [hideZeroBalances, setHideZeroBalances] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [activeAddress, setActiveAddress] = useState<LetterheadAddress | null>(null)
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())

  useEffect(() => {
    companyProfileApi.getActiveAddress().then(a => { if (a) setActiveAddress(a) }).catch(() => {})
  }, [])
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false)

  // Fetch on mount and when currency changes
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
    const year = new Date().getFullYear()
    const defaultDate = new Date(year, 11, 31)
    setAsOfDate(defaultDate)

    if (reportMode === "single" && currencyId) {
      dispatch(generateBalanceSheet({ asOfDate: format(defaultDate, "yyyy-MM-dd"), currencyId, hideZeroBalances }) as any)
      setConsolidatedBalance(null)
    }

    if (reportMode === "consolidated") {
      loadConsolidatedBalanceSheet(defaultDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyId, reportMode, selectedCurrencyIds])

  const loadConsolidatedBalanceSheet = async (dateOverride?: Date) => {
    const targetDate = dateOverride || asOfDate
    if (!selectedCurrencyIds.length || !targetDate) {
      setConsolidatedBalance(null)
      return
    }

    try {
      setIsConsolidating(true)
      const asOfDateString = format(targetDate, "yyyy-MM-dd")
      const reportingCurrency = currencies.find((c) => c.code === "USD") || currencies[0]

      const responses = await Promise.all(
        selectedCurrencyIds.map((id) =>
          accountingApi.generateBalanceSheet(
            { asOfDate: asOfDateString, currencyId: id },
            { hideZeroBalances }
          )
        )
      )

      const statements = responses
        .map((res, idx) => ({
          ok: res.success && res.data,
          data: res.data as any,
          currency: currencies.find((c) => c.id === selectedCurrencyIds[idx]),
        }))
        .filter((x) => x.ok && x.data && x.currency)
        .map((x) => ({ currency: x.currency!, sheet: x.data }))

      if (!statements.length) {
        setConsolidatedBalance(null)
        return
      }

      const ratesResponse = await accountingApi.getExchangeRates()
      const ratesRaw = (ratesResponse as any)?.data
      const rates = Array.isArray(ratesRaw)
        ? ratesRaw
        : (ratesRaw?.exchangeRates || [])
      const normalizedRates = withUsdZwlFallbackRates(rates, currencies)

      const consolidated = buildConsolidatedBalanceSheet(
        statements,
        normalizedRates,
        { id: reportingCurrency?.id || currencyId, code: reportingCurrency?.code || "USD" }
      )

      setConsolidatedBalance(consolidated)

      if (consolidated && consolidated.missingRates.length > 0) {
        toast.warning("Some balance sheet rows were excluded due to missing exchange rates", {
          description: `${consolidated.missingRates.length} row(s) have no spot rate as of ${asOfDateString}.`,
        })
      }
    } catch (error: any) {
      setConsolidatedBalance(null)
      toast.error("Failed to load consolidated balance sheet", {
        description: error?.message || "Unexpected error",
      })
    } finally {
      setIsConsolidating(false)
    }
  }

  const handleGenerate = async () => {
    if (asOfDate && reportMode === "single" && currencyId) {
      try {
        await dispatch(generateBalanceSheet({ asOfDate: format(asOfDate, "yyyy-MM-dd"), currencyId, hideZeroBalances }) as any)
        setConsolidatedBalance(null)
      } catch (error: any) {
        toast.error("Failed to generate balance sheet", { description: error.message })
      }
    }

    if (asOfDate && reportMode === "consolidated") {
      await loadConsolidatedBalanceSheet()
    }
  }

  const toggleAccount = (accountNo: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(accountNo)) {
        newSet.delete(accountNo)
      } else {
        newSet.add(accountNo)
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
            )}
          >
            <span>{c.code} <span className="text-xs text-gray-400 ml-1">{c.name}</span></span>
            {c.id === currencyId && <Check className="w-4 h-4 text-blue-600 ml-2" />}
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
              <span>{c.code} <span className="text-xs text-gray-400 ml-1">{c.name}</span></span>
              {selected && <Check className="w-4 h-4 text-blue-600 ml-2" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const formatUSD = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(value))

  const renderConsolidatedBalanceView = () => {
    if (!consolidatedBalance) return null

    const groups = [
      { key: "assets", label: "Assets" },
      { key: "liabilities", label: "Liabilities" },
      { key: "equity", label: "Equity" },
    ] as const

    return (
      <div className="space-y-6">
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">National venture capital company of Zimbabwe</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Balance Sheet (Consolidated)</h2>
          <p className="text-gray-600">As of {format(new Date(consolidatedBalance.asOfDate), "MMMM d, yyyy")}</p>
          <p className="text-sm text-gray-500 mt-1">Reporting Currency: {consolidatedBalance.reportingCurrencyCode}</p>
          {consolidatedBalance.missingRates.length > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              Missing spot rates for {consolidatedBalance.missingRates.length} row(s). Those rows were excluded.
            </p>
          )}
        </div>

        {groups.map((group) => {
          const rows = consolidatedBalance.rows.filter((r) => r.section === group.key)
          if (!rows.length) return null

          return (
            <div key={group.key} className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide border-b-2 border-gray-300 pb-2">{group.label}</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Account</th>
                      <th className="text-right p-3">Source</th>
                      <th className="text-right p-3">Spot Rate</th>
                      <th className="text-right p-3">Consolidated (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={`${group.key}-${row.accountNo}-${row.sourceCurrencyCode}-${idx}`} className="border-t">
                        <td className="p-3">{row.accountNo} - {row.accountName}</td>
                        <td className="p-3 text-right font-mono">
                          {row.sourceCurrencyCode} {Math.abs(row.sourceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono">{row.spotRate.toFixed(6)}</td>
                        <td className="p-3 text-right font-mono">{formatUSD(row.consolidatedAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        <div className="mt-8 pt-4 border-t-2 border-gray-400 space-y-2">
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>TOTAL ASSETS</span>
            <span className="font-mono text-blue-700">{formatUSD(consolidatedBalance.totals.assets)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>TOTAL LIABILITIES</span>
            <span className="font-mono text-red-700">{formatUSD(consolidatedBalance.totals.liabilities)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>TOTAL EQUITY</span>
            <span className="font-mono text-green-700">{formatUSD(consolidatedBalance.totals.equity)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg border-t">
            <span>TOTAL LIABILITIES & EQUITY</span>
            <span className="font-mono">{formatUSD(consolidatedBalance.totals.liabilitiesAndEquity)}</span>
          </div>
          <div className="text-center mt-3">
            {consolidatedBalance.isBalanced
              ? <Badge className="bg-green-100 text-green-800">✓ Balanced</Badge>
              : <Badge className="bg-red-100 text-red-800">⚠ Not Balanced (Diff: {formatUSD(consolidatedBalance.difference)})</Badge>}
          </div>
        </div>
      </div>
    )
  }

  // Export to PDF implementation
  const handleExportPDF = async () => {
    if (reportMode === "consolidated" && consolidatedBalance) {
      setGeneratingPDF(true)
      try {
        const doc = new jsPDF()
        let startY = await addLetterhead(doc, "Balance Sheet", undefined, activeAddress)
        startY = addReportInfo(doc, startY, [
          `Consolidated (${consolidatedBalance.reportingCurrencyCode})`,
          `As of ${format(new Date(consolidatedBalance.asOfDate), "MMMM d, yyyy")}`,
        ])

        const rows: any[] = []
        const sections: Array<"assets" | "liabilities" | "equity"> = ["assets", "liabilities", "equity"]
        sections.forEach((section) => {
          const sectionRows = consolidatedBalance.rows.filter((r) => r.section === section)
          if (!sectionRows.length) return

          rows.push([{ content: section.toUpperCase(), colSpan: 4, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }])
          sectionRows.forEach((row) => {
            rows.push([
              `${row.accountNo} - ${row.accountName}`,
              `${row.sourceCurrencyCode} ${Math.abs(row.sourceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              row.spotRate.toFixed(6),
              Math.abs(row.consolidatedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            ])
          })
        })

        rows.push([
          { content: "TOTAL ASSETS", colSpan: 3, styles: { fontStyle: "bold" } },
          { content: consolidatedBalance.totals.assets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: "bold" } },
        ])
        rows.push([
          { content: "TOTAL LIABILITIES", colSpan: 3, styles: { fontStyle: "bold" } },
          { content: consolidatedBalance.totals.liabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: "bold" } },
        ])
        rows.push([
          { content: "TOTAL EQUITY", colSpan: 3, styles: { fontStyle: "bold" } },
          { content: consolidatedBalance.totals.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: "bold" } },
        ])
        rows.push([
          { content: "TOTAL LIABILITIES & EQUITY", colSpan: 3, styles: { fontStyle: "bold" } },
          { content: consolidatedBalance.totals.liabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: "bold" } },
        ])

        autoTable(doc, {
          head: [["Account", "Source", "Spot Rate", `Consolidated (${consolidatedBalance.reportingCurrencyCode})`]],
          body: rows,
          startY,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
          columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
        })

        doc.save(`BalanceSheet_Consolidated_${consolidatedBalance.asOfDate}.pdf`)
        toast.success("Consolidated balance sheet PDF generated successfully")
      } catch {
        toast.error("Failed to generate consolidated balance sheet PDF")
      } finally {
        setGeneratingPDF(false)
      }
      return
    }

    if (!balanceSheet) {
      toast.error("No balance sheet data to export")
      return
    }
    setGeneratingPDF(true)
    try {
      const doc = new jsPDF()
      const currencyObj = currencies.find(c => c.code === balanceSheet.currency) || currencies.find(c => c.id === currencyId)
      let startY = await addLetterhead(doc, "Balance Sheet", undefined, activeAddress)
      startY = addReportInfo(doc, startY, [
        `As of ${format(new Date(balanceSheet.asOfDate), "MMMM d, yyyy")}`,
        `Currency: ${currencyObj?.name || balanceSheet.currency}`,
      ])

      // Prepare rows for PDF
      const rows: any[] = []
      const pushSection = (label: string) => rows.push([{ content: label, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }])
      const pushItem = (label: string, value: number | null) => rows.push([label, value !== null ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""])
      const pushTotal = (label: string, value: number | null) => rows.push([{ content: label, styles: { fontStyle: 'bold' } }, { content: value !== null ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "", styles: { fontStyle: 'bold' } }])

      // Assets
      pushSection("Assets")
      const { currentAssets, fixedAssets, otherAssets, totalAssets } = balanceSheet.assets
      if (currentAssets.accounts.length) {
        pushSection("Current Assets")
        currentAssets.accounts.forEach(a => pushItem(a.accountName, a.balance))
        pushTotal("Total Current Assets", currentAssets.total)
      }
      if (fixedAssets.accounts.length) {
        pushSection("Fixed Assets")
        fixedAssets.accounts.forEach(a => pushItem(a.accountName, a.balance))
        if (typeof fixedAssets.accumulatedDepreciation === "number") {
          pushItem("Accumulated Depreciation", fixedAssets.accumulatedDepreciation)
        }
        pushTotal("Total Fixed Assets", fixedAssets.total)
      }
      if (otherAssets.accounts.length) {
        pushSection("Other Assets")
        otherAssets.accounts.forEach(a => pushItem(a.accountName, a.balance))
        pushTotal("Total Other Assets", otherAssets.total)
      }
      pushTotal("Total Assets", totalAssets)

      // Liabilities
      pushSection("Liabilities")
      const { currentLiabilities, longTermLiabilities, totalLiabilities } = balanceSheet.liabilities
      if (currentLiabilities.accounts.length) {
        pushSection("Current Liabilities")
        currentLiabilities.accounts.forEach(a => pushItem(a.accountName, a.balance))
        pushTotal("Total Current Liabilities", currentLiabilities.total)
      }
      if (longTermLiabilities.accounts.length) {
        pushSection("Long-Term Liabilities")
        longTermLiabilities.accounts.forEach(a => pushItem(a.accountName, a.balance))
        pushTotal("Total Long-Term Liabilities", longTermLiabilities.total)
      }
      pushTotal("Total Liabilities", totalLiabilities)

      // Equity
      pushSection("Equity")
      const { accounts, total, retainedEarnings } = balanceSheet.equity
      accounts.forEach(a => pushItem(a.accountName, a.balance))
      pushItem("Retained Earnings", retainedEarnings)
      pushTotal("Total Equity", total)
      pushTotal("Total Liabilities & Equity", balanceSheet.totalLiabilitiesAndEquity)

      autoTable(doc, {
        head: [["Description", "Amount"]],
        body: rows,
        startY,
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        columnStyles: { 1: { halign: 'right' } }
      })

      doc.save(`BalanceSheet_${balanceSheet.asOfDate}.pdf`)
      toast.success("Balance sheet PDF generated successfully")
    } catch (err) {
      toast.error("Failed to generate balance sheet PDF")
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (reportMode === "single" && balanceSheetError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Balance Sheet</h3>
          <p className="text-gray-600 mb-4">{balanceSheetError}</p>
          <Button onClick={handleGenerate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Helper to flatten asset, liability, equity sections for vertical display
  function verticalRows() {
    if (!balanceSheet) return []
    const rows: { label: string; value: number | null; type: "section" | "item" | "total" }[] = []
    // Assets
    const { currentAssets, fixedAssets, otherAssets, totalAssets } = balanceSheet.assets
    if (currentAssets.accounts.length) {
      rows.push({ label: "Current Assets", value: null, type: "section" })
      currentAssets.accounts.forEach(a => rows.push({ label: a.accountName, value: a.balance, type: "item" }))
      rows.push({ label: "Total Current Assets", value: currentAssets.total, type: "total" })
    }
    if (fixedAssets.accounts.length) {
      rows.push({ label: "Fixed Assets", value: null, type: "section" })
      fixedAssets.accounts.forEach(a => rows.push({ label: a.accountName, value: a.balance, type: "item" }))
      if (typeof fixedAssets.accumulatedDepreciation === "number") {
        rows.push({ label: "Accumulated Depreciation", value: fixedAssets.accumulatedDepreciation, type: "item" })
      }
      rows.push({ label: "Total Fixed Assets", value: fixedAssets.total, type: "total" })
    }
    if (otherAssets.accounts.length) {
      rows.push({ label: "Other Assets", value: null, type: "section" })
      otherAssets.accounts.forEach(a => rows.push({ label: a.accountName, value: a.balance, type: "item" }))
      rows.push({ label: "Total Other Assets", value: otherAssets.total, type: "total" })
    }
    rows.push({ label: "Total Assets", value: totalAssets, type: "total" })
    // Liabilities
    const { currentLiabilities, longTermLiabilities, totalLiabilities } = balanceSheet.liabilities
    if (currentLiabilities.accounts.length) {
      rows.push({ label: "Current Liabilities", value: null, type: "section" })
      currentLiabilities.accounts.forEach(a => rows.push({ label: a.accountName, value: a.balance, type: "item" }))
      rows.push({ label: "Total Current Liabilities", value: currentLiabilities.total, type: "total" })
    }
    if (longTermLiabilities.accounts.length) {
      rows.push({ label: "Long-Term Liabilities", value: null, type: "section" })
      longTermLiabilities.accounts.forEach(a => rows.push({ label: a.accountName, value: a.balance, type: "item" }))
      rows.push({ label: "Total Long-Term Liabilities", value: longTermLiabilities.total, type: "total" })
    }
    rows.push({ label: "Total Liabilities", value: totalLiabilities, type: "total" })
    // Equity
    const { accounts, total, retainedEarnings } = balanceSheet.equity
    rows.push({ label: "Equity", value: null, type: "section" })
    accounts.forEach(a => rows.push({ label: a.accountName, value: a.balance, type: "item" }))
    rows.push({ label: "Retained Earnings", value: retainedEarnings, type: "item" })
    rows.push({ label: "Total Equity", value: total, type: "total" })
    // Final
    rows.push({ label: "Total Liabilities & Equity", value: balanceSheet.totalLiabilitiesAndEquity, type: "total" })
    return rows
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Balance Sheet</h2>
          <p className="text-gray-600">
            {reportMode === "single"
              ? `As of ${format(asOfDate, "MMM d, yyyy")}`
              : `Consolidated View (${(currencies.find((c) => c.code === "USD") || currencies[0])?.code || "USD"} reporting)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">As of:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(asOfDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={asOfDate}
                  onSelect={(date) => date && setAsOfDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Custom currency dropdown */}
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
          <div>
            {reportMode === "single" ? currencyDropdown : multiCurrencyDropdown}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="hideZeroBalances"
              checked={hideZeroBalances}
              onCheckedChange={setHideZeroBalances}
            />
            <Label htmlFor="hideZeroBalances" className="text-sm whitespace-nowrap">Hide zero balances</Label>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={balanceSheetLoading || isConsolidating}
            className="rounded-full"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", (balanceSheetLoading || isConsolidating) && "animate-spin")} />
            Generate
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="rounded-full"
            disabled={generatingPDF || (reportMode === "single" ? !balanceSheet : !consolidatedBalance)}
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

      {/* Balance Sheet Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            {reportMode === "single" ? "Balance Sheet" : "Balance Sheet (Consolidated)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(reportMode === "single" && balanceSheetLoading) || (reportMode === "consolidated" && isConsolidating) ? (
            <BalanceSheetSkeleton />
          ) : reportMode === "consolidated" ? (
            consolidatedBalance ? (
              <div className="max-w-6xl mx-auto">{renderConsolidatedBalanceView()}</div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Consolidated Balance Sheet Data</h3>
                <p className="text-gray-600">No data available for selected currencies and date</p>
              </div>
            )
          ) : balanceSheet ? (
            <div className="max-w-6xl mx-auto">
              {/* Company Header */}
              <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">National venture capital company of Zimbabwe</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Balance Sheet</h2>
                <p className="text-gray-600">
                  As of {format(new Date(balanceSheet.asOfDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-6">
                {/* ASSETS */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">Assets</h3>

                  {/* Current Assets */}
                  {balanceSheet.assets.currentAssets && balanceSheet.assets.currentAssets.accounts && balanceSheet.assets.currentAssets.accounts.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">Current Assets</h4>
                      <div className="ml-4 space-y-2">
                        {balanceSheet.assets.currentAssets.accounts.map((account: any) => {
                          const isExpanded = expandedAccounts.has(account.accountNo)
                          const hasTransactions = account.transactions && account.transactions.length > 0

                          return (
                            <div key={account.accountNo} className="space-y-2">
                              <div
                                className={cn(
                                  "flex justify-between items-center py-1 rounded-md px-2 -mx-2",
                                  hasTransactions && "cursor-pointer hover:bg-blue-50 transition-colors"
                                )}
                                onClick={() => hasTransactions && toggleAccount(account.accountNo)}
                              >
                                <div className="flex items-center gap-2">
                                  {hasTransactions && (
                                    <div className="h-6 w-6 flex items-center justify-center">
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-700">{account.accountName}</span>
                                  {hasTransactions && (
                                    <Badge variant="outline" className="text-xs">{account.transactions.length} txns</Badge>
                                  )}
                                </div>
                                <span className="font-mono text-sm text-gray-900">{formatMoney(account.balance)}</span>
                              </div>

                              {isExpanded && hasTransactions && (
                                <div className="ml-8 my-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                        <div className="flex justify-between py-2 border-t border-gray-300 font-semibold">
                          <span>Total Current Assets</span>
                          <span className="font-mono text-blue-700">{formatMoney(balanceSheet.assets.currentAssets.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fixed Assets */}
                  {balanceSheet.assets.fixedAssets && balanceSheet.assets.fixedAssets.accounts && balanceSheet.assets.fixedAssets.accounts.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">Fixed Assets</h4>
                      <div className="ml-4 space-y-2">
                        {balanceSheet.assets.fixedAssets.accounts.map((account: any) => {
                          const isExpanded = expandedAccounts.has(account.accountNo)
                          const hasTransactions = account.transactions && account.transactions.length > 0

                          return (
                            <div key={account.accountNo} className="space-y-2">
                              <div
                                className={cn(
                                  "flex justify-between items-center py-1 rounded-md px-2 -mx-2",
                                  hasTransactions && "cursor-pointer hover:bg-blue-50 transition-colors"
                                )}
                                onClick={() => hasTransactions && toggleAccount(account.accountNo)}
                              >
                                <div className="flex items-center gap-2">
                                  {hasTransactions && (
                                    <div className="h-6 w-6 flex items-center justify-center">
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-700">{account.accountName}</span>
                                  {hasTransactions && (
                                    <Badge variant="outline" className="text-xs">{account.transactions.length} txns</Badge>
                                  )}
                                </div>
                                <span className="font-mono text-sm text-gray-900">{formatMoney(account.balance)}</span>
                              </div>

                              {isExpanded && hasTransactions && (
                                <div className="ml-8 my-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                        <div className="flex justify-between py-2 border-t border-gray-300 font-semibold">
                          <span>Total Fixed Assets</span>
                          <span className="font-mono text-blue-700">{formatMoney(balanceSheet.assets.fixedAssets.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other Assets */}
                  {balanceSheet.assets.otherAssets && balanceSheet.assets.otherAssets.accounts && balanceSheet.assets.otherAssets.accounts.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">Other Assets</h4>
                      <div className="ml-4 space-y-2">
                        {balanceSheet.assets.otherAssets.accounts.map((account: any) => {
                          const isExpanded = expandedAccounts.has(account.accountNo)
                          const hasTransactions = account.transactions && account.transactions.length > 0

                          return (
                            <div key={account.accountNo} className="space-y-2">
                              <div
                                className={cn(
                                  "flex justify-between items-center py-1 rounded-md px-2 -mx-2",
                                  hasTransactions && "cursor-pointer hover:bg-blue-50 transition-colors"
                                )}
                                onClick={() => hasTransactions && toggleAccount(account.accountNo)}
                              >
                                <div className="flex items-center gap-2">
                                  {hasTransactions && (
                                    <div className="h-6 w-6 flex items-center justify-center">
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-700">{account.accountName}</span>
                                  {hasTransactions && (
                                    <Badge variant="outline" className="text-xs">{account.transactions.length} txns</Badge>
                                  )}
                                </div>
                                <span className="font-mono text-sm text-gray-900">{formatMoney(account.balance)}</span>
                              </div>

                              {isExpanded && hasTransactions && (
                                <div className="ml-8 my-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                        <div className="flex justify-between py-2 border-t border-gray-300 font-semibold">
                          <span>Total Other Assets</span>
                          <span className="font-mono text-blue-700">{formatMoney(balanceSheet.assets.otherAssets.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total Assets */}
                  <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg">
                    <span>TOTAL ASSETS</span>
                    <span className="font-mono text-blue-700">{formatMoney(balanceSheet.assets.totalAssets)}</span>
                  </div>
                </div>

                {/* LIABILITIES */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">Liabilities</h3>

                  {/* Current Liabilities */}
                  {balanceSheet.liabilities.currentLiabilities && balanceSheet.liabilities.currentLiabilities.accounts && balanceSheet.liabilities.currentLiabilities.accounts.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">Current Liabilities</h4>
                      <div className="ml-4 space-y-2">
                        {balanceSheet.liabilities.currentLiabilities.accounts.map((account: any) => {
                          const isExpanded = expandedAccounts.has(account.accountNo)
                          const hasTransactions = account.transactions && account.transactions.length > 0

                          return (
                            <div key={account.accountNo} className="space-y-2">
                              <div
                                className={cn(
                                  "flex justify-between items-center py-1 rounded-md px-2 -mx-2",
                                  hasTransactions && "cursor-pointer hover:bg-red-50 transition-colors"
                                )}
                                onClick={() => hasTransactions && toggleAccount(account.accountNo)}
                              >
                                <div className="flex items-center gap-2">
                                  {hasTransactions && (
                                    <div className="h-6 w-6 flex items-center justify-center">
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-700">{account.accountName}</span>
                                  {hasTransactions && (
                                    <Badge variant="outline" className="text-xs">{account.transactions.length} txns</Badge>
                                  )}
                                </div>
                                <span className="font-mono text-sm text-gray-900">{formatMoney(account.balance)}</span>
                              </div>

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
                        <div className="flex justify-between py-2 border-t border-gray-300 font-semibold">
                          <span>Total Current Liabilities</span>
                          <span className="font-mono text-red-700">{formatMoney(balanceSheet.liabilities.currentLiabilities.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total Liabilities */}
                  <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg">
                    <span>TOTAL LIABILITIES</span>
                    <span className="font-mono text-red-700">{formatMoney(balanceSheet.liabilities.totalLiabilities)}</span>
                  </div>
                </div>

                {/* EQUITY */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">Equity</h3>
                  <div className="ml-4 space-y-2">
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-700">Retained Earnings</span>
                      <span className="font-mono text-sm text-gray-900">{formatMoney(balanceSheet.equity.retainedEarnings)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg">
                      <span>TOTAL EQUITY</span>
                      <span className="font-mono text-green-700">{formatMoney(balanceSheet.equity.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Balance Check */}
                <div className="mt-8 pt-4 border-t-2 border-gray-400">
                  <div className="flex justify-between py-3 font-bold text-lg">
                    <span>TOTAL LIABILITIES & EQUITY</span>
                    <span className="font-mono">{formatMoney(balanceSheet.totalLiabilitiesAndEquity)}</span>
                  </div>
                  <div className="text-center mt-4">
                    {balanceSheet.isBalanced
                      ? <Badge className="bg-green-100 text-green-800">✓ Balanced</Badge>
                      : <Badge className="bg-red-100 text-red-800">⚠ Not Balanced (Diff: {formatMoney(balanceSheet.difference)})</Badge>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Balance Sheet Data</h3>
              <p className="text-gray-600">No data available for the selected date</p>
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
