"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Database,
  FileText,
  Flag,
  Info,
  LayoutGrid,
  Percent,
  Save,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { PmAvatar, PmButton, PmCard } from "@/components/performance-mock/primitives"
import { PM_PHOTOS } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, label: "Definition", sub: "Define KPI details" },
  { id: 2, label: "Calculation", sub: "Define how it’s calculated" },
  { id: 3, label: "Data source", sub: "Select data source" },
  { id: 4, label: "Targets & thresholds", sub: "Set targets & thresholds" },
  { id: 5, label: "Ownership", sub: "Assign owners" },
  { id: 6, label: "Review", sub: "Review & confirm" },
] as const

const categories = ["Financial", "Customer", "Internal Process", "Learning & Growth"]
const types = [
  { value: "Percentage", label: "% Percentage" },
  { value: "Currency", label: "$ Currency" },
  { value: "Number", label: "# Number" },
  { value: "Ratio", label: "Ratio" },
  { value: "Days", label: "Days" },
]
const frequencies = ["Weekly", "Monthly", "Quarterly", "Annually"]
const units = ["%", "$", "#", "days", "ratio"]
const directions = ["Higher is better", "Lower is better"]
const aggregations = ["Period end", "Average", "Sum"]
const perspectives = ["Financial", "Customer", "Internal Process", "Learning & Growth"]
const linkedObjectives = [
  "Drive sustainable revenue growth",
  "Deliver world-class customer experience",
  "Build high-performing, engaged teams",
]
const dataSources = ["Finance ERP", "CRM", "Manual entry", "Data warehouse"]
const owners = ["Rumbidzai Chaza", "Tendai Nyathi", "Farai Muchengezi", "Nyasha Dube"]

const inputClass =
  "w-full h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] text-[#0F172A] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE]"

