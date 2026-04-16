"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format } from "date-fns"
import { Save, Send, Lock, CheckCircle, Clock, AlertCircle, CalendarIcon, Paperclip, FileUp, X, Eye, Download, RotateCcw, FileText, BarChart3, DollarSign, TrendingUp } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  type PeriodType,
  type FormStatus,
  type ReportingFormData,
  EMPTY_INCOME_STATEMENT,
  EMPTY_BALANCE_SHEET,
  EMPTY_CASH_FLOW,
  EMPTY_NON_FINANCIAL_KPIS,
} from "./types"
import { IncomeStatementTab } from "./tabs/IncomeStatementTab"
import { BalanceSheetTab } from "./tabs/BalanceSheetTab"
import { CashFlowTab } from "./tabs/CashFlowTab"
import { NonFinancialKPIsTab } from "./tabs/NonFinancialKPIsTab"
import { toast } from "sonner"
import applicationPortalApiService, { type FinancialReport, type ReportingRequestItem } from "@/lib/api/application-portal-api"
import { addLetterhead, addReportInfo } from "@/lib/utils/pdf-letterhead"

type MandatoryFileMap = Record<string, File | null>

const DRAFT_KEY = "investee_reporting_draft"

const TABS = [
  { id: "income",   label: "Income Statement" },
  { id: "balance",  label: "Statement of Financial Position" },
  { id: "cashflow", label: "Cash Flow Statement" },
  { id: "kpis",     label: "Non-Financial KPIs" },
  { id: "recent",   label: "Recent Submitted Reports" },
] as const
type TabId = (typeof TABS)[number]["id"]

const DRAWER_VIEW_TABS = [
  { id: "income", label: "Income Statement", icon: FileText, gradient: "from-green-400 to-green-600" },
  { id: "balance", label: "Balance Sheet", icon: BarChart3, gradient: "from-blue-400 to-blue-600" },
  { id: "cashflow", label: "Cash Flow", icon: DollarSign, gradient: "from-indigo-400 to-indigo-600" },
  { id: "kpis", label: "Operational KPIs", icon: TrendingUp, gradient: "from-amber-400 to-amber-600" },
] as const

type DrawerViewTabId = (typeof DRAWER_VIEW_TABS)[number]["id"]

function getDrawerViewTabId(reportType?: FinancialReport["reportType"]): DrawerViewTabId | null {
  if (!reportType) return null
  if (reportType === "INCOME_STATEMENTS" || reportType === "INCOME_STATEMENT") return "income"
  if (reportType === "STATEMENT_OF_FINANCIAL_POSITION") return "balance"
  if (reportType === "CASHFLOW_STATEMENTS" || reportType === "CASHFLOW_STATEMENT") return "cashflow"
  if (reportType === "OPERATIONAL_KPIS") return "kpis"
  return null
}

