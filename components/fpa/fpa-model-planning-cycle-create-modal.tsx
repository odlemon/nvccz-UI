"use client"

/**
 * Create modal for Model Planning cycles (distinct from PlanningBudgetCycle).
 * Fetches its own sources (models/versions/scenarios/planningTypes) and users.
 * On success calls onCreated(cycle) — the list navigates to the worksheet.
 */

import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  CalendarDays,
  Loader2,
  Plus,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  fpaApi,
  type FpaModelPlanningCycle,
  type FpaModelPlanningCycleCreateRequest,
  type FpaModelPlanningCycleSources,
  type FpaPlanningType,
} from "@/lib/api/fpa-api"
import { departmentApiService } from "@/lib/api/department-api"
import { usersApi, type AppUser } from "@/lib/api/users-api"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type OwnerDraft = {
  departmentId: string
  departmentName: string
  assigneeId: string
  assigneeName: string
  dueDate?: string
}

function userLabel(u: AppUser) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id
}

function userDeptId(u: AppUser): string | null {
  if (u.departmentId) return String(u.departmentId)
  if (u.department && typeof u.department === "object" && u.department.id) {
    return String(u.department.id)
  }
  return null
}

/** Match user to a dept by id, or by name when API only has a department string. */
function userMatchesDept(
  u: AppUser,
  dept: { id: string; name: string } | undefined,
): boolean {
  if (!dept) return false
  const id = userDeptId(u)
  if (id && id === dept.id) return true
  const nameHint =
    (typeof u.department === "string" && u.department) ||
    (u.department && typeof u.department === "object" && u.department.name) ||
    (u as AppUser & { userDepartment?: string }).userDepartment ||
    null
  if (nameHint && String(nameHint).toLowerCase() === dept.name.toLowerCase()) return true
  return false
}

function normalizeDepartments(raw: unknown): Array<{ id: string; name: string }> {
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] })?.data)
      ? (raw as { data: unknown[] }).data
      : Array.isArray((raw as { departments?: unknown[] })?.departments)
        ? (raw as { departments: unknown[] }).departments
        : []
  const out: Array<{ id: string; name: string }> = []
  for (const row of rows) {
    const r = row as { id?: string; departmentId?: string; name?: string; departmentName?: string }
    const id = String(r.id || r.departmentId || "")
    const name = String(r.name || r.departmentName || "")
    if (id && name) out.push({ id, name })
  }
  return out
}

const SELECT_TRIGGER =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172a] shadow-none justify-start text-left focus:ring-2 focus:ring-[#2563eb]/30 [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:text-left"
const FIELD =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a] bg-white"

function FieldSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`mt-1 h-9 w-full rounded-full bg-[#e2e8f0] ${className || ""}`} />
}

