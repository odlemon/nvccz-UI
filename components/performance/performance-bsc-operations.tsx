"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  createBscBudgetVarianceReport,
  createPerformanceContract,
  fetchAvailableDepartments,
  fetchBscBudgetVarianceReportsByGoal,
  fetchBscStatutorySubmissionsByGoal,
  submitBscFinancialOutcomeRoi,
} from "@/lib/store/slices/performanceSlice"
import { performanceBscApiService } from "@/lib/api/performance-bsc-api"
import { applicationsApi, type InvestmentUser } from "@/lib/api/applications-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Users as UsersIcon,
  FileText as FileTextIcon,
  Briefcase,
  Handshake,
  GraduationCap,
  Target,
  Activity,
  ClipboardCheck,
  Loader2,
  TrendingUp,
  Upload,
  BarChart3,
  ShieldCheck,
  Crown,
  User,
  Building2,
  Sparkles,
  ShoppingBag,
  BookOpen,
  Heart,
  ClipboardList,
  Calendar as CalendarIcon,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

type MainTab = "contracts" | "bsc-entry" | "workflow"

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

const GRADIENT_PRIMARY =
  "rounded-full gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
const GRADIENT_EMERALD =
  "rounded-full gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
const GRADIENT_AMBER =
  "rounded-full gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
const GRADIENT_BLUE =
  "rounded-full gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
const GRADIENT_PURPLE =
  "rounded-full gap-1.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
