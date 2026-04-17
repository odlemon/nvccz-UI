"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store/store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"
import { format } from "date-fns"
import { createInstrument, extractErrorMessage } from "@/lib/api/short-term-investments-api"
import type {
  InvestmentCategory,
  CompoundingMethod,
  DayCountConvention,
  CreateInstrumentRequest,
} from "@/lib/api/short-term-investments-api"
import type { ChartOfAccount } from "@/lib/api/chart-of-accounts-api"
import {
  FileText,
  Landmark,
  Calendar as CalendarIcon,
  Percent,
  Wallet,
  BookOpen,
  Banknote,
} from "lucide-react"

interface CreateInstrumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

interface FormData {
  name: string
  category: InvestmentCategory
  broker: string
  principal: string
  currencyId: string
  functionalCurrencyId: string
  compoundingMethod: CompoundingMethod
  dayCountConvention: DayCountConvention
  settlementBankId: string
  principalGlAccountId: string
  accruedInterestGlAccountId: string
  interestIncomeGlAccountId: string
  negativeYieldExpenseGlAccountId: string
  unrealizedFxGlAccountId: string
  realizedFxGlAccountId: string
  apy: string
}

const initialForm: FormData = {
  name: "",
  category: "Money market",
  broker: "",
  principal: "",
  currencyId: "",
  functionalCurrencyId: "",
  compoundingMethod: "SIMPLE",
  dayCountConvention: "ACTUAL_365",
  settlementBankId: "",
  principalGlAccountId: "",
  accruedInterestGlAccountId: "",
  interestIncomeGlAccountId: "",
  negativeYieldExpenseGlAccountId: "",
  unrealizedFxGlAccountId: "",
  realizedFxGlAccountId: "",
  apy: "",
}

/**
 * Normalize APY user input:
 *   "5"    → 0.05  (treated as percent)
 *   "0.05" → 0.05  (treated as decimal)
 *   "-0.5" → -0.005 treated as percent? We take the rule: if |value| > 1, assume percent.
 * Matches the helper "Enter 5 for 5%, or 0.05 for 5%".
 */
function normalizeApy(raw: string): number {
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return NaN
  return Math.abs(n) > 1 ? n / 100 : n
}