/** BE stores cut-over as month-start ISO (`YYYY-MM-01`); normalize date inputs. */
function toPeriodStart(date: string | null | undefined): string | null {
  if (!date) return null
  const m = date.trim().match(/^(\d{4})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-01` : date
}

/** BE may send `label` or `name` (same as FpaVersion.name). */
function versionOptionLabel(v: {
  id: string
  label?: string | null
  name?: string | null
  status?: string | null
  isPublished?: boolean | null
}) {
  const base = (v.label || v.name || "").trim()
  const suffix = v.isPublished ? " (published)" : v.status ? ` (${v.status})` : ""
  if (base) return `${base}${suffix}`
  if (v.status) return `${v.status}${v.isPublished ? " · published" : ""}`
  return `Version ${v.id.slice(-8)}`
}

export function FpaModelPlanningCycleCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (cycle: FpaModelPlanningCycle) => void
}) {
  const [sources, setSources] = useState<FpaModelPlanningCycleSources | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  /** Models / planning types — load first so the form can be used ASAP. */
  const [loadingCore, setLoadingCore] = useState(true)
  /** Users + departments for owner assignment. */
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [busy, setBusy] = useState(false)
  const [setupErrors, setSetupErrors] = useState<string[]>([])

  const [name, setName] = useState("")
  const [financialYear, setFinancialYear] = useState(String(new Date().getFullYear()))
  const [planningType, setPlanningType] = useState<FpaPlanningType>("ANNUAL_BUDGET")
  const [sourceModelId, setSourceModelId] = useState("")
  const [sourceModelVersionId, setSourceModelVersionId] = useState("")
  const [planningHorizon, setPlanningHorizon] = useState("12")
  const [baseScenarioId, setBaseScenarioId] = useState("")
  const [actualsCutoffPeriod, setActualsCutoffPeriod] = useState("")
  const [forecastStartPeriod, setForecastStartPeriod] = useState("")
  const [submissionDeadline, setSubmissionDeadline] = useState("")
  const [planningOwnerId, setPlanningOwnerId] = useState("")
  const [owners, setOwners] = useState<OwnerDraft[]>([])
  const [draftDeptId, setDraftDeptId] = useState("")
  const [draftAssigneeId, setDraftAssigneeId] = useState("")
  const [draftOwnerDue, setDraftOwnerDue] = useState("")

  useEffect(() => {
    let cancelled = false

    // 1) Core sources first (models, types) — unlocks most of the form.
    setLoadingCore(true)
    void fpaApi
      .listModelPlanningCycleSources()
      .then((srcRes) => {
        if (cancelled) return
        if (srcRes.success && srcRes.data) setSources(srcRes.data)
      })
      .catch((err) => {
        if (cancelled) return
        logFpaGap({
          category: "broken",
          path: "/v1/fpa/model-planning/cycles/sources",
          method: "GET",
          message: errorMessage(err),
          impact: "Failed to load planning cycle sources",
          response: err,
        })
        toast.error(errorMessage(err, "Failed to load sources"))
      })
      .finally(() => {
        if (!cancelled) setLoadingCore(false)
      })

    // 2) People data in parallel — owners section skeletons until ready.
    setLoadingPeople(true)
    void Promise.all([
      usersApi.getAll().catch(() => null),
      departmentApiService.getDepartments().catch(() => null),
    ])
      .then(([userRes, deptRes]) => {
        if (cancelled) return
        if (userRes && Array.isArray((userRes as { data?: unknown[] }).data)) {
          setUsers((userRes as { data: AppUser[] }).data)
        } else if (Array.isArray(userRes)) {
          setUsers(userRes as AppUser[])
        }
        if (deptRes) setDepartments(normalizeDepartments(deptRes))
      })
      .finally(() => {
        if (!cancelled) setLoadingPeople(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Versions/scenarios are scoped to the selected model on the backend
  // (the /sources endpoint takes an optional ?modelId), so refetch them when
  // the model changes. Show spinner on the version select only.
  useEffect(() => {
    if (!sourceModelId) return
    let cancelled = false
    setLoadingVersions(true)
    fpaApi
      .listModelPlanningCycleSources(sourceModelId)
      .then((res) => {
        if (cancelled || !res.success || !res.data) return
        setSources((prev) =>
          prev
            ? { ...prev, versions: res.data!.versions, scenarios: res.data!.scenarios }
            : res.data,
        )
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingVersions(false)
      })
    return () => {
      cancelled = true
    }
  }, [sourceModelId])

  // When sources were refetched with ?modelId=, versions may omit modelId — keep them.
  const versionsForModel = useMemo(() => {
    if (!sourceModelId) return []
    const list = sources?.versions || []
    const scoped = list.filter((v) => !v.modelId || v.modelId === sourceModelId)
    return scoped.length ? scoped : list
  }, [sources, sourceModelId])
  const scenariosForModel = useMemo(() => {
    if (!sourceModelId) return []
    const list = sources?.scenarios || []
    const scoped = list.filter((s) => !s.modelId || s.modelId === sourceModelId)
    return scoped.length ? scoped : list
  }, [sources, sourceModelId])

  // Prefer a Base/Budget scenario by default when scenarios load for a model
  useEffect(() => {
    if (!sourceModelId || baseScenarioId) return
    const preferred =
      scenariosForModel.find(
        (s) =>
          String(s.type || "").toUpperCase() === "BASE" ||
          /^(base|budget)/i.test(String(s.name || "").trim()),
      ) || scenariosForModel[0]
    if (preferred?.id) setBaseScenarioId(preferred.id)
  }, [sourceModelId, scenariosForModel, baseScenarioId])

  const selectedVersionLabel = useMemo(() => {
    const v = versionsForModel.find((x) => x.id === sourceModelVersionId)
    return v ? versionOptionLabel(v) : undefined
  }, [versionsForModel, sourceModelVersionId])

  const assigneeOptions = useMemo(() => {
    if (!draftDeptId) return [] as AppUser[]
    const dept = departments.find((d) => d.id === draftDeptId)
    return users.filter((u) => userMatchesDept(u, dept))
  }, [users, draftDeptId, departments])

  const addOwner = () => {
    if (!draftDeptId) {
      toast.error("Select a department")
      return
    }
    if (!draftAssigneeId) {
      toast.error("Select a department owner")
      return
    }
    if (owners.some((o) => o.departmentId === draftDeptId)) {
      toast.error("That department is already assigned")
      return
    }
    const dept = departments.find((d) => d.id === draftDeptId)
    const user = users.find((u) => u.id === draftAssigneeId)
    setOwners((prev) => [
      ...prev,
      {
        departmentId: draftDeptId,
        departmentName: dept?.name || draftDeptId,
        assigneeId: draftAssigneeId,
        assigneeName: user ? userLabel(user) : draftAssigneeId,
        dueDate: draftOwnerDue || undefined,
      },
    ])
    setDraftDeptId("")
    setDraftAssigneeId("")
    setDraftOwnerDue("")
  }

  const collectRequirements = (): string[] => {
    const reqs: string[] = []
    if (!name.trim()) reqs.push("Cycle name is required.")
    if (!financialYear.trim() || !Number(financialYear)) reqs.push("Financial year is required.")
    if (!planningType) reqs.push("Planning type is required.")
    if (!sourceModelId) reqs.push("Source model is required.")
    if (!sourceModelVersionId) reqs.push("Source model version is required.")
    if (!planningOwnerId) reqs.push("Planning owner is required.")
    if (!owners.length) reqs.push("Assign at least one department owner.")
    if (owners.some((o) => !o.assigneeId)) {
      reqs.push("Every department owner row needs an assigned user.")
    }
    return reqs
  }

  const applyApiErrors = (res: {
    message?: string
    errors?: Array<{ message?: string; code?: string }>
    response?: { errors?: Array<{ message?: string; code?: string }> }
  }) => {
    const apiErrs = res.response?.errors || res.errors
    if (Array.isArray(apiErrs) && apiErrs.length) {
      setSetupErrors(
        apiErrs.map((e) =>
          e.message ? (e.code ? `${e.code}: ${e.message}` : e.message) : e.code || "Requirement unmet",
        ),
      )
    }
  }

  const submit = async () => {
    const reqs = collectRequirements()
    if (reqs.length) {
      setSetupErrors(reqs)
      toast.error(`Cannot create cycle. ${reqs.length} requirement${reqs.length === 1 ? "" : "s"} remain.`)
      return
    }
    setSetupErrors([])
    setBusy(true)
    try {
      const defaultScenarioId =
        baseScenarioId ||
        scenariosForModel.find(
          (s) =>
            String(s.type || "").toUpperCase() === "BASE" ||
            /^(base|budget)/i.test(String(s.name || "").trim()),
        )?.id ||
        scenariosForModel[0]?.id ||
        null

      const body: FpaModelPlanningCycleCreateRequest = {
        name: name.trim(),
        financialYear: Number(financialYear),
        planningType,
        sourceModelId,
        sourceModelVersionId,
        planningHorizon: planningHorizon ? Number(planningHorizon) : null,
        baseScenarioId: defaultScenarioId,
        actualsCutoffPeriod: toPeriodStart(actualsCutoffPeriod),
        forecastStartPeriod: toPeriodStart(forecastStartPeriod),
        submissionDeadline: submissionDeadline || null,
        planningOwnerId,
        owners: owners.map((o) => ({
          departmentId: o.departmentId,
          assigneeId: o.assigneeId,
          dueDate: o.dueDate || null,
        })),
      }
      const res = await fpaApi.createModelPlanningCycle(body)
      if (!res.success || !res.data) {
        applyApiErrors(res)
        throw new Error(res.message || "Failed to create planning cycle")
      }
      toast.success("Planning cycle created")
      onCreated(res.data)
    } catch (err) {
      const code = (err as { response?: { code?: string } })?.response?.code
      const status = (err as { status?: number })?.status
      applyApiErrors(err as { response?: { errors?: Array<{ message?: string; code?: string }> } })
      if (code === "NO_OWNERS") {
        toast.error(errorMessage(err, "Assign at least one department owner"))
      } else if (code === "UNKNOWN_DEPARTMENT") {
        toast.error(errorMessage(err, "Unknown department — pick a department from the list"))
      } else if (code === "UNKNOWN_ASSIGNEE") {
        toast.error(errorMessage(err, "Unknown assignee — pick a user from the list"))
      } else if (code === "SOURCE_VERSION_NOT_PUBLISHED") {
        toast.error(errorMessage(err, "Source version must be published (LOCKED)"))
      } else if (status === 400 || code) {
        toast.error(errorMessage(err, "Invalid planning cycle request"))
      } else {
        logFpaGap({
          category: "broken",
          path: "/v1/fpa/model-planning/cycles",
          method: "POST",
          message: errorMessage(err),
          impact: "Create planning cycle failed",
          response: err,
        })
        toast.error(errorMessage(err, "Failed to create planning cycle"))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-[#e2e8f0] bg-white shadow-xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[#e2e8f0] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[#0f172a]">Create planning cycle</h2>
            <p className="text-[11px] text-[#64748b] mt-0.5">Pick a published model, version and planning type.</p>
          </div>
          <button type="button" disabled={busy} onClick={onClose} className="text-[#94a3b8] hover:text-[#475569]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-[#0f172a]">Cycle name</label>
            <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="FY2026 Annual Budget" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Financial year</label>
              <input className={FIELD} value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Planning type</label>
              {loadingCore ? (
                <FieldSkeleton />
              ) : (
                <Select
                  value={planningType}
                  onValueChange={(v) => setPlanningType(v as FpaPlanningType)}
                >
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#e2e8f0] bg-white text-[#0f172a]">
                    {(sources?.planningTypes || []).map((t) => (
                      <SelectItem key={t} value={t} className="rounded-lg text-sm text-[#0f172a]">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#0f172a]">Source model</label>
            {loadingCore ? (
              <FieldSkeleton />
            ) : (
              <Select
                value={sourceModelId || undefined}
                onValueChange={(v) => {
                  setSourceModelId(v)
                  setSourceModelVersionId("")
                  setBaseScenarioId("")
                }}
              >
                <SelectTrigger className={SELECT_TRIGGER}>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#e2e8f0] bg-white text-[#0f172a]">
                  {(sources?.models || []).map((m) => (
                    <SelectItem key={m.id} value={m.id} className="rounded-lg text-sm text-[#0f172a]">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Source version</label>
              {loadingCore || (sourceModelId && loadingVersions) ? (
                <FieldSkeleton />
              ) : (
                <Select
                  value={sourceModelVersionId || undefined}
                  onValueChange={setSourceModelVersionId}
                  disabled={!sourceModelId}
                >
                  <SelectTrigger className={`${SELECT_TRIGGER} disabled:opacity-70`}>
                    <span
                      className={
                        selectedVersionLabel
                          ? "min-w-0 flex-1 truncate text-left text-sm text-[#0f172a]"
                          : "min-w-0 flex-1 truncate text-left text-sm text-[#94a3b8]"
                      }
                    >
                      {selectedVersionLabel ||
                        (!sourceModelId ? "Select a model first" : "Select version")}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#e2e8f0] bg-white text-[#0f172a]">
                    {versionsForModel.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-[#64748b]">No versions for this model</div>
                    ) : (
                      versionsForModel.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="rounded-lg text-sm text-[#0f172a]">
                          {versionOptionLabel(v)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Planning horizon (periods)</label>
              <input className={FIELD} value={planningHorizon} onChange={(e) => setPlanningHorizon(e.target.value)} inputMode="numeric" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#0f172a]">Base scenario</label>
            {loadingCore || (sourceModelId && loadingVersions) ? (
              <FieldSkeleton />
            ) : (
              <Select
                value={baseScenarioId || undefined}
                onValueChange={setBaseScenarioId}
                disabled={!sourceModelId}
              >
                <SelectTrigger className={SELECT_TRIGGER}>
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#e2e8f0] bg-white text-[#0f172a]">
                  {scenariosForModel.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="rounded-lg text-sm text-[#0f172a]">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Actuals cutoff</label>
              <input type="date" className={FIELD} value={actualsCutoffPeriod} onChange={(e) => setActualsCutoffPeriod(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Forecast start</label>
              <input type="date" className={FIELD} value={forecastStartPeriod} onChange={(e) => setForecastStartPeriod(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Submission due</label>
              <input type="date" className={FIELD} value={submissionDeadline} onChange={(e) => setSubmissionDeadline(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#0f172a] inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5 text-[#64748b]" />
              Planning owner
              <span className="text-[#dc2626]">*</span>
            </label>
            {loadingPeople ? (
              <FieldSkeleton />
            ) : (
              <Select value={planningOwnerId || undefined} onValueChange={setPlanningOwnerId}>
                <SelectTrigger className={SELECT_TRIGGER}>
                  <SelectValue placeholder="Select planning owner…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#e2e8f0] bg-white text-[#0f172a]">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="rounded-lg text-sm text-[#0f172a]">
                      {userLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[#eaecf0] bg-[#f8fafc]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
                <Users className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#0f172a]">Departments &amp; owners</p>
                <p className="text-[11px] text-[#667085]">At least one department owner required</p>
              </div>
            </div>

            <div className="p-3.5 space-y-3">
              {loadingPeople ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
                    <FieldSkeleton className="mt-0" />
                    <FieldSkeleton className="mt-0" />
                    <FieldSkeleton className="mt-0" />
                    <Skeleton className="h-9 w-9 rounded-full bg-[#e2e8f0]" />
                  </div>
                  <FieldSkeleton />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <label className="text-[11px] font-medium text-[#0f172a] inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-[#94a3b8]" />
                        Department
                      </label>
                      <Select
                        value={draftDeptId || undefined}
                        onValueChange={(v) => {
                          setDraftDeptId(v)
                          setDraftAssigneeId("")
                        }}
                      >
                        <SelectTrigger className={SELECT_TRIGGER}>
                          <SelectValue
                            placeholder={departments.length ? "Select…" : "No departments"}
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-[#e2e8f0] bg-white text-[#0f172a]">
                          {departments.map((d) => (
                            <SelectItem
                              key={d.id}
                              value={d.id}
                              className="rounded-lg text-sm text-[#0f172a]"
                            >
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#0f172a] inline-flex items-center gap-1">
                        <UserRound className="h-3 w-3 text-[#94a3b8]" />
                        Owner
                      </label>
                      <Select
                        value={draftAssigneeId || undefined}
                        onValueChange={setDraftAssigneeId}
                        disabled={!draftDeptId}
                      >
                        <SelectTrigger className={SELECT_TRIGGER}>
                          <SelectValue
                            placeholder={
                              !draftDeptId
                                ? "Pick department first"
                                : assigneeOptions.length
                                  ? "Select user…"
                                  : "No users in this department"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-[#e2e8f0] bg-white text-[#0f172a]">
                          {assigneeOptions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-[#64748b]">
                              {!draftDeptId
                                ? "Select a department first"
                                : "No users linked to this department"}
                            </div>
                          ) : (
                            assigneeOptions.map((u) => (
                              <SelectItem
                                key={u.id}
                                value={u.id}
                                className="rounded-lg text-sm text-[#0f172a]"
                              >
                                {userLabel(u)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#0f172a] inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-[#94a3b8]" />
                        Due
                      </label>
                      <input
                        type="date"
                        className={FIELD}
                        value={draftOwnerDue}
                        onChange={(e) => setDraftOwnerDue(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addOwner}
                      aria-label="Add owner"
                      title="Add owner"
                      className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[#2563eb] text-white shadow-sm hover:bg-[#1d4ed8]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {owners.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#d0d5dd] bg-[#f9fafb] px-3 py-3 text-[12px] text-[#667085]">
                      <Building2 className="h-4 w-4 shrink-0 text-[#98a2b3]" />
                      Add a department owner to continue
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {owners.map((o) => (
                        <li
                          key={o.departmentId}
                          className="flex items-center gap-3 rounded-xl border border-[#eaecf0] bg-[#f9fafb] px-3 py-2.5"
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-[#eaecf0] text-[#2563eb]">
                            <Building2 className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-[#101828] truncate">
                              {o.departmentName}
                            </p>
                            <p className="text-[11px] text-[#667085] truncate inline-flex items-center gap-1.5">
                              <UserRound className="h-3 w-3 shrink-0" />
                              {o.assigneeName}
                              {o.dueDate ? (
                                <>
                                  <span className="text-[#d0d5dd]">·</span>
                                  <CalendarDays className="h-3 w-3 shrink-0" />
                                  {o.dueDate}
                                </>
                              ) : null}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${o.departmentName}`}
                            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full text-[#b42318] hover:bg-[#fef3f2]"
                            onClick={() =>
                              setOwners((prev) =>
                                prev.filter((x) => x.departmentId !== o.departmentId),
                              )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>

          {setupErrors.length > 0 && (
            <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] text-[#b91c1c] space-y-0.5">
              {setupErrors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 sm:px-5 py-3 border-t border-[#e2e8f0] shrink-0">
          <button type="button" disabled={busy} onClick={onClose} className="h-9 rounded-full border border-[#e2e8f0] bg-white px-4 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc]">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || loadingCore || loadingPeople}
            onClick={() => void submit()}
            className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create cycle
          </button>
        </div>
      </div>
    </div>
  )
}