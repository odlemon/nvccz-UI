"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, DollarSign, X, CreditCard, FileText, TrendingUp, Eye, Check, XCircle, Download, BarChart3 } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchCompanyFinancialReports, reviewFinancialReport } from "@/lib/store/slices/portfolioCompaniesSlice"
import { FinancialReportReviewModal } from "./financial-report-review-modal"
import { PortfolioFinancialReport } from "@/lib/api/portfolio-api"
import { format } from "date-fns"
import { FinancialReportsSkeleton } from "./financial-reports-skeleton"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PORTFOLIO_ACTIONS } from "@/lib/config/role-permissions"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { addLetterhead, addReportInfo } from "@/lib/utils/pdf-letterhead"
import {
  EMPTY_BALANCE_SHEET,
  EMPTY_CASH_FLOW,
  EMPTY_INCOME_STATEMENT,
  EMPTY_NON_FINANCIAL_KPIS,
  type ReportingFormData,
} from "@/components/application-portal/financial-reporting/types"
import { IncomeStatementTab } from "@/components/application-portal/financial-reporting/tabs/IncomeStatementTab"
import { BalanceSheetTab } from "@/components/application-portal/financial-reporting/tabs/BalanceSheetTab"
import { CashFlowTab } from "@/components/application-portal/financial-reporting/tabs/CashFlowTab"
import { NonFinancialKPIsTab } from "@/components/application-portal/financial-reporting/tabs/NonFinancialKPIsTab"
import { cn } from "@/lib/utils"

const ADMIN_DRAWER_VIEW_TABS = [
  { id: "income", label: "Income Statement", icon: FileText, gradient: "from-green-400 to-green-600" },
  { id: "balance", label: "Balance Sheet", icon: BarChart3, gradient: "from-blue-400 to-blue-600" },
  { id: "cashflow", label: "Cash Flow", icon: DollarSign, gradient: "from-indigo-400 to-indigo-600" },
  { id: "kpis", label: "Operational KPIs", icon: TrendingUp, gradient: "from-amber-400 to-amber-600" },
] as const

type AdminDrawerViewTabId = (typeof ADMIN_DRAWER_VIEW_TABS)[number]["id"]

function getAdminDrawerViewTabId(reportType?: PortfolioFinancialReport["reportType"]): AdminDrawerViewTabId | null {
  if (!reportType) return null
  if (reportType === "INCOME_STATEMENTS" || reportType === "INCOME_STATEMENT") return "income"
  if (reportType === "STATEMENT_OF_FINANCIAL_POSITION" || reportType === "BALANCE_SHEET") return "balance"
  if (reportType === "CASHFLOW_STATEMENTS" || reportType === "CASHFLOW_STATEMENT") return "cashflow"
  if (reportType === "OPERATIONAL_KPIS") return "kpis"
  return null
}

