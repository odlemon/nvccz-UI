"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X } from "lucide-react"
import { toast } from "sonner"
import {
  asNumber,
  fpaApi,
  type ForecastEntity,
  type FpaDimension,
  type FpaModel,
  type FpaModelSetupRequest,
  type FpaSetupError,
} from "@/lib/api/fpa-api"
import { departmentApiService, type Department } from "@/lib/api/department-api"
import { accountingApi, type AccountingCurrency } from "@/lib/api/accounting-api"
import { useAppDispatch } from "@/lib/store"
import { bootstrapFpaSelection, fetchFpaModels } from "@/lib/store/slices/fpaSlice"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { errorMessage, logFpaGap, setupErrorsFrom } from "@/lib/fpa/fpa-api-gaps"
import { cn } from "@/lib/utils"
import { CurrencySelect } from "@/components/performance/currency-select"
import {
  emptySetupDraft,
  mapApiStepToSetupStep,
  SETUP_STEPS,
  validationToChecks,
  type SetupDraft,
  type SetupStepId,
} from "@/components/fpa/setup/setup-types"

const FIELD =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a] bg-white"
const FIELD_AREA =
  "mt-1 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a] bg-white min-h-[72px]"

const DEFAULT_LINE_PACK: SetupDraft["lineItems"] = [
  { code: "REVENUE", name: "Revenue", lineItemType: "REVENUE", category: "REVENUE" },
  { code: "COGS", name: "COGS", lineItemType: "EXPENSE", category: "EXPENSE" },
  { code: "GROSS_PROFIT", name: "Gross Profit", lineItemType: "CALC", category: "REVENUE" },
  { code: "OPEX", name: "Operating Expenses", lineItemType: "EXPENSE", category: "EXPENSE" },
  { code: "EBITDA", name: "EBITDA", lineItemType: "CALC", category: "REVENUE" },
]

const DEFAULT_FORMULAS: SetupDraft["formulas"] = [
  { lineItemCode: "GROSS_PROFIT", expression: "LINE('REVENUE') - LINE('COGS')" },
  { lineItemCode: "EBITDA", expression: "LINE('GROSS_PROFIT') - LINE('OPEX')" },
]

const LINE_TYPES = ["REVENUE", "EXPENSE", "CALC", "METRIC", "ASSET", "LIABILITY"] as const

interface Props {
  open: boolean
  onClose: () => void
}

function stepIndex(id: SetupStepId) {
  return SETUP_STEPS.findIndex((s) => s.id === id)
}

/**
 * Multi-step modal: draft stays client-side until Create → POST /models/setup.
 */
