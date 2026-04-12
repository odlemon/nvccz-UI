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

  // Derive banks from existing instruments
  const banks = (() => {
    const seen = new Map<string, { id: string; name: string; accountNumber: string }>()
    instruments.forEach((inst) => {
      if (inst.settlementBank && !seen.has(inst.settlementBank.id)) {
        seen.set(inst.settlementBank.id, inst.settlementBank)
      }
    })
    return Array.from(seen.values())
  })()

  // Also derive from cashbook banks if available
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
    if (!form.name.trim()) newErrors.name = "Instrument name is required"
    if (!form.broker.trim()) newErrors.broker = "Broker is required"
    if (!form.principal || parseFloat(form.principal) <= 0) newErrors.principal = "Valid principal amount required"
    if (!form.currencyId) newErrors.currencyId = "Currency is required"
    if (!startDate) newErrors.startDate = "Start date is required"
    if (!maturityDate) newErrors.maturityDate = "Maturity date is required"
    if (startDate && maturityDate && maturityDate <= startDate) {
      newErrors.maturityDate = "Maturity must be after start date"
    }
    if (!form.apy) newErrors.apy = "APY is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.settlementBankId) newErrors.settlementBankId = "Settlement account is required"
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
        apy: parseFloat(form.apy),
      }

      await createInstrument(body)
      toast.success("Investment instrument created successfully")
      onCreated()
    } catch (e: any) {
      toast.error("Failed to create instrument", { description: extractErrorMessage(e) })
    } finally {
      setIsSubmitting(false)
    }
  }

  // GL account label: "accountNo — accountName"
  const glAccountLabel = (a: ChartOfAccount) => `${a.accountNo} — ${a.accountName}`

  const glSelect = (
    label: string,
    fieldKey: keyof FormData,
    required: boolean = true
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}{required ? " *" : ""}</Label>
      <Select value={form[fieldKey]} onValueChange={(v) => updateField(fieldKey, v as any)}>
        <SelectTrigger className="rounded-full h-10 text-sm border-gray-300">
          <SelectValue placeholder="Select GL account" />
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-[200px]">
          {chartOfAccounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>{glAccountLabel(a)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors[fieldKey] && <p className="text-xs text-red-500">{errors[fieldKey]}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {step === 1 ? "New Investment Instrument" : "GL Account Mappings"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 1
              ? "Enter the investment details, interest parameters, and timeline"
              : "Map the instrument to the correct general ledger accounts"
            }
          </DialogDescription>
          <div className="flex items-center gap-2 mt-3">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-[#4f77ff]" : "bg-gray-200"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-[#4f77ff]" : "bg-gray-200"}`} />
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Instrument Name *</Label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. ZIG Money Market Fund" className="rounded-full h-10 text-sm border-gray-300" />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category *</Label>
                <Select value={form.category} onValueChange={(v) => updateField("category", v as InvestmentCategory)}>
                  <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Money market">Money Market</SelectItem>
                    <SelectItem value="T-Bill">Treasury Bill</SelectItem>
                    <SelectItem value="Commercial Paper">Commercial Paper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Broker / Financial Institution *</Label>
                <Input value={form.broker} onChange={(e) => updateField("broker", e.target.value)} placeholder="e.g. CBZ Bank" className="rounded-full h-10 text-sm border-gray-300" />
                {errors.broker && <p className="text-xs text-red-500">{errors.broker}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Principal Amount *</Label>
                <Input type="number" value={form.principal} onChange={(e) => updateField("principal", e.target.value)} placeholder="e.g. 100000" className="rounded-full h-10 text-sm border-gray-300" />
                {errors.principal && <p className="text-xs text-red-500">{errors.principal}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Currency *</Label>
                <Select value={form.currencyId} onValueChange={(v) => updateField("currencyId", v)}>
                  <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {currencies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currencyId && <p className="text-xs text-red-500">{errors.currencyId}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Functional Currency (if multi-currency)</Label>
                <Select value={form.functionalCurrencyId} onValueChange={(v) => updateField("functionalCurrencyId", v === "none" ? "" : v)}>
                  <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue placeholder="Same as instrument" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Same as instrument</SelectItem>
                    {currencies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Annual Percentage Yield (APY) *</Label>
                <Input type="number" step="0.001" value={form.apy} onChange={(e) => updateField("apy", e.target.value)} placeholder="e.g. 0.05 for 5%" className="rounded-full h-10 text-sm border-gray-300" />
                {errors.apy && <p className="text-xs text-red-500">{errors.apy}</p>}
                <p className="text-[10px] text-muted-foreground">Enter as decimal (0.05 = 5%). Negative values indicate capital erosion.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Compounding Method *</Label>
                <Select value={form.compoundingMethod} onValueChange={(v) => updateField("compoundingMethod", v as CompoundingMethod)}>
                  <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="SIMPLE">Simple Interest</SelectItem>
                    <SelectItem value="COMPOUND_DAILY">Compound Daily</SelectItem>
                    <SelectItem value="COMPOUND_MONTHLY">Compound Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Day Count Convention *</Label>
                <Select value={form.dayCountConvention} onValueChange={(v) => updateField("dayCountConvention", v as DayCountConvention)}>
                  <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ACTUAL_365">Actual/365</SelectItem>
                    <SelectItem value="ACTUAL_360">Actual/360</SelectItem>
                    <SelectItem value="THIRTY_360">30/360</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Start Date *</Label>
                <DatePicker value={startDate} onChange={(d) => { setStartDate(d); setErrors((p) => ({ ...p, startDate: undefined })) }} placeholder="Pick start date" allowFutureDates />
                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Maturity Date *</Label>
                <DatePicker value={maturityDate} onChange={(d) => { setMaturityDate(d); setErrors((p) => ({ ...p, maturityDate: undefined })) }} placeholder="Pick maturity date" allowFutureDates />
                {errors.maturityDate && <p className="text-xs text-red-500">{errors.maturityDate}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" className="rounded-full h-10 px-5 text-xs font-semibold" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button className="rounded-full h-10 px-5 text-xs font-semibold bg-[#4f77ff] hover:bg-[#4f77ff]/90" onClick={handleNext}>Next: GL Mappings</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Settlement Cash Account *</Label>
              <Select value={form.settlementBankId} onValueChange={(v) => updateField("settlementBankId", v)}>
                <SelectTrigger className="rounded-full h-10 text-sm border-gray-300"><SelectValue placeholder="Select settlement account" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {allBanks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}{b.accountNumber ? ` — ${b.accountNumber}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.settlementBankId && <p className="text-xs text-red-500">{errors.settlementBankId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {glSelect("Principal Asset Account", "principalGlAccountId")}
              {glSelect("Accrued Interest Receivable", "accruedInterestGlAccountId")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {glSelect("Interest Income Account", "interestIncomeGlAccountId")}
              {glSelect("Negative Yield Expense Account", "negativeYieldExpenseGlAccountId")}
            </div>

            {form.functionalCurrencyId && (
              <div className="grid grid-cols-2 gap-4">
                {glSelect("Unrealized FX Gain/Loss Account", "unrealizedFxGlAccountId", false)}
                {glSelect("Realized FX Gain/Loss Account", "realizedFxGlAccountId", false)}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" className="rounded-full h-10 px-5 text-xs font-semibold" onClick={() => setStep(1)}>Back</Button>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-full h-10 px-5 text-xs font-semibold" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button className="rounded-full h-10 px-5 text-xs font-semibold bg-[#4f77ff] hover:bg-[#4f77ff]/90" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Instrument"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