function AdminReportDetailDrawer({
  open,
  onClose,
  report,
}: {
  open: boolean
  onClose: () => void
  report: PortfolioFinancialReport | null
}) {
  const activeViewTab = getAdminDrawerViewTabId(report?.reportType)

  const handleDownloadFile = () => {
    const link = report?.fileUrl || report?.reportUrl
    if (!link) {
      toast.error("No file attached for this report")
      return
    }
    const a = document.createElement("a")
    a.href = link
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.download = ""
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleExportPdf = async () => {
    if (!report) return
    try {
      const doc = new jsPDF()
      const prettyType = report.reportType.replaceAll("_", " ")
      let startY = await addLetterhead(doc, prettyType)
      startY = addReportInfo(doc, startY, [
        `Title: ${report.title || "-"}`,
        `Period: ${(report.periodStart || "-").slice(0, 10)} to ${(report.periodEnd || "-").slice(0, 10)}`,
        `Reporting Period: ${(report.reportingPeriod || "-").slice(0, 10)}`,
        `Status: ${report.status}`,
      ])

      const payload = report.data && typeof report.data === "object" ? report.data as Record<string, unknown> : {}
      const rows: any[] = []

      const labelize = (key: string) => key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())

      const pushRows = (value: unknown, path: string[] = []) => {
        if (value === null || value === undefined) {
          rows.push([path.map(labelize).join(" > ") || "Value", "-"])
          return
        }

        if (Array.isArray(value)) {
          if (value.length === 0) {
            rows.push([path.map(labelize).join(" > ") || "Value", "[]"])
            return
          }
          value.forEach((item, index) => pushRows(item, [...path, String(index + 1)]))
          return
        }

        if (typeof value === "object") {
          const entries = Object.entries(value as Record<string, unknown>)
          if (entries.length === 0) {
            rows.push([path.map(labelize).join(" > ") || "Value", "{}"])
            return
          }
          entries.forEach(([k, v]) => pushRows(v, [...path, k]))
          return
        }

        const rendered = typeof value === "number"
          ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
          : String(value)
        rows.push([path.map(labelize).join(" > ") || "Value", rendered])
      }

      pushRows(payload)

      autoTable(doc, {
        head: [["Description", "Value"]],
        body: rows.length > 0 ? rows : [["No structured payload available", "-"]],
        startY,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        columnStyles: { 1: { halign: "right" } },
      })

      const stamp = (report.reportingPeriod || report.periodEnd || report.createdAt || "report").slice(0, 10)
      doc.save(`${report.reportType.toLowerCase()}-${stamp}.pdf`)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Failed to export PDF")
    }
  }

  const mapIncomeStatementFromPayload = (payload: Record<string, any>): ReportingFormData["incomeStatement"] => {
    const source = payload || {}
    return {
      ...EMPTY_INCOME_STATEMENT,
      grossSales: [source.grossSales || 0, 0, 0],
      returnsRefunds: [source.returnsRefundsAndAllowances || 0, 0, 0],
      otherRevenue: [source.otherRevenue || 0, 0, 0],
      goodsPurchased: [source.goodsPurchased || 0, 0, 0],
      materials: [source.materials || 0, 0, 0],
      labour: [source.labour || 0, 0, 0],
      overhead: [source.overhead || 0, 0, 0],
      advertisingPromotion: [source.advertisingAndPromotion || 0, 0, 0],
      badDebt: [source.badDebt || 0, 0, 0],
      bankServiceCharges: [source.bankServiceCharges || 0, 0, 0],
      computerInternet: [source.computerAndInternet || 0, 0, 0],
      deliveryFreight: [source.deliveryFreightExpense || 0, 0, 0],
      furnitureEquipment: [source.furnitureAndEquipment || 0, 0, 0],
      insurance: [source.insurance || 0, 0, 0],
      maintenanceRepairs: [source.maintenanceAndRepairs || 0, 0, 0],
      mileage: [source.mileage || 0, 0, 0],
      officeSupplies: [source.officeSupplies || 0, 0, 0],
      otherExpenses: [source.otherExpenses || 0, 0, 0],
      payrollProcessing: [source.payrollProcessing || 0, 0, 0],
      postageDelivery: [source.postageAndDelivery || 0, 0, 0],
      professionalServices: [source.professionalServices || 0, 0, 0],
      rentLease: [source.rentLease || 0, 0, 0],
      researchDevelopment: [source.researchAndDevelopment || 0, 0, 0],
      salariesBenefitsWages: [source.salariesBenefitsAndWages || 0, 0, 0],
      travel: [source.travel || 0, 0, 0],
      utilitiesTelephone: [source.utilitiesTelephoneExpenses || 0, 0, 0],
      depreciationAmortization: [source.depreciationAndAmortisation || 0, 0, 0],
      nonOperatingRevenues: [source.nonOperatingRevenuesAndExpenses || 0, 0, 0],
      interestExpense: [source.lessInterestExpense || 0, 0, 0],
      incomeTaxExpense: [source.lessIncomeTaxExpense || 0, 0, 0],
      discontinuedOperations: [source.incomeFromDiscontinuedOperations || 0, 0, 0],
      accountingChanges: [source.effectOfAccountingChanges || 0, 0, 0],
      extraordinaryItems: [source.extraordinaryItems || 0, 0, 0],
    }
  }

  const mapBalanceSheetFromPayload = (payload: Record<string, any>): ReportingFormData["balanceSheet"] => {
    const c = payload?.currentPeriod || {}
    const p = payload?.priorPeriod || {}
    return {
      ...EMPTY_BALANCE_SHEET,
      cash: [c.cash || 0, p.cash || 0],
      accountsReceivable: [c.accountsReceivable || 0, p.accountsReceivable || 0],
      inventory: [c.inventory || 0, p.inventory || 0],
      prepaidExpenses: [c.prepaidExpenses || 0, p.prepaidExpenses || 0],
      shortTermInvestments: [c.shortTermInvestments || 0, p.shortTermInvestments || 0],
      longTermInvestments: [c.longTermInvestments || 0, p.longTermInvestments || 0],
      propertyPlantEquipment: [c.propertyPlantAndEquipment || 0, p.propertyPlantAndEquipment || 0],
      accumulatedDepreciation: [c.lessAccumulatedDepreciation || 0, p.lessAccumulatedDepreciation || 0],
      intangibleAssets: [c.intangibleAssets || 0, p.intangibleAssets || 0],
      deferredIncomeTax: [c.deferredIncomeTaxAssets || 0, p.deferredIncomeTaxAssets || 0],
      otherAssets: [c.otherAssets || 0, p.otherAssets || 0],
      accountsPayable: [c.accountsPayable || 0, p.accountsPayable || 0],
      shortTermLoans: [c.shortTermLoans || 0, p.shortTermLoans || 0],
      incomeTaxesPayable: [c.incomeTaxesPayable || 0, p.incomeTaxesPayable || 0],
      accruedSalariesWages: [c.accruedSalariesAndWages || 0, p.accruedSalariesAndWages || 0],
      unearnedRevenue: [c.unearnedRevenue || 0, p.unearnedRevenue || 0],
      currentPortionLTD: [c.currentPortionOfLongTermDebt || 0, p.currentPortionOfLongTermDebt || 0],
      longTermDebt: [c.longTermDebt || 0, p.longTermDebt || 0],
      deferredIncomeTaxLiab: [c.deferredIncomeTaxLiabilities || 0, p.deferredIncomeTaxLiabilities || 0],
      otherLiabilities: [c.otherLongTermLiabilities || 0, p.otherLongTermLiabilities || 0],
      ownersInvestment: [c.ownersInvestment || 0, p.ownersInvestment || 0],
      retainedEarnings: [c.retainedEarnings || 0, p.retainedEarnings || 0],
      otherEquity: [c.otherOwnersEquity || 0, p.otherOwnersEquity || 0],
    }
  }

  const mapCashFlowFromPayload = (payload: Record<string, any>): ReportingFormData["cashFlow"] => {
    const source = payload || {}
    return {
      ...EMPTY_CASH_FLOW,
      cashAtBeginning: [source.cashAtBeginningOfYear || 0, 0],
      cashFromCustomers: [source.cashReceiptsCustomers || 0, 0],
      cashFromOtherOperations: [source.cashReceiptsOtherOperations || 0, 0],
      paidInventory: [source.cashPaidInventoryPurchases || 0, 0],
      paidAdminExpenses: [source.cashPaidGeneralOperatingAndAdministrativeExpenses || 0, 0],
      paidWages: [source.cashPaidWageExpenses || 0, 0],
      paidInterest: [source.cashPaidInterest || 0, 0],
      paidIncomeTaxes: [source.cashPaidIncomeTaxes || 0, 0],
      proceedsFromPropertySales: [source.investingReceiptsSaleOfPropertyAndEquipment || 0, 0],
      principalCollected: [source.investingReceiptsCollectionOfPrincipalOnLoans || 0, 0],
      proceedsFromInvestmentSales: [source.investingReceiptsSaleOfInvestmentSecurities || 0, 0],
      purchaseOfProperty: [source.investingPaidPurchaseOfPropertyAndEquipment || 0, 0],
      loansToOtherEntities: [source.investingPaidMakingLoansToOtherEntities || 0, 0],
      purchaseOfInvestments: [source.investingPaidPurchaseOfInvestmentSecurities || 0, 0],
      proceedsFromStockIssuance: [source.financingReceiptsIssuanceOfStock || 0, 0],
      borrowingProceeds: [source.financingReceiptsBorrowing || 0, 0],
      stockRepurchase: [source.financingPaidRepurchaseOfStockTreasuryStock || 0, 0],
      loanRepayments: [source.financingPaidRepaymentOfLoans || 0, 0],
      dividendsPaid: [source.financingPaidDividends || 0, 0],
    }
  }

  const mapKpisFromPayload = (payload: Record<string, any>): ReportingFormData["nonFinancialKPIs"] => {
    const source = payload?.operational || payload || {}
    return {
      ...EMPTY_NON_FINANCIAL_KPIS,
      newCustomersAcquired: source.newCustomersCount || 0,
      activeCustomers: source.customerCountAtPeriodEnd || 0,
      customersAtBeginning: source.customerCountAtPeriodStart || 0,
      customersAtEnd: source.customerCountAtPeriodEnd || 0,
      marketOutlets: source.leadOrVisitorCount || 0,
      newProductsLaunched: source.customersFromLeads || 0,
      rdBudget: source.salesAndMarketingSpend || 0,
      emissionsWasteReduced: source.churnRate ? Math.round(source.churnRate * 100) : 0,
      jobsCreated: source.newCustomersCount || 0,
    }
  }

  const renderPayloadByType = () => {
    if (!report) {
      return <p className="text-sm text-muted-foreground">No report selected.</p>
    }

    const endDate = report.periodEnd ? new Date(report.periodEnd) : new Date()
    const currentYear = endDate.getFullYear()
    const incomeYears: [string, string, string] = [String(currentYear), String(currentYear - 1), String(currentYear - 2)]
    const bsYears: [string, string] = [String(currentYear), String(currentYear - 1)]
    const payload = report.data && typeof report.data === "object" ? report.data : {}

    if (report.reportType === "STATEMENT_OF_FINANCIAL_POSITION" || report.reportType === "BALANCE_SHEET") {
      return (
        <BalanceSheetTab
          data={mapBalanceSheetFromPayload(payload)}
          incomeStatement={EMPTY_INCOME_STATEMENT}
          onChange={() => {}}
          readOnly
          years={bsYears}
        />
      )
    }

    if (report.reportType === "OPERATIONAL_KPIS") {
      return <NonFinancialKPIsTab data={mapKpisFromPayload(payload)} onChange={() => {}} readOnly />
    }

    if (report.reportType === "INCOME_STATEMENTS" || report.reportType === "INCOME_STATEMENT") {
      return <IncomeStatementTab data={mapIncomeStatementFromPayload(payload)} onChange={() => {}} readOnly years={incomeYears} />
    }

    if (report.reportType === "CASHFLOW_STATEMENTS" || report.reportType === "CASHFLOW_STATEMENT") {
      return <CashFlowTab data={mapCashFlowFromPayload(payload)} onChange={() => {}} readOnly years={bsYears} />
    }

    if (report.reportType === "BUSINESS_PLAN") {
      return <p className="text-sm text-muted-foreground">No structured data available for this report.</p>
    }

    return <p className="text-sm text-muted-foreground">No compatible statement view available for this report type.</p>
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[80vw] min-w-[1100px] max-w-none overflow-y-auto p-0">
        <SheetHeader className="px-0 py-0 border-b bg-white">
          <div className="px-6 py-4 border-b bg-gray-50">
            <SheetTitle className="text-xl">Report Details</SheetTitle>
          </div>
          <div className="px-6 pt-2">
            <div className="flex items-center overflow-x-auto border-b border-border">
              <div className="flex space-x-1 min-w-max">
                {ADMIN_DRAWER_VIEW_TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeViewTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      disabled
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                        isActive ? "text-blue-600 border-blue-600" : "text-gray-500 border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                          isActive ? tab.gradient : "from-gray-300 to-gray-400"
                        )}
                      >
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </SheetHeader>

        {!report ? (
          <div className="p-6 text-sm text-muted-foreground">No report selected.</div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {report.reportType.replaceAll("_", " ")} • {report.periodType}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn(
                  "w-fit",
                  report.status === "ACCEPTED"
                    ? "bg-emerald-100 text-emerald-700"
                    : report.status === "PENDING"
                    ? "bg-blue-100 text-blue-700"
                    : report.status === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                )}>
                  {report.status}
                </Badge>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={handleExportPdf}>
                  <Download className="h-3.5 w-3.5" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={handleDownloadFile}>
                  <Download className="h-3.5 w-3.5" />
                  Download File
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Report Meta</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5">
                  <p><span className="font-medium">Period:</span> {report.periodStart?.slice(0, 10)} to {report.periodEnd?.slice(0, 10)}</p>
                  <p><span className="font-medium">Reporting Period:</span> {report.reportingPeriod?.slice(0, 10) || "-"}</p>
                  <p><span className="font-medium">Template:</span> {report.templateVersion || "-"}</p>
                  <p><span className="font-medium">Created:</span> {report.createdAt ? format(new Date(report.createdAt), "MMM d, yyyy HH:mm") : "-"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Review Meta</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5">
                  <p><span className="font-medium">Reviewed At:</span> {report.reviewedAt ? format(new Date(report.reviewedAt), "MMM d, yyyy HH:mm") : "Not reviewed"}</p>
                  <p><span className="font-medium">Submitted By:</span> {(report.submittedByFirstName || "-") + " " + (report.submittedByLastName || "")}</p>
                  <p><span className="font-medium">Reviewer Comment:</span> {report.reviewerComment || "-"}</p>
                  <p><span className="font-medium">Has File:</span> {report.fileUrl || report.reportUrl ? "Yes" : "No"}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Submitted Statement View</CardTitle>
              </CardHeader>
              <CardContent className="px-2 md:px-4">
                {renderPayloadByType()}
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function CompanyDrawer() {
  const { hasSpecificAction } = useRolePermissions()
  const canReviewReports = hasSpecificAction('portfolio-management', PORTFOLIO_ACTIONS.REVIEW_FINANCIAL_REPORT)

  const dispatch = useAppDispatch()
  const { selectedCompany, financialReports, financialReportsLoading } = useAppSelector(state => state.portfolioCompanies)
  const [activeTab, setActiveTab] = useState<'overview' | 'disbursements' | 'financials'>('overview')
  const [isReviewModalOpen, setReviewModalOpen] = useState(false)
  const [reportToReview, setReportToReview] = useState<PortfolioFinancialReport | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL')
  const [dueWindowFilter, setDueWindowFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_7' | 'DUE_30' | 'LATER'>('ALL')
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'DUE_SOONEST' | 'NEWEST'>('PRIORITY')
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([])
  const [bulkReviewLoading, setBulkReviewLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<PortfolioFinancialReport | null>(null)
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false)

  const normalizedFinancialReports: PortfolioFinancialReport[] = Array.isArray(financialReports)
    ? financialReports
    : ((financialReports as unknown as { items?: PortfolioFinancialReport[] })?.items ?? [])

  useEffect(() => {
    if (selectedCompany && activeTab === 'financials') {
      dispatch(fetchCompanyFinancialReports(selectedCompany.id))
    }
  }, [selectedCompany, activeTab, dispatch])

  const handleReviewClick = (report: PortfolioFinancialReport) => {
    setReportToReview(report)
    setReviewModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-700 border-green-400/30'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-700 border-yellow-400/30'
      case 'INACTIVE': return 'bg-gray-500/20 text-gray-700 border-gray-400/30'
      case 'CLOSED': return 'bg-red-500/20 text-red-700 border-red-400/30'
      default: return 'bg-blue-500/20 text-blue-700 border-blue-400/30'
    }
  }

  const getDisbursementStatusColor = (status: string) => {
    switch (status) {
      case 'DISBURSED': return 'bg-green-100 text-green-700'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'APPROVED': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      BALANCE_SHEET: 'Balance Sheet',
      INCOME_STATEMENT: 'Income Statement',
      CASHFLOW_STATEMENT: 'Cashflow Statement',
      INCOME_STATEMENTS: 'Income Statement',
      CASHFLOW_STATEMENTS: 'Cashflow Statement',
      STATEMENT_OF_FINANCIAL_POSITION: 'Statement of Financial Position',
      OPERATIONAL_KPIS: 'Operational KPIs',
      BUSINESS_PLAN: 'Business Plan',
    }
    return map[type] || type
  }

  const getDueWindow = (report: PortfolioFinancialReport): 'OVERDUE' | 'DUE_7' | 'DUE_30' | 'LATER' => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(report.periodEnd)
    due.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'OVERDUE'
    if (diffDays <= 7) return 'DUE_7'
    if (diffDays <= 30) return 'DUE_30'
    return 'LATER'
  }

  const filteredReports = normalizedFinancialReports.filter((report) => {
    if (statusFilter !== 'ALL' && report.status !== statusFilter) return false
    if (dueWindowFilter !== 'ALL' && getDueWindow(report) !== dueWindowFilter) return false
    return true
  })

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'NEWEST') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    const aDue = new Date(a.periodEnd).getTime()
    const bDue = new Date(b.periodEnd).getTime()
    if (sortBy === 'DUE_SOONEST') {
      return aDue - bDue
    }

    const statusRank: Record<PortfolioFinancialReport['status'], number> = {
      PENDING: 0,
      REJECTED: 1,
      ACCEPTED: 2,
    }

    const queueRank = (report: PortfolioFinancialReport) => {
      const due = getDueWindow(report)
      if (due === 'OVERDUE') return 0
      if (due === 'DUE_7') return 1
      if (due === 'DUE_30') return 2
      return 3
    }

    const statusDiff = statusRank[a.status] - statusRank[b.status]
    if (statusDiff !== 0) return statusDiff

    const queueDiff = queueRank(a) - queueRank(b)
    if (queueDiff !== 0) return queueDiff

    return aDue - bDue
  })

  const selectablePendingReportIds = sortedReports.filter((report) => report.status === 'PENDING').map((report) => report.id)
  const allPendingSelected = selectablePendingReportIds.length > 0 && selectablePendingReportIds.every((id) => selectedReportIds.includes(id))

  const pendingCount = normalizedFinancialReports.filter((report) => report.status === 'PENDING').length
  const overduePendingCount = normalizedFinancialReports.filter((report) => report.status === 'PENDING' && getDueWindow(report) === 'OVERDUE').length

  const toggleReportSelection = (reportId: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    )
  }

  const toggleAllVisiblePending = () => {
    setSelectedReportIds((prev) => {
      if (allPendingSelected) {
        return prev.filter((id) => !selectablePendingReportIds.includes(id))
      }

      const next = new Set(prev)
      selectablePendingReportIds.forEach((id) => next.add(id))
      return [...next]
    })
  }

  const handleBulkReview = async (action: 'ACCEPT' | 'REJECT') => {
    if (!selectedCompany || selectedReportIds.length === 0) return

    setBulkReviewLoading(true)
    try {
      await Promise.all(
        selectedReportIds.map((reportId) =>
          dispatch(
            reviewFinancialReport({
              companyId: selectedCompany.id,
              reportId,
              data: {
                action,
                comment: `Bulk ${action.toLowerCase()} action from review queue`,
              },
            })
          ).unwrap()
        )
      )

      setSelectedReportIds([])
      toast.success(`Successfully ${action === 'ACCEPT' ? 'accepted' : 'rejected'} ${selectedReportIds.length} report(s).`)
    } catch (error: any) {
      toast.error(error || `Failed to ${action.toLowerCase()} selected reports.`)
    } finally {
      setBulkReviewLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'disbursements', label: 'Disbursements', icon: CreditCard, count: selectedCompany?.disbursements?.length || 0 },
    { id: 'financials', label: 'Financial Reports', icon: TrendingUp, count: normalizedFinancialReports.length },
  ]

  return (
    <>
      <FinancialReportReviewModal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} report={reportToReview} />
      <AdminReportDetailDrawer
        open={reportDrawerOpen}
        onClose={() => setReportDrawerOpen(false)}
        report={selectedReport}
      />
      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && dispatch({ type: 'portfolioCompanies/setSelectedCompany', payload: null })}>
        <SheetContent className="w-[75vw] min-w-[1100px] max-w-[1900px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
          {selectedCompany && (
            <>
              <SheetHeader className="p-6 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl">{selectedCompany.name}</SheetTitle>
                  <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'portfolioCompanies/setSelectedCompany', payload: null })}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </SheetHeader>
              {/* <SheetHeader>
                          <SheetTitle className="text-2xl font-normal flex items-center gap-2">
                            <CiFileOn className="w-6 h-6" /> {selected?.businessName}
                          </SheetTitle>
                        </SheetHeader> */}
              <div className="p-6">
                <div className="border-b mb-6">
                  <div className="flex space-x-6">
                    {tabs.map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        <Badge variant="secondary" className="rounded-full">{tab.count}</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5" />Company Information</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div><label className="text-sm text-gray-500">Registration Number</label><p className="text-base font-mono">{selectedCompany.registrationNumber}</p></div>
                        <div><label className="text-sm text-gray-500">Industry</label><p className="text-base font-medium">{selectedCompany.industry}</p></div>
                        <div><label className="text-sm text-gray-500">Status</label><div className="mt-1"><Badge className={getStatusColor(selectedCompany.status)}>{selectedCompany.status}</Badge></div></div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5" />Investment Details</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-sm text-gray-500">Total Invested</label><p className="text-xl font-semibold text-blue-600">${(Number(selectedCompany.totalInvested) || 0).toLocaleString()}</p></div>
                          <div><label className="text-sm text-gray-500">Disbursements</label><p className="text-xl font-semibold text-emerald-600">{selectedCompany.disbursements?.length || 0}</p></div>
                        </div>
                        <div><label className="text-sm text-gray-500">Fund</label><p className="text-base font-medium">{selectedCompany.fund?.name || 'No fund assigned'}</p></div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'disbursements' && (
                  <div className="space-y-4">
                    {(selectedCompany.disbursements?.length || 0) > 0 ? (
                      selectedCompany.disbursements.map((disbursement) => (
                        <Card key={disbursement.id}><CardContent className="pt-6"><div className="flex justify-between items-start"><p className="font-semibold text-xl text-gray-900">${parseFloat(disbursement.amount).toLocaleString()}</p><Badge className={`text-xs ${getDisbursementStatusColor(disbursement.status)}`}>{disbursement.status}</Badge></div><div className="text-xs text-gray-500 pt-2 border-t mt-2">Disbursed on {new Date(disbursement.disbursementDate).toLocaleDateString()}</div></CardContent></Card>
                      ))
                    ) : (
                      <div className="text-center py-12"><CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No disbursements yet</p></div>
                    )}
                  </div>
                )}

                {activeTab === 'financials' && (
                  <div className="space-y-4">
                    <Card className="border-dashed">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-yellow-100 text-yellow-800">Pending {pendingCount}</Badge>
                            <Badge className="bg-red-100 text-red-800">Overdue {overduePendingCount}</Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'PRIORITY' | 'DUE_SOONEST' | 'NEWEST')}>
                              <SelectTrigger className="w-[180px] rounded-full">
                                <SelectValue placeholder="Sort" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PRIORITY">Priority queue</SelectItem>
                                <SelectItem value="DUE_SOONEST">Due soonest</SelectItem>
                                <SelectItem value="NEWEST">Newest first</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED')}>
                              <SelectTrigger className="w-[180px] rounded-full">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ALL">All statuses</SelectItem>
                                <SelectItem value="PENDING">Pending review</SelectItem>
                                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select value={dueWindowFilter} onValueChange={(value) => setDueWindowFilter(value as 'ALL' | 'OVERDUE' | 'DUE_7' | 'DUE_30' | 'LATER')}>
                              <SelectTrigger className="w-[200px] rounded-full">
                                <SelectValue placeholder="Due window" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ALL">All due windows</SelectItem>
                                <SelectItem value="OVERDUE">Overdue</SelectItem>
                                <SelectItem value="DUE_7">Due in 7 days</SelectItem>
                                <SelectItem value="DUE_30">Due in 30 days</SelectItem>
                                <SelectItem value="LATER">Due later</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {canReviewReports && (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t pt-3">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={allPendingSelected} onCheckedChange={toggleAllVisiblePending} />
                              <span className="text-xs text-muted-foreground">
                                Select all visible pending ({selectablePendingReportIds.length})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Selected {selectedReportIds.length}</span>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full"
                                    disabled={selectedReportIds.length === 0 || bulkReviewLoading}
                                  >
                                    Bulk Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject selected reports?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will reject {selectedReportIds.length} selected report(s).
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.preventDefault()
                                        void handleBulkReview('REJECT')
                                      }}
                                    >
                                      Confirm Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                    disabled={selectedReportIds.length === 0 || bulkReviewLoading}
                                  >
                                    Bulk Accept
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Accept selected reports?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will accept {selectedReportIds.length} selected report(s).
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.preventDefault()
                                        void handleBulkReview('ACCEPT')
                                      }}
                                    >
                                      Confirm Accept
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {financialReportsLoading ? <FinancialReportsSkeleton /> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedReports.map((report, idx) => (
                          <motion.div
                            key={report.id}
                            className="group relative border rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <div className="h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                              <div className="text-center">
                                <FileText className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                                <p className="text-xs text-blue-600 font-medium">{getTypeLabel(report.reportType)}</p>
                              </div>
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <Button
                                  size="sm"
                                  className="bg-white/90 hover:bg-white text-gray-900 rounded-full"
                                  onClick={() => {
                                    setSelectedReport(report)
                                    setReportDrawerOpen(true)
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" /> Preview
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  {canReviewReports && report.status === 'PENDING' && (
                                    <div className="mb-1">
                                      <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <Checkbox
                                          checked={selectedReportIds.includes(report.id)}
                                          onCheckedChange={() => toggleReportSelection(report.id)}
                                        />
                                        Select for bulk review
                                      </label>
                                    </div>
                                  )}
                                  <p className="text-xs font-semibold text-gray-800 truncate">{report.title}</p>
                                  <p className="text-[11px] text-gray-500">Period: {format(new Date(report.periodStart), 'd MMM yy')} - {format(new Date(report.periodEnd), 'd MMM yy')}</p>
                                  <p className="text-[11px] text-gray-500">By: {report.submittedByFirstName} {report.submittedByLastName}</p>
                                  <p className="text-[11px] text-gray-500">Queue: {getDueWindow(report).replace('_', ' ')}</p>
                                </div>
                                <div className="absolute top-2 right-2">
                                  <Badge className={`${getReportStatusColor(report.status)} text-[10px] px-1.5 py-0.5`}>{report.status}</Badge>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="rounded-full px-3 py-1"
                                  onClick={() => {
                                    setSelectedReport(report)
                                    setReportDrawerOpen(true)
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" /> View
                                </Button>
                                {report.status === 'PENDING' && canReviewReports && (
                                  <Button size="xs" onClick={() => handleReviewClick(report)} className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1">
                                    <Check className="w-3 h-3 mr-1" /> Review
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    {!financialReportsLoading && normalizedFinancialReports.length === 0 && (
                      <div className="text-center py-12 col-span-full">
                        <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No financial reports submitted.</p>
                      </div>
                    )}
                    {!financialReportsLoading && normalizedFinancialReports.length > 0 && sortedReports.length === 0 && (
                      <div className="text-center py-12 col-span-full">
                        <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No reports match the selected filters.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