export function FpaModelSetupModal({ open, onClose }: Props) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { canCreateModel, isAdmin } = useFpaPermissions()
  const canSetup = canCreateModel || isAdmin

  const [step, setStep] = useState<SetupStepId>("create")
  const [draft, setDraft] = useState<SetupDraft>(() => emptySetupDraft())
  const [busy, setBusy] = useState(false)
  const [bootLoading, setBootLoading] = useState(false)
  const [entities, setEntities] = useState<ForecastEntity[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [deptError, setDeptError] = useState<string | null>(null)
  const [coaRows, setCoaRows] = useState<Array<Record<string, unknown>>>([])
  const [coaLoading, setCoaLoading] = useState(false)
  const [dimCatalog, setDimCatalog] = useState<FpaDimension[]>([])
  const [priorModels, setPriorModels] = useState<FpaModel[]>([])
  const [validation, setValidation] = useState<{
    passed: boolean
    checks: Array<{ id: string; label: string; ok: boolean; detail?: string }>
  } | null>(null)

  const idx = stepIndex(step)

  const patch = useCallback((partial: Partial<SetupDraft>) => {
    setDraft((d) => ({ ...d, ...partial }))
  }, [])

  const reset = useCallback(() => {
    setStep("create")
    setDraft(emptySetupDraft())
    setValidation(null)
    setBusy(false)
    setCoaRows([])
    setDeptError(null)
  }, [])

  const applyServerErrors = useCallback((errors: FpaSetupError[], passed: boolean) => {
    setValidation(validationToChecks(errors, passed))
    if (passed || !errors.length) return
    const target = mapApiStepToSetupStep(errors[0]?.step)
    if (target && target !== "validate") setStep(target)
  }, [])

  const openWorksheet = useCallback(
    async (modelId: string) => {
      toast.success("Model ready for planning")
      await dispatch(bootstrapFpaSelection(modelId))
      await dispatch(fetchFpaModels())
      onClose()
      reset()
      router.push(`/forecasting/models/${modelId}/worksheet`)
    },
    [dispatch, onClose, reset, router],
  )

  useEffect(() => {
    if (!open) return
    reset()
    let cancelled = false
    setBootLoading(true)
    ;(async () => {
      try {
        const [entRes, deptRes, dimRes, modelsRes, currRes] = await Promise.all([
          fpaApi.listEntities().catch((err) => {
            logFpaGap({
              category: "broken",
              path: "/forecast-entities",
              method: "GET",
              message: errorMessage(err),
              impact: "Setup modal entities empty",
              response: err,
            })
            return { success: false as const, data: [] as ForecastEntity[] }
          }),
          departmentApiService.getDepartments({ isActive: true }).catch((err) => {
            setDeptError(errorMessage(err, "Failed to load departments"))
            return null
          }),
          fpaApi.listDimensions().catch((err) => {
            logFpaGap({
              category: "broken",
              path: "/v1/fpa/dimensions",
              method: "GET",
              message: errorMessage(err),
              impact: "Dimension catalog empty",
              response: err,
            })
            return { success: false as const, data: [] as FpaDimension[] }
          }),
          fpaApi.listModels().catch(() => ({ success: false as const, data: [] as FpaModel[] })),
          accountingApi.getCurrencies().catch(() => null),
        ])
        if (cancelled) return

        if (entRes.success) setEntities(entRes.data || [])

        const deptList = deptRes?.data?.length
          ? deptRes.data
          : deptRes?.departments?.length
            ? deptRes.departments
            : []
        if (deptList.length) {
          setDepartments(deptList.filter((d) => d.isActive !== false))
          setDeptError(null)
        } else if (deptRes) {
          setDepartments([])
          setDeptError(null)
        }

        if (dimRes.success) setDimCatalog(dimRes.data || [])
        if (modelsRes.success) {
          setPriorModels((modelsRes.data || []).filter((m) => m.defaultVersionId))
        }

        const currencies: AccountingCurrency[] = Array.isArray(currRes)
          ? currRes
          : Array.isArray((currRes as { data?: AccountingCurrency[] } | null)?.data)
            ? ((currRes as { data: AccountingCurrency[] }).data)
            : []
        const active = currencies.filter((c) => c.isActive !== false)
        const def = active.find((c) => c.isDefault) || active.find((c) => c.code === "USD") || active[0]
        if (def?.code) {
          setDraft((d) => ({ ...d, baseCurrency: def.code }))
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setBootLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, reset])

  useEffect(() => {
    if (!open || step !== "coa") return
    const entityId = draft.entityIds[0]
    if (!entityId) {
      setCoaRows([])
      return
    }
    let cancelled = false
    setCoaLoading(true)
    ;(async () => {
      try {
        const res = await fpaApi.getChartOfAccounts(entityId)
        if (!res.success) throw new Error(res.message || "COA failed")
        if (!cancelled) setCoaRows((res.data || []) as Array<Record<string, unknown>>)
      } catch (err) {
        if (!cancelled) {
          setCoaRows([])
          toast.error(errorMessage(err, "Failed to load chart of accounts"))
        }
      } finally {
        if (!cancelled) setCoaLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, step, draft.entityIds])

  const dimensionOptions = useMemo(() => {
    if (!dimCatalog.length) return []
    return dimCatalog.map((d) => ({
      key: d.key || d.code,
      label: d.name || d.key || d.code,
      members: d.members || [],
    }))
  }, [dimCatalog])

  const buildSetupBody = (): FpaModelSetupRequest => {
    const body: FpaModelSetupRequest = {
      name: draft.name.trim(),
      description: draft.description || undefined,
      baseCurrency: draft.baseCurrency,
      modelType: draft.modelType,
      startPeriod: draft.startPeriod,
      endPeriod: draft.endPeriod,
      timeGranularity: draft.timeGranularity,
      entityIds: draft.entityIds,
      departmentIds: draft.departmentIds,
      accountIds: draft.accountIds,
      dimensions: draft.dimensions,
      baseline: {
        mode: draft.baselineMode,
        sourceVersionId: draft.sourceVersionId.trim() || null,
        sourceScenarioId: draft.sourceScenarioId.trim() || null,
      },
    }
    if (draft.lineItems.length) {
      body.lineItems = draft.lineItems.map((li) => ({
        code: li.code.trim().toUpperCase(),
        name: li.name.trim(),
        lineItemType: li.lineItemType,
        category: li.category,
      }))
    }
    if (draft.formulas.some((f) => f.expression.trim())) {
      body.formulas = draft.formulas
        .filter((f) => f.expression.trim())
        .map((f) => ({
          lineItemCode: f.lineItemCode.trim().toUpperCase(),
          expression: f.expression.trim(),
        }))
    }
    if (draft.drivers.length) {
      body.drivers = draft.drivers.map((d) => ({
        code: d.code.trim().toUpperCase(),
        name: d.name.trim(),
        value: d.value,
        category: d.category || "GENERAL",
      }))
    }
    if (draft.workflowName.trim()) {
      body.workflow = {
        name: draft.workflowName.trim(),
        workflowType: draft.modelType === "FORECAST" || draft.modelType === "ROLLING_FORECAST" ? "FORECAST" : "BUDGET",
        stages: [],
        tasks: (draft.workflowTasks.length ? draft.workflowTasks : [{ title: "Finance input" }]).map(
          (t) => ({ title: t.title.trim(), assigneeId: null, departmentId: null }),
        ),
      }
    }
    return body
  }

  const clientPreflight = (): boolean => {
    const checks: Array<{ id: string; label: string; ok: boolean; detail?: string }> = []
    checks.push({
      id: "name",
      label: "Model name",
      ok: !!draft.name.trim(),
      detail: draft.name.trim() ? undefined : "Required",
    })
    checks.push({
      id: "currency",
      label: "Base currency",
      ok: !!draft.baseCurrency,
    })
    checks.push({
      id: "type",
      label: "Model type",
      ok: !!draft.modelType,
    })
    checks.push({
      id: "horizon",
      label: "Time horizon",
      ok: !!(draft.startPeriod && draft.endPeriod && draft.timeGranularity),
      detail:
        draft.startPeriod && draft.endPeriod && draft.startPeriod > draft.endPeriod
          ? "Start must be before end"
          : undefined,
    })
    if (draft.startPeriod && draft.endPeriod && draft.startPeriod > draft.endPeriod) {
      checks[checks.length - 1].ok = false
    }
    checks.push({
      id: "scope",
      label: "Entities or departments",
      ok: draft.entityIds.length > 0 || draft.departmentIds.length > 0,
      detail: "Select at least one entity or department",
    })
    if (draft.baselineMode === "PRIOR_FORECAST") {
      checks.push({
        id: "baseline",
        label: "Prior forecast source",
        ok: !!draft.sourceVersionId.trim(),
        detail: "Pick a source version",
      })
    }
    checks.push({
      id: "coa",
      label: "Chart of accounts",
      ok: true,
      detail: draft.accountIds.length ? `${draft.accountIds.length} selected` : "Optional — can skip",
    })
    checks.push({
      id: "dimensions",
      label: "Dimensions",
      ok: true,
      detail: draft.dimensions.length ? `${draft.dimensions.length} selected` : "Optional — can skip",
    })
    checks.push({
      id: "lineItems",
      label: "Line items",
      ok: true,
      detail: draft.lineItems.length
        ? `${draft.lineItems.length} custom`
        : "Default pack if omitted on create",
    })
    const hard = ["name", "currency", "type", "horizon", "scope"]
    if (draft.baselineMode === "PRIOR_FORECAST") hard.push("baseline")
    const passed = checks.filter((c) => hard.includes(c.id)).every((c) => c.ok)
    setValidation({ passed, checks })
    return passed
  }

  const applyFixesAndValidate = async (modelId: string) => {
    await fpaApi.putModelScope(modelId, {
      entityIds: draft.entityIds,
      departmentIds: draft.departmentIds,
    })
    await fpaApi.putModelCoa(modelId, {
      entityId: draft.entityIds[0],
      accountIds: draft.accountIds,
    })
    await fpaApi.putModelDimensions(modelId, { dimensions: draft.dimensions })
    await fpaApi.postModelBaseline(modelId, {
      mode: draft.baselineMode,
      sourceVersionId: draft.sourceVersionId.trim() || null,
      sourceScenarioId: draft.sourceScenarioId.trim() || null,
    })
    if (draft.lineItems.length) {
      await fpaApi.bulkCreateLineItems(modelId, {
        lineItems: draft.lineItems.map((li) => ({
          code: li.code.trim().toUpperCase(),
          name: li.name.trim(),
          lineItemType: li.lineItemType,
          category: li.category,
        })),
      })
    }
    const res = await fpaApi.validateModel(modelId)
    if (!res.success || !res.data) throw new Error(res.message || "Validate failed")
    applyServerErrors(res.data.errors || [], res.data.passed)
    if (res.data.passed) await openWorksheet(modelId)
    else toast.error("Validation failed — fix the highlighted step")
  }

  const commitAll = async () => {
    if (!canSetup) {
      toast.error("You do not have permission to create models")
      return
    }
    if (!clientPreflight()) {
      toast.error("Fix required fields before creating")
      return
    }

    setBusy(true)
    try {
      if (draft.modelId) {
        await applyFixesAndValidate(draft.modelId)
        return
      }

      const created = await fpaApi.setupModel(buildSetupBody())
      if (!created.success || !created.data?.model) {
        throw new Error(created.message || "Create model failed")
      }

      const { model, validation: serverVal } = created.data
      const modelId = model.id
      patch({
        modelId,
        defaultScenarioId: model.defaultScenarioId || null,
        defaultVersionId: model.defaultVersionId || null,
      })

      const passed = !!serverVal?.passed
      const errors = serverVal?.errors || []
      applyServerErrors(errors, passed)

      if (passed) {
        await openWorksheet(modelId)
        return
      }

      toast.message("Model created — fix validation issues to open for planning")
      await dispatch(fetchFpaModels())
    } catch (err) {
      const fieldErrors = setupErrorsFrom(err)
      if (fieldErrors.length) {
        applyServerErrors(fieldErrors, false)
        toast.error(errorMessage(err, "Setup validation failed — nothing was saved"))
      } else {
        logFpaGap({
          category: "broken",
          path: "/v1/fpa/models/setup",
          method: "POST",
          message: errorMessage(err),
          impact: "Atomic model setup failed",
          request: { name: draft.name },
          response: err,
        })
        toast.error(errorMessage(err, "Failed to create planning model"))
        setValidation({
          passed: false,
          checks: [{ id: "commit", label: "Create commit", ok: false, detail: errorMessage(err) }],
        })
      }
    } finally {
      setBusy(false)
    }
  }

  const onNext = () => {
    if (step === "create") {
      if (!draft.name.trim()) {
        toast.error("Model name is required")
        return
      }
      if (!draft.baseCurrency) {
        toast.error("Select a base currency")
        return
      }
    }
    if (step === "entities") {
      if (!draft.entityIds.length && !draft.departmentIds.length) {
        toast.error("Select at least one entity or department")
        return
      }
    }
    if (step === "baseline" && draft.baselineMode === "PRIOR_FORECAST" && !draft.sourceVersionId.trim()) {
      toast.error("Select a source version for prior forecast")
      return
    }
    if (step === "validate") {
      void commitAll()
      return
    }
    const next = SETUP_STEPS[Math.min(idx + 1, SETUP_STEPS.length - 1)].id
    if (next === "validate") clientPreflight()
    setStep(next)
  }

  const onBack = () => {
    if (idx <= 0) return
    setStep(SETUP_STEPS[idx - 1].id)
  }

  const onSkip = () => {
    if (["coa", "dimensions", "baseline", "workflow", "formulas", "drivers", "lineItems"].includes(step)) {
      setStep(SETUP_STEPS[Math.min(idx + 1, SETUP_STEPS.length - 1)].id)
    }
  }

  const toggleDimensionKey = (key: string, allMemberIds: string[]) => {
    const existing = draft.dimensions.find((d) => d.key === key)
    if (existing) {
      patch({ dimensions: draft.dimensions.filter((d) => d.key !== key) })
      return
    }
    patch({
      dimensions: [...draft.dimensions, { key, valueIds: allMemberIds.length ? allMemberIds : [] }],
    })
  }

  const toggleDimensionMember = (key: string, memberId: string) => {
    const existing = draft.dimensions.find((d) => d.key === key)
    if (!existing) {
      patch({ dimensions: [...draft.dimensions, { key, valueIds: [memberId] }] })
      return
    }
    const on = existing.valueIds.includes(memberId)
    const valueIds = on
      ? existing.valueIds.filter((id) => id !== memberId)
      : [...existing.valueIds, memberId]
    if (!valueIds.length) {
      patch({ dimensions: draft.dimensions.filter((d) => d.key !== key) })
      return
    }
    patch({
      dimensions: draft.dimensions.map((d) => (d.key === key ? { ...d, valueIds } : d)),
    })
  }

  const toggleAllAccounts = () => {
    const ids = coaRows.map((row, i) => String(row.id || row.account_id || i))
    const allOn = ids.length > 0 && ids.every((id) => draft.accountIds.includes(id))
    patch({ accountIds: allOn ? draft.accountIds.filter((id) => !ids.includes(id)) : [...new Set([...draft.accountIds, ...ids])] })
  }

  const seedDefaultLines = () => {
    patch({
      lineItems: DEFAULT_LINE_PACK.map((x) => ({ ...x })),
      formulas: DEFAULT_FORMULAS.map((x) => ({ ...x })),
    })
    toast.success("Loaded default line items + formulas")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fpa-setup-title"
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[#e2e8f0] bg-white shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[#e2e8f0] shrink-0">
          <div>
            <h2 id="fpa-setup-title" className="text-sm font-semibold text-[#0f172a]">
              New planning model
            </h2>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Step {idx + 1} of {SETUP_STEPS.length}
              {draft.modelId
                ? " · Model created — fix issues then re-validate"
                : " · Nothing is saved until you finish"}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onClose()
              reset()
            }}
            className="text-[#94a3b8] hover:text-[#475569]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <aside className="hidden sm:block w-52 shrink-0 border-r border-[#e2e8f0] overflow-y-auto p-3 bg-[#f8fafc]">
            <ol className="space-y-0.5">
              {SETUP_STEPS.map((s, i) => {
                const active = s.id === step
                const done = i < idx
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStep(s.id)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-full px-2.5 py-1.5 text-left text-[11px]",
                        active && "bg-[#eff6ff] text-[#2563eb] font-medium",
                        done && !active && "text-[#16a34a]",
                        !active && !done && "text-[#64748b] hover:bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border",
                          active && "bg-[#2563eb] text-white border-[#2563eb]",
                          done && !active && "bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0]",
                          !active && !done && "border-[#e2e8f0] text-[#94a3b8]",
                        )}
                      >
                        {done ? <Check className="w-3 h-3" /> : s.short}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </aside>

          <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">{SETUP_STEPS[idx]?.label}</h3>

            {bootLoading && (
              <div className="mb-3 flex items-center gap-2 text-xs text-[#64748b]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading entities, departments, currencies…
              </div>
            )}

            {step === "create" && (
              <div className="space-y-3">
                <Field label="Name">
                  <input
                    className={FIELD}
                    value={draft.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="FY2026 Operating Plan"
                  />
                </Field>
                <Field label="Base currency">
                  <CurrencySelect
                    value={draft.baseCurrency}
                    onChange={(code) => patch({ baseCurrency: code })}
                    className={`${FIELD} mt-1`}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className={FIELD_AREA}
                    value={draft.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="Optional notes for this planning model"
                  />
                </Field>
              </div>
            )}

            {step === "type" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { v: "BUDGET", d: "Annual budgeting cycle" },
                  { v: "FORECAST", d: "Working forecast" },
                  { v: "ROLLING_FORECAST", d: "Rolling horizon" },
                ].map((t) => (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => patch({ modelType: t.v })}
                    className={cn(
                      "rounded-xl border p-3 text-left",
                      draft.modelType === t.v
                        ? "border-[#2563eb] bg-[#eff6ff]"
                        : "border-[#e2e8f0] bg-white",
                    )}
                  >
                    <p className="text-xs font-semibold">{t.v.replace(/_/g, " ")}</p>
                    <p className="text-[11px] text-[#64748b] mt-1">{t.d}</p>
                  </button>
                ))}
              </div>
            )}

            {step === "horizon" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Start period">
                  <input
                    type="date"
                    className={FIELD}
                    value={draft.startPeriod}
                    onChange={(e) => patch({ startPeriod: e.target.value })}
                  />
                </Field>
                <Field label="End period">
                  <input
                    type="date"
                    className={FIELD}
                    value={draft.endPeriod}
                    onChange={(e) => patch({ endPeriod: e.target.value })}
                  />
                </Field>
                <Field label="Granularity">
                  <select
                    className={FIELD}
                    value={draft.timeGranularity}
                    onChange={(e) => patch({ timeGranularity: e.target.value })}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </Field>
              </div>
            )}

            {step === "entities" && (
              <div className="space-y-4">
                <p className="text-[11px] text-[#64748b]">
                  Bound on create via <span className="font-mono">entityIds</span> /{" "}
                  <span className="font-mono">departmentIds</span>. Select at least one.
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-[#0f172a]">Entities</p>
                    <span className="text-[11px] text-[#64748b]">{draft.entityIds.length} selected</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-auto">
                    {entities.length === 0 ? (
                      <p className="text-xs text-[#94a3b8]">
                        No forecast entities found. Create entities under forecast-entities first.
                      </p>
                    ) : (
                      entities.map((e) => {
                        const on = draft.entityIds.includes(e.id)
                        return (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() =>
                              patch({
                                entityIds: on
                                  ? draft.entityIds.filter((x) => x !== e.id)
                                  : [...draft.entityIds, e.id],
                                // Clear COA when primary entity changes
                                accountIds: on && draft.entityIds[0] === e.id ? [] : draft.accountIds,
                              })
                            }
                            className={cn(
                              "w-full text-left rounded-full border px-3 py-2 text-xs",
                              on ? "border-[#2563eb] bg-[#eff6ff]" : "border-[#e2e8f0]",
                            )}
                          >
                            <span className="font-medium">{e.name}</span>
                            <span className="text-[#94a3b8] ml-2">
                              {e.type}
                              {(e.baseCurrency || e.base_currency) &&
                                ` · ${e.baseCurrency || e.base_currency}`}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-[#0f172a]">Departments</p>
                    <span className="text-[11px] text-[#64748b]">{draft.departmentIds.length} selected</span>
                  </div>
                  {deptError ? (
                    <p className="text-xs text-[#b91c1c]">{deptError}</p>
                  ) : departments.length === 0 ? (
                    <p className="text-xs text-[#94a3b8]">
                      No active departments from GET /departments.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {departments.map((d) => {
                        const on = draft.departmentIds.includes(d.id)
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() =>
                              patch({
                                departmentIds: on
                                  ? draft.departmentIds.filter((x) => x !== d.id)
                                  : [...draft.departmentIds, d.id],
                              })
                            }
                            className={cn(
                              "h-7 rounded-full border px-2.5 text-[11px]",
                              on
                                ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                                : "border-[#e2e8f0]",
                            )}
                          >
                            {d.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "coa" && (
              <div className="space-y-2">
                <p className="text-[11px] text-[#64748b]">
                  Accounts from the first selected entity&apos;s chart of accounts. Optional — skip if
                  not ready.
                </p>
                {draft.entityIds.length > 1 && (
                  <Field label="COA entity">
                    <select
                      className={FIELD}
                      value={draft.entityIds[0]}
                      onChange={(e) => {
                        const id = e.target.value
                        patch({
                          entityIds: [id, ...draft.entityIds.filter((x) => x !== id)],
                          accountIds: [],
                        })
                      }}
                    >
                      {draft.entityIds.map((id) => {
                        const ent = entities.find((x) => x.id === id)
                        return (
                          <option key={id} value={id}>
                            {ent?.name || id}
                          </option>
                        )
                      })}
                    </select>
                  </Field>
                )}
                {!draft.entityIds[0] ? (
                  <p className="text-xs text-[#94a3b8]">Select an entity in the previous step first.</p>
                ) : coaLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#64748b] py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts…
                  </div>
                ) : coaRows.length === 0 ? (
                  <p className="text-xs text-[#94a3b8]">No accounts on this entity.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#64748b]">
                        {draft.accountIds.length} of {coaRows.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={toggleAllAccounts}
                        className="h-7 rounded-full border border-[#e2e8f0] px-2.5 text-[11px] text-[#2563eb]"
                      >
                        {coaRows.every((row, i) =>
                          draft.accountIds.includes(String(row.id || row.account_id || i)),
                        )
                          ? "Clear all"
                          : "Select all"}
                      </button>
                    </div>
                    <div className="rounded-xl border border-[#e2e8f0] max-h-52 overflow-auto">
                      <table className="w-full text-[11px]">
                        <tbody>
                          {coaRows.map((row, i) => {
                            const id = String(row.id || row.account_id || i)
                            const on = draft.accountIds.includes(id)
                            return (
                              <tr key={id} className="border-t border-[#f1f5f9]">
                                <td className="px-2 py-1.5 w-8">
                                  <input
                                    type="checkbox"
                                    checked={on}
                                    onChange={() =>
                                      patch({
                                        accountIds: on
                                          ? draft.accountIds.filter((x) => x !== id)
                                          : [...draft.accountIds, id],
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-2 py-1.5 font-mono">
                                  {String(row.code || row.account_code || "—")}
                                </td>
                                <td className="px-2 py-1.5">
                                  {String(row.name || row.account_name || "")}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === "dimensions" && (
              <div className="space-y-3">
                <p className="text-[11px] text-[#64748b]">
                  From GET /v1/fpa/dimensions. Toggle a dimension, then pick members.
                </p>
                {dimensionOptions.length === 0 ? (
                  <p className="text-xs text-[#94a3b8]">
                    Dimension catalog empty. Backend seeds REGION / PRODUCT / CHANNEL on first GET —
                    retry, or skip for now.
                  </p>
                ) : (
                  dimensionOptions.map((d) => {
                    const selected = draft.dimensions.find((x) => x.key === d.key)
                    const on = !!selected
                    return (
                      <div
                        key={d.key}
                        className={cn(
                          "rounded-xl border p-3",
                          on ? "border-[#2563eb] bg-[#eff6ff]/20" : "border-[#e2e8f0]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleDimensionKey(
                              d.key,
                              d.members.map((m) => m.id || m.code).filter(Boolean),
                            )
                          }
                          className="flex items-center gap-2 text-xs font-medium text-[#0f172a]"
                        >
                          <span
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center",
                              on ? "bg-[#2563eb] border-[#2563eb] text-white" : "border-[#cbd5e1]",
                            )}
                          >
                            {on && <Check className="w-3 h-3" />}
                          </span>
                          {d.label}
                          <span className="font-mono text-[#94a3b8] font-normal">{d.key}</span>
                        </button>
                        {on && d.members.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 pl-6">
                            {d.members.map((m) => {
                              const mid = m.id || m.code
                              const mon = selected?.valueIds.includes(mid)
                              return (
                                <button
                                  key={mid}
                                  type="button"
                                  onClick={() => toggleDimensionMember(d.key, mid)}
                                  className={cn(
                                    "h-7 rounded-full border px-2.5 text-[11px]",
                                    mon
                                      ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                                      : "border-[#e2e8f0]",
                                  )}
                                >
                                  {m.name || m.code}
                                </button>
                              )
                            })}
                          </div>
                        )}
                        {on && d.members.length === 0 && (
                          <p className="text-[11px] text-[#94a3b8] mt-2 pl-6">
                            No members yet — dimension key will still be sent.
                          </p>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {step === "baseline" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      ["NONE", "Start empty"],
                      ["ACTUALS_SYNC", "Sync GL actuals"],
                      ["PRIOR_FORECAST", "Copy prior forecast"],
                    ] as const
                  ).map(([v, t]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        patch({
                          baselineMode: v,
                          ...(v !== "PRIOR_FORECAST"
                            ? { sourceVersionId: "", sourceScenarioId: "" }
                            : {}),
                        })
                      }
                      className={cn(
                        "rounded-xl border p-3 text-left text-xs",
                        draft.baselineMode === v
                          ? "border-[#2563eb] bg-[#eff6ff]"
                          : "border-[#e2e8f0]",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {draft.baselineMode === "PRIOR_FORECAST" && (
                  <Field label="Source model / version">
                    {priorModels.length === 0 ? (
                      <p className="mt-1 text-xs text-[#94a3b8]">
                        No existing models with a default version. Create one with NONE first, or use
                        another baseline mode.
                      </p>
                    ) : (
                      <select
                        className={FIELD}
                        value={draft.sourceVersionId}
                        onChange={(e) => {
                          const versionId = e.target.value
                          const m = priorModels.find((x) => x.defaultVersionId === versionId)
                          patch({
                            sourceVersionId: versionId,
                            sourceScenarioId: m?.defaultScenarioId || "",
                          })
                        }}
                      >
                        <option value="">Select source…</option>
                        {priorModels.map((m) => (
                          <option key={m.id} value={m.defaultVersionId!}>
                            {m.name} · {m.modelType} ({m.defaultVersionId})
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                )}
                {draft.baselineMode === "ACTUALS_SYNC" && (
                  <p className="text-[11px] text-[#64748b]">
                    After create, the API runs GL actuals sync (may return rowCount 0 if no actuals).
                  </p>
                )}
              </div>
            )}

            {step === "lineItems" && (
              <LineItemsEditor
                items={draft.lineItems}
                onChange={(lineItems) => patch({ lineItems })}
                onSeedDefaults={seedDefaultLines}
              />
            )}
            {step === "formulas" && (
              <FormulasEditor
                lineItems={draft.lineItems}
                formulas={draft.formulas}
                onChange={(formulas) => patch({ formulas })}
              />
            )}
            {step === "drivers" && (
              <DriversEditor drivers={draft.drivers} onChange={(drivers) => patch({ drivers })} />
            )}
            {step === "workflow" && (
              <WorkflowEditor
                name={draft.workflowName}
                tasks={draft.workflowTasks}
                onNameChange={(workflowName) => patch({ workflowName })}
                onTasksChange={(workflowTasks) => patch({ workflowTasks })}
              />
            )}

            {step === "validate" && (
              <div className="space-y-3">
                <p className="text-[11px] text-[#64748b]">
                  {draft.modelId
                    ? "Apply your fixes, then re-validate. Opening requires validation.passed."
                    : "Create posts the full draft to POST /models/setup in one transaction. Preflight failure creates nothing."}
                </p>
                <SummaryDraft draft={draft} entities={entities} departments={departments} />
                {validation && (
                  <>
                    <div
                      className={cn(
                        "rounded-xl border px-3 py-2 text-xs font-medium",
                        validation.passed
                          ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
                          : "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
                      )}
                    >
                      {validation.passed
                        ? draft.modelId
                          ? "Ready — open worksheet"
                          : "Ready — create model and open worksheet"
                        : "Not ready — fix required items"}
                    </div>
                    <ul className="space-y-1.5">
                      {validation.checks.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-start gap-2 text-[11px] border border-[#e2e8f0] rounded-lg px-2.5 py-1.5"
                        >
                          {c.ok ? (
                            <Check className="w-3.5 h-3.5 text-[#16a34a] shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#dc2626] shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium text-[#0f172a]">{c.label}</p>
                            {c.detail && <p className="text-[#64748b]">{c.detail}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-t border-[#e2e8f0] shrink-0 bg-white">
          <button
            type="button"
            disabled={busy || idx === 0}
            onClick={onBack}
            className="h-9 inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] px-3 text-xs text-[#475569] disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>
          {["coa", "dimensions", "baseline", "formulas", "drivers", "workflow", "lineItems"].includes(
            step,
          ) && (
            <button
              type="button"
              disabled={busy}
              onClick={onSkip}
              className="h-9 rounded-full border border-[#e2e8f0] px-3 text-xs text-[#64748b]"
            >
              Skip
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onClose()
              reset()
            }}
            className="h-9 rounded-full border border-[#e2e8f0] px-4 text-xs text-[#475569] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !canSetup}
            onClick={onNext}
            className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {step === "validate" ? (draft.modelId ? "Re-validate & open" : "Create model") : "Next"}
            {step !== "validate" && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-[#64748b]">
      {label}
      {children}
    </label>
  )
}

function SummaryDraft({
  draft,
  entities,
  departments,
}: {
  draft: SetupDraft
  entities: ForecastEntity[]
  departments: Department[]
}) {
  const entNames = draft.entityIds
    .map((id) => entities.find((e) => e.id === id)?.name || id)
    .join(", ")
  const deptNames = draft.departmentIds
    .map((id) => departments.find((d) => d.id === id)?.name || id)
    .join(", ")
  return (
    <dl className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[11px] grid grid-cols-2 gap-x-3 gap-y-1.5">
      <dt className="text-[#64748b]">Name</dt>
      <dd className="text-[#0f172a] font-medium truncate">{draft.name || "—"}</dd>
      <dt className="text-[#64748b]">Type / currency</dt>
      <dd className="text-[#0f172a]">
        {draft.modelType} · {draft.baseCurrency}
      </dd>
      <dt className="text-[#64748b]">Horizon</dt>
      <dd className="text-[#0f172a]">
        {draft.startPeriod} → {draft.endPeriod} ({draft.timeGranularity})
      </dd>
      <dt className="text-[#64748b]">Scope</dt>
      <dd className="text-[#0f172a] truncate">
        {[entNames, deptNames].filter(Boolean).join(" · ") || "—"}
      </dd>
      <dt className="text-[#64748b]">Accounts / dims</dt>
      <dd className="text-[#0f172a]">
        {draft.accountIds.length} accounts · {draft.dimensions.length} dimensions
      </dd>
      <dt className="text-[#64748b]">Lines / drivers</dt>
      <dd className="text-[#0f172a]">
        {draft.lineItems.length || "default"} lines · {draft.drivers.length} drivers
        {draft.workflowName ? ` · workflow` : ""}
      </dd>
    </dl>
  )
}

function LineItemsEditor({
  items,
  onChange,
  onSeedDefaults,
}: {
  items: SetupDraft["lineItems"]
  onChange: (items: SetupDraft["lineItems"]) => void
  onSeedDefaults: () => void
}) {
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [lineItemType, setLineItemType] = useState<string>("METRIC")
  const [category, setCategory] = useState("GENERAL")
  const add = () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Code and name required")
      return
    }
    if (items.some((i) => i.code.toUpperCase() === code.trim().toUpperCase())) {
      toast.error("Code already added")
      return
    }
    onChange([
      ...items,
      {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        lineItemType,
        category: category.trim() || "GENERAL",
      },
    ])
    setCode("")
    setName("")
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-[#64748b]">
          Leave empty to use the API default pack, or seed / add your own.
        </p>
        <button
          type="button"
          onClick={onSeedDefaults}
          className="h-7 rounded-full border border-[#e2e8f0] px-2.5 text-[11px] text-[#2563eb]"
        >
          Load defaults
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <Field label="Code">
          <input className={`${FIELD} w-28`} value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Name">
          <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Type">
          <select
            className={`${FIELD} w-32`}
            value={lineItemType}
            onChange={(e) => setLineItemType(e.target.value)}
          >
            {LINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <input
            className={`${FIELD} w-28`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </Field>
        <button type="button" onClick={add} className="h-9 rounded-full bg-[#2563eb] px-3 text-xs text-white">
          Add
        </button>
      </div>
      <ul className="text-xs divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-xl overflow-hidden">
        {items.map((li) => (
          <li key={li.code} className="flex gap-2 px-3 py-2 items-center">
            <span className="font-mono text-[#64748b]">{li.code}</span>
            <span className="flex-1">{li.name}</span>
            <span className="text-[#94a3b8]">{li.lineItemType}</span>
            <button
              type="button"
              className="text-[#dc2626]"
              onClick={() => onChange(items.filter((x) => x.code !== li.code))}
            >
              Remove
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-4 text-[#94a3b8]">None — API default pack will be used</li>
        )}
      </ul>
    </div>
  )
}

function FormulasEditor({
  lineItems,
  formulas,
  onChange,
}: {
  lineItems: SetupDraft["lineItems"]
  formulas: SetupDraft["formulas"]
  onChange: (f: SetupDraft["formulas"]) => void
}) {
  if (!lineItems.length) {
    return (
      <p className="text-xs text-[#94a3b8]">
        Add or load line items first. Example: LINE(&apos;REVENUE&apos;) - LINE(&apos;COGS&apos;)
      </p>
    )
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[#64748b]">
        Use LINE(&apos;CODE&apos;) references. Only CALC rows usually need formulas.
      </p>
      {lineItems.map((li) => {
        const fx = formulas.find((f) => f.lineItemCode === li.code)
        return (
          <Field key={li.code} label={`${li.code} (${li.lineItemType})`}>
            <input
              className={`${FIELD} font-mono`}
              value={fx?.expression || ""}
              placeholder={li.lineItemType === "CALC" ? "LINE('A') - LINE('B')" : "Optional"}
              onChange={(e) => {
                const expression = e.target.value
                const rest = formulas.filter((f) => f.lineItemCode !== li.code)
                onChange(expression.trim() ? [...rest, { lineItemCode: li.code, expression }] : rest)
              }}
            />
          </Field>
        )
      })}
    </div>
  )
}

function DriversEditor({
  drivers,
  onChange,
}: {
  drivers: SetupDraft["drivers"]
  onChange: (d: SetupDraft["drivers"]) => void
}) {
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [value, setValue] = useState("1.05")
  const add = () => {
    if (!code.trim() || !name.trim()) return toast.error("Code and name required")
    if (drivers.some((d) => d.code.toUpperCase() === code.trim().toUpperCase())) {
      return toast.error("Code already added")
    }
    onChange([
      ...drivers,
      {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        value: asNumber(value),
        category: "GENERAL",
      },
    ])
    setCode("")
    setName("")
    setValue("1.05")
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[#64748b]">Optional planning drivers (e.g. GROWTH = 1.05).</p>
      <div className="flex flex-wrap gap-2 items-end">
        <Field label="Code">
          <input className={`${FIELD} w-24`} value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Name">
          <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Value">
          <input className={`${FIELD} w-20`} value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <button type="button" onClick={add} className="h-9 rounded-full bg-[#2563eb] px-3 text-xs text-white">
          Add
        </button>
      </div>
      <ul className="text-xs divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-xl">
        {drivers.map((d) => (
          <li key={d.code} className="flex gap-2 px-3 py-2">
            <span className="font-mono">{d.code}</span>
            <span className="flex-1">{d.name}</span>
            <span>{d.value}</span>
            <button
              type="button"
              className="text-[#dc2626]"
              onClick={() => onChange(drivers.filter((x) => x.code !== d.code))}
            >
              Remove
            </button>
          </li>
        ))}
        {drivers.length === 0 && <li className="px-3 py-3 text-[#94a3b8]">None (optional)</li>}
      </ul>
    </div>
  )
}

function WorkflowEditor({
  name,
  tasks,
  onNameChange,
  onTasksChange,
}: {
  name: string
  tasks: SetupDraft["workflowTasks"]
  onNameChange: (n: string) => void
  onTasksChange: (t: SetupDraft["workflowTasks"]) => void
}) {
  const [taskTitle, setTaskTitle] = useState("")
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#64748b]">
        Optional. Workflow is created only if a name is set.
      </p>
      <Field label="Planning cycle name">
        <input
          className={FIELD}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="FY2026 Budget Cycle"
        />
      </Field>
      {!!name.trim() && (
        <>
          <div className="flex flex-wrap gap-2 items-end">
            <Field label="Task title">
              <input
                className={FIELD}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Finance input"
              />
            </Field>
            <button
              type="button"
              onClick={() => {
                if (!taskTitle.trim()) return
                onTasksChange([...tasks, { title: taskTitle.trim() }])
                setTaskTitle("")
              }}
              className="h-9 rounded-full bg-[#2563eb] px-3 text-xs text-white"
            >
              Add task
            </button>
          </div>
          <ul className="text-xs divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-xl">
            {tasks.map((t, i) => (
              <li key={`${t.title}-${i}`} className="flex gap-2 px-3 py-2">
                <span className="flex-1">{t.title}</span>
                <button
                  type="button"
                  className="text-[#dc2626]"
                  onClick={() => onTasksChange(tasks.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </li>
            ))}
            {tasks.length === 0 && (
              <li className="px-3 py-3 text-[#94a3b8]">No tasks — default “Finance input” will be sent</li>
            )}
          </ul>
        </>
      )}
    </div>
  )
}