export function CreateInstrumentModal({ open, onOpenChange, onCreated }: CreateInstrumentModalProps) {
  const [form, setForm] = useState<FormData>(initialForm)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [maturityDate, setMaturityDate] = useState<Date | undefined>(undefined)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "startDate" | "maturityDate", string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const accountingState = useSelector((state: RootState) => state.accounting)
  const currencies = accountingState?.currencies ?? []
  const chartOfAccounts: ChartOfAccount[] = accountingState?.chartOfAccounts ?? []
  const stiState = useSelector((state: RootState) => state.shortTermInvestments)
  const instruments = stiState?.instruments ?? []

  // Derive banks from existing instruments + cashbook banks
  const banks = (() => {
    const seen = new Map<string, { id: string; name: string; accountNumber: string }>()
    instruments.forEach((inst) => {
      if (inst.settlementBank && !seen.has(inst.settlementBank.id)) {
        seen.set(inst.settlementBank.id, inst.settlementBank)
      }
    })
    return Array.from(seen.values())
  })()

  const cashbookBanks = accountingState?.cashbookBanks ?? []
  const allBanks = (() => {
    const seen = new Map<string, { id: string; name: string; accountNumber: string }>()
    banks.forEach((b) => seen.set(b.id, b))
    cashbookBanks.forEach((b: any) => {
      if (!seen.has(b.id)) {
        seen.set(b.id, { id: b.id, name: b.name, accountNumber: b.accountNumber || "" })
      }
    })
    return Array.from(seen.values())
  })()

  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setStartDate(undefined)
      setMaturityDate(undefined)
      setErrors({})
      setStep(1)
    }
  }, [open])

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = "Investment name is required"
    if (!form.broker.trim()) newErrors.broker = "Provide who holds or sold this investment"
    if (!form.principal || parseFloat(form.principal) <= 0) newErrors.principal = "Amount invested must be greater than 0"
    if (!form.currencyId) newErrors.currencyId = "Investment currency is required"
    if (!startDate) newErrors.startDate = "Investment start date is required"
    if (!maturityDate) newErrors.maturityDate = "End / maturity date is required"
    if (startDate && maturityDate && maturityDate <= startDate) {
      newErrors.maturityDate = "Maturity must be after the start date"
    }
    const apy = normalizeApy(form.apy)
    if (!form.apy || !Number.isFinite(apy)) newErrors.apy = "Expected yearly return (APY) is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.settlementBankId) newErrors.settlementBankId = "Select the bank / cash account"
    if (!form.principalGlAccountId) newErrors.principalGlAccountId = "Required"
    if (!form.accruedInterestGlAccountId) newErrors.accruedInterestGlAccountId = "Required"
    if (!form.interestIncomeGlAccountId) newErrors.interestIncomeGlAccountId = "Required"
    if (!form.negativeYieldExpenseGlAccountId) newErrors.negativeYieldExpenseGlAccountId = "Required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    setIsSubmitting(true)
    try {
      const body: CreateInstrumentRequest = {
        name: form.name.trim(),
        category: form.category,
        broker: form.broker.trim(),
        principal: parseFloat(form.principal),
        currencyId: form.currencyId,
        ...(form.functionalCurrencyId && { functionalCurrencyId: form.functionalCurrencyId }),
        compoundingMethod: form.compoundingMethod,
        dayCountConvention: form.dayCountConvention,
        settlementBankId: form.settlementBankId,
        principalGlAccountId: form.principalGlAccountId,
        accruedInterestGlAccountId: form.accruedInterestGlAccountId,
        interestIncomeGlAccountId: form.interestIncomeGlAccountId,
        negativeYieldExpenseGlAccountId: form.negativeYieldExpenseGlAccountId,
        ...(form.unrealizedFxGlAccountId && { unrealizedFxGlAccountId: form.unrealizedFxGlAccountId }),
        ...(form.realizedFxGlAccountId && { realizedFxGlAccountId: form.realizedFxGlAccountId }),
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
        maturityDate: maturityDate ? format(maturityDate, "yyyy-MM-dd") : "",
        apy: normalizeApy(form.apy),
      }

      await createInstrument(body)
      toast.success("Investment created successfully")
      onCreated()
    } catch (e: any) {
      toast.error("Failed to create investment", { description: extractErrorMessage(e) })
    } finally {
      setIsSubmitting(false)
    }
  }

  const glAccountLabel = (a: ChartOfAccount) => `${a.accountNo} — ${a.accountName}`

  const glSelect = (
    label: string,
    helper: string,
    fieldKey: keyof FormData,
    required: boolean = true
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}{required ? " *" : " (optional)"}</Label>
      <Select value={form[fieldKey]} onValueChange={(v) => updateField(fieldKey, v as any)}>
        <SelectTrigger className="rounded-full h-10 text-sm border-gray-300">
          <SelectValue placeholder="Select GL account" />
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-[240px]">
          {chartOfAccounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>{glAccountLabel(a)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground">{helper}</p>
      {errors[fieldKey] && <p className="text-xs text-red-500">{errors[fieldKey]}</p>}
    </div>
  )

  // Preview of normalised APY for user feedback
  const apyPreview = (() => {
    const n = normalizeApy(form.apy)
    if (!Number.isFinite(n)) return null
    return `${(n * 100).toFixed(4)}% annual (${n < 0 ? "negative yield / capital erosion" : "positive yield"})`
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              {step === 1 ? (
                <FileText className="w-5 h-5 text-white" />
              ) : (
                <BookOpen className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {step === 1 ? "New Investment" : "Accounting Setup"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {step === 1
                  ? "Describe the investment: what it is, how much, and over what period."
                  : "Where to record this investment in the books — pick the cash and ledger accounts."}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-gray-200"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-gray-200"}`} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
            <span className={step === 1 ? "font-semibold text-indigo-600" : ""}>Step 1 · Details & timeline</span>
            <span className={step === 2 ? "font-semibold text-indigo-600" : ""}>Step 2 · Accounting setup</span>
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-5 mt-2">
            {/* Basic identification */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold">What is this investment?</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Investment name *</Label>
                  <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. CBZ 90-day Money Market" className="rounded-full h-10 text-sm border-gray-300" />
                  <p className="text-[10px] text-muted-foreground">A short name you&apos;ll recognise on reports.</p>
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Type of investment *</Label>
                  <Select value={form.category} onValueChange={(v) => updateField("category", v as InvestmentCategory)}>
                    <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Money market">Money market</SelectItem>
                      <SelectItem value="T-Bill">Treasury bill (T-Bill)</SelectItem>
                      <SelectItem value="Commercial Paper">Commercial paper</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Pick the kind of product.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Who holds or sold the investment *</Label>
                  <Input value={form.broker} onChange={(e) => updateField("broker", e.target.value)} placeholder="e.g. CBZ Bank" className="rounded-full h-10 text-sm border-gray-300" />
                  <p className="text-[10px] text-muted-foreground">Bank, fund manager, or broker name.</p>
                  {errors.broker && <p className="text-xs text-red-500">{errors.broker}</p>}
                </div>
              </div>
            </div>

            {/* Amount and currency */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">How much, and in what currency?</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Amount invested *</Label>
                  <Input type="number" value={form.principal} onChange={(e) => updateField("principal", e.target.value)} placeholder="e.g. 100000" className="rounded-full h-10 text-sm border-gray-300" />
                  <p className="text-[10px] text-muted-foreground">How much money is placed in this investment.</p>
                  {errors.principal && <p className="text-xs text-red-500">{errors.principal}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Investment currency *</Label>
                  <Select value={form.currencyId} onValueChange={(v) => updateField("currencyId", v)}>
                    <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {currencies.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">The currency this investment is denominated in.</p>
                  {errors.currencyId && <p className="text-xs text-red-500">{errors.currencyId}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Reporting currency (optional)</Label>
                  <Select value={form.functionalCurrencyId || "none"} onValueChange={(v) => updateField("functionalCurrencyId", v === "none" ? "" : v)}>
                    <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue placeholder="Same as investment" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Same as investment</SelectItem>
                      {currencies.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Only if you report results in a different currency.</p>
                </div>
              </div>
            </div>

            {/* Interest settings */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold">How does interest work?</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Expected yearly return (APY) *</Label>
                  <Input type="number" step="0.001" value={form.apy} onChange={(e) => updateField("apy", e.target.value)} placeholder="e.g. 5 or 0.05" className="rounded-full h-10 text-sm border-gray-300" />
                  <p className="text-[10px] text-muted-foreground">Enter <strong>5</strong> for 5%, or <strong>0.05</strong> for 5%. Negative values represent capital erosion.</p>
                  {apyPreview && <p className="text-[10px] text-indigo-600 font-medium">Interpreted as: {apyPreview}</p>}
                  {errors.apy && <p className="text-xs text-red-500">{errors.apy}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">How interest builds up *</Label>
                  <Select value={form.compoundingMethod} onValueChange={(v) => updateField("compoundingMethod", v as CompoundingMethod)}>
                    <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="SIMPLE">Simple — interest on principal only</SelectItem>
                      <SelectItem value="COMPOUND_DAILY">Compound daily — interest earns interest</SelectItem>
                      <SelectItem value="COMPOUND_MONTHLY">Compound monthly — interest earns interest</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Pick the option that matches the product.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Interest day-count rule *</Label>
                  <Select value={form.dayCountConvention} onValueChange={(v) => updateField("dayCountConvention", v as DayCountConvention)}>
                    <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ACTUAL_365">Actual / 365 (typical)</SelectItem>
                      <SelectItem value="ACTUAL_360">Actual / 360 (money market)</SelectItem>
                      <SelectItem value="THIRTY_360">30 / 360 (some T-Bills)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Technical rule for how days in a year are counted.</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-semibold">Over what period?</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Investment start date *</Label>
                  <DatePicker value={startDate} onChange={(d) => { setStartDate(d); setErrors((p) => ({ ...p, startDate: undefined })) }} placeholder="Pick start date" allowFutureDates />
                  <p className="text-[10px] text-muted-foreground">First day this investment is on the books.</p>
                  {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">End / maturity date *</Label>
                  <DatePicker value={maturityDate} onChange={(d) => { setMaturityDate(d); setErrors((p) => ({ ...p, maturityDate: undefined })) }} placeholder="Pick maturity date" allowFutureDates />
                  <p className="text-[10px] text-muted-foreground">When the investment matures (last day of the term).</p>
                  {errors.maturityDate && <p className="text-xs text-red-500">{errors.maturityDate}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" className="rounded-full h-10 px-5 text-xs font-semibold" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button className="rounded-full h-10 px-5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white" onClick={handleNext}>
                Next: Accounting setup →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 mt-2">
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold">Cash movements</h3>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Bank or cash account that receives principal &amp; pays out *</Label>
                <Select value={form.settlementBankId} onValueChange={(v) => updateField("settlementBankId", v)}>
                  <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue placeholder="Select bank / cash account" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {allBanks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}{b.accountNumber ? ` — ${b.accountNumber}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">The bank account used for this investment&apos;s cash movements.</p>
                {errors.settlementBankId && <p className="text-xs text-red-500">{errors.settlementBankId}</p>}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Balance sheet &amp; income statement</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {glSelect(
                  "Balance sheet account for the money invested",
                  "Where the face amount of the investment sits on the balance sheet until repaid.",
                  "principalGlAccountId"
                )}
                {glSelect(
                  "Interest earned but not yet received",
                  "Accrued interest you've earned but haven't been paid yet.",
                  "accruedInterestGlAccountId"
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {glSelect(
                  "Profit &amp; loss account for interest income",
                  "Where interest revenue is recognised in the income statement.",
                  "interestIncomeGlAccountId"
                )}
                {glSelect(
                  "Expense if the investment loses value or charges fees",
                  "Used when yield is negative or principal can be eroded.",
                  "negativeYieldExpenseGlAccountId"
                )}
              </div>
            </div>

            {form.functionalCurrencyId && (
              <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-semibold">FX accounts (reporting currency differs)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {glSelect(
                    "Unrealised foreign-exchange gains or losses",
                    "Paper FX movements before cash is taken.",
                    "unrealizedFxGlAccountId",
                    false
                  )}
                  {glSelect(
                    "Realised foreign-exchange gains or losses",
                    "FX when positions are closed or settled in cash.",
                    "realizedFxGlAccountId",
                    false
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" className="rounded-full h-10 px-5 text-xs font-semibold" onClick={() => setStep(1)}>← Back</Button>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-full h-10 px-5 text-xs font-semibold" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button className="rounded-full h-10 px-5 text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Investment"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