const STATUS_CONFIG: Record<FormStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  DRAFT:     { label: "Draft",     badge: "bg-gray-100 text-gray-600",   icon: <Clock className="h-3.5 w-3.5" /> },
  SUBMITTED: { label: "Submitted", badge: "bg-blue-100 text-blue-700",   icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REVIEWED:  { label: "Reviewed",  badge: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REJECTED:  { label: "Rejected",  badge: "bg-red-100 text-red-700",     icon: <AlertCircle className="h-3.5 w-3.5" /> },
}

function emptyForm(): ReportingFormData {
  return {
    periodType: "MONTHLY",
    periodStart: "",
    periodEnd: "",
    incomeStatement:   { ...EMPTY_INCOME_STATEMENT },
    balanceSheet:      { ...EMPTY_BALANCE_SHEET },
    cashFlow:          { ...EMPTY_CASH_FLOW },
    nonFinancialKPIs:  { ...EMPTY_NON_FINANCIAL_KPIS },
  }
}

const toIncomeDraftPayload = (d: ReportingFormData["incomeStatement"]) => ({
  grossSales: d.grossSales[0],
  returnsRefundsAndAllowances: d.returnsRefunds[0],
  otherRevenue: d.otherRevenue[0],
  goodsPurchased: d.goodsPurchased[0],
  materials: d.materials[0],
  labour: d.labour[0],
  overhead: d.overhead[0],
  advertisingAndPromotion: d.advertisingPromotion[0],
  badDebt: d.badDebt[0],
  bankServiceCharges: d.bankServiceCharges[0],
  computerAndInternet: d.computerInternet[0],
  deliveryFreightExpense: d.deliveryFreight[0],
  furnitureAndEquipment: d.furnitureEquipment[0],
  insurance: d.insurance[0],
  maintenanceAndRepairs: d.maintenanceRepairs[0],
  mileage: d.mileage[0],
  officeSupplies: d.officeSupplies[0],
  otherExpenses: d.otherExpenses[0],
  payrollProcessing: d.payrollProcessing[0],
  postageAndDelivery: d.postageDelivery[0],
  professionalServices: d.professionalServices[0],
  rentLease: d.rentLease[0],
  researchAndDevelopment: d.researchDevelopment[0],
  salariesBenefitsAndWages: d.salariesBenefitsWages[0],
  travel: d.travel[0],
  utilitiesTelephoneExpenses: d.utilitiesTelephone[0],
  depreciationAndAmortisation: d.depreciationAmortization[0],
  nonOperatingRevenuesAndExpenses: d.nonOperatingRevenues[0],
  lessInterestExpense: d.interestExpense[0],
  lessIncomeTaxExpense: d.incomeTaxExpense[0],
  incomeFromDiscontinuedOperations: d.discontinuedOperations[0],
  effectOfAccountingChanges: d.accountingChanges[0],
  extraordinaryItems: d.extraordinaryItems[0],
})

const toBalanceDraftPayload = (d: ReportingFormData["balanceSheet"]) => ({
  currentPeriod: {
    cash: d.cash[0],
    accountsReceivable: d.accountsReceivable[0],
    inventory: d.inventory[0],
    prepaidExpenses: d.prepaidExpenses[0],
    shortTermInvestments: d.shortTermInvestments[0],
    longTermInvestments: d.longTermInvestments[0],
    propertyPlantAndEquipment: d.propertyPlantEquipment[0],
    lessAccumulatedDepreciation: d.accumulatedDepreciation[0],
    intangibleAssets: d.intangibleAssets[0],
    deferredIncomeTaxAssets: d.deferredIncomeTax[0],
    otherAssets: d.otherAssets[0],
    accountsPayable: d.accountsPayable[0],
    shortTermLoans: d.shortTermLoans[0],
    incomeTaxesPayable: d.incomeTaxesPayable[0],
    accruedSalariesAndWages: d.accruedSalariesWages[0],
    unearnedRevenue: d.unearnedRevenue[0],
    currentPortionOfLongTermDebt: d.currentPortionLTD[0],
    longTermDebt: d.longTermDebt[0],
    deferredIncomeTaxLiabilities: d.deferredIncomeTaxLiab[0],
    otherLongTermLiabilities: d.otherLiabilities[0],
    ownersInvestment: d.ownersInvestment[0],
    retainedEarnings: d.retainedEarnings[0],
    otherOwnersEquity: d.otherEquity[0],
  },
  priorPeriod: {
    cash: d.cash[1],
    accountsReceivable: d.accountsReceivable[1],
    inventory: d.inventory[1],
    prepaidExpenses: d.prepaidExpenses[1],
    shortTermInvestments: d.shortTermInvestments[1],
    longTermInvestments: d.longTermInvestments[1],
    propertyPlantAndEquipment: d.propertyPlantEquipment[1],
    lessAccumulatedDepreciation: d.accumulatedDepreciation[1],
    intangibleAssets: d.intangibleAssets[1],
    deferredIncomeTaxAssets: d.deferredIncomeTax[1],
    otherAssets: d.otherAssets[1],
    accountsPayable: d.accountsPayable[1],
    shortTermLoans: d.shortTermLoans[1],
    incomeTaxesPayable: d.incomeTaxesPayable[1],
    accruedSalariesAndWages: d.accruedSalariesWages[1],
    unearnedRevenue: d.unearnedRevenue[1],
    currentPortionOfLongTermDebt: d.currentPortionLTD[1],
    longTermDebt: d.longTermDebt[1],
    deferredIncomeTaxLiabilities: d.deferredIncomeTaxLiab[1],
    otherLongTermLiabilities: d.otherLiabilities[1],
    ownersInvestment: d.ownersInvestment[1],
    retainedEarnings: d.retainedEarnings[1],
    otherOwnersEquity: d.otherEquity[1],
  },
})

const toCashFlowDraftPayload = (d: ReportingFormData["cashFlow"]) => ({
  cashAtBeginningOfYear: d.cashAtBeginning[0],
  cashReceiptsCustomers: d.cashFromCustomers[0],
  cashReceiptsOtherOperations: d.cashFromOtherOperations[0],
  cashPaidInventoryPurchases: d.paidInventory[0],
  cashPaidGeneralOperatingAndAdministrativeExpenses: d.paidAdminExpenses[0],
  cashPaidWageExpenses: d.paidWages[0],
  cashPaidInterest: d.paidInterest[0],
  cashPaidIncomeTaxes: d.paidIncomeTaxes[0],
  investingReceiptsSaleOfPropertyAndEquipment: d.proceedsFromPropertySales[0],
  investingReceiptsCollectionOfPrincipalOnLoans: d.principalCollected[0],
  investingReceiptsSaleOfInvestmentSecurities: d.proceedsFromInvestmentSales[0],
  investingPaidPurchaseOfPropertyAndEquipment: d.purchaseOfProperty[0],
  investingPaidMakingLoansToOtherEntities: d.loansToOtherEntities[0],
  investingPaidPurchaseOfInvestmentSecurities: d.purchaseOfInvestments[0],
  financingReceiptsIssuanceOfStock: d.proceedsFromStockIssuance[0],
  financingReceiptsBorrowing: d.borrowingProceeds[0],
  financingPaidRepurchaseOfStockTreasuryStock: d.stockRepurchase[0],
  financingPaidRepaymentOfLoans: d.loanRepayments[0],
  financingPaidDividends: d.dividendsPaid[0],
  cashAtEndOfYear: d.cashAtBeginning[0] + d.cashFromCustomers[0] + d.cashFromOtherOperations[0] - d.paidInventory[0] - d.paidAdminExpenses[0] - d.paidWages[0] - d.paidInterest[0] - d.paidIncomeTaxes[0],
})

// ── Submit + document attachment dialog ─────────────────────────────────────

function SubmitDialog({
  open,
  onClose,
  onConfirm,
  submitting,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (file: File | null, notes: string) => void
  submitting: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // reset on open
  useEffect(() => {
    if (open) { setFile(null); setNotes("") }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-600" />
            Submit Financial Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            Attach any supporting document (auditor sign-off, management letter, etc.) and add submission notes before submitting.
          </p>

          {/* File upload */}
          <div className="space-y-1.5">
            <Label>Supporting Document <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-card-foreground">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                <FileUp className="h-5 w-5" />
                Click to attach file
              </button>
            )}
            <p className="text-xs text-muted-foreground">PDF, Word, Excel, or image up to 10 MB</p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Submission Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              placeholder="Add any notes for the reviewer…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={() => onConfirm(file, notes)}
            disabled={submitting}
            className="gradient-primary text-white gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Submitting…" : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReportDetailDrawer({
  open,
  onClose,
  report,
}: {
  open: boolean
  onClose: () => void
  report: FinancialReport | null
}) {
  const handleOpenFile = () => {
    const link = report?.fileUrl || report?.reportUrl
    if (!link) {
      toast.error("No report file available")
      return
    }
    window.open(link, "_blank", "noopener,noreferrer")
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

  const activeViewTab = getDrawerViewTabId(report?.reportType)

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
    const incomeYears: [string, string, string] = [
      String(currentYear),
      String(currentYear - 1),
      String(currentYear - 2),
    ]
    const bsYears: [string, string] = [String(currentYear), String(currentYear - 1)]
    const payload = report.data && typeof report.data === "object" ? report.data : {}

    if (report.reportType === "STATEMENT_OF_FINANCIAL_POSITION") {
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
      return (
        <NonFinancialKPIsTab
          data={mapKpisFromPayload(payload)}
          onChange={() => {}}
          readOnly
        />
      )
    }

    if (report.reportType === "INCOME_STATEMENTS" || report.reportType === "INCOME_STATEMENT") {
      return (
        <IncomeStatementTab
          data={mapIncomeStatementFromPayload(payload)}
          onChange={() => {}}
          readOnly
          years={incomeYears}
        />
      )
    }

    if (report.reportType === "CASHFLOW_STATEMENTS" || report.reportType === "CASHFLOW_STATEMENT") {
      return (
        <CashFlowTab
          data={mapCashFlowFromPayload(payload)}
          onChange={() => {}}
          readOnly
          years={bsYears}
        />
      )
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
                {DRAWER_VIEW_TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeViewTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      disabled
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                        isActive
                          ? "text-blue-600 border-blue-600"
                          : "text-gray-500 border-transparent"
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
                  report.status === "ACCEPTED" || report.status === "REVIEWED"
                    ? "bg-emerald-100 text-emerald-700"
                    : report.status === "PENDING" || report.status === "SUBMITTED"
                    ? "bg-blue-100 text-blue-700"
                    : report.status === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                )}>
                  {report.status}
                </Badge>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={handleOpenFile}>
                  <Eye className="h-3.5 w-3.5" />
                  View File
                </Button>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={handleExportPdf}>
                  <Download className="h-3.5 w-3.5" />
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Report Meta</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5">
                  <p><span className="font-medium">Company:</span> {report.companyName || "-"}</p>
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
                  <p><span className="font-medium">Reviewer Comment:</span> {report.reviewerComment || "-"}</p>
                  <p><span className="font-medium">Can Download:</span> {report.canDownload ? "Yes" : "No"}</p>
                  <p><span className="font-medium">Can Upload File:</span> {report.canUploadFile ? "Yes" : "No"}</p>
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

// ── Main form ────────────────────────────────────────────────────────────────

export function InvesteeReportingForm() {
  const [formData, setFormData]   = useState<ReportingFormData>(emptyForm)
  const [status, setStatus]       = useState<FormStatus>("DRAFT")
  const [activeTab, setActiveTab] = useState<TabId>("income")
  const [reportingRequests, setReportingRequests] = useState<ReportingRequestItem[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [recentReports, setRecentReports] = useState<FinancialReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState("")
  const [mandatoryFiles, setMandatoryFiles] = useState<MandatoryFileMap>({})
  const [saving, setSaving]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isLocked = false
  const selectedRequest = reportingRequests.find((req) => req.id === selectedRequestId) || null
  const selectedMandatoryAttachments = selectedRequest?.mandatoryAttachments || []
  const missingMandatoryAttachments = selectedMandatoryAttachments.filter((att) => !mandatoryFiles[att.name])
  const dueDateObj = selectedRequest?.dueDate ? new Date(selectedRequest.dueDate) : null
  const daysUntilDue = dueDateObj ? Math.ceil((dueDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  // Derived date objects for Popover/Calendar
  const startDateObj = formData.periodStart ? new Date(formData.periodStart + "T00:00:00") : undefined
  const endDateObj   = formData.periodEnd   ? new Date(formData.periodEnd   + "T00:00:00") : undefined

  // Year labels derived from the reporting period end date
  // Income Statement: 3 years (current, prior-1, prior-2)
  // Balance Sheet / Cash Flow: 2 years (current, prior)
  const currentYear = endDateObj ? endDateObj.getFullYear() : new Date().getFullYear()
  const incomeYears: [string, string, string] = [
    String(currentYear),
    String(currentYear - 1),
    String(currentYear - 2),
  ]
  const bsYears: [string, string] = [String(currentYear), String(currentYear - 1)]

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.formData) setFormData(parsed.formData)
        if (parsed.status)   setStatus(parsed.status)
        if (parsed.lastSaved) setLastSaved(new Date(parsed.lastSaved))
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const loadReportingRequests = async () => {
      setRequestsLoading(true)
      setReportsLoading(true)
      try {
        const [requestsResponse, reportsResponse] = await Promise.all([
          applicationPortalApiService.getReportingRequests(),
          applicationPortalApiService.getFinancialReports(),
        ])

        const requests = requestsResponse?.data || []
        setRecentReports((reportsResponse?.data || []).slice(0, 6))
        setReportingRequests(requests)

        if (requests.length > 0) {
          const first = requests[0]
          setSelectedRequestId(first.id)
          const initialMandatoryState: MandatoryFileMap = {}
          ;(first.mandatoryAttachments || []).forEach((att) => {
            initialMandatoryState[att.name] = null
          })
          setMandatoryFiles(initialMandatoryState)
          setFormData((prev) => ({
            ...prev,
            periodEnd: first.reportingPeriod || prev.periodEnd,
            periodStart: prev.periodStart || first.reportingPeriod || prev.periodStart,
          }))
        }
      } catch (error: any) {
        toast.error("Failed to load reporting requests", { description: error?.message })
      } finally {
        setRequestsLoading(false)
        setReportsLoading(false)
      }
    }

    void loadReportingRequests()
  }, [])

  const saveDraft = useCallback(() => {
    setSaving(true)
    try {
      const now = new Date()
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, status: "DRAFT", lastSaved: now.toISOString() }))
      setLastSaved(now)
      setStatus("DRAFT")
      toast.success("Draft saved")
    } catch {
      toast.error("Failed to save draft")
    } finally {
      setSaving(false)
    }
  }, [formData])

  const resetFormForRequest = (requestId?: string) => {
    const target = requestId
      ? reportingRequests.find((req) => req.id === requestId) || null
      : selectedRequest

    const nextMandatoryState: MandatoryFileMap = {}
    ;(target?.mandatoryAttachments || []).forEach((att) => {
      nextMandatoryState[att.name] = null
    })

    setFormData((prev) => {
      const base = emptyForm()
      return {
        ...base,
        periodType: prev.periodType,
        periodStart: target?.reportingPeriod || "",
        periodEnd: target?.reportingPeriod || "",
      }
    })
    setStatus("DRAFT")
    setMandatoryFiles(nextMandatoryState)
    localStorage.removeItem(DRAFT_KEY)
  }

  const handleSubmitConfirm = async (file: File | null, notes: string) => {
    setSubmitting(true)
    try {
      if (missingMandatoryAttachments.length > 0) {
        throw new Error(`Attach all mandatory documents before submit (${missingMandatoryAttachments.length} missing)`)
      }

      const basePayload = {
        reportingPeriod: formData.periodEnd,
        periodType: formData.periodType,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        templateVersion: "2026.1",
      }

      const incomeDraft = await applicationPortalApiService.createIncomeStatementDraft({
        ...basePayload,
        title: `Income statement — ${formData.periodEnd}`,
        description: notes || "Submitted from investee reporting portal",
        data: toIncomeDraftPayload(formData.incomeStatement),
      })

      await applicationPortalApiService.createBalanceSheetDraft({
        ...basePayload,
        title: `Statement of financial position — ${formData.periodEnd}`,
        description: notes || "Submitted from investee reporting portal",
        data: toBalanceDraftPayload(formData.balanceSheet),
      })

      await applicationPortalApiService.createCashFlowDraft({
        ...basePayload,
        title: `Cash flow statement — ${formData.periodEnd}`,
        description: notes || "Submitted from investee reporting portal",
        data: toCashFlowDraftPayload(formData.cashFlow),
      })

      const anchorReportId = incomeDraft?.data?.id
      if (!anchorReportId) {
        throw new Error("Unable to create reporting drafts")
      }

      for (const mandatory of selectedMandatoryAttachments) {
        const selectedFile = mandatoryFiles[mandatory.name]
        if (!selectedFile) continue
        await applicationPortalApiService.uploadFinancialReportFile(anchorReportId, selectedFile)
      }

      if (file) {
        await applicationPortalApiService.uploadFinancialReportFile(anchorReportId, file)
      }

      await applicationPortalApiService.submitPeriodKPIs({
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        totalRevenue: formData.incomeStatement.grossSales[0] || 0,
        netProfit: 0,
        cashFlowNet: 0,
      })

      await applicationPortalApiService.submitFinancialReportBundle(anchorReportId)
      const refreshedReports = await applicationPortalApiService.getFinancialReports()
      setRecentReports((refreshedReports?.data || []).slice(0, 6))
      setStatus("DRAFT")
      localStorage.removeItem(DRAFT_KEY)
      setSubmitOpen(false)
      resetFormForRequest(selectedRequestId)
      toast.success("Report submitted successfully", {
        description: file
          ? `Submitted with supporting document: ${file.name}`
          : "Your financial report has been submitted for review.",
      })
    } catch (e: any) {
      toast.error("Submission failed", { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleMandatoryFileChange = (attachmentName: string, file: File | null) => {
    setMandatoryFiles((prev) => ({
      ...prev,
      [attachmentName]: file,
    }))
  }

  const updateIncome  = (d: ReportingFormData["incomeStatement"])  => setFormData(f => ({ ...f, incomeStatement: d }))
  const updateBalance = (d: ReportingFormData["balanceSheet"])     => setFormData(f => ({ ...f, balanceSheet: d }))
  const updateCashFlow= (d: ReportingFormData["cashFlow"])         => setFormData(f => ({ ...f, cashFlow: d }))
  const updateKPIs    = (d: ReportingFormData["nonFinancialKPIs"]) => setFormData(f => ({ ...f, nonFinancialKPIs: d }))

  const statusCfg = STATUS_CONFIG[status]

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Financial Reporting</h2>
          <p className="text-gray-600 mt-1">Submit your periodic financial statements and KPIs for review</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status badge */}
          <Badge className={cn("flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full", statusCfg.badge)}>
            {statusCfg.icon}
            {statusCfg.label}
          </Badge>

          {lastSaved && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}

          {!isLocked && (
            <>
              <Button variant="outline" size="sm" onClick={() => resetFormForRequest(selectedRequestId)} className="rounded-full gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Form
              </Button>
              <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving} className="rounded-full gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save Draft"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!selectedRequestId) {
                    toast.error("Please select an open reporting request before submitting")
                    return
                  }
                  if (missingMandatoryAttachments.length > 0) {
                    toast.error("Please upload all mandatory attachments before submitting")
                    return
                  }
                  if (!formData.periodStart || !formData.periodEnd) {
                    toast.error("Please set the reporting period before submitting")
                    return
                  }
                  setSubmitOpen(true)
                }}
                className="rounded-full gap-1.5 gradient-primary text-white"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Report
              </Button>
            </>
          )}

          {isLocked && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Read-only
            </span>
          )}
        </div>
      </div>

      {/* ── Period / date card ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-blue-600" />
            Reporting Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Open Request</span>
              <Select
                value={selectedRequestId}
                onValueChange={(value) => {
                  setSelectedRequestId(value)
                  const selected = reportingRequests.find((req) => req.id === value)
                  if (!selected) return
                  const nextMandatoryState: MandatoryFileMap = {}
                  ;(selected.mandatoryAttachments || []).forEach((att) => {
                    nextMandatoryState[att.name] = mandatoryFiles[att.name] || null
                  })
                  setMandatoryFiles(nextMandatoryState)
                  setFormData((prev) => ({
                    ...prev,
                    periodEnd: selected.reportingPeriod,
                    periodStart: prev.periodStart || selected.reportingPeriod,
                  }))
                  resetFormForRequest(value)
                }}
                disabled={requestsLoading || reportingRequests.length === 0}
              >
                <SelectTrigger className="w-[260px] rounded-full">
                  <SelectValue placeholder={requestsLoading ? "Loading open requests..." : "Select open period"} />
                </SelectTrigger>
                <SelectContent>
                  {reportingRequests.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.reportingPeriod} {req.dueDate ? `• due ${format(new Date(req.dueDate), "MMM d, yyyy")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period type */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Period Type</span>
              <Select
                value={formData.periodType}
                onValueChange={v => setFormData(f => ({ ...f, periodType: v as PeriodType }))}
                disabled={isLocked}
              >
                <SelectTrigger className="w-[140px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUALLY">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start date */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">From</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("rounded-full gap-2", !startDateObj && "text-muted-foreground")}
                    disabled={isLocked}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {startDateObj ? format(startDateObj, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDateObj}
                    onSelect={date => date && setFormData(f => ({ ...f, periodStart: format(date, "yyyy-MM-dd") }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End date */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">To</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("rounded-full gap-2", !endDateObj && "text-muted-foreground")}
                    disabled={isLocked}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {endDateObj ? format(endDateObj, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDateObj}
                    onSelect={date => date && setFormData(f => ({ ...f, periodEnd: format(date, "yyyy-MM-dd") }))}
                    disabled={startDateObj ? { before: startDateObj } : undefined}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Period summary pill */}
            {startDateObj && endDateObj && (
              <Badge variant="outline" className="rounded-full text-xs text-blue-700 border-blue-200 bg-blue-50">
                {formData.periodType.charAt(0) + formData.periodType.slice(1).toLowerCase()} &middot;{" "}
                {format(startDateObj, "MMM d")} – {format(endDateObj, "MMM d, yyyy")}
              </Badge>
            )}

            {selectedRequest?.dueDate && (
              <Badge variant="outline" className="rounded-full text-xs text-amber-700 border-amber-200 bg-amber-50">
                Due {format(new Date(selectedRequest.dueDate), "MMM d, yyyy")}
              </Badge>
            )}

            {selectedRequest?.portalStatus && (
              <Badge variant="outline" className="rounded-full text-xs text-emerald-700 border-emerald-200 bg-emerald-50">
                {selectedRequest.portalStatus}
              </Badge>
            )}
          </div>

          {selectedRequest && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-medium">Request ID: {selectedRequest.id}</span>
                {dueDateObj && (
                  <span>
                    Due {format(dueDateObj, "MMM d, yyyy")}
                    {daysUntilDue !== null && (
                      <span className="ml-1 text-blue-700">
                        ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} day(s) overdue` : `${daysUntilDue} day(s) remaining`})
                      </span>
                    )}
                  </span>
                )}
                {selectedRequest.portalStatus && <span>Status: {selectedRequest.portalStatus}</span>}
              </div>
            </div>
          )}

          {selectedMandatoryAttachments.length > 0 && (
            <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">Mandatory Attachments</h4>
                <Badge className={cn(
                  "text-xs",
                  missingMandatoryAttachments.length === 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                )}>
                  {selectedMandatoryAttachments.length - missingMandatoryAttachments.length}/{selectedMandatoryAttachments.length} attached
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedMandatoryAttachments.map((att) => {
                  const file = mandatoryFiles[att.name]
                  const inputId = `mandatory-file-${att.name.replace(/\s+/g, "-").toLowerCase()}`
                  return (
                    <div key={att.name} className="rounded-lg border border-border bg-background px-3 py-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{att.name}</p>
                        <Badge variant="outline" className="text-[10px] uppercase">Required</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Allowed: {(att.formats || []).join(", ") || "Any"}
                      </p>
                      <input
                        id={inputId}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleMandatoryFileChange(att.name, e.target.files?.[0] || null)}
                        disabled={isLocked}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => document.getElementById(inputId)?.click()}
                          disabled={isLocked}
                        >
                          {file ? "Replace File" : "Upload File"}
                        </Button>
                        {file && (
                          <span className="text-xs text-emerald-700 truncate">{file.name}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tabs + content ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-0">
          {/* Locked notice */}
          {isLocked && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-3 text-sm text-blue-700">
              <Lock className="h-4 w-4 shrink-0" />
              This report has been submitted and is now read-only.
            </div>
          )}

          {/* Tab bar — matching accounting module style */}
          <div className="flex items-center overflow-x-auto border-b border-border">
            <div className="flex space-x-1 min-w-max">
              {TABS.map(tab => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                      active
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 px-0 space-y-4">
          {activeTab === "recent" && (
            <div className="px-6">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-800">Recent Submitted Statements</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading recent submissions...</p>
                  ) : recentReports.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No financial statements submitted yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {recentReports.map((report) => (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => {
                            setSelectedReport(report)
                            setDrawerOpen(true)
                          }}
                          className="w-full text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/40 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{report.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.reportType.replaceAll("_", " ")} • {report.periodStart?.slice(0, 10)} to {report.periodEnd?.slice(0, 10)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "w-fit",
                                report.status === "ACCEPTED" || report.status === "REVIEWED"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : report.status === "SUBMITTED" || report.status === "PENDING"
                                  ? "bg-blue-100 text-blue-700"
                                  : report.status === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              )}
                            >
                              {report.status}
                            </Badge>
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "income" && (
            <IncomeStatementTab
              data={formData.incomeStatement}
              onChange={updateIncome}
              readOnly={isLocked}
              years={incomeYears}
            />
          )}
          {activeTab === "balance" && (
            <BalanceSheetTab
              data={formData.balanceSheet}
              incomeStatement={formData.incomeStatement}
              onChange={updateBalance}
              readOnly={isLocked}
              years={bsYears}
            />
          )}
          {activeTab === "cashflow" && (
            <CashFlowTab
              data={formData.cashFlow}
              onChange={updateCashFlow}
              readOnly={isLocked}
              years={bsYears}
            />
          )}
          {activeTab === "kpis" && (
            <NonFinancialKPIsTab
              data={formData.nonFinancialKPIs}
              onChange={updateKPIs}
              readOnly={isLocked}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Submit dialog ────────────────────────────────────────── */}
      <SubmitDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onConfirm={handleSubmitConfirm}
        submitting={submitting}
      />

      <ReportDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        report={selectedReport}
      />
    </div>
  )
}
