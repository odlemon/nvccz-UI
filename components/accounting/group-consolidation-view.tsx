"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { format } from "date-fns"
import { Building2, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api/api-client"
import { accountingApi } from "@/lib/api/accounting-api"
import { fetchCurrencies } from "@/lib/store/slices/accountingSlice"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { AccountingExportControls } from "./accounting-export-controls"
import type { Ac52ExportSpec } from "@/lib/accounting-v52/export"

type EntitySummary = {
  forecastEntityId: string
  entityName: string
  entityType: string
  postedJournalCount?: number
  pendingJournalCount?: number
  balanceSheet: { totalAssets: number; totalLiabilities: number; totalEquity: number; isBalanced: boolean }
  incomeStatement: { revenue: number; expenses: number; netIncome: number }
}

type GroupSummary = {
  period: { startDate: string; endDate: string }
  entities: EntitySummary[]
  eliminations: Omit<EntitySummary["balanceSheet"], "isBalanced"> & EntitySummary["incomeStatement"]
  consolidated: Omit<EntitySummary["balanceSheet"], "isBalanced"> & EntitySummary["incomeStatement"]
}

type ForecastEntity = {
  id: string
  name: string
  type: string
  base_currency: string | null
  registration_number: string | null
  is_active: boolean
  is_default: boolean
  portfolio_company_id?: string | null
  inConsolidation?: boolean
  statusLabel?: string
}

type PortfolioCompany = { id: string; name: string; registrationNumber?: string | null; registration_number?: string | null; status?: string | null }
type MatchRow = { id: string; left: { entityName: string; accountNo: string; currency: string; signedBalance: number; sourceReferences: string[] }; right: { entityName: string; signedBalance: number; sourceReferences: string[] }; discrepancy: number; suggestedStatus: string; status: string; ownerName: string; comments: Array<{ author: string; text: string; createdAt: string }>; correctionRequested?: boolean }
type EliminationWorkflow = { journalEntryId: string; referenceNumber: string; description: string; transactionDate: string; sourceEntities: string[]; sourceInvoiceReferences: string[]; reciprocalAccounts: string[]; fxImpact: number; evidence: string[]; comments: Array<{ author: string; text: string; createdAt: string }>; preparerName: string; reviewerName?: string | null; approverName?: string | null; status: string; journalStatus: string; totalAmount: number; currencyCode: string }

type BalanceSheet = {
  assets: {
    cashAndCashEquivalents: { breakdown: AccountRow[] }
    currentAssets: { accounts: AccountRow[] }
    fixedAssets: { accounts: AccountRow[] }
    otherAssets: { accounts: AccountRow[] }
    totalAssets: number
  }
  liabilities: {
    currentLiabilities: { accounts: AccountRow[] }
    longTermLiabilities: { accounts: AccountRow[] }
    totalLiabilities: number
  }
  equity: { accounts: AccountRow[]; total: number }
  exchangeRates: Array<{ currencyCode: string; rate: number }>
  isBalanced: boolean
}

type AccountRow = {
  accountNo: string
  accountName: string
  balance: number
  currencyBreakdown?: Array<{ sourceCurrency: string; sourceAmount: number; conversionRate: number }>
}

type ApiResult<T> = { success: boolean; message?: string; error?: string; data?: T }
type PageState = { page: number; setPage: (page: number) => void }

const pageSize = 10

function PaginationFooter({ count, page, setPage }: PageState & { count: number }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  const start = count ? (page - 1) * pageSize + 1 : 0
  const end = Math.min(page * pageSize, count)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
      <span>Showing {start}-{end} of {count}</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>Previous</Button>
        <span>Page {page} of {pages}</span>
        <Button type="button" variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(Math.min(pages, page + 1))}>Next</Button>
      </div>
    </div>
  )
}

function entityKind(entity: Pick<ForecastEntity, "type" | "is_default"> | Pick<EntitySummary, "entityType">, isDefault = false) {
  const type = "entityType" in entity ? entity.entityType : entity.type
  const main = "is_default" in entity ? entity.is_default : isDefault
  if (main) return "Main company"
  if (type === "EXTERNAL_STARTUP") return "Portfolio company"
  if (type === "INTERNAL_SUBSIDIARY") return "Subsidiary"
  return "Other entity"
}