const GRADIENT_ROSE =
  "rounded-full gap-1.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white"

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
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${ACCENT_BG[accent]} flex items-center justify-center shrink-0`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">{children}</CardContent>
    </Card>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

export function PerformanceBscOperations() {
  const dispatch = useAppDispatch()
  const {
    bscOperationLoading,
    budgetVarianceReports,
    statutorySubmissions,
    availableDepartments,
    availableDepartmentsLoading,
  } = useAppSelector((s) => s.performance)

  const [activeTab, setActiveTab] = useState<MainTab>("contracts")
  const [period, setPeriod] = useState<PeriodFields>(DEFAULT_PERIOD)

  // User list for contracts + assignments
  const [users, setUsers] = useState<InvestmentUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Contracts
  const [contractYear, setContractYear] = useState(String(new Date().getFullYear()))
  const [contractDept, setContractDept] = useState("")
  const [contractUserId, setContractUserId] = useState("")

  // BSC entry forms
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
  const [prevAvgScore, setPrevAvgScore] = useState("")

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
  const [excludeStatuses, setExcludeStatuses] = useState("")

  const [budgetGoalId, setBudgetGoalId] = useState("")
  const [actualSpend, setActualSpend] = useState("")
  const [strategicAllocation, setStrategicAllocation] = useState("")
  const [criticalOverspendPercent, setCriticalOverspendPercent] = useState("")

  const [inclusionGoalId, setInclusionGoalId] = useState("")
  const [groupCountsJson, setGroupCountsJson] = useState('{"women":0,"youth":0}')

  const [glRevenueGoalId, setGlRevenueGoalId] = useState("")
  const [glNetProfitGoalId, setGlNetProfitGoalId] = useState("")

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

  // Workflow
  const [varianceGoalId, setVarianceGoalId] = useState("")
  const [varianceNarrative, setVarianceNarrative] = useState("")

  const [statGoalId, setStatGoalId] = useState("")
  const [statEvidenceUrl, setStatEvidenceUrl] = useState("")
  const [statFile, setStatFile] = useState<File | null>(null)

  const [signoffSubmissionId, setSignoffSubmissionId] = useState("")
  const [signoffNote, setSignoffNote] = useState("")

  const [trainingGoalId, setTrainingGoalId] = useState("")
  const [trainingIncrement, setTrainingIncrement] = useState("1")
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null)

  const numericYear = useMemo(() => {
    const parsed = Number.parseInt(contractYear, 10)
    return Number.isFinite(parsed) ? parsed : new Date().getFullYear()
  }, [contractYear])

  useEffect(() => {
    dispatch(fetchAvailableDepartments())
    void loadUsers()
  }, [dispatch])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await applicationsApi.getInvestmentUsers()
      setUsers(res.data || [])
    } catch (e: any) {
      toast.error("Failed to load users", { description: e?.message })
    } finally {
      setUsersLoading(false)
    }
  }

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

  const runCreateContract = async (type: "BOARD" | "CEO" | "DEPARTMENT" | "EMPLOYEE") => {
    await runWithLoading(`contract-${type}`, async () => {
      try {
      const payload: any = { periodYear: numericYear, periodLabel: String(numericYear) }
      if (type === "DEPARTMENT") {
        if (!contractDept) return toast.error("Select a department")
        payload.departmentName = contractDept
      }
      if (type === "EMPLOYEE") {
        if (!contractUserId) return toast.error("Select an employee")
        payload.subjectUserId = contractUserId
      }
      if (type === "CEO" && contractUserId) {
        payload.subjectUserId = contractUserId
      }

      await dispatch(createPerformanceContract({ type, payload })).unwrap()
      toast.success(`${type} contract created`)
      } catch (error: any) {
        if (String(error || "").toLowerCase().includes("duplicate") || String(error || "").includes("409")) {
          toast.info(`${type} contract already exists for ${numericYear}`)
        } else {
          toast.error(`Failed to create ${type} contract`, { description: String(error || "Unknown error") })
        }
      }
    })
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

  const runCreateVariance = async () => {
    if (!varianceGoalId || !varianceNarrative.trim()) {
      toast.error("Select a goal and enter a narrative")
      return
    }
    await dispatch(
      createBscBudgetVarianceReport({
        goalId: varianceGoalId,
        narrative: varianceNarrative,
        ...periodPayload(),
      })
    ).unwrap()
    await dispatch(fetchBscBudgetVarianceReportsByGoal(varianceGoalId)).unwrap()
  }

  const runCreateStatutorySubmission = async () => {
    if (!statGoalId) return toast.error("Select a goal")
    if (!statFile && !statEvidenceUrl.trim()) return toast.error("Attach an evidence file or URL")

    await performanceBscApiService.createStatutorySubmission({
      goalId: statGoalId,
      evidenceFile: statFile || undefined,
      evidenceDocumentUrl: statEvidenceUrl || undefined,
      ...periodPayload(),
    })
    await dispatch(fetchBscStatutorySubmissionsByGoal(statGoalId)).unwrap()
  }

  const runLoadWorkflow = async () => {
    if (!varianceGoalId && !statGoalId) {
      toast.error("Select a goal on either variance or statutory section first")
      return
    }
    if (varianceGoalId) await dispatch(fetchBscBudgetVarianceReportsByGoal(varianceGoalId)).unwrap()
    if (statGoalId) await dispatch(fetchBscStatutorySubmissionsByGoal(statGoalId)).unwrap()
    toast.success("Workflow history loaded")
  }

  return (
    <Card className="bg-white border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">BSC Operations Hub</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Balanced scorecard data entry, workflows, and performance contracts.
              </p>
            </div>
          </div>
          {bscOperationLoading && (
            <Badge variant="outline" className="gap-1.5 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Shared period controls */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-card-foreground">Reporting Period</span>
            <Badge variant="outline" className="rounded-full ml-auto">
              {period.frequency}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <FormField label="Frequency" required>
              <Select
                value={period.frequency}
                onValueChange={(v) => setPeriod((p) => ({ ...p, frequency: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Period Label" required>
              <Input
                className="rounded-full"
                value={period.periodLabel}
                onChange={(e) => setPeriod((p) => ({ ...p, periodLabel: e.target.value }))}
                placeholder="e.g. 2026-Q1"
              />
            </FormField>
            <FormField label="Period Start">
              <DatePicker
                value={period.periodStart}
                onChange={(d) => setPeriod((p) => ({ ...p, periodStart: d }))}
                placeholder="Pick start date"
                allowFutureDates
              />
            </FormField>
            <FormField label="Period End">
              <DatePicker
                value={period.periodEnd}
                onChange={(d) => setPeriod((p) => ({ ...p, periodEnd: d }))}
                placeholder="Pick end date"
                allowFutureDates
              />
            </FormField>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          <Button
            variant={activeTab === "contracts" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setActiveTab("contracts")}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Contracts
          </Button>
          <Button
            variant={activeTab === "bsc-entry" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setActiveTab("bsc-entry")}
          >
            <Target className="w-3.5 h-3.5" />
            BSC Entry
          </Button>
          <Button
            variant={activeTab === "workflow" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setActiveTab("workflow")}
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            Workflow
          </Button>
        </div>

        {/* Contracts tab */}
        {activeTab === "contracts" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-xs text-indigo-800 flex items-center justify-between gap-2 flex-wrap">
              <span>
                Need full contract management with reviewers, approvers, and signed PDFs?
                Use the dedicated <strong>Contracts</strong> page.
              </span>
              <a href="/performance/contracts" className="text-sm font-medium underline underline-offset-4">
                Open Contracts →
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField label="Contract Period Year" required>
                <Select value={contractYear} onValueChange={setContractYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i).map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Department">
                <Select
                  value={contractDept || "__none__"}
                  onValueChange={(v) => setContractDept(v === "__none__" ? "" : v)}
                  disabled={availableDepartmentsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not applicable</SelectItem>
                    {availableDepartments.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Employee / CEO User (optional)">
                <Select
                  value={contractUserId || "__none__"}
                  onValueChange={(v) => setContractUserId(v === "__none__" ? "" : v)}
                  disabled={usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Auto-resolve</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex flex-col">
                          <span>
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className={GRADIENT_PURPLE}
                onClick={() => void runCreateContract("BOARD")}
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("contract-BOARD") ? <Loader2 className="w-4 h-4 animate-spin" /> : <UsersIcon className="w-4 h-4" />}
                {isActionLoading("contract-BOARD") ? "Creating..." : "Create Board Contract"}
              </Button>
              <Button
                size="sm"
                className={GRADIENT_AMBER}
                onClick={() => void runCreateContract("CEO")}
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("contract-CEO") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                {isActionLoading("contract-CEO") ? "Creating..." : "Create CEO Contract"}
              </Button>
              <Button
                size="sm"
                className={GRADIENT_EMERALD}
                onClick={() => void runCreateContract("DEPARTMENT")}
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("contract-DEPARTMENT") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                {isActionLoading("contract-DEPARTMENT") ? "Creating..." : "Create Department Contract"}
              </Button>
              <Button
                size="sm"
                className={GRADIENT_BLUE}
                onClick={() => void runCreateContract("EMPLOYEE")}
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("contract-EMPLOYEE") ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                {isActionLoading("contract-EMPLOYEE") ? "Creating..." : "Create Employee Contract"}
              </Button>
            </div>
          </div>
        )}

        {/* BSC Entry tab */}
        {activeTab === "bsc-entry" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Financial Outcome ROI */}
            <SectionCard
              title="Financial Outcome — ROI"
              description="Record net profit vs capital invested for a financial goal."
              icon={DollarSign}
              accent="emerald"
            >
              <FormField label="ROI Goal" required>
                <GoalSelect value={roiGoalId} onChange={setRoiGoalId} placeholder="Select ROI goal" />
              </FormField>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Net Profit">
                  <Input
                    className="rounded-full"
                    value={netProfit}
                    onChange={(e) => setNetProfit(e.target.value)}
                    type="number"
                    placeholder="0"
                  />
                </FormField>
                <FormField label="Total Capital Invested">
                  <Input
                    className="rounded-full"
                    value={capitalInvested}
                    onChange={(e) => setCapitalInvested(e.target.value)}
                    type="number"
                    placeholder="0"
                  />
                </FormField>
                <FormField label="Currency">
                  <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />
                </FormField>
              </div>
              <Button
                size="sm"
                className={GRADIENT_EMERALD}
                onClick={() => void safeRun("roi-entry", "ROI entry", runSubmitRoi)}
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("roi-entry") ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                {isActionLoading("roi-entry") ? "Submitting..." : "Submit ROI"}
              </Button>
            </SectionCard>

            {/* Internal Process Funding Rate */}
            <SectionCard
              title="Internal Process — Funding Rate"
              description="Projects funded vs approved for the selected fund."
              icon={BarChart3}
              accent="blue"
            >
              <FormField label="Funding Goal" required>
                <GoalSelect value={fundingGoalId} onChange={setFundingGoalId} placeholder="Select funding goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Projects Funded">
                  <Input className="rounded-full" value={projectsFunded} onChange={(e) => setProjectsFunded(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Projects Approved">
                  <Input className="rounded-full" value={projectsApproved} onChange={(e) => setProjectsApproved(e.target.value)} type="number" placeholder="0" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Fund (optional)">
                  <FundSelect value={fundId} onChange={setFundId} allowEmpty placeholder="Any fund" />
                </FormField>
                <FormField label="Target %">
                  <Input className="rounded-full" value={targetPercent} onChange={(e) => setTargetPercent(e.target.value)} type="number" placeholder="e.g. 80" />
                </FormField>
              </div>
              <Button
                size="sm"
                className={GRADIENT_BLUE}
                onClick={() =>
                  void safeRun("funding-rate", "Funding rate", async () => {
                    await performanceBscApiService.recordInternalProcessFundingRate({
                      goalId: fundingGoalId,
                      projectsFunded: toNum(projectsFunded),
                      projectsApproved: toNum(projectsApproved),
                      fundId: fundId || undefined,
                      targetPercent: toNum(targetPercent),
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("funding-rate") ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                {isActionLoading("funding-rate") ? "Submitting..." : "Submit Funding Rate"}
              </Button>
            </SectionCard>

            {/* Stakeholder Survey */}
            <SectionCard
              title="Stakeholder Survey"
              description="Average score vs scale max; optional prior-period score."
              icon={UsersIcon}
              accent="purple"
            >
              <FormField label="Survey Goal" required>
                <GoalSelect value={surveyGoalId} onChange={setSurveyGoalId} placeholder="Select survey goal" />
              </FormField>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Average Score">
                  <Input className="rounded-full" value={avgScore} onChange={(e) => setAvgScore(e.target.value)} type="number" placeholder="e.g. 4.2" />
                </FormField>
                <FormField label="Scale Max">
                  <Input className="rounded-full" value={scoreTotal} onChange={(e) => setScoreTotal(e.target.value)} type="number" placeholder="e.g. 5" />
                </FormField>
                <FormField label="Previous Average">
                  <Input className="rounded-full" value={prevAvgScore} onChange={(e) => setPrevAvgScore(e.target.value)} type="number" placeholder="0" />
                </FormField>
              </div>
              <Button
                size="sm"
                className={GRADIENT_PURPLE}
                onClick={() =>
                  void safeRun("stakeholder-survey", "Stakeholder survey", async () => {
                    await performanceBscApiService.recordStakeholderSurvey({
                      goalId: surveyGoalId,
                      averageScore: toNum(avgScore),
                      scoreTotal: toNum(scoreTotal),
                      previousAverageScore: toNum(prevAvgScore),
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("stakeholder-survey") ? <Loader2 className="w-4 h-4 animate-spin" /> : <UsersIcon className="w-4 h-4" />}
                {isActionLoading("stakeholder-survey") ? "Submitting..." : "Submit Survey"}
              </Button>
            </SectionCard>

            {/* Partnerships (MoU) */}
            <SectionCard
              title="Partnerships Signed"
              description="Upload MoU evidence or link to the signed document."
              icon={Handshake}
              accent="indigo"
            >
              <FormField label="Partnership Goal" required>
                <GoalSelect value={partnershipGoalId} onChange={setPartnershipGoalId} placeholder="Select partnership goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Increment By">
                  <Input className="rounded-full" value={partnershipIncrement} onChange={(e) => setPartnershipIncrement(e.target.value)} type="number" placeholder="1" />
                </FormField>
                <FormField label="MoU URL (optional)">
                  <Input className="rounded-full" value={partnershipUrl} onChange={(e) => setPartnershipUrl(e.target.value)} placeholder="https://..." />
                </FormField>
              </div>
              <FormField label="MoU File (optional)">
                <Input type="file" onChange={(e) => setPartnershipFile(e.target.files?.[0] || null)} />
              </FormField>
              <Button
                size="sm"
                className={GRADIENT_PRIMARY}
                onClick={() =>
                  void safeRun("partnership-mou", "Partnership MoU", async () => {
                    await performanceBscApiService.recordPartnershipsSigned({
                      goalId: partnershipGoalId,
                      incrementBy: toNum(partnershipIncrement),
                      mouDocumentUrl: partnershipUrl || undefined,
                      mouFile: partnershipFile || undefined,
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("partnership-mou") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                {isActionLoading("partnership-mou") ? "Submitting..." : "Submit MoU"}
              </Button>
            </SectionCard>

            {/* Service Delivery - Customer Charter */}
            <SectionCard
              title="Service Delivery — Customer Charter"
              description="Charter availability + supporting documents."
              icon={ShieldCheck}
              accent="emerald"
            >
              <FormField label="Charter Goal" required>
                <GoalSelect value={charterGoalId} onChange={setCharterGoalId} placeholder="Select charter goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Add % Progress">
                  <Input className="rounded-full" value={charterAddPercent} onChange={(e) => setCharterAddPercent(e.target.value)} type="number" placeholder="e.g. 20" />
                </FormField>
                <FormField label="Charter in Local Languages">
                  <Select value={charterLanguages} onValueChange={setCharterLanguages}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label="Supporting URLs (comma-separated, optional)">
                <Input className="rounded-full" value={charterUrls} onChange={(e) => setCharterUrls(e.target.value)} placeholder="https://a,https://b" />
              </FormField>
              <FormField label="Supporting Files (up to 10)">
                <Input type="file" multiple onChange={(e) => setCharterFiles(Array.from(e.target.files || []))} />
              </FormField>
              <Button
                size="sm"
                className={GRADIENT_EMERALD}
                onClick={() =>
                  void safeRun("customer-charter", "Customer charter", async () => {
                    await performanceBscApiService.recordServiceDeliveryCustomerCharter({
                      goalId: charterGoalId,
                      addPercent: toNum(charterAddPercent),
                      charterAvailableLocalLanguages: charterLanguages === "true",
                      supportingDocumentUrls: charterUrls ? charterUrls.split(",").map((x) => x.trim()).filter(Boolean) : undefined,
                      supportingDocuments: charterFiles.length ? charterFiles : undefined,
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("customer-charter") ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isActionLoading("customer-charter") ? "Submitting..." : "Submit Customer Charter"}
              </Button>
            </SectionCard>

            {/* Jobs Created Aggregate */}
            <SectionCard
              title="Jobs Created Aggregate"
              description="Portfolio-wide full-time jobs; optional fund filter."
              icon={Briefcase}
              accent="blue"
            >
              <FormField label="Jobs Goal" required>
                <GoalSelect value={jobsGoalId} onChange={setJobsGoalId} placeholder="Select jobs goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Total Full-time Jobs">
                  <Input className="rounded-full" value={jobsCount} onChange={(e) => setJobsCount(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Fund (optional)">
                  <FundSelect value={jobsFundId} onChange={setJobsFundId} allowEmpty placeholder="Any fund" />
                </FormField>
              </div>
              <FormField label="Exclude Deal Statuses (comma-separated)">
                <Input className="rounded-full" value={excludeStatuses} onChange={(e) => setExcludeStatuses(e.target.value)} placeholder="e.g. REJECTED,BELOW_THRESHOLD" />
              </FormField>
              <Button
                size="sm"
                className={GRADIENT_BLUE}
                onClick={() =>
                  void safeRun("jobs-aggregate", "Jobs aggregate", async () => {
                    await performanceBscApiService.recordJobsCreatedAggregate({
                      goalId: jobsGoalId,
                      totalFullTimeJobs: toNum(jobsCount),
                      fundId: jobsFundId || undefined,
                      excludeStatuses: excludeStatuses ? excludeStatuses.split(",").map((x) => x.trim()).filter(Boolean) : undefined,
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("jobs-aggregate") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                {isActionLoading("jobs-aggregate") ? "Submitting..." : "Submit Jobs"}
              </Button>
            </SectionCard>

            {/* Resource Budget Alignment */}
            <SectionCard
              title="Resource Budget Alignment"
              description="Actual spend vs strategic allocation."
              icon={DollarSign}
              accent="amber"
            >
              <FormField label="Budget Goal" required>
                <GoalSelect value={budgetGoalId} onChange={setBudgetGoalId} placeholder="Select budget goal" />
              </FormField>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Actual Spend">
                  <Input className="rounded-full" value={actualSpend} onChange={(e) => setActualSpend(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Strategic Allocation">
                  <Input className="rounded-full" value={strategicAllocation} onChange={(e) => setStrategicAllocation(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Critical Overspend %">
                  <Input className="rounded-full" value={criticalOverspendPercent} onChange={(e) => setCriticalOverspendPercent(e.target.value)} type="number" placeholder="e.g. 10" />
                </FormField>
              </div>
              <FormField label="Currency">
                <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />
              </FormField>
              <Button
                size="sm"
                className={GRADIENT_AMBER}
                onClick={() =>
                  void safeRun("budget-alignment", "Budget alignment", async () => {
                    await performanceBscApiService.recordResourceBudgetAlignment({
                      goalId: budgetGoalId,
                      actualSpend: toNum(actualSpend),
                      strategicAllocation: toNum(strategicAllocation),
                      criticalOverspendPercent: toNum(criticalOverspendPercent),
                      currencyCode,
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("budget-alignment") ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                {isActionLoading("budget-alignment") ? "Submitting..." : "Submit Alignment"}
              </Button>
            </SectionCard>

            {/* Inclusion & Diversity */}
            <SectionCard
              title="Inclusion & Diversity"
              description="Counts per dimension (women, youth, disability, etc)."
              icon={Heart}
              accent="rose"
            >
              <FormField label="Diversity Goal" required>
                <GoalSelect value={inclusionGoalId} onChange={setInclusionGoalId} placeholder="Select diversity goal" />
              </FormField>
              <FormField label="Group Counts (JSON object)">
                <Textarea
                  value={groupCountsJson}
                  onChange={(e) => setGroupCountsJson(e.target.value)}
                  rows={3}
                  className="rounded-xl font-mono text-xs"
                  placeholder='{"women":10,"youth":8,"disability":2}'
                />
              </FormField>
              <Button
                size="sm"
                className={GRADIENT_ROSE}
                onClick={() =>
                  void safeRun("inclusion-diversity", "Inclusion diversity", async () => {
                    await performanceBscApiService.recordInclusionDiversityReporting({
                      goalId: inclusionGoalId,
                      groupCounts: JSON.parse(groupCountsJson || "{}"),
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("inclusion-diversity") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                {isActionLoading("inclusion-diversity") ? "Submitting..." : "Submit Inclusion"}
              </Button>
            </SectionCard>

            {/* Accounting Period from GL */}
            <SectionCard
              title="Accounting Period from GL"
              description="Pull GL totals into revenue / net-profit goals."
              icon={DollarSign}
              accent="indigo"
            >
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Revenue Goal">
                  <GoalSelect value={glRevenueGoalId} onChange={setGlRevenueGoalId} placeholder="Revenue goal" />
                </FormField>
                <FormField label="Net Profit Goal">
                  <GoalSelect value={glNetProfitGoalId} onChange={setGlNetProfitGoalId} placeholder="Net profit goal" />
                </FormField>
              </div>
              <FormField label="Currency">
                <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />
              </FormField>
              <Button
                size="sm"
                className={GRADIENT_PRIMARY}
                onClick={() =>
                  void safeRun("gl-period-push", "Accounting period GL push", async () => {
                    if (!period.periodStart || !period.periodEnd) {
                      throw new Error("Set period start and end dates above")
                    }
                    await performanceBscApiService.recordAccountingPeriodFromGl({
                      periodStart: format(period.periodStart, "yyyy-MM-dd"),
                      periodEnd: format(period.periodEnd, "yyyy-MM-dd"),
                      revenueGoalId: glRevenueGoalId || undefined,
                      netProfitGoalId: glNetProfitGoalId || undefined,
                      currencyCode,
                      frequency: period.frequency,
                      periodLabel: period.periodLabel,
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("gl-period-push") ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                {isActionLoading("gl-period-push") ? "Submitting..." : "Push GL Period"}
              </Button>
            </SectionCard>

            {/* Statutory Reports Output */}
            <SectionCard
              title="Statutory Reports Output"
              description="Record filings with evidence file or URL."
              icon={FileTextIcon}
              accent="amber"
            >
              <FormField label="Statutory Goal" required>
                <GoalSelect value={statOutputGoalId} onChange={setStatOutputGoalId} placeholder="Select statutory goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Increment By">
                  <Input className="rounded-full" value={statOutputIncrement} onChange={(e) => setStatOutputIncrement(e.target.value)} type="number" placeholder="1" />
                </FormField>
                <FormField label="Evidence URL (optional)">
                  <Input className="rounded-full" value={statOutputUrl} onChange={(e) => setStatOutputUrl(e.target.value)} placeholder="https://..." />
                </FormField>
              </div>
              <FormField label="Evidence File (optional)">
                <Input type="file" onChange={(e) => setStatOutputFile(e.target.files?.[0] || null)} />
              </FormField>
              <Button
                size="sm"
                className={GRADIENT_AMBER}
                onClick={() =>
                  void safeRun("statutory-output", "Statutory output", async () => {
                    await performanceBscApiService.recordStatutoryReportsOutput({
                      goalId: statOutputGoalId,
                      incrementBy: toNum(statOutputIncrement),
                      evidenceDocumentUrl: statOutputUrl || undefined,
                      evidenceFile: statOutputFile || undefined,
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("statutory-output") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isActionLoading("statutory-output") ? "Submitting..." : "Submit Statutory Output"}
              </Button>
            </SectionCard>

            {/* Governance Checklist */}
            <SectionCard
              title="Governance Checklist"
              description="Items met vs total governance requirements."
              icon={ClipboardList}
              accent="purple"
            >
              <FormField label="Governance Goal" required>
                <GoalSelect value={govGoalId} onChange={setGovGoalId} placeholder="Select governance goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Items Met">
                  <Input className="rounded-full" value={govItemsMet} onChange={(e) => setGovItemsMet(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Total Requirements">
                  <Input className="rounded-full" value={govTotalReq} onChange={(e) => setGovTotalReq(e.target.value)} type="number" placeholder="0" />
                </FormField>
              </div>
              <Button
                size="sm"
                className={GRADIENT_PURPLE}
                onClick={() =>
                  void safeRun("governance-checklist", "Governance checklist", async () => {
                    await performanceBscApiService.recordGovernanceChecklistScore({
                      goalId: govGoalId,
                      complianceItemsMet: toNum(govItemsMet),
                      totalGovernanceRequirements: toNum(govTotalReq),
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("governance-checklist") ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                {isActionLoading("governance-checklist") ? "Submitting..." : "Submit Governance"}
              </Button>
            </SectionCard>

            {/* Procurement Compliance */}
            <SectionCard
              title="Procurement Plan Compliance"
              description="Actual procurement vs annual planned value."
              icon={ShoppingBag}
              accent="emerald"
            >
              <FormField label="Procurement Goal" required>
                <GoalSelect value={procGoalId} onChange={setProcGoalId} placeholder="Select procurement goal" />
              </FormField>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Actual Procured">
                  <Input className="rounded-full" value={actualProcured} onChange={(e) => setActualProcured(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Annual Planned">
                  <Input className="rounded-full" value={annualPlanned} onChange={(e) => setAnnualPlanned(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Currency">
                  <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />
                </FormField>
              </div>
              <Button
                size="sm"
                className={GRADIENT_EMERALD}
                onClick={() =>
                  void safeRun("procurement-compliance", "Procurement compliance", async () => {
                    await performanceBscApiService.recordProcurementPlanCompliance({
                      goalId: procGoalId,
                      actualProcured: toNum(actualProcured),
                      annualPlanned: toNum(annualPlanned),
                      currencyCode,
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("procurement-compliance") ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                {isActionLoading("procurement-compliance") ? "Submitting..." : "Submit Procurement"}
              </Button>
            </SectionCard>

            {/* Ease of Doing Business */}
            <SectionCard
              title="Ease of Doing Business"
              description="Innovations completed vs annual target."
              icon={Sparkles}
              accent="indigo"
            >
              <FormField label="EoDB Goal" required>
                <GoalSelect value={easeGoalId} onChange={setEaseGoalId} placeholder="Select EoDB goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Innovations Completed">
                  <Input className="rounded-full" value={innovationsCompleted} onChange={(e) => setInnovationsCompleted(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Target Innovations">
                  <Input className="rounded-full" value={targetInnovations} onChange={(e) => setTargetInnovations(e.target.value)} type="number" placeholder="0" />
                </FormField>
              </div>
              <Button
                size="sm"
                className={GRADIENT_PRIMARY}
                onClick={() =>
                  void safeRun("ease-of-business", "Ease of doing business", async () => {
                    await performanceBscApiService.recordEaseOfDoingBusinessProgress({
                      goalId: easeGoalId,
                      innovationsCompleted: toNum(innovationsCompleted),
                      targetInnovations: toNum(targetInnovations),
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("ease-of-business") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isActionLoading("ease-of-business") ? "Submitting..." : "Submit EoDB"}
              </Button>
            </SectionCard>

            {/* Skills Development */}
            <SectionCard
              title="Skills Development"
              description="Certificates completed vs plan target."
              icon={GraduationCap}
              accent="blue"
            >
              <FormField label="Skills Goal" required>
                <GoalSelect value={skillsGoalId} onChange={setSkillsGoalId} placeholder="Select skills goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Completed">
                  <Input className="rounded-full" value={skillsCompleted} onChange={(e) => setSkillsCompleted(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Target">
                  <Input className="rounded-full" value={skillsTarget} onChange={(e) => setSkillsTarget(e.target.value)} type="number" placeholder="0" />
                </FormField>
              </div>
              <Button
                size="sm"
                className={GRADIENT_BLUE}
                onClick={() =>
                  void safeRun("skills-development", "Skills development", async () => {
                    await performanceBscApiService.recordSkillsDevelopmentProgress({
                      goalId: skillsGoalId,
                      completedCount: toNum(skillsCompleted),
                      targetCount: toNum(skillsTarget),
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("skills-development") ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                {isActionLoading("skills-development") ? "Submitting..." : "Submit Skills"}
              </Button>
            </SectionCard>

            {/* CSR Participation */}
            <SectionCard
              title="CSR Participation"
              description="Participants completed vs eligible."
              icon={BookOpen}
              accent="rose"
            >
              <FormField label="CSR Goal" required>
                <GoalSelect value={csrGoalId} onChange={setCsrGoalId} placeholder="Select CSR goal" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Participants Completed">
                  <Input className="rounded-full" value={csrCompleted} onChange={(e) => setCsrCompleted(e.target.value)} type="number" placeholder="0" />
                </FormField>
                <FormField label="Eligible Participants">
                  <Input className="rounded-full" value={csrEligible} onChange={(e) => setCsrEligible(e.target.value)} type="number" placeholder="0" />
                </FormField>
              </div>
              <Button
                size="sm"
                className={GRADIENT_ROSE}
                onClick={() =>
                  void safeRun("csr-participation", "CSR participation", async () => {
                    await performanceBscApiService.recordCsrParticipationRate({
                      goalId: csrGoalId,
                      participantsCompleted: toNum(csrCompleted),
                      participantsEligible: toNum(csrEligible),
                      ...periodPayload(),
                    })
                  })
                }
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("csr-participation") ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                {isActionLoading("csr-participation") ? "Submitting..." : "Submit CSR"}
              </Button>
            </SectionCard>
          </div>
        )}

        {/* Workflow tab */}
        {activeTab === "workflow" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard
                title="Budget Variance Report"
                description="Submit narrative on why actual spend differs from plan."
                icon={AlertTriangle}
                accent="amber"
              >
                <FormField label="Variance Goal" required>
                  <GoalSelect value={varianceGoalId} onChange={setVarianceGoalId} placeholder="Select variance goal" />
                </FormField>
                <FormField label="Narrative" required>
                  <Textarea
                    value={varianceNarrative}
                    onChange={(e) => setVarianceNarrative(e.target.value)}
                    placeholder="Explain why actual spend differs from plan..."
                    rows={4}
                    className="rounded-xl"
                  />
                </FormField>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className={GRADIENT_AMBER}
                    onClick={() => void safeRun("budget-variance-report", "Budget variance report", runCreateVariance)}
                    disabled={Boolean(actionLoadingKey)}
                  >
                    {isActionLoading("budget-variance-report") ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    {isActionLoading("budget-variance-report") ? "Submitting..." : "Create Variance Report"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5"
                    onClick={() =>
                      varianceGoalId &&
                      void runWithLoading("load-variance-history", async () => {
                        await dispatch(fetchBscBudgetVarianceReportsByGoal(varianceGoalId)).unwrap()
                      })
                    }
                    disabled={!varianceGoalId || Boolean(actionLoadingKey)}
                  >
                    {isActionLoading("load-variance-history") ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileTextIcon className="w-4 h-4" />}
                    {isActionLoading("load-variance-history") ? "Loading..." : "Load History"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Loaded records: <strong>{budgetVarianceReports.length}</strong>
                </p>
              </SectionCard>

              <SectionCard
                title="Statutory Submission"
                description="Evidence bundle for statutory compliance filings."
                icon={ShieldCheck}
                accent="purple"
              >
                <FormField label="Statutory Goal" required>
                  <GoalSelect value={statGoalId} onChange={setStatGoalId} placeholder="Select statutory goal" />
                </FormField>
                <FormField label="Evidence URL (optional)">
                  <Input className="rounded-full" value={statEvidenceUrl} onChange={(e) => setStatEvidenceUrl(e.target.value)} placeholder="https://..." />
                </FormField>
                <FormField label="Evidence File (optional)">
                  <Input type="file" onChange={(e) => setStatFile(e.target.files?.[0] || null)} />
                </FormField>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className={GRADIENT_PURPLE}
                    onClick={() => void safeRun("statutory-submission", "Statutory submission", runCreateStatutorySubmission)}
                    disabled={Boolean(actionLoadingKey)}
                  >
                    {isActionLoading("statutory-submission") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isActionLoading("statutory-submission") ? "Submitting..." : "Create Submission"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5"
                    onClick={() =>
                      statGoalId &&
                      void runWithLoading("load-statutory-history", async () => {
                        await dispatch(fetchBscStatutorySubmissionsByGoal(statGoalId)).unwrap()
                      })
                    }
                    disabled={!statGoalId || Boolean(actionLoadingKey)}
                  >
                    {isActionLoading("load-statutory-history") ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileTextIcon className="w-4 h-4" />}
                    {isActionLoading("load-statutory-history") ? "Loading..." : "Load History"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Loaded records: <strong>{statutorySubmissions.length}</strong>
                </p>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard
                title="Manager Sign-off"
                description="Approve a statutory submission by ID."
                icon={ClipboardCheck}
                accent="emerald"
              >
                <FormField label="Submission ID" required>
                  <Input
                    className="rounded-full"
                    value={signoffSubmissionId}
                    onChange={(e) => setSignoffSubmissionId(e.target.value)}
                    placeholder="Enter submission ID to sign off"
                  />
                </FormField>
                <FormField label="Sign-off Note (optional)">
                  <Textarea
                    value={signoffNote}
                    onChange={(e) => setSignoffNote(e.target.value)}
                    rows={3}
                    className="rounded-xl"
                    placeholder="Comments for the sign-off..."
                  />
                </FormField>
                <Button
                  size="sm"
                  className={GRADIENT_EMERALD}
                  onClick={() =>
                    void safeRun("manager-signoff", "Manager sign-off", async () => {
                      if (!signoffSubmissionId) throw new Error("Enter submission ID")
                      await performanceBscApiService.managerSignOffStatutorySubmission(signoffSubmissionId, {
                        note: signoffNote,
                      })
                    })
                  }
                  disabled={Boolean(actionLoadingKey)}
                >
                  {isActionLoading("manager-signoff") ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                  {isActionLoading("manager-signoff") ? "Submitting..." : "Submit Sign-off"}
                </Button>
              </SectionCard>

              <SectionCard
                title="Training Certificate Recorded"
                description="HR hook — increments skills counter."
                icon={GraduationCap}
                accent="blue"
              >
                <FormField label="Training Goal" required>
                  <GoalSelect value={trainingGoalId} onChange={setTrainingGoalId} placeholder="Select training goal" />
                </FormField>
                <FormField label="Increment (default 1)">
                  <Input className="rounded-full" value={trainingIncrement} onChange={(e) => setTrainingIncrement(e.target.value)} type="number" placeholder="1" />
                </FormField>
                <Button
                  size="sm"
                  className={GRADIENT_BLUE}
                  onClick={() =>
                    void safeRun("training-certificate", "Training certificate", async () => {
                      await performanceBscApiService.recordTrainingCertificate({
                        goalId: trainingGoalId,
                        incrementBy: toNum(trainingIncrement),
                        ...periodPayload(),
                      })
                    })
                  }
                  disabled={Boolean(actionLoadingKey)}
                >
                  {isActionLoading("training-certificate") ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                  {isActionLoading("training-certificate") ? "Submitting..." : "Record Certificate"}
                </Button>
              </SectionCard>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => void runWithLoading("load-workflow-history", runLoadWorkflow)}
                disabled={Boolean(actionLoadingKey)}
              >
                {isActionLoading("load-workflow-history") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                {isActionLoading("load-workflow-history") ? "Loading..." : "Load All Workflow History"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
