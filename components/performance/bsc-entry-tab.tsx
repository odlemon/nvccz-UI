"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchAvailableDepartments,
  submitBscFinancialOutcomeRoi,
} from "@/lib/store/slices/performanceSlice"
import { performanceBscApiService } from "@/lib/api/performance-bsc-api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { GoalSelect } from "./goal-select"
import { CurrencySelect } from "./currency-select"
import { FundSelect } from "./fund-select"
import {
  DollarSign,
  Briefcase,
  Handshake,
  Target,
  Loader2,
  TrendingUp,
  Upload,
  BarChart3,
  Crown,
  Sparkles,
  ShoppingBag,
  BookOpen,
  Heart,
  Calendar as CalendarIcon,
  Info,
} from "lucide-react"
import { toast } from "sonner"

type PeriodFields = {
  periodLabel: string
  periodStart?: Date
  periodEnd?: Date
  frequency: string
}

const DEFAULT_PERIOD: PeriodFields = {
  periodLabel: `${new Date().getFullYear()}-Q1`,
  frequency: "QUARTERLY",
}

const toNum = (v: string) => Number(v || 0)

const GRADIENT_EMERALD = "rounded-full gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
const GRADIENT_AMBER = "rounded-full gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
const GRADIENT_BLUE = "rounded-full gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
const GRADIENT_PURPLE = "rounded-full gap-1.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
const GRADIENT_ROSE = "rounded-full gap-1.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white"

interface SectionCardProps {
  title: string
  description?: string
  icon: React.ElementType
  accent: "blue" | "emerald" | "amber" | "purple" | "rose" | "indigo"
  children: React.ReactNode
}

const ACCENT_BG: Record<SectionCardProps["accent"], string> = {
  blue: "from-blue-100 to-cyan-200 text-blue-600",
  emerald: "from-emerald-100 to-teal-200 text-emerald-600",
  amber: "from-amber-100 to-orange-200 text-amber-600",
  purple: "from-purple-100 to-pink-200 text-purple-600",
  rose: "from-rose-100 to-red-200 text-rose-600",
  indigo: "from-indigo-100 to-purple-200 text-indigo-600",
}

function SectionCard({ title, description, icon: Icon, accent, children }: SectionCardProps) {
  return (
    <Card className="border-border overflow-hidden shadow-none border-2 border-gray-100 rounded-2xl">
      <div className="p-5 border-b border-gray-50 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ACCENT_BG[accent]} flex items-center justify-center shrink-0 border border-white/20 shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          {description && <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5">{description}</p>}
        </div>
      </div>
      <CardContent className="p-5 space-y-4">{children}</CardContent>
    </Card>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

function KpiHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-blue-50/50 border border-blue-100 p-3 text-[11px] leading-snug text-blue-800">
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
      <span>{children}</span>
    </div>
  )
}

