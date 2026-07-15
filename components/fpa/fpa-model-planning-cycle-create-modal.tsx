"use client"

/**
 * Create modal for Model Planning cycles (distinct from PlanningBudgetCycle).
 * Fetches its own sources (models/versions/scenarios/planningTypes) and users.
 * On success calls onCreated(cycle) — the list navigates to the worksheet.
 */

import { useEffect, useMemo, useState } from "react"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import {
  fpaApi,
  type FpaModelPlanningCycle,
  type FpaModelPlanningCycleCreateRequest,
  type FpaModelPlanningCycleSources,
  type FpaPlanningType,
} from "@/lib/api/fpa-api"
import { usersApi, type AppUser } from "@/lib/api/users-api"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SELECT_TRIGGER =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172a] shadow-none focus:ring-2 focus:ring-[#2563eb]/30"
const FIELD =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a] bg-white"

export function FpaModelPlanningCycleCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (cycle: FpaModelPlanningCycle) => void
}) {
  const [sources, setSources] = useState<FpaModelPlanningCycleSources | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingSources, setLoadingSources] = useState(true)
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

  const loadSources = async (modelId?: string) => {
    setLoadingSources(true)
    try {
      const [srcRes, userRes] = await Promise.all([
        fpaApi.listModelPlanningCycleSources(modelId),
        usersApi.getAll().catch(() => null),
      ])
      if (srcRes.success && srcRes.data) setSources(srcRes.data)
      if (userRes && Array.isArray((userRes as { data?: unknown[] }).data)) {
        setUsers((userRes as { data: AppUser[] }).data)
      } else if (Array.isArray(userRes)) {
        setUsers(userRes as AppUser[])
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/model-planning/cycles/sources",
        method: "GET",
        message: errorMessage(err),
        impact: "Failed to load planning cycle sources",
        response: err,
      })
      toast.error(errorMessage(err, "Failed to load sources"))
    } finally {
      setLoadingSources(false)
    }
  }

  useEffect(() => {
    void loadSources()
  }, [])

  // Versions/scenarios are scoped to the selected model on the backend
  // (the /sources endpoint takes an optional ?modelId), so refetch them when
  // the model changes. No full-form spinner — just merge into existing sources.
  useEffect(() => {
    if (!sourceModelId) return
    let cancelled = false
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
    return () => {
      cancelled = true
    }
  }, [sourceModelId])

  const versionsForModel = useMemo(
    () => (sources?.versions || []).filter((v) => v.modelId === sourceModelId),
    [sources, sourceModelId],
  )
  const scenariosForModel = useMemo(
    () => (sources?.scenarios || []).filter((s) => s.modelId === sourceModelId),
    [sources, sourceModelId],
  )

  const collectRequirements = (): string[] => {
    const reqs: string[] = []
    if (!name.trim()) reqs.push("Cycle name is required.")
    if (!financialYear.trim() || !Number(financialYear)) reqs.push("Financial year is required.")
    if (!planningType) reqs.push("Planning type is required.")
    if (!sourceModelId) reqs.push("Source model is required.")
    if (!sourceModelVersionId) reqs.push("Source model version is required.")
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
      const body: FpaModelPlanningCycleCreateRequest = {
        name: name.trim(),
        financialYear: Number(financialYear),
        planningType,
        sourceModelId,
        sourceModelVersionId,
        planningHorizon: planningHorizon ? Number(planningHorizon) : null,
        baseScenarioId: baseScenarioId || null,
        actualsCutoffPeriod: actualsCutoffPeriod || null,
        forecastStartPeriod: forecastStartPeriod || null,
        submissionDeadline: submissionDeadline || null,
        planningOwnerId: planningOwnerId || null,
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
      if (status === 400 || code) {
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
          {loadingSources ? (
            <div className="flex items-center justify-center py-10 text-[#64748b] gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading sources…
            </div>
          ) : (
            <>
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
                  <Select value={planningType} onValueChange={(v) => setPlanningType(v as FpaPlanningType)}>
                    <SelectTrigger className={SELECT_TRIGGER}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#e2e8f0]">
                      {(sources?.planningTypes || []).map((t) => (
                        <SelectItem key={t} value={t} className="rounded-lg text-sm">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#0f172a]">Source model</label>
                <Select value={sourceModelId} onValueChange={(v) => { setSourceModelId(v); setSourceModelVersionId(""); setBaseScenarioId("") }}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#e2e8f0]">
                    {(sources?.models || []).map((m) => (
                      <SelectItem key={m.id} value={m.id} className="rounded-lg text-sm">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[#0f172a]">Source version</label>
                  <Select value={sourceModelVersionId} onValueChange={setSourceModelVersionId} disabled={!sourceModelId}>
                    <SelectTrigger className={SELECT_TRIGGER}>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#e2e8f0]">
                      {versionsForModel.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="rounded-lg text-sm">
                          {v.label}{v.isPublished ? " (published)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#0f172a]">Planning horizon (periods)</label>
                  <input className={FIELD} value={planningHorizon} onChange={(e) => setPlanningHorizon(e.target.value)} inputMode="numeric" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#0f172a]">Base scenario</label>
                <Select value={baseScenarioId} onValueChange={setBaseScenarioId} disabled={!sourceModelId}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#e2e8f0]">
                    {scenariosForModel.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg text-sm">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <label className="text-[11px] font-medium text-[#0f172a]">Planning owner</label>
                <Select value={planningOwnerId} onValueChange={setPlanningOwnerId}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#e2e8f0]">
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="rounded-lg text-sm">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

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
          <button type="button" disabled={busy || loadingSources} onClick={() => void submit()} className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create cycle
          </button>
        </div>
      </div>
    </div>
  )
}