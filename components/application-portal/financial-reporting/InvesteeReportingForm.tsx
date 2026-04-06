"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format } from "date-fns"
import { Save, Send, Lock, CheckCircle, Clock, AlertCircle, CalendarIcon, Paperclip, FileUp, X } from "lucide-react"
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

const DRAFT_KEY = "investee_reporting_draft"

const TABS = [
  { id: "income",   label: "Income Statement" },
  { id: "balance",  label: "Statement of Financial Position" },
  { id: "cashflow", label: "Cash Flow Statement" },
  { id: "kpis",     label: "Non-Financial KPIs" },
] as const
type TabId = (typeof TABS)[number]["id"]

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

// ── Main form ────────────────────────────────────────────────────────────────

export function InvesteeReportingForm() {
  const [formData, setFormData]   = useState<ReportingFormData>(emptyForm)
  const [status, setStatus]       = useState<FormStatus>("DRAFT")
  const [activeTab, setActiveTab] = useState<TabId>("income")
  const [saving, setSaving]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)

  const isLocked = status === "SUBMITTED" || status === "REVIEWED"

  // Derived date objects for Popover/Calendar
  const startDateObj = formData.periodStart ? new Date(formData.periodStart + "T00:00:00") : undefined
  const endDateObj   = formData.periodEnd   ? new Date(formData.periodEnd   + "T00:00:00") : undefined

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

  const handleSubmitConfirm = async (file: File | null, notes: string) => {
    setSubmitting(true)
    try {
      // TODO: wire to actual API — attach file via FormData
      await new Promise(r => setTimeout(r, 900))
      setStatus("SUBMITTED")
      localStorage.removeItem(DRAFT_KEY)
      setSubmitOpen(false)
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
              <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving} className="rounded-full gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save Draft"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
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
          </div>
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

        <CardContent className="pt-6">
          {activeTab === "income" && (
            <IncomeStatementTab data={formData.incomeStatement} onChange={updateIncome} readOnly={isLocked} />
          )}
          {activeTab === "balance" && (
            <BalanceSheetTab data={formData.balanceSheet} onChange={updateBalance} readOnly={isLocked} />
          )}
          {activeTab === "cashflow" && (
            <CashFlowTab data={formData.cashFlow} onChange={updateCashFlow} readOnly={isLocked} />
          )}
          {activeTab === "kpis" && (
            <NonFinancialKPIsTab data={formData.nonFinancialKPIs} onChange={updateKPIs} readOnly={isLocked} />
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
    </div>
  )
}