export function BscEntryTab() {
  const dispatch = useAppDispatch()
  const { bscOperationLoading } = useAppSelector((s) => s.performance)
  const [period, setPeriod] = useState<PeriodFields>(DEFAULT_PERIOD)
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null)

  // Forms state
  const [roiGoalId, setRoiGoalId] = useState("")
  const [netProfit, setNetProfit] = useState("")
  const [capitalInvested, setCapitalInvested] = useState("")
  const [currencyCode, setCurrencyCode] = useState("USD")

  const [fundingGoalId, setFundingGoalId] = useState("")
  const [projectsFunded, setProjectsFunded] = useState("")
  const [projectsApproved, setProjectsApproved] = useState("")
  const [fundId, setFundId] = useState("")
  const [targetPercent, setTargetPercent] = useState("")

  const [surveyGoalId, setSurveyGoalId] = useState("")
  const [avgScore, setAvgScore] = useState("")
  const [scoreTotal, setScoreTotal] = useState("5")

  const [partnershipGoalId, setPartnershipGoalId] = useState("")
  const [partnershipIncrement, setPartnershipIncrement] = useState("1")
  const [partnershipUrl, setPartnershipUrl] = useState("")
  const [partnershipFile, setPartnershipFile] = useState<File | null>(null)

  const [charterGoalId, setCharterGoalId] = useState("")
  const [charterAddPercent, setCharterAddPercent] = useState("")
  const [charterLanguages, setCharterLanguages] = useState("true")
  const [charterUrls, setCharterUrls] = useState("")
  const [charterFiles, setCharterFiles] = useState<File[]>([])

  const [jobsGoalId, setJobsGoalId] = useState("")
  const [jobsCount, setJobsCount] = useState("")
  const [jobsFundId, setJobsFundId] = useState("")

  const [budgetGoalId, setBudgetGoalId] = useState("")
  const [actualSpend, setActualSpend] = useState("")
  const [strategicAllocation, setStrategicAllocation] = useState("")

  const [inclusionGoalId, setInclusionGoalId] = useState("")
  const [groupCountsJson, setGroupCountsJson] = useState('{"women":0,"youth":0}')

  const [statOutputGoalId, setStatOutputGoalId] = useState("")
  const [statOutputIncrement, setStatOutputIncrement] = useState("1")
  const [statOutputUrl, setStatOutputUrl] = useState("")
  const [statOutputFile, setStatOutputFile] = useState<File | null>(null)

  const [govGoalId, setGovGoalId] = useState("")
  const [govItemsMet, setGovItemsMet] = useState("")
  const [govTotalReq, setGovTotalReq] = useState("")

  const [procGoalId, setProcGoalId] = useState("")
  const [actualProcured, setActualProcured] = useState("")
  const [annualPlanned, setAnnualPlanned] = useState("")

  const [easeGoalId, setEaseGoalId] = useState("")
  const [innovationsCompleted, setInnovationsCompleted] = useState("")
  const [targetInnovations, setTargetInnovations] = useState("")

  const [skillsGoalId, setSkillsGoalId] = useState("")
  const [skillsCompleted, setSkillsCompleted] = useState("")
  const [skillsTarget, setSkillsTarget] = useState("")

  const [csrGoalId, setCsrGoalId] = useState("")
  const [csrCompleted, setCsrCompleted] = useState("")
  const [csrEligible, setCsrEligible] = useState("")

  const periodPayload = () => ({
    frequency: period.frequency,
    periodLabel: period.periodLabel,
    periodStart: period.periodStart ? format(period.periodStart, "yyyy-MM-dd") : undefined,
    periodEnd: period.periodEnd ? format(period.periodEnd, "yyyy-MM-dd") : undefined,
  })

  const isActionLoading = (key: string) => actionLoadingKey === key

  const runWithLoading = async (key: string, fn: () => Promise<any>) => {
    if (actionLoadingKey) return
    setActionLoadingKey(key)
    try {
      return await fn()
    } finally {
      setActionLoadingKey(null)
    }
  }

  const safeRun = async (key: string, label: string, fn: () => Promise<any>) => {
    try {
      await runWithLoading(key, fn)
      toast.success(`${label} submitted successfully`)
    } catch (error: any) {
      toast.error(`Failed to submit ${label}`, { description: String(error || "Unknown error") })
    }
  }

  const runSubmitRoi = async () => {
    if (!roiGoalId) return toast.error("Select an ROI goal")
    await dispatch(
      submitBscFinancialOutcomeRoi({
        goalId: roiGoalId,
        netProfit: toNum(netProfit),
        totalCapitalInvested: toNum(capitalInvested),
        currencyCode,
        ...periodPayload(),
      })
    ).unwrap()
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
             <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Reporting Period</h3>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Select time window for data entry</p>
          </div>
          <Badge className="ml-auto bg-blue-50 text-blue-600 border-none px-3 py-1 text-[10px] font-bold">
            {period.frequency}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FormField label="Frequency" required>
            <Select value={period.frequency} onValueChange={(v) => setPeriod((p) => ({ ...p, frequency: v }))}>
              <SelectTrigger className="rounded-xl border-2 border-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="ANNUAL">Annual</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Period Label" required>
            <Input
              className="rounded-xl border-2 border-gray-100"
              value={period.periodLabel}
              onChange={(e) => setPeriod((p) => ({ ...p, periodLabel: e.target.value }))}
              placeholder="e.g. 2026-Q1"
            />
          </FormField>
          <FormField label="Period Start">
            <DatePicker value={period.periodStart} onChange={(d) => setPeriod((p) => ({ ...p, periodStart: d || undefined }))} />
          </FormField>
          <FormField label="Period End">
            <DatePicker value={period.periodEnd} onChange={(d) => setPeriod((p) => ({ ...p, periodEnd: d || undefined }))} />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial: ROI */}
        <SectionCard title="Financial Outcome: ROI" description="Strategic ROI calculation" icon={TrendingUp} accent="emerald">
          <FormField label="Goal" required>
            <GoalSelect value={roiGoalId} onChange={setRoiGoalId} placeholder="Select ROI goal" bscEntryKind="FINANCIAL_OUTCOME_ROI" formulaType="ROI" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Net Profit" required>
              <Input type="number" value={netProfit} onChange={(e) => setNetProfit(e.target.value)} />
            </FormField>
            <FormField label="Capital Invested" required>
              <Input type="number" value={capitalInvested} onChange={(e) => setCapitalInvested(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Currency">
            <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />
          </FormField>
          <Button size="sm" className={GRADIENT_EMERALD} onClick={() => void safeRun("roi", "ROI Data", runSubmitRoi)} disabled={Boolean(actionLoadingKey)}>
            {isActionLoading("roi") ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {isActionLoading("roi") ? "Submitting..." : "Submit ROI Data"}
          </Button>
        </SectionCard>

        {/* Financial: Funding */}
        <SectionCard title="Funding & Resources" description="Investment resource tracking" icon={DollarSign} accent="blue">
          <FormField label="Goal" required>
            <GoalSelect value={fundingGoalId} onChange={setFundingGoalId} placeholder="Select funding goal" bscEntryKind="FUNDING_AND_RESOURCES" formulaType="PERCENTAGE_GROWTH" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Projects Funded">
              <Input type="number" value={projectsFunded} onChange={(e) => setProjectsFunded(e.target.value)} />
            </FormField>
            <FormField label="Projects Approved">
              <Input type="number" value={projectsApproved} onChange={(e) => setProjectsApproved(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Resource Fund">
            <FundSelect value={fundId} onChange={setFundId} />
          </FormField>
          <Button
            size="sm"
            className={GRADIENT_BLUE}
            onClick={() => void safeRun("funding", "Funding data", async () => {
              await performanceBscApiService.submitBscFundingResources({
                goalId: fundingGoalId,
                numProjectsFunded: toNum(projectsFunded),
                numProjectsApproved: toNum(projectsApproved),
                fundId: fundId || undefined,
                targetGrowthPercentage: toNum(targetPercent),
                ...periodPayload(),
              })
            })}
            disabled={Boolean(actionLoadingKey)}
          >
            {isActionLoading("funding") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
            Record Funding
          </Button>
        </SectionCard>

        {/* Operations: Budget */}
        <SectionCard title="Operations: Budget Management" description="Budget allocation tracking" icon={BarChart3} accent="amber">
          <FormField label="Goal" required>
            <GoalSelect value={budgetGoalId} onChange={setBudgetGoalId} bscEntryKind="RESOURCE_BUDGET_ALIGNMENT" formulaType="BUDGET_VARIANCE" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Actual Spend" required>
              <Input type="number" value={actualSpend} onChange={(e) => setActualSpend(e.target.value)} />
            </FormField>
            <FormField label="Strategic Allocation">
              <Input type="number" value={strategicAllocation} onChange={(e) => setStrategicAllocation(e.target.value)} />
            </FormField>
          </div>
          <Button
            size="sm"
            className={GRADIENT_AMBER}
            onClick={() => void safeRun("budget", "Budget data", async () => {
              await performanceBscApiService.submitBscBudgetAlignment({
                goalId: budgetGoalId,
                actualSpend: toNum(actualSpend),
                strategicAllocation: toNum(strategicAllocation),
                ...periodPayload(),
              })
            })}
            disabled={Boolean(actionLoadingKey)}
          >
            Submit Budget Data
          </Button>
        </SectionCard>

        {/* Customer: Survey */}
        <SectionCard title="Customer: Satisfaction" description="Survey & feedback metrics" icon={Heart} accent="rose">
          <FormField label="Goal" required>
            <GoalSelect value={surveyGoalId} onChange={setSurveyGoalId} bscEntryKind="CUSTOMER_SATISFACTION_INDEX" formulaType="CSI" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Average Score" required>
              <Input type="number" value={avgScore} onChange={(e) => setAvgScore(e.target.value)} placeholder="4.2" />
            </FormField>
            <FormField label="Scale (max)" required>
              <Input type="number" value={scoreTotal} onChange={(e) => setScoreTotal(e.target.value)} placeholder="5" />
            </FormField>
          </div>
          <Button
            size="sm"
            className={GRADIENT_ROSE}
            onClick={() => void safeRun("survey", "Survey score", async () => {
              await performanceBscApiService.submitBscCustomerSatisfaction({
                goalId: surveyGoalId,
                averageScore: toNum(avgScore),
                totalPossibleScore: toNum(scoreTotal),
                ...periodPayload(),
              })
            })}
            disabled={Boolean(actionLoadingKey)}
          >
            Submit Satisfaction
          </Button>
        </SectionCard>
      </div>
      
      <div className="bg-blue-50/30 border-2 border-dashed border-blue-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
         <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-50 flex items-center justify-center mb-3">
            <Target className="w-6 h-6 text-blue-400" />
         </div>
         <h4 className="text-sm font-bold text-gray-900">Additional Operations</h4>
         <p className="text-xs text-gray-500 mt-1 max-w-sm">Use the specialized forms above to enter data for each BSC perspective. Pick a goal to unlock the respective submit buttons.</p>
      </div>
    </div>
  )
}