export function CreateKpiWizardMockScreen() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [name, setName] = useState("Revenue Growth Rate")
  const [code, setCode] = useState("FIN-REV-001")
  const [description, setDescription] = useState(
    "Measures the percentage increase in recurring revenue compared to the same period in the previous year."
  )
  const [category, setCategory] = useState("Financial")
  const [type, setType] = useState("Percentage")
  const [frequency, setFrequency] = useState("Monthly")
  const [unit, setUnit] = useState("%")
  const [direction, setDirection] = useState("Higher is better")
  const [aggregation, setAggregation] = useState("Period end")
  const [scope, setScope] = useState<"Organisation" | "Departments">("Organisation")
  const [perspective, setPerspective] = useState("Financial")
  const [objective, setObjective] = useState(linkedObjectives[0])
  const [tags, setTags] = useState(["Revenue", "Growth", "Recurring"])
  const [tagDraft, setTagDraft] = useState("")
  const [addingTag, setAddingTag] = useState(false)
  const [plainLanguage, setPlainLanguage] = useState(
    "Shows how much our recurring revenue has grown as a percentage compared to last year."
  )
  const [whyItMatters, setWhyItMatters] = useState(
    "Indicates the effectiveness of our commercial strategy and customer value delivery."
  )
  const [decisionSupported, setDecisionSupported] = useState(
    "Helps leadership decide on investments, pricing, and resource allocation."
  )

  const [formula, setFormula] = useState("((Current period ARR − Prior period ARR) / Prior period ARR) × 100")
  const [numerator, setNumerator] = useState("Current period ARR − Prior period ARR")
  const [denominator, setDenominator] = useState("Prior period ARR")

  const [dataSource, setDataSource] = useState("Finance ERP")
  const [refreshCadence, setRefreshCadence] = useState("Daily")
  const [fieldMapping, setFieldMapping] = useState("arr.recurring_revenue")

  const [target, setTarget] = useState("10.0")
  const [stretch, setStretch] = useState("15.0")
  const [thresholdGreen, setThresholdGreen] = useState("10.0")
  const [thresholdAmber, setThresholdAmber] = useState("7.5")
  const [thresholdRed, setThresholdRed] = useState("5.0")

  const [owner, setOwner] = useState("Rumbidzai Chaza")
  const [contributor, setContributor] = useState("Nyasha Dube")
  const [approver, setApprover] = useState("Tendai Nyathi")
  const [steward, setSteward] = useState("Farai Muchengezi")

  const previewValue = "12.4%"
  const previewTarget = `${Number(target || 0).toFixed(1)}${unit === "%" ? "%" : ""}`

  const definitionComplete = useMemo(
    () => name.trim().length > 0 && code.trim().length > 0 && description.trim().length > 0,
    [name, code, description]
  )

  const stepValid = useMemo(() => {
    if (step === 1) return definitionComplete
    if (step === 2) return formula.trim().length > 0
    if (step === 3) return dataSource.trim().length > 0
    if (step === 4) return target.trim().length > 0
    if (step === 5) return owner.trim().length > 0
    return true
  }, [step, definitionComplete, formula, dataSource, target, owner])

  const addTag = () => {
    const t = tagDraft.trim()
    if (!t || tags.includes(t)) return
    setTags((prev) => [...prev, t])
    setTagDraft("")
    setAddingTag(false)
  }

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t))

  const goNext = () => {
    if (!stepValid) {
      toast.error("Please complete the required fields before continuing")
      return
    }
    if (step >= STEPS.length) {
      toast.success("KPI created", { description: `${code} · ${name}` })
      router.push("/performance/kpis")
      return
    }
    setStep((s) => s + 1)
  }

  const goBack = () => setStep((s) => Math.max(1, s - 1))

  const saveDraft = () => {
    toast.success("Draft saved", { description: `${code || "New KPI"} saved for later.` })
  }

  const guidanceSteps = STEPS.slice(0, 5)

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="text-xs text-[#94A3B8]">
            <button type="button" onClick={() => router.push("/performance/configuration")} className="hover:text-[#7C3AED] hover:underline">
              Configuration
            </button>
            <span className="mx-1.5">/</span>
            <button type="button" onClick={() => router.push("/performance/kpis")} className="hover:text-[#7C3AED] hover:underline">
              KPI Management
            </button>
            <span className="mx-1.5">/</span>
            <span className="text-[#334155] font-medium">Create KPI</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <PmButton variant="outline" onClick={saveDraft}>
              <Save className="h-3.5 w-3.5" /> Save draft
            </PmButton>
            <button
              type="button"
              onClick={() => router.push("/performance/kpis")}
              className="h-9 px-3 rounded-full text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <PmButton onClick={goNext}>
              {step >= STEPS.length ? "Create KPI" : "Continue"} <ChevronRight className="h-3.5 w-3.5" />
            </PmButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-start min-w-[780px] gap-1">
            {STEPS.map((s, i) => {
              const isActive = s.id === step
              const isDone = s.id < step
              return (
                <div key={s.id} className="flex items-start flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => (isDone || isActive ? setStep(s.id) : undefined)}
                    className="flex items-start gap-2 text-left shrink-0"
                  >
                    <span
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5",
                        isDone ? "bg-[#10B981] text-white" : isActive ? "bg-[#7C3AED] text-white shadow-sm" : "bg-[#F1F5F9] text-[#94A3B8]"
                      )}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.id}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span
                        className={cn(
                          "block text-[12px] font-bold whitespace-nowrap leading-tight",
                          isActive ? "text-[#7C3AED]" : isDone ? "text-[#0F172A]" : "text-[#94A3B8]"
                        )}
                      >
                        {s.label}
                      </span>
                      <span className="block text-[10px] text-[#94A3B8] whitespace-nowrap mt-0.5">{s.sub}</span>
                    </span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-[#CBD5E1] mx-2 mt-2 shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div className="min-w-0 space-y-4">
            {step === 1 && (
              <PmCard className="p-5">
                <div className="flex items-start gap-2.5 mb-4">
                  <span className="h-8 w-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0F172A]">KPI definition</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">Provide the core details that define this KPI.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="KPI name" required info>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Code" required info>
                    <input value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} />
                  </Field>
                </div>

                <div className="mt-3.5">
                  <Field label="Description" required info>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={cn(inputClass, "h-auto py-2.5 resize-none")}
                    />
                  </Field>
                </div>

                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Category" required info>
                    <IconSelect icon={Building2} value={category} onChange={setCategory} options={categories.map((c) => ({ value: c, label: c }))} />
                  </Field>
                  <Field label="Type" required info>
                    <IconSelect icon={Percent} value={type} onChange={setType} options={types} />
                  </Field>
                  <Field label="Frequency" required info>
                    <IconSelect icon={Calendar} value={frequency} onChange={setFrequency} options={frequencies.map((f) => ({ value: f, label: f }))} />
                  </Field>
                  <Field label="Reporting unit" required info>
                    <IconSelect icon={Percent} value={unit} onChange={setUnit} options={units.map((u) => ({ value: u, label: u }))} />
                  </Field>
                  <Field label="Direction" required info>
                    <IconSelect icon={TrendingUp} value={direction} onChange={setDirection} options={directions.map((d) => ({ value: d, label: d }))} />
                  </Field>
                  <Field label="Aggregation" required info>
                    <IconSelect icon={Activity} value={aggregation} onChange={setAggregation} options={aggregations.map((a) => ({ value: a, label: a }))} />
                  </Field>
                </div>

                <div className="mt-3.5">
                  <LabelRow label="Scope" required info />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(
                      [
                        { id: "Organisation" as const, icon: Building2, label: "Organisation", hint: "Company-wide KPI" },
                        { id: "Departments" as const, icon: LayoutGrid, label: "Departments (optional)", hint: "Limit to selected teams" },
                      ] as const
                    ).map((opt) => {
                      const active = scope === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setScope(opt.id)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all",
                            active ? "border-[#7C3AED] bg-[#F5F3FF] shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#C4B5FD]"
                          )}
                        >
                          <span
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              active ? "bg-white text-[#7C3AED]" : "bg-[#F8FAFC] text-[#94A3B8]"
                            )}
                          >
                            <opt.icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className={cn("block text-[12px] font-bold", active ? "text-[#7C3AED]" : "text-[#334155]")}>{opt.label}</span>
                            <span className="block text-[10px] text-[#94A3B8] mt-0.5">{opt.hint}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="BSC perspective" required info>
                    <IconSelect icon={Target} value={perspective} onChange={setPerspective} options={perspectives.map((p) => ({ value: p, label: p }))} />
                  </Field>
                  <Field label="Linked objective" info>
                    <IconSelect icon={Target} value={objective} onChange={setObjective} options={linkedObjectives.map((o) => ({ value: o, label: o }))} />
                  </Field>
                </div>

                <div className="mt-3.5">
                  <LabelRow label="Tags" info />
                  <div className="flex flex-wrap items-center gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] text-[11px] font-semibold text-[#6D28D9]"
                      >
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="text-[#A78BFA] hover:text-[#6D28D9]" aria-label={`Remove ${t}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {addingTag ? (
                      <input
                        autoFocus
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addTag()
                          if (e.key === "Escape") {
                            setAddingTag(false)
                            setTagDraft("")
                          }
                        }}
                        onBlur={() => {
                          if (tagDraft.trim()) addTag()
                          else setAddingTag(false)
                        }}
                        placeholder="Tag name"
                        className="h-8 w-28 rounded-lg border border-[#C4B5FD] px-2.5 text-[11px] outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingTag(true)}
                        className="h-8 px-2.5 rounded-lg border border-dashed border-[#C4B5FD] text-[11px] font-semibold text-[#7C3AED] hover:bg-[#F5F3FF]"
                      >
                        + Add tag
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
                    <h4 className="text-[13px] font-bold text-[#0F172A]">Business meaning</h4>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mb-3">Help others understand why this KPI matters</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <MeaningCard icon={FileText} label="Plain-language definition" value={plainLanguage} onChange={setPlainLanguage} />
                    <MeaningCard icon={Flag} label="Why it matters" value={whyItMatters} onChange={setWhyItMatters} />
                    <MeaningCard icon={Scale} label="Decision supported" value={decisionSupported} onChange={setDecisionSupported} />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="h-9 px-3.5 rounded-full border border-[#E2E8F0] bg-white text-[12px] font-semibold text-[#334155] inline-flex items-center gap-1.5 hover:bg-[#F8FAFC]"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#7C3AED]" /> Save &amp; continue later
                  </button>
                  <PmButton onClick={goNext} className="h-10 px-5">
                    Next: Calculation <ChevronRight className="h-3.5 w-3.5" />
                  </PmButton>
                </div>
              </PmCard>
            )}

            {step === 2 && (
              <StepCard title="Calculation" subtitle="Define how this KPI is calculated from source values." icon={Activity} onBack={goBack} onNext={goNext} nextLabel="Next: Data source">
                <Field label="Formula" required info>
                  <textarea value={formula} onChange={(e) => setFormula(e.target.value)} rows={3} className={cn(inputClass, "h-auto py-2.5 resize-none font-mono text-[12px]")} />
                </Field>
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Numerator" required>
                    <input value={numerator} onChange={(e) => setNumerator(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Denominator" required>
                    <input value={denominator} onChange={(e) => setDenominator(e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </StepCard>
            )}

            {step === 3 && (
              <StepCard title="Data source" subtitle="Select where actuals are pulled from and how often they refresh." icon={Database} onBack={goBack} onNext={goNext} nextLabel="Next: Targets & thresholds">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Primary source" required>
                    <IconSelect icon={Database} value={dataSource} onChange={setDataSource} options={dataSources.map((d) => ({ value: d, label: d }))} />
                  </Field>
                  <Field label="Refresh cadence" required>
                    <IconSelect icon={Clock} value={refreshCadence} onChange={setRefreshCadence} options={["Daily", "Weekly", "Monthly"].map((d) => ({ value: d, label: d }))} />
                  </Field>
                </div>
                <div className="mt-3.5">
                  <Field label="Field mapping" required info>
                    <input value={fieldMapping} onChange={(e) => setFieldMapping(e.target.value)} className={cn(inputClass, "font-mono text-[12px]")} />
                  </Field>
                </div>
              </StepCard>
            )}

            {step === 4 && (
              <StepCard title="Targets & thresholds" subtitle="Set the target, stretch goal, and traffic-light thresholds." icon={Target} onBack={goBack} onNext={goNext} nextLabel="Next: Ownership">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label={`Target (${unit})`} required>
                    <input value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={`Stretch (${unit})`}>
                    <input value={stretch} onChange={(e) => setStretch(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="On track ≥">
                    <input value={thresholdGreen} onChange={(e) => setThresholdGreen(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="At risk ≥">
                    <input value={thresholdAmber} onChange={(e) => setThresholdAmber(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Off track <">
                    <input value={thresholdRed} onChange={(e) => setThresholdRed(e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </StepCard>
            )}

            {step === 5 && (
              <StepCard title="Ownership" subtitle="Assign accountability for delivery, contribution and approval." icon={Users} onBack={goBack} onNext={goNext} nextLabel="Next: Review">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="KPI owner" required>
                    <IconSelect icon={Users} value={owner} onChange={setOwner} options={owners.map((o) => ({ value: o, label: o }))} />
                  </Field>
                  <Field label="Contributor">
                    <IconSelect icon={Users} value={contributor} onChange={setContributor} options={owners.map((o) => ({ value: o, label: o }))} />
                  </Field>
                  <Field label="Approver" required>
                    <IconSelect icon={Users} value={approver} onChange={setApprover} options={owners.map((o) => ({ value: o, label: o }))} />
                  </Field>
                  <Field label="Data steward" required>
                    <IconSelect icon={Users} value={steward} onChange={setSteward} options={owners.map((o) => ({ value: o, label: o }))} />
                  </Field>
                </div>
              </StepCard>
            )}

            {step === 6 && (
              <StepCard title="Review & confirm" subtitle="Confirm definition, calculation and ownership before creating." icon={Check} onBack={goBack} onNext={goNext} nextLabel="Create KPI">
                <div className="space-y-2.5 text-xs">
                  {[
                    ["Name", name],
                    ["Code", code],
                    ["Category", category],
                    ["Type", types.find((t) => t.value === type)?.label || type],
                    ["Frequency", frequency],
                    ["Formula", formula],
                    ["Data source", dataSource],
                    ["Target", `${target}${unit}`],
                    ["Owner", owner],
                    ["Approver", approver],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-3 rounded-lg border border-[#F1F5F9] px-3 py-2">
                      <span className="text-[#94A3B8] font-medium shrink-0">{k}</span>
                      <span className="font-semibold text-[#0F172A] text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </StepCard>
            )}
          </div>

          <div className="space-y-3 xl:sticky xl:top-24">
            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-0.5">Live preview</h3>
              <p className="text-[11px] text-[#94A3B8] mb-3">See how your KPI will appear</p>
              <div className="rounded-xl border border-[#E2E8F0] bg-gradient-to-br from-white to-[#F8FAFC] p-3.5 relative overflow-hidden">
                <span className="absolute top-3 right-3 text-[10px] font-semibold text-[#94A3B8]">{frequency}</span>
                <div className="flex items-start gap-2.5 mb-3">
                  <span className="h-9 w-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 pr-10">
                    <p className="text-[12px] font-bold text-[#0F172A] leading-snug truncate">{name || "Untitled KPI"}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{code || "—"}</p>
                  </div>
                </div>
                <p className="text-[28px] font-extrabold text-[#0F172A] tracking-tight leading-none">{previewValue}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-[#64748B]">
                    Target <span className="font-bold text-[#0F172A]">{previewTarget || `${target}%`}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10B981]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> On track
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                  <div className="h-full w-[82%] rounded-full bg-[#7C3AED]" />
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-0.5">Setup guidance</h3>
              <p className="text-[11px] text-[#94A3B8] mb-3">Follow the steps to complete your KPI</p>
              <div className="space-y-2.5">
                {guidanceSteps.map((s) => {
                  const isComplete = s.id < step || (s.id === 1 && definitionComplete && step === 1)
                  const isCurrent = s.id === step && !(s.id === 1 && definitionComplete)
                  return (
                    <div key={s.id} className="flex items-center justify-between text-xs gap-2">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                            isComplete
                              ? "bg-[#10B981] text-white"
                              : isCurrent
                                ? "bg-[#F5F3FF] text-[#7C3AED] ring-1 ring-[#DDD6FE]"
                                : "bg-[#F1F5F9] text-[#94A3B8]"
                          )}
                        >
                          {isComplete ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="text-[10px] font-bold">{s.id}</span>}
                        </span>
                        <span className={cn("truncate", isComplete ? "text-[#0F172A] font-semibold" : "text-[#64748B]")}>
                          {s.id}. {s.label}
                        </span>
                      </span>
                      {isComplete ? (
                        <span className="text-[10px] font-bold text-[#10B981] shrink-0">Complete</span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7C3AED] shrink-0">
                          <Clock className="h-3 w-3" /> In progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#94A3B8] shrink-0">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-0.5">Governance</h3>
              <p className="text-[11px] text-[#94A3B8] mb-3">Governance and accountability for this KPI</p>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Approval required</span>
                  <span className="font-bold text-[#7C3AED]">Yes</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Proposed approver</span>
                  <PmAvatar initials="TN" name={approver} src={PM_PHOTOS.tendai} size="sm" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Data steward</span>
                  <PmAvatar initials="FM" name={steward} src={PM_PHOTOS.farai} size="sm" />
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-0.5">Draft details</h3>
              <p className="text-[11px] text-[#94A3B8] mb-3">Information about this draft</p>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Created by</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-6 w-6 rounded-full bg-[#7C3AED] text-white text-[9px] font-bold flex items-center justify-center">AU</span>
                    <span className="font-semibold text-[#0F172A]">Adm. User</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Created on</span>
                  <span className="font-semibold text-[#0F172A]">13 Jul 2026</span>
                </div>
              </div>
            </PmCard>
          </div>
        </div>
      </div>
    </div>
  )
}

function LabelRow({ label, required, info }: { label: string; required?: boolean; info?: boolean }) {
  return (
    <div className="flex items-center gap-1 mb-1.5">
      <span className="text-[12px] font-semibold text-[#334155]">{label}</span>
      {required && <span className="text-[#EF4444] text-[12px]">*</span>}
      {info && (
        <button
          type="button"
          onClick={() => toast(label, { description: `Guidance for ${label.toLowerCase()}.` })}
          className="text-[#94A3B8] hover:text-[#7C3AED]"
          aria-label={`Info about ${label}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function Field({
  label,
  required,
  info,
  children,
}: {
  label: string
  required?: boolean
  info?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <LabelRow label={label} required={required} info={info} />
      {children}
    </label>
  )
}

function IconSelect({
  icon: Icon,
  value,
  onChange,
  options,
}: {
  icon: typeof Percent
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7C3AED] pointer-events-none">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, "pl-8 pr-8 appearance-none")}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8] rotate-90" />
    </div>
  )
}

function MeaningCard({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof FileText
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#FAFAFB] p-3">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#334155] mb-2">
        <span className="h-6 w-6 rounded-full bg-white border border-[#E2E8F0] text-[#7C3AED] flex items-center justify-center">
          <Icon className="h-3 w-3" />
        </span>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-2 text-[11px] text-[#475569] outline-none focus:border-[#7C3AED] resize-none leading-relaxed"
      />
    </div>
  )
}

function StepCard({
  title,
  subtitle,
  icon: Icon,
  children,
  onBack,
  onNext,
  nextLabel,
}: {
  title: string
  subtitle: string
  icon: typeof Activity
  children: React.ReactNode
  onBack: () => void
  onNext: () => void
  nextLabel: string
}) {
  return (
    <PmCard className="p-5">
      <div className="flex items-start gap-2.5 mb-4">
        <span className="h-8 w-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-[#0F172A]">{title}</h3>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <PmButton variant="outline" onClick={onBack}>
          Back
        </PmButton>
        <PmButton onClick={onNext} className="h-10 px-5">
          {nextLabel} <ChevronRight className="h-3.5 w-3.5" />
        </PmButton>
      </div>
    </PmCard>
  )
}