function amount(value: number | null | undefined, currency: string) {
  const normalized = Number(value || 0)
  return `${currency} ${normalized.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function dateOnly(value: string) {
  return String(value || "").slice(0, 10)
}

function importAmount(value: unknown) {
  if (typeof value === "number") return value
  const raw = String(value ?? "").trim()
  if (!raw) return 0
  const parenthesized = raw.startsWith("(") && raw.endsWith(")")
  const normalized = raw.replace(/[(),\s]/g, "").replace(/^[A-Z$]{1,4}/i, "")
  const parsed = Number(normalized)
  return parenthesized ? -parsed : parsed
}

function PaginationTable<T>({ rows, page, setPage, columns, renderRow, rowKey, empty }: {
  rows: T[]
  page: number
  setPage: (page: number) => void
  columns: string[]
  renderRow: (row: T) => React.ReactNode
  rowKey: (row: T, index: number) => string
  empty: string
}) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pages)
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize)
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr>{columns.map((column) => <th key={column} className="whitespace-nowrap border-b bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">{column}</th>)}</tr></thead>
          <tbody>{visible.map((row, index) => <tr key={rowKey(row, index)} className="border-b last:border-0">{renderRow(row)}</tr>)}
            {!visible.length && <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      <PaginationFooter count={rows.length} page={safePage} setPage={setPage} />
    </>
  )
}

export function GroupConsolidationView() {
  const dispatch = useDispatch<AppDispatch>()
  const currencies = useSelector((state: RootState) => state.accounting.currencies || [])
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [periodStart, setPeriodStart] = useState(`${format(new Date(), "yyyy")}-01-01`)
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), "yyyy-MM-dd"))
  const [currencyId, setCurrencyId] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")
  const [activeSection, setActiveSection] = useState<"overview" | "entities" | "matching" | "eliminations">("overview")
  const [search, setSearch] = useState("")
  const [summary, setSummary] = useState<GroupSummary | null>(null)
  const [entities, setEntities] = useState<ForecastEntity[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [eliminations, setEliminations] = useState<EliminationWorkflow[]>([])
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadedFilters, setLoadedFilters] = useState("")
  const [entityPage, setEntityPage] = useState(1)
  const [summaryPage, setSummaryPage] = useState(1)
  const [accountPage, setAccountPage] = useState(1)
  const [matchPage, setMatchPage] = useState(1)
  const [eliminationPage, setEliminationPage] = useState(1)
  const [matchComments, setMatchComments] = useState<Record<string, string>>({})
  const [workflowComments, setWorkflowComments] = useState<Record<string, string>>({})
  const [tbImportEntity, setTbImportEntity] = useState<ForecastEntity | null>(null)
  const tbFileRef = useRef<HTMLInputElement>(null)
  const [eliminationForm, setEliminationForm] = useState({
    referenceNumber: "", description: "", sourceEntityA: "", sourceEntityB: "", sourceInvoiceReferences: "",
    lines: [{ accountNo: "", debit: "", credit: "", description: "" }, { accountNo: "", debit: "", credit: "", description: "" }],
    fxImpact: "0", evidence: "", comment: "",
  })
  const requestSequence = useRef(0)

  useEffect(() => { void dispatch(fetchCurrencies()) }, [dispatch])
  useEffect(() => {
    if (!currencyId && currencies.length) setCurrencyId(currencies.find((currency) => currency.isDefault)?.id || currencies[0].id)
  }, [currencyId, currencies])

  const activeCurrency = currencies.find((currency) => currency.id === currencyId)
  const currencyCode = activeCurrency?.code || "USD"
  const filterKey = `${asOfDate}|${periodStart}|${periodEnd}|${currencyId}`

  const loadReport = async () => {
    if (!currencyId) { toast.error("Choose a reporting currency first."); return }
    if (periodStart > periodEnd) { toast.error("The reporting period must start on or before its end date."); return }
    const requestId = ++requestSequence.current
    setLoading(true)
    try {
      const query = new URLSearchParams({ asOfDate, periodStart, periodEnd, consolidationCurrencyId: currencyId })
      const matchQuery = new URLSearchParams({ asOfDate })
      const [summaryResponse, entityResponse, portfolioResponse, balanceResponse, matchResponse, eliminationResponse] = await Promise.all([
        apiClient.get<ApiResult<GroupSummary>>(`/accounting/consolidation/summary?${query.toString()}`),
        apiClient.get<ApiResult<ForecastEntity[]>>("/forecast-entities"),
        apiClient.get<ApiResult<PortfolioCompany[]>>("/portfolio-companies"),
        accountingApi.getConsolidatedBalanceSheet({ asOfDate, consolidationCurrencyId: currencyId, startDate: periodStart, endDate: periodEnd }),
        apiClient.get<ApiResult<MatchRow[]>>(`/accounting/consolidation/intercompany-matches?${matchQuery.toString()}`),
        apiClient.get<ApiResult<EliminationWorkflow[]>>("/accounting/consolidation/eliminations"),
      ])
      if (requestId !== requestSequence.current) return
      if (!summaryResponse.success || !summaryResponse.data) throw new Error(summaryResponse.message || summaryResponse.error || "The group summary could not be loaded.")
      if (!entityResponse.success) throw new Error(entityResponse.message || entityResponse.error || "The entity register could not be loaded.")
      if (!portfolioResponse.success) throw new Error(portfolioResponse.message || portfolioResponse.error || "The portfolio company register could not be loaded.")
      if (!balanceResponse.success || !balanceResponse.data) throw new Error(balanceResponse.message || balanceResponse.error || "The consolidated balance sheet could not be loaded.")
      const accountingEntities = entityResponse.data || []
      if (!matchResponse.success) throw new Error(matchResponse.message || matchResponse.error || "Intercompany matching could not be loaded.")
      if (!eliminationResponse.success) throw new Error(eliminationResponse.message || eliminationResponse.error || "Elimination approvals could not be loaded.")
      const configuredPortfolioIds = new Set(accountingEntities.map((entity) => entity.portfolio_company_id).filter(Boolean))
      const unconfiguredPortfolioCompanies = (portfolioResponse.data || [])
        .filter((company) => company.name && !configuredPortfolioIds.has(company.id))
        .map((company) => ({
          id: `portfolio-${company.id}`,
          name: company.name,
          type: "EXTERNAL_STARTUP",
          base_currency: null,
          registration_number: company.registrationNumber || company.registration_number || null,
          is_active: true,
          is_default: false,
          portfolio_company_id: company.id,
          inConsolidation: false,
          statusLabel: `${company.status || "Portfolio company"} - entity setup required`,
        }))
      setSummary(summaryResponse.data)
      const summaryByEntityId = new Map((summaryResponse.data.entities || []).map((entity) => [entity.forecastEntityId, entity]))
      setEntities([
        ...accountingEntities.map((entity) => {
          const state = summaryByEntityId.get(entity.id)
          const statusLabel = state?.postedJournalCount ? "Included - posted trial balance" : state?.pendingJournalCount ? "Trial balance pending approval" : "Entity configured - trial balance required"
          return { ...entity, inConsolidation: true, statusLabel }
        }),
        ...unconfiguredPortfolioCompanies,
      ])
      setMatches(matchResponse.data || [])
      setEliminations(eliminationResponse.data || [])
      setBalanceSheet(balanceResponse.data as unknown as BalanceSheet)
      setLoadedFilters(filterKey)
      setEntityPage(1); setSummaryPage(1); setAccountPage(1); setMatchPage(1); setEliminationPage(1)
    } catch (error) {
      if (requestId === requestSequence.current) toast.error("Could not load group consolidation", { description: error instanceof Error ? error.message : "Unexpected error" })
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (currencyId && !summary && !loading) void loadReport()
    // Initial load after currencies resolve. Filter changes use the Generate button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyId])

  const entityByName = useMemo(() => new Map(entities.map((entity) => [entity.name, entity])), [entities])
  const directoryRows = useMemo(() => [...entities].sort((a, b) => {
    const rank = (entity: ForecastEntity) => entity.is_default ? 0 : entity.type === "EXTERNAL_STARTUP" ? 1 : entity.type === "INTERNAL_SUBSIDIARY" ? 2 : 3
    return rank(a) - rank(b) || a.name.localeCompare(b.name)
  }), [entities])
  const visibleDirectory = useMemo(() => directoryRows.filter((entity) => {
    const kind = entityKind(entity)
    const matchesKind = entityFilter === "all" || kind === entityFilter
    return matchesKind && entity.name.toLowerCase().includes(search.trim().toLowerCase())
  }), [directoryRows, entityFilter, search])

  const summaryRows = useMemo(() => {
    if (!summary) return []
    const entityRows = summary.entities.filter((entity) => {
      const directoryEntity = entityByName.get(entity.entityName)
      const kind = entityKind({ entityType: entity.entityType }, Boolean(directoryEntity?.is_default))
      return (entityFilter === "all" || kind === entityFilter) && entity.entityName.toLowerCase().includes(search.trim().toLowerCase())
    }).map((entity) => ({
      name: entity.entityName,
      kind: entityKind({ entityType: entity.entityType }, Boolean(entityByName.get(entity.entityName)?.is_default)),
      assets: entity.balanceSheet.totalAssets,
      liabilities: entity.balanceSheet.totalLiabilities,
      equity: entity.balanceSheet.totalEquity,
      revenue: entity.incomeStatement.revenue,
      expenses: entity.incomeStatement.expenses,
      netIncome: entity.incomeStatement.netIncome,
      balanced: entity.balanceSheet.isBalanced,
      aggregate: false,
    }))
    if (entityFilter !== "all" || search.trim()) return entityRows
    const aggregateRows = [
      { name: "Eliminations", kind: "Group adjustment", assets: summary.eliminations.totalAssets, liabilities: summary.eliminations.totalLiabilities, equity: summary.eliminations.totalEquity, revenue: summary.eliminations.revenue, expenses: summary.eliminations.expenses, netIncome: summary.eliminations.netIncome, balanced: null, aggregate: true },
      { name: "Consolidated group", kind: "After eliminations", assets: summary.consolidated.totalAssets, liabilities: summary.consolidated.totalLiabilities, equity: summary.consolidated.totalEquity, revenue: summary.consolidated.revenue, expenses: summary.consolidated.expenses, netIncome: summary.consolidated.netIncome, balanced: Math.abs(summary.consolidated.totalAssets - summary.consolidated.totalLiabilities - summary.consolidated.totalEquity) < 0.01, aggregate: true },
    ]
    return [...entityRows, ...aggregateRows]
  }, [summary, entityByName, entityFilter, search])

  const accountRows = useMemo(() => {
    if (!balanceSheet) return []
    const buckets: Array<[string, AccountRow[]]> = [
      ["Cash and cash equivalents", balanceSheet.assets.cashAndCashEquivalents.breakdown || []],
      ["Current assets", balanceSheet.assets.currentAssets.accounts || []],
      ["Non-current assets", balanceSheet.assets.fixedAssets.accounts || []],
      ["Other assets", balanceSheet.assets.otherAssets.accounts || []],
      ["Current liabilities", balanceSheet.liabilities.currentLiabilities.accounts || []],
      ["Long-term liabilities", balanceSheet.liabilities.longTermLiabilities.accounts || []],
      ["Equity", balanceSheet.equity.accounts || []],
    ]
    return buckets.flatMap(([section, rows]) => rows.filter((row) => Math.abs(Number(row.balance || 0)) >= 0.005).map((row) => ({ section, ...row })))
  }, [balanceSheet])

  const exportSpec = async (): Promise<Ac52ExportSpec> => {
    if (!summary || !balanceSheet || loadedFilters !== filterKey) throw new Error("Regenerate the report after changing its date or currency filters.")
    const summaryExportRows = summaryRows.map((row) => [row.name, row.kind, row.assets, row.liabilities, row.equity, row.revenue, row.expenses, row.netIncome, row.balanced == null ? "" : row.balanced ? "Balances" : "Out of balance"])
    return {
      title: "Group Consolidation",
      subtitle: `As of ${asOfDate}; results ${periodStart} to ${periodEnd}; reporting currency ${currencyCode}`,
      meta: [["Entities included", String(summary.entities.length)], ["Consolidated status", balanceSheet.isBalanced ? "Balances" : "Out of balance"]],
      columns: ["Entity", "Relationship", `Assets (${currencyCode})`, `Liabilities (${currencyCode})`, `Equity (${currencyCode})`, `Revenue (${currencyCode})`, `Expenses (${currencyCode})`, `Net income (${currencyCode})`, "Balance check"],
      moneyColumns: [2, 3, 4, 5, 6, 7],
      rows: summaryExportRows,
      extra: [
        { title: "Company hierarchy", columns: ["Entity", "Relationship", "Base currency", "Registration number", "Status"], rows: visibleDirectory.map((entity) => [entity.name, entityKind(entity), entity.base_currency || "", entity.registration_number || "", entity.statusLabel || (entity.is_active ? "Active" : "Inactive")]) },
        { title: "Consolidated balance sheet", columns: ["Section", "Account", `Balance (${currencyCode})`, "Currency translation"], moneyColumns: [2], rows: accountRows.map((row) => [row.section, `${row.accountNo} ${row.accountName}`, Number(row.balance || 0), (row.currencyBreakdown || []).map((part) => `${part.sourceCurrency} ${Number(part.sourceAmount).toFixed(2)} x ${Number(part.conversionRate).toFixed(2)}`).join("; ")]) },
        { title: "Intercompany matching", columns: ["Entity A", "Entity B", "Account", "Currency", "Balance A", "Balance B", "Difference", "Status", "Owner"], moneyColumns: [4, 5, 6], rows: matches.map((row) => [row.left.entityName, row.right.entityName, row.left.accountNo, row.left.currency, row.left.signedBalance, row.right.signedBalance, row.discrepancy, row.status, row.ownerName]) },
        { title: "Elimination approvals", columns: ["Reference", "Date", "Description", "Source entities", "Source invoices", "Accounts", "Evidence", "Status", "Preparer", "Reviewer", "Approver"], rows: eliminations.map((row) => [row.referenceNumber, dateOnly(row.transactionDate), row.description, row.sourceEntities.join("; "), row.sourceInvoiceReferences.join("; "), row.reciprocalAccounts.join("; "), row.evidence.join("; "), row.status, row.preparerName, row.reviewerName || "", row.approverName || ""]) },
      ],
      filename: "group-consolidation",
      landscape: true,
      note: "Eliminations are shown separately and deducted to calculate the consolidated group figures.",
    }
  }

  const configurePortfolioEntity = async (entity: ForecastEntity) => {
    if (!entity.portfolio_company_id) return
    try {
      const response = await apiClient.post<ApiResult<ForecastEntity>>("/accounting/consolidation/entities", {
        name: entity.name,
        type: "EXTERNAL_STARTUP",
        base_currency: entity.base_currency || currencyCode,
        registration_number: entity.registration_number || undefined,
        portfolio_company_id: entity.portfolio_company_id,
      })
      if (!response.success) throw new Error(response.message || "Could not configure this company.")
      toast.success("Company added to consolidation", { description: "Import its trial balance and post it through the General Ledger approval queue to include actual balances." })
      await loadReport()
    } catch (error) {
      toast.error("Could not configure company", { description: error instanceof Error ? error.message : "Unexpected error" })
    }
  }

  const downloadTrialBalanceTemplate = () => {
    const content = [
      "Account Code,Account Name,Debit,Credit,Description",
      "1000,Cash and cash equivalents,0.00,0.00,Opening balance",
      "3000,Retained earnings,0.00,0.00,Opening balance",
    ].join("\r\n")
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "group-consolidation-trial-balance-template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importTrialBalance = async (file?: File) => {
    const entity = tbImportEntity
    if (!file || !entity) return
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Choose a file smaller than 10 MB.")
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) throw new Error("The file does not contain a worksheet.")
      const sourceRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
      const key = (row: Record<string, unknown>, aliases: string[]) => {
        const found = Object.keys(row).find((header) => aliases.includes(header.trim().toLowerCase().replace(/[_-]+/g, " ")))
        return found ? row[found] : ""
      }
      const rows = sourceRows.map((row) => ({
        accountNo: String(key(row, ["account code", "account no", "account number", "account"])).trim(),
        debit: importAmount(key(row, ["debit", "debit amount"])),
        credit: importAmount(key(row, ["credit", "credit amount"])),
        description: String(key(row, ["description", "memo", "details"]) || "Imported trial balance"),
      })).filter((row) => row.accountNo && (row.debit !== 0 || row.credit !== 0))
      if (!rows.length) throw new Error("No non-zero trial balance lines were found. Use the provided template headers.")
      if (rows.some((row) => !Number.isFinite(row.debit) || !Number.isFinite(row.credit) || row.debit < 0 || row.credit < 0 || (row.debit > 0 && row.credit > 0))) throw new Error("Each account row must have a non-negative debit or credit, not both.")
      const selectedCurrency = currencies.find((currency) => currency.code === entity.base_currency) || activeCurrency
      if (!selectedCurrency) throw new Error("Choose a valid reporting currency before importing a trial balance.")
      const referenceNumber = `TB-${format(new Date(), "yyyyMMdd-HHmmss")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const response = await apiClient.post<ApiResult<{ entityName: string; status: string }>>("/accounting/consolidation/trial-balance/import", {
        entityId: entity.id,
        transactionDate: asOfDate,
        referenceNumber,
        currencyId: selectedCurrency.id,
        lines: rows,
      })
      if (!response.success) throw new Error(response.message || "Trial balance import failed.")
      toast.success("Trial balance validated and submitted", { description: "The journal is pending independent General Ledger approval. It will affect consolidated balances after posting." })
      await loadReport()
    } catch (error) {
      toast.error("Trial balance was not imported", { description: error instanceof Error ? error.message : "Unexpected error" })
    } finally {
      setTbImportEntity(null)
      if (tbFileRef.current) tbFileRef.current.value = ""
    }
  }

  const updateMatch = async (row: MatchRow, update: Record<string, unknown>) => {
    try {
      const response = await apiClient.patch<ApiResult<MatchRow>>(`/accounting/consolidation/intercompany-matches/${row.id}`, {
        asOfDate, ...update,
      })
      if (!response.success) throw new Error(response.message || "Could not update this match.")
      toast.success("Intercompany match updated")
      setMatchComments((current) => ({ ...current, [row.id]: "" }))
      await loadReport()
    } catch (error) {
      toast.error("Could not update intercompany match", { description: error instanceof Error ? error.message : "Unexpected error" })
    }
  }

  const submitElimination = async (event: React.FormEvent) => {
    event.preventDefault()
    const sourceEntities = [eliminationForm.sourceEntityA, eliminationForm.sourceEntityB].filter(Boolean)
    const lines = eliminationForm.lines.map((line) => ({ ...line, debit: Number(line.debit || 0), credit: Number(line.credit || 0) }))
    const debits = lines.reduce((sum, line) => sum + line.debit, 0)
    const credits = lines.reduce((sum, line) => sum + line.credit, 0)
    if (sourceEntities.length !== 2 || sourceEntities[0] === sourceEntities[1] || lines.some((line) => !line.accountNo || !Number.isFinite(line.debit) || !Number.isFinite(line.credit) || line.debit < 0 || line.credit < 0 || (line.debit > 0 && line.credit > 0)) || debits <= 0 || Math.abs(debits - credits) > 0.01) {
      toast.error("Choose two different source companies and enter balanced journal lines with active account codes.")
      return
    }
    try {
      const response = await apiClient.post<ApiResult<EliminationWorkflow>>("/accounting/consolidation/eliminations", {
        ...eliminationForm,
        transactionDate: asOfDate,
        currencyId,
        sourceEntities,
        sourceInvoiceReferences: eliminationForm.sourceInvoiceReferences.split(/[;,\n]/).map((part) => part.trim()).filter(Boolean),
        evidence: eliminationForm.evidence.split(/[;,\n]/).map((part) => part.trim()).filter(Boolean),
        fxImpact: Number(eliminationForm.fxImpact || 0),
        lines: lines.map((line) => ({ ...line, description: line.description || eliminationForm.description })),
      })
      if (!response.success) throw new Error(response.message || "Could not submit this elimination.")
      toast.success("Elimination journal sent for review")
      setEliminationForm({ referenceNumber: "", description: "", sourceEntityA: "", sourceEntityB: "", sourceInvoiceReferences: "", lines: [{ accountNo: "", debit: "", credit: "", description: "" }, { accountNo: "", debit: "", credit: "", description: "" }], fxImpact: "0", evidence: "", comment: "" })
      await loadReport()
    } catch (error) {
      toast.error("Could not submit elimination", { description: error instanceof Error ? error.message : "Unexpected error" })
    }
  }

  const reviewElimination = async (row: EliminationWorkflow, action: "REVIEW" | "APPROVE" | "RETURN" | "RESUBMIT") => {
    const comment = workflowComments[row.journalEntryId] || ""
    if (action !== "APPROVE" && !comment.trim()) {
      toast.error("Add a workflow note before continuing.")
      return
    }
    try {
      const response = await apiClient.patch<ApiResult<EliminationWorkflow>>(`/accounting/consolidation/eliminations/${row.journalEntryId}/review`, { action, comment })
      if (!response.success) throw new Error(response.message || "Workflow action failed.")
      toast.success(response.message || "Elimination workflow updated")
      setWorkflowComments((current) => ({ ...current, [row.journalEntryId]: "" }))
      await loadReport()
    } catch (error) {
      toast.error("Could not update elimination", { description: error instanceof Error ? error.message : "Unexpected error" })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Group Consolidation</h2>
          <p className="text-sm text-muted-foreground">Review the parent company, subsidiaries and portfolio companies alongside the group totals.</p>
        </div>
        {summary && <AccountingExportControls label="group consolidation" spec={exportSpec} />}
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-sm"><span>Balance sheet as of</span><Input type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} /></label>
          <label className="space-y-1 text-sm"><span>Results from</span><Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></label>
          <label className="space-y-1 text-sm"><span>Results through</span><Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></label>
          <label className="space-y-1 text-sm"><span>Reporting currency</span><Select value={currencyId} onValueChange={setCurrencyId}><SelectTrigger><SelectValue placeholder="Choose currency" /></SelectTrigger><SelectContent>{currencies.filter((currency) => currency.isActive).map((currency) => <SelectItem key={currency.id} value={currency.id}>{currency.code} - {currency.name}</SelectItem>)}</SelectContent></Select></label>
          <div className="flex items-end"><Button type="button" onClick={() => void loadReport()} disabled={loading || !currencyId} className="w-full"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "Generating..." : "Generate report"}</Button></div>
        </CardContent>
      </Card>

      {loading && !summary ? <div className="flex items-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading group data...</div> : null}

      {summary && balanceSheet && <>
        <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">Consolidation workflow</p><p className="text-sm text-muted-foreground">Review totals, configure companies and import balances, match intercompany items, then review eliminations.</p></div><nav aria-label="Group consolidation sections" className="flex flex-wrap gap-2">{([["overview", "Overview"], ["entities", "Companies & balances"], ["matching", "Match transactions"], ["eliminations", "Eliminations & approvals"]] as const).map(([id, label]) => <Button key={id} type="button" size="sm" variant={activeSection === id ? "default" : "outline"} aria-current={activeSection === id ? "page" : undefined} onClick={() => setActiveSection(id)}>{label}</Button>)}</nav></CardContent></Card>
        {activeSection === "entities" && <>
        <Card>
          <CardHeader className="pb-2"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5" />Company hierarchy</CardTitle><p className="mt-1 text-sm text-muted-foreground">Add portfolio companies as entities, then import their trial balances. Imported journals enter the General Ledger approval queue.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={downloadTrialBalanceTemplate}>Download trial balance template</Button><Input className="w-56" placeholder="Search companies" value={search} onChange={(event) => { setSearch(event.target.value); setEntityPage(1); setSummaryPage(1) }} /><Select value={entityFilter} onValueChange={(value) => { setEntityFilter(value); setEntityPage(1); setSummaryPage(1) }}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All entity types</SelectItem><SelectItem value="Main company">Main company</SelectItem><SelectItem value="Subsidiary">Subsidiaries</SelectItem><SelectItem value="Portfolio company">Portfolio companies</SelectItem></SelectContent></Select></div></div></CardHeader>
          <CardContent className="p-0">
            <input ref={tbFileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event) => void importTrialBalance(event.target.files?.[0])} />
            <PaginationTable rows={visibleDirectory} page={entityPage} setPage={setEntityPage} columns={["Company", "Relationship", "Base currency", "Registration number", "Status", "Actions"]} rowKey={(entity) => entity.id} empty="No companies match the selected filters." renderRow={(entity) => <><td className="px-3 py-3 font-medium">{entity.name}</td><td className="px-3 py-3">{entityKind(entity)}</td><td className="px-3 py-3">{entity.base_currency || "-"}</td><td className="px-3 py-3">{entity.registration_number || "-"}</td><td className="px-3 py-3">{entity.statusLabel || (entity.is_active ? "Active" : "Inactive")}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2">{!entity.inConsolidation && entity.portfolio_company_id ? <Button type="button" size="sm" onClick={() => void configurePortfolioEntity(entity)}>Add to consolidation</Button> : null}{entity.inConsolidation ? <Button type="button" size="sm" variant="outline" onClick={() => { setTbImportEntity(entity); window.setTimeout(() => tbFileRef.current?.click(), 0) }}>Import trial balance</Button> : null}</div></td></>} />
          </CardContent>
        </Card>
        </>}

        {activeSection === "overview" && <>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Entity results and consolidated totals</CardTitle><p className="text-sm text-muted-foreground">Balances are translated to {currencyCode}. Eliminations remain visible as a separate adjustment.</p></CardHeader>
          <CardContent className="p-0"><PaginationTable rows={summaryRows} page={summaryPage} setPage={setSummaryPage} columns={["Entity", "Relationship", "Assets", "Liabilities", "Equity", "Revenue", "Expenses", "Net income", "Balance check"]} rowKey={(row) => `${row.name}-${row.kind}`} empty="No entity results match the selected filters." renderRow={(row) => <>
            <td className={`px-3 py-3 ${row.aggregate ? "font-semibold" : "font-medium"}`}>{row.name}</td><td className="px-3 py-3">{row.kind}</td>
            {[row.assets, row.liabilities, row.equity, row.revenue, row.expenses, row.netIncome].map((value, index) => <td key={index} className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{amount(value, currencyCode)}</td>)}
            <td className="px-3 py-3">{row.balanced == null ? "-" : row.balanced ? "Balances" : "Review"}</td>
          </>} /></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Consolidated balance sheet accounts</CardTitle><p className="text-sm text-muted-foreground">As of {asOfDate}. Balance check: {balanceSheet.isBalanced ? "Assets equal liabilities and equity" : "Review the difference before relying on this report"}.</p></CardHeader>
          <CardContent className="p-0"><PaginationTable rows={accountRows} page={accountPage} setPage={setAccountPage} columns={["Section", "Account", `Balance (${currencyCode})`, "Source currency details"]} rowKey={(row) => `${row.section}-${row.accountNo}`} empty="No non-zero consolidated accounts for this date." renderRow={(row) => <>
            <td className="px-3 py-3">{row.section}</td><td className="px-3 py-3">{row.accountNo} - {row.accountName}</td><td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{amount(row.balance, currencyCode)}</td><td className="px-3 py-3 text-sm text-muted-foreground">{(row.currencyBreakdown || []).map((part) => `${part.sourceCurrency} ${Number(part.sourceAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} at ${Number(part.conversionRate).toFixed(2)}`).join(" | ") || currencyCode}</td>
          </>} /></CardContent>
        </Card>
        </>}

        {activeSection === "matching" && <>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Intercompany matching</CardTitle><p className="text-sm text-muted-foreground">Candidates compare posted balances by entity pair, account code, and currency for the selected period. Confirm only after checking the source references.</p></CardHeader>
          <CardContent className="p-0"><PaginationTable rows={matches} page={matchPage} setPage={setMatchPage} columns={["Company pair", "Account", "Balance A", "Balance B", "Difference", "Status", "Owner", "Source references and actions"]} rowKey={(row) => row.id} empty="No intercompany account pairs were found for this period." renderRow={(row) => <>
            <td className="px-3 py-3">{row.left.entityName}<br /><span className="text-muted-foreground">{row.right.entityName}</span></td>
            <td className="px-3 py-3">{row.left.accountNo}</td>
            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{amount(row.left.signedBalance, row.left.currency)}</td>
            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{amount(row.right.signedBalance, row.left.currency)}</td>
            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{amount(row.discrepancy, row.left.currency)}</td>
            <td className="px-3 py-3">{row.status}</td><td className="px-3 py-3">{row.ownerName}</td>
            <td className="min-w-64 px-3 py-3"><div className="space-y-2"><span className="block text-xs text-muted-foreground">{[...row.left.sourceReferences, ...row.right.sourceReferences].join(", ") || "No journal references"}</span><Input aria-label={`Comment for ${row.left.entityName} and ${row.right.entityName}`} value={matchComments[row.id] || ""} onChange={(event) => setMatchComments((current) => ({ ...current, [row.id]: event.target.value }))} placeholder="Add a review comment" /><div className="flex flex-wrap gap-1"><Button type="button" size="sm" variant="outline" onClick={() => void updateMatch(row, { assignToSelf: true })}>Assign to me</Button><Button type="button" size="sm" onClick={() => void updateMatch(row, { status: "MATCHED", comment: matchComments[row.id] })}>Mark matched</Button><Button type="button" size="sm" variant="outline" onClick={() => void updateMatch(row, { status: "REVIEW", comment: matchComments[row.id] })}>Review</Button><Button type="button" size="sm" variant="destructive" onClick={() => void updateMatch(row, { requestCorrection: true, comment: matchComments[row.id] })}>Request correction</Button></div>{row.comments?.slice(-2).map((comment, index) => <p key={`${comment.createdAt}-${index}`} className="text-xs text-muted-foreground">{comment.author}: {comment.text}</p>)}</div></td>
          </>} /></CardContent>
        </Card>
        </>}

        {activeSection === "eliminations" && <>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Prepare an elimination journal</CardTitle><p className="text-sm text-muted-foreground">The journal remains pending until a separate reviewer and approver complete the approval chain.</p></CardHeader>
          <CardContent>
            <form onSubmit={(event) => void submitElimination(event)} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-1 text-sm"><span>Journal reference</span><Input required value={eliminationForm.referenceNumber} onChange={(event) => setEliminationForm((form) => ({ ...form, referenceNumber: event.target.value }))} /></label>
              <label className="space-y-1 text-sm"><span>Description</span><Input required value={eliminationForm.description} onChange={(event) => setEliminationForm((form) => ({ ...form, description: event.target.value }))} /></label>
              <label className="space-y-1 text-sm"><span>Source company A</span><Select required value={eliminationForm.sourceEntityA} onValueChange={(value) => setEliminationForm((form) => ({ ...form, sourceEntityA: value }))}><SelectTrigger><SelectValue placeholder="Choose company" /></SelectTrigger><SelectContent>{entities.filter((entity) => entity.inConsolidation).map((entity) => <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>)}</SelectContent></Select></label>
              <label className="space-y-1 text-sm"><span>Source company B</span><Select required value={eliminationForm.sourceEntityB} onValueChange={(value) => setEliminationForm((form) => ({ ...form, sourceEntityB: value }))}><SelectTrigger><SelectValue placeholder="Choose company" /></SelectTrigger><SelectContent>{entities.filter((entity) => entity.inConsolidation).map((entity) => <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>)}</SelectContent></Select></label>
              <label className="space-y-1 text-sm"><span>Source invoice references</span><Input required value={eliminationForm.sourceInvoiceReferences} onChange={(event) => setEliminationForm((form) => ({ ...form, sourceInvoiceReferences: event.target.value }))} placeholder="Separate multiple references with commas" /></label>
              <div className="space-y-2 xl:col-span-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Elimination journal lines</p><p className="text-xs text-muted-foreground">Use active account codes. Add FX gain or loss lines here so the journal remains balanced.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setEliminationForm((form) => ({ ...form, lines: [...form.lines, { accountNo: "", debit: "", credit: "", description: "" }] }))}>Add line</Button></div>{eliminationForm.lines.map((line, index) => <div key={index} className="grid gap-2 rounded-md border p-3 md:grid-cols-4"><label className="space-y-1 text-xs"><span>Account code</span><Input required value={line.accountNo} onChange={(event) => setEliminationForm((form) => ({ ...form, lines: form.lines.map((item, row) => row === index ? { ...item, accountNo: event.target.value } : item) }))} /></label><label className="space-y-1 text-xs"><span>Debit ({currencyCode})</span><Input type="number" min="0" step="0.01" value={line.debit} onChange={(event) => setEliminationForm((form) => ({ ...form, lines: form.lines.map((item, row) => row === index ? { ...item, debit: event.target.value } : item) }))} /></label><label className="space-y-1 text-xs"><span>Credit ({currencyCode})</span><Input type="number" min="0" step="0.01" value={line.credit} onChange={(event) => setEliminationForm((form) => ({ ...form, lines: form.lines.map((item, row) => row === index ? { ...item, credit: event.target.value } : item) }))} /></label><label className="space-y-1 text-xs"><span>Line description</span><Input value={line.description} onChange={(event) => setEliminationForm((form) => ({ ...form, lines: form.lines.map((item, row) => row === index ? { ...item, description: event.target.value } : item) }))} /></label></div>)}</div>
              <label className="space-y-1 text-sm"><span>FX impact memo ({currencyCode})</span><Input type="number" step="0.01" value={eliminationForm.fxImpact} onChange={(event) => setEliminationForm((form) => ({ ...form, fxImpact: event.target.value }))} /></label>
              <label className="space-y-1 text-sm xl:col-span-2"><span>Evidence references (required)</span><Input required value={eliminationForm.evidence} onChange={(event) => setEliminationForm((form) => ({ ...form, evidence: event.target.value }))} placeholder="Document name or vault reference; separate multiple with commas" /></label>
              <label className="space-y-1 text-sm xl:col-span-2"><span>Preparer comment</span><Input value={eliminationForm.comment} onChange={(event) => setEliminationForm((form) => ({ ...form, comment: event.target.value }))} /></label>
              <div className="xl:col-span-4"><Button type="submit">Submit for independent review</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Elimination approval queue</CardTitle><p className="text-sm text-muted-foreground">Preparer, reviewer, and approver must be different users. The final approval posts the journal to the group elimination layer.</p></CardHeader>
          <CardContent className="p-0"><PaginationTable rows={eliminations} page={eliminationPage} setPage={setEliminationPage} columns={["Reference", "Date and source", "Reciprocal accounts", "Evidence and FX impact", "Approval chain", "Status", "Action"]} rowKey={(row) => row.journalEntryId} empty="No elimination journals are awaiting or have completed approval." renderRow={(row) => <>
            <td className="px-3 py-3 font-medium">{row.referenceNumber}<br /><span className="text-xs text-muted-foreground">{row.description}</span></td>
            <td className="px-3 py-3">{dateOnly(row.transactionDate)}<br /><span className="text-xs text-muted-foreground">{row.sourceEntities.join(" and ")}</span><br /><span className="text-xs text-muted-foreground">Invoices: {row.sourceInvoiceReferences.join(", ") || "Not provided"}</span></td>
            <td className="px-3 py-3">{row.reciprocalAccounts.join(", ")}<br /><span className="text-xs text-muted-foreground">Journal {amount(row.totalAmount, row.currencyCode)}</span></td>
            <td className="px-3 py-3">{row.evidence.join(", ")}<br /><span className="text-xs text-muted-foreground">FX impact: {amount(row.fxImpact, row.currencyCode)}</span></td>
            <td className="px-3 py-3">Preparer: {row.preparerName}<br />Reviewer: {row.reviewerName || "Awaiting"}<br />Approver: {row.approverName || "Awaiting"}</td>
            <td className="px-3 py-3">{row.status}<br /><span className="text-xs text-muted-foreground">Journal: {row.journalStatus}</span></td>
            <td className="min-w-56 px-3 py-3"><div className="space-y-2">{row.status !== "POSTED" && row.status !== "REJECTED" ? <Input aria-label={`Workflow comment for ${row.referenceNumber}`} value={workflowComments[row.journalEntryId] || ""} onChange={(event) => setWorkflowComments((current) => ({ ...current, [row.journalEntryId]: event.target.value }))} placeholder="Review or approval note" /> : null}{row.status === "AWAITING_REVIEW" ? <><Button type="button" size="sm" onClick={() => void reviewElimination(row, "REVIEW")}>Complete review</Button><Button type="button" size="sm" variant="outline" onClick={() => void reviewElimination(row, "RETURN")}>Return for correction</Button></> : null}{row.status === "RETURNED" ? <><p className="text-xs text-muted-foreground">Edit the pending journal in General Ledger before resubmitting.</p><Button type="button" size="sm" onClick={() => void reviewElimination(row, "RESUBMIT")}>Resubmit for review</Button></> : null}{row.status === "AWAITING_APPROVAL" ? <Button type="button" size="sm" onClick={() => void reviewElimination(row, "APPROVE")}>Approve and post</Button> : null}{row.comments?.slice(-2).map((comment, index) => <p key={`${comment.createdAt}-${index}`} className="text-xs text-muted-foreground">{comment.author}: {comment.text}</p>)}</div></td>
          </>} /></CardContent>
        </Card>
        </>}
      </>}
    </div>
  )
}
