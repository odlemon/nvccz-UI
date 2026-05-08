"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchBscBudgetVarianceReportsByGoal,
  fetchBscStatutorySubmissionsByGoal,
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
import { Badge } from "@/components/ui/badge"
import { GoalSelect } from "./goal-select"
import {
  FileText as FileTextIcon,
  Activity,
  ClipboardCheck,
  Loader2,
  Upload,
  ShieldCheck,
  AlertTriangle,
  GraduationCap,
  Info,
  History,
  CheckCircle2,
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

// Shared className additions for the action buttons in this hub. Colour comes
// from the Button `variant` prop now (gradient-create / -update / -info / etc.)
// so these only carry layout / sizing concerns.
const ACTION_BTN_CLASS = "rounded-full gap-1.5"

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
    <Card className="border-border overflow-hidden shadow-none border-2 border-gray-100 rounded-2xl bg-white">
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
    <div className="flex items-start gap-2 rounded-xl bg-indigo-50/50 border border-indigo-100 p-3 text-[11px] leading-snug text-indigo-800">
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" />
      <span>{children}</span>
    </div>
  )
}

export function WorkflowTab() {
  const dispatch = useAppDispatch()
  const { budgetVarianceReports, statutorySubmissions } = useAppSelector((s) => s.performance)
  const [period, setPeriod] = useState<PeriodFields>(DEFAULT_PERIOD)
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null)

  // Forms state
  const [varianceGoalId, setVarianceGoalId] = useState("")
  const [varianceNarrative, setVarianceNarrative] = useState("")

  const [statGoalId, setStatGoalId] = useState("")
  const [statEvidenceUrl, setStatEvidenceUrl] = useState("")
  const [statFile, setStatFile] = useState<File | null>(null)

  const [signoffSubmissionId, setSignoffSubmissionId] = useState("")
  const [signoffNote, setSignoffNote] = useState("")

  const [trainingGoalId, setTrainingGoalId] = useState("")
  const [trainingIncrement, setTrainingIncrement] = useState("1")

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

  const runCreateVariance = async () => {
    if (!varianceGoalId || !varianceNarrative.trim()) {
      toast.error("Select a goal and enter a narrative")
      return
    }
    await dispatch(
      performanceBscApiService.createBudgetVarianceReport({
        goalId: varianceGoalId,
        narrative: varianceNarrative,
        ...periodPayload(),
      } as any)
    )
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
      toast.error("Select a goal first")
      return
    }
    if (varianceGoalId) await dispatch(fetchBscBudgetVarianceReportsByGoal(varianceGoalId)).unwrap()
    if (statGoalId) await dispatch(fetchBscStatutorySubmissionsByGoal(statGoalId)).unwrap()
    toast.success("Workflow history loaded")
  }

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity className="w-32 h-32" />
         </div>
         <div className="relative z-10 space-y-2">
            <h3 className="text-xl font-light tracking-tight">Performance Workflow Hub</h3>
            <p className="text-indigo-100/70 text-xs font-medium uppercase tracking-widest">Approve evidence, file narratives and track compliance</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Variance */}
        <SectionCard title="Budget Variance Narrative" description="Justify spend deviations" icon={AlertTriangle} accent="amber">
          <FormField label="Target Goal" required>
            <GoalSelect value={varianceGoalId} onChange={setVarianceGoalId} bscEntryKind="RESOURCE_BUDGET_ALIGNMENT" formulaType="BUDGET_VARIANCE" />
          </FormField>
          <FormField label="Narrative" required>
            <Textarea value={varianceNarrative} onChange={(e) => setVarianceNarrative(e.target.value)} placeholder="Explain why actual spend differs from plan..." rows={4} className="rounded-xl border-2" />
          </FormField>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="gradient-update" className={ACTION_BTN_CLASS} onClick={() => void safeRun("variance", "Variance report", runCreateVariance)} disabled={Boolean(actionLoadingKey)}>
              {isActionLoading("variance") ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Submit Narrative
            </Button>
            <Button size="sm" variant="outline" className="rounded-full h-9 border-2" onClick={() => varianceGoalId && dispatch(fetchBscBudgetVarianceReportsByGoal(varianceGoalId))} disabled={!varianceGoalId}>
               <History className="w-3.5 h-3.5 mr-2" /> History ({budgetVarianceReports.length})
            </Button>
          </div>
        </SectionCard>

        {/* Statutory Step 1 */}
        <SectionCard title="Compliance Filing" description="Step 1: Evidence Submission" icon={ShieldCheck} accent="purple">
          <FormField label="Statutory Goal" required>
            <GoalSelect value={statGoalId} onChange={setStatGoalId} bscEntryKind="STATUTORY_SUBMISSION" formulaType="STATUTORY_REPORTS" />
          </FormField>
          <FormField label="Evidence URL">
            <Input className="rounded-xl border-2" value={statEvidenceUrl} onChange={(e) => setStatEvidenceUrl(e.target.value)} placeholder="https://..." />
          </FormField>
          <FormField label="Attachment">
            <Input type="file" onChange={(e) => setStatFile(e.target.files?.[0] || null)} className="rounded-xl border-2 cursor-pointer" />
          </FormField>
          <Button size="sm" variant="gradient" className={ACTION_BTN_CLASS} onClick={() => void safeRun("stat", "Statutory submission", runCreateStatutorySubmission)} disabled={Boolean(actionLoadingKey)}>
             Submit Evidence
          </Button>
        </SectionCard>

        {/* Statutory Step 2: Sign-off */}
        <SectionCard title="Manager Sign-off" description="Step 2: Approval Workflow" icon={ClipboardCheck} accent="emerald">
          <FormField label="Select Submission" required>
            <Select value={signoffSubmissionId} onValueChange={setSignoffSubmissionId}>
              <SelectTrigger className="rounded-xl border-2">
                <SelectValue placeholder="Pick a submission..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                {statutorySubmissions.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.periodLabel || s.id} ({s.status})
                  </SelectItem>
                ))}
                {statutorySubmissions.length === 0 && <SelectItem value="none" disabled>No submissions loaded</SelectItem>}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Approval Note">
            <Textarea value={signoffNote} onChange={(e) => setSignoffNote(e.target.value)} rows={3} className="rounded-xl border-2" placeholder="Comments..." />
          </FormField>
          <Button
            size="sm"
            variant="gradient-create"
            className={ACTION_BTN_CLASS}
            onClick={() => void safeRun("signoff", "Manager sign-off", () => performanceBscApiService.managerSignOffStatutorySubmission(signoffSubmissionId, { note: signoffNote }))}
            disabled={!signoffSubmissionId || Boolean(actionLoadingKey)}
          >
            Approve Submission
          </Button>
        </SectionCard>

        {/* Training Certificate */}
        <SectionCard title="Training Recording" description="Log certificate completion" icon={GraduationCap} accent="blue">
          <FormField label="Training Goal" required>
            <GoalSelect value={trainingGoalId} onChange={setTrainingGoalId} bscEntryKind="TRAINING_CERTIFICATE" formulaType="TRAINING_CERTIFICATES" />
          </FormField>
          <FormField label="Increment Count">
            <Input type="number" className="rounded-xl border-2" value={trainingIncrement} onChange={(e) => setTrainingIncrement(e.target.value)} />
          </FormField>
          <Button
            size="sm"
            variant="gradient-info"
            className={ACTION_BTN_CLASS}
            onClick={() => void safeRun("training", "Training certificate", () => performanceBscApiService.recordTrainingCertificate({ goalId: trainingGoalId, incrementBy: toNum(trainingIncrement), ...periodPayload() }))}
            disabled={!trainingGoalId || Boolean(actionLoadingKey)}
          >
            Record Training
          </Button>
        </SectionCard>
      </div>

      <div className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 mt-4">
         <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-gray-400" />
            <p className="text-xs text-gray-500 font-medium">Load history to populate sign-off lists and track previous submissions.</p>
         </div>
         <Button variant="outline" size="sm" className="rounded-full h-9 border-2" onClick={() => void runLoadWorkflow()} disabled={Boolean(actionLoadingKey)}>
            {isActionLoading("load-workflow") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />} Load Goal History
         </Button>
      </div>
    </div>
  )
}
