"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "@/components/fpa/fpa-page-header"
import { FpaStatusBadge } from "@/components/fpa/fpa-status-badge"
import {
  BUDGET_BASELINE_METHODS,
  BUDGET_INPUT_CATEGORIES,
  BUDGET_PURPOSE,
  BUDGET_STATUS_LABEL,
  PLANNING_CYCLE_TYPES,
  formatStageLabel,
  getCycleNextStep,
  isOwnerTaskSubmitted,
  stageIndex,
  statusTone,
} from "@/components/fpa/budget/budget-constants"
import {
  fpaApi,
  type FpaBaselineMode,
  type FpaBudgetCycle,
  type FpaBudgetCycleCreateRequest,
  type FpaBudgetInputCategory,
  type FpaModel,
  type FpaOwnerWorkspace,
  type FpaScenario,
  type FpaVersion,
} from "@/lib/api/fpa-api"
import { departmentApiService } from "@/lib/api/department-api"
import { usersApi, type AppUser } from "@/lib/api/users-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  bootstrapFpaSelection,
  fetchMyFpaTasks,
  setSelectedModelId,
} from "@/lib/store/slices/fpaSlice"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { humanizeDeptIdsInText, looksLikeDbId } from "@/lib/fpa/humanize-dept-message"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const FIELD =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a] bg-white"
const SELECT_TRIGGER =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172a] shadow-none focus:ring-2 focus:ring-[#2563eb]/30"

function humanDeptName(
  departmentId?: string | null,
  departmentName?: string | null,
  owners?: FpaBudgetCycle["owners"],
  deptById?: Map<string, string>,
): string {
  if (departmentName && !looksLikeDbId(departmentName)) return departmentName
  if (departmentId) {
    const fromOwner = owners?.find((o) => o.departmentId === departmentId)?.departmentName
    if (fromOwner && !looksLikeDbId(fromOwner)) return fromOwner
    const mapped = deptById?.get(departmentId)
    if (mapped) return mapped
  }
  return "Department"
}

export function FpaBudgetCycles() {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const cycleIdFromUrl = searchParams.get("cycleId")
  const { selectedModelId, selectedVersionId, selectedScenarioId, models, versions, scenarios, tasks, bootstrapped, loadingModels } =
    useAppSelector((s) => s.fpa)
  const {
    canAssignTasks,
    canReviewSubmissions,
    canApproveBudget,
    canLockVersion,
    canSubmitTask,
    canEditGrid,
    isAdmin,
  } = useFpaPermissions()

  const userDetails = useAppSelector((s) => s.auth.userDetails)
  const currentUserId =
    userDetails?.id ||
    (userDetails as { userId?: string } | null)?.userId ||
    null

  const canSeeAllCycles =
    isAdmin || canAssignTasks || canReviewSubmissions || canApproveBudget || canLockVersion

  const canCreateCycle = canAssignTasks || isAdmin
  const model = models.find((m) => m.id === selectedModelId)
  const year = model?.startPeriod
    ? new Date(model.startPeriod).getUTCFullYear()
    : new Date().getFullYear()

  const [cycles, setCycles] = useState<FpaBudgetCycle[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(cycleIdFromUrl)
  const [loading, setLoading] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<
    Array<{ code: string; message: string; departmentId?: string; category?: string }>
  >([])
  const [validationPassed, setValidationPassed] = useState<boolean | null>(null)

  const upsertCycle = useCallback((cycle: FpaBudgetCycle) => {
    setCycles((prev) => {
      const rest = prev.filter((c) => c.id !== cycle.id)
      return [cycle, ...rest]
    })
    setSelectedId(cycle.id)
  }, [])

  const cycleIsVisibleToUser = useCallback(
    (cycle: FpaBudgetCycle) => {
      if (canSeeAllCycles) return true
      if (!currentUserId) return false
      if (cycle.cycleOwnerId === currentUserId) return true
      if (cycle.owners?.some((o) => o.assigneeId === currentUserId)) return true
      if (
        tasks.some(
          (t) =>
            t.assigneeId === currentUserId &&
            (t.workflowId === cycle.workflowId ||
              cycle.tasks?.some((x) => x.id === t.id) ||
              cycle.owners?.some((o) => o.taskId === t.id)),
        )
      ) {
        return true
      }
      return false
    },
    [canSeeAllCycles, currentUserId, tasks],
  )

  const visibleCycles = useMemo(
    () => cycles.filter(cycleIsVisibleToUser),
    [cycles, cycleIsVisibleToUser],
  )

  const selected = visibleCycles.find((c) => c.id === selectedId) || visibleCycles[0] || null

  const myOwnerTasks = useMemo(() => {
    if (!selected || !currentUserId) return []
    return tasks.filter(
      (t) =>
        t.assigneeId === currentUserId &&
        (t.workflowId === selected.workflowId ||
          selected.tasks?.some((x) => x.id === t.id) ||
          selected.owners?.some((o) => o.taskId === t.id)),
    )
  }, [tasks, selected, currentUserId])

  const refresh = useCallback(async () => {
    if (!selectedModelId) {
      setCycles([])
      setLoadError(null)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fpaApi.listBudgetCycles({ modelId: selectedModelId })
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || "listBudgetCycles failed")
      }
      setCycles(res.data)
      const visible = canSeeAllCycles
        ? res.data!
        : res.data!.filter((c) => {
            if (!currentUserId) return false
            if (c.cycleOwnerId === currentUserId) return true
            if (c.owners?.some((o) => o.assigneeId === currentUserId)) return true
            return false
          })
      const preferred = cycleIdFromUrl
      setSelectedId((prev) => {
        if (preferred && visible.some((c) => c.id === preferred)) return preferred
        if (prev && visible.some((c) => c.id === prev)) return prev
        return visible[0]?.id ?? null
      })
      const detailId =
        preferred && visible.some((c) => c.id === preferred)
          ? preferred
          : selectedId && visible.some((c) => c.id === selectedId)
            ? selectedId
            : visible[0]?.id
      if (detailId) {
        try {
          const detail = await fpaApi.getBudgetCycle(detailId)
          if (detail.success && detail.data) {
            setCycles((prev) => {
              const rest = prev.filter((c) => c.id !== detail.data!.id)
              return [detail.data!, ...rest]
            })
            if (detail.data.validation) {
              setValidationPassed(detail.data.validation.passed)
              setValidationErrors(detail.data.validation.errors || [])
            }
          }
        } catch {
          /* list is enough */
        }
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/budget-cycles",
        method: "GET",
        message: errorMessage(err),
        impact: "Budget cycle list unavailable",
        response: err,
      })
      const message = errorMessage(err, "Failed to load budget cycles")
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [selectedModelId, selectedId, cycleIdFromUrl, canSeeAllCycles, currentUserId])

  // Deep-link: /forecasting/budget?cycleId=… — select model + cycle from notification
  useEffect(() => {
    if (!cycleIdFromUrl) return
    let cancelled = false
    ;(async () => {
      try {
        const detail = await fpaApi.getBudgetCycle(cycleIdFromUrl)
        if (cancelled || !detail.success || !detail.data) return
        const cycle = detail.data
        if (!canSeeAllCycles && currentUserId) {
          const assigned =
            cycle.cycleOwnerId === currentUserId ||
            cycle.owners?.some((o) => o.assigneeId === currentUserId)
          if (!assigned) return
        }
        if (cycle.modelId && cycle.modelId !== selectedModelId) {
          dispatch(setSelectedModelId(cycle.modelId))
        }
        setSelectedId(cycle.id)
        upsertCycle(cycle)
        if (cycle.validation) {
          setValidationPassed(cycle.validation.passed)
          setValidationErrors(cycle.validation.errors || [])
        }
      } catch {
        /* list refresh may still find it */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cycleIdFromUrl, dispatch, selectedModelId, upsertCycle, canSeeAllCycles, currentUserId])

  useEffect(() => {
    void refresh()
    void dispatch(fetchMyFpaTasks())
  }, [selectedModelId, dispatch]) // eslint-disable-line react-hooks/exhaustive-deps -- refresh on model change

  useEffect(() => {
    if (!selectedId) return
    if (visibleCycles.some((c) => c.id === selectedId)) return
    setSelectedId(visibleCycles[0]?.id ?? null)
  }, [visibleCycles, selectedId])

  const runAction = async (
    label: string,
    fn: () => Promise<FpaBudgetCycle | void | null | undefined>,
    path: string,
    actionKey?: string,
  ) => {
    if (!selected) return
    const key =
      actionKey ||
      (path.includes("/tasks/") && path.endsWith("/submit")
        ? "submit-task"
        : path.split("/").filter(Boolean).pop() || path)
    setBusyKey(key)
    try {
      const updated = await fn()
      if (updated && typeof updated === "object" && "id" in updated) {
        upsertCycle(updated)
      } else {
        const detail = await fpaApi.getBudgetCycle(selected.id)
        if (detail.success && detail.data) upsertCycle(detail.data)
        else await refresh()
      }
      toast.success(label)
      setComment("")
      await dispatch(fetchMyFpaTasks())
      if (selectedModelId) await dispatch(bootstrapFpaSelection(selectedModelId))
    } catch (err) {
      const code = (err as { response?: { code?: string }; status?: number })?.response?.code
      const status = (err as { status?: number })?.status
      logFpaGap({
        category: "broken",
        path,
        method: "POST",
        message: errorMessage(err),
        impact: `Budget action failed: ${label}`,
        response: err,
      })
      if (status === 409 || code === "INVALID_TRANSITION") {
        toast.error(errorMessage(err, "Invalid transition for this cycle status"))
      } else if (code === "BOARD_PACK_FAILED") {
        toast.error(errorMessage(err, "Board pack generation failed"))
      } else if (code === "SETUP_INCOMPLETE" || code === "VERSION_NOT_READY") {
        toast.error(errorMessage(err, code === "VERSION_NOT_READY"
          ? "Selected version is not ready for budgeting"
          : "Planning cycle cannot be opened — setup requirements remain"))
      } else {
        toast.error(errorMessage(err, label))
      }
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader
        title="Budgeting"
        hideFilters
        hideSearch
        actions={
          canCreateCycle ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-3 text-xs font-medium text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              New budget cycle
            </button>
          ) : undefined
        }
      />

      <div className="p-4 sm:p-5 space-y-4">
        <section className="rounded-md border border-[#e2e8f0] bg-white px-4 py-3">
          <p className="text-xs text-[#64748b]">
            <span className="font-semibold text-[#0f172a]">Purpose. </span>
            {BUDGET_PURPOSE}
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void refresh()}
            className="h-8 inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-3 text-xs text-[#475569]"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            <span>{loadError}</span>
            <button
              type="button"
              className="ml-3 rounded-full border border-[#fca5a5] bg-white px-3 py-1 text-xs font-medium hover:bg-[#fff7f7]"
              onClick={() => void refresh()}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {!selectedModelId ? (
              <div className="rounded-md border border-dashed border-[#cbd5e1] bg-white p-10 text-center">
                <p className="text-sm font-medium text-[#0f172a]">
                  {loadingModels || !bootstrapped ? "Loading models…" : "Pick a model to list cycles"}
                </p>
                <p className="text-xs text-[#64748b] mt-1">
                  {loadingModels || !bootstrapped
                    ? "Setting up your FP&A model context."
                    : "Open Models and select a working model, or use New budget cycle to choose one."}
                </p>
                {canCreateCycle && bootstrapped && !loadingModels && (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="mt-4 h-9 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white"
                  >
                    Create annual budget cycle
                  </button>
                )}
              </div>
            ) : loadError && visibleCycles.length === 0 ? (
              <div className="rounded-md border border-[#fecaca] bg-white p-10 text-center">
                <p className="text-sm font-medium text-[#991b1b]">Budget cycles could not be loaded</p>
                <p className="mt-1 text-xs text-[#64748b]">Retry to restore the canonical budget-cycle list.</p>
              </div>
            ) : loading && visibleCycles.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-16 text-[#64748b] text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading cycles…
              </div>
            ) : visibleCycles.length === 0 ? (
              <div className="rounded-md border border-dashed border-[#cbd5e1] bg-white p-10 text-center">
                <p className="text-sm font-medium text-[#0f172a]">No budget cycles for you</p>
                <p className="text-xs text-[#64748b] mt-1 max-w-md mx-auto">
                  {canSeeAllCycles
                    ? "Create a cycle, assign department owners and users, then run the review path."
                    : "You only see cycles where you are assigned as a department owner. Ask FP&A if you expected a cycle here."}
                </p>
                {canCreateCycle && (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="mt-4 h-9 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white"
                  >
                    Create annual budget cycle
                  </button>
                )}
              </div>
            ) : (
              visibleCycles.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id)
                    setValidationErrors([])
                    setValidationPassed(null)
                    void fpaApi.getBudgetCycle(c.id).then((res) => {
                      if (res.success && res.data) upsertCycle(res.data)
                    })
                  }}
                  className={cn(
                    "w-full text-left rounded-md border bg-white p-4 transition-colors",
                    selectedId === c.id
                      ? "border-[#2563eb] ring-1 ring-[#2563eb]/20"
                      : "border-[#e2e8f0] hover:bg-[#f8fafc]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-[#0f172a] truncate">{c.name}</h2>
                      <p className="text-[11px] text-[#64748b] mt-1">
                        FY{c.fiscalYear} · Stage {formatStageLabel(c.currentStage)}
                        {c.owners?.length
                          ? ` · ${c.owners.length} owner${c.owners.length === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    </div>
                    <FpaStatusBadge tone={statusTone(c.status)}>
                      {BUDGET_STATUS_LABEL[c.status] || c.status}
                    </FpaStatusBadge>
                  </div>
                  <StageRail stage={c.currentStage} status={c.status} />
                </button>
              ))
            )}
          </div>

          <CycleDetailPanel
            cycle={selected}
            busyKey={busyKey}
            comment={comment}
            onComment={setComment}
            myTasks={myOwnerTasks}
            currentUserId={currentUserId}
            validationErrors={validationErrors}
            validationPassed={validationPassed}
            onValidation={(passed, errors) => {
              setValidationPassed(passed)
              setValidationErrors(errors)
            }}
            canEditGrid={canEditGrid}
            canSubmitTask={canSubmitTask}
            canReviewSubmissions={canReviewSubmissions}
            canApproveBudget={canApproveBudget}
            canLockVersion={canLockVersion}
            canAssignTasks={canAssignTasks}
            isAdmin={isAdmin}
            modelId={selectedModelId || selected?.modelId || ""}
            onAction={runAction}
            onRefresh={refresh}
          />
        </div>
      </div>

      {createOpen && (
        <CreateBudgetCycleModal
          models={models}
          initialModelId={selectedModelId}
          initialVersionId={selectedVersionId}
          initialScenarioId={selectedScenarioId}
          initialScenarios={scenarios}
          initialVersions={versions.length ? versions : model?.versions || []}
          fiscalYear={year}
          onClose={() => setCreateOpen(false)}
          onCreated={(cycle) => {
            if (cycle.modelId) {
              dispatch(setSelectedModelId(cycle.modelId))
              void dispatch(bootstrapFpaSelection(cycle.modelId))
            }
            upsertCycle(cycle)
            setCreateOpen(false)
            setValidationErrors([])
            setValidationPassed(null)
            void refresh()
          }}
        />
      )}
    </div>
  )
}

function StageRail({
  stage,
  status,
}: {
  stage: string
  status: string
}) {
  const idx = stageIndex(stage)
  const steps = ["Setup", "Input", "FP&A", "CFO", "Lock"]
  const map = Math.min(4, Math.floor(idx / 2))
  const returned = status === "RETURNED_FOR_CORRECTION"
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1 min-w-0">
          <div
            className={cn(
              "h-1.5 flex-1 rounded-full",
              returned && i <= map
                ? "bg-[#fca5a5]"
                : i <= map
                  ? "bg-[#2563eb]"
                  : "bg-[#e2e8f0]",
            )}
            title={label}
          />
        </div>
      ))}
    </div>
  )
}

function CycleDetailPanel({
  cycle,
  busyKey,
  comment,
  onComment,
  myTasks,
  currentUserId,
  validationErrors,
  validationPassed,
  onValidation,
  canEditGrid,
  canSubmitTask,
  canReviewSubmissions,
  canApproveBudget,
  canLockVersion,
  canAssignTasks,
  isAdmin,
  modelId,
  onAction,
  onRefresh,
}: {
  cycle: FpaBudgetCycle | null
  busyKey: string | null
  comment: string
  onComment: (v: string) => void
  myTasks: FpaBudgetCycle["tasks"]
  currentUserId?: string | null
  validationErrors: Array<{ code: string; message: string; departmentId?: string; category?: string }>
  validationPassed: boolean | null
  onValidation: (
    passed: boolean,
    errors: Array<{ code: string; message: string; departmentId?: string; category?: string }>,
  ) => void
  canEditGrid: boolean
  canSubmitTask: boolean
  canReviewSubmissions: boolean
  canApproveBudget: boolean
  canLockVersion: boolean
  canAssignTasks: boolean
  isAdmin?: boolean
  modelId: string
  onAction: (
    label: string,
    fn: () => Promise<FpaBudgetCycle | void | null | undefined>,
    path: string,
    actionKey?: string,
  ) => Promise<void>
  onRefresh: () => Promise<void>
}) {
  const [workspace, setWorkspace] = useState<FpaOwnerWorkspace | null>(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [reopenReason, setReopenReason] = useState("")
  const [deptById, setDeptById] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let cancelled = false
    void departmentApiService
      .getDepartments()
      .then((res) => {
        if (cancelled) return
        const rows = Array.isArray(res?.data)
          ? res.data
          : Array.isArray((res as { departments?: unknown[] })?.departments)
            ? (res as { departments: unknown[] }).departments
            : []
        const map = new Map<string, string>()
        for (const raw of rows) {
          const row = raw as { id?: string; departmentId?: string; name?: string; departmentName?: string }
          const id = String(row.id || row.departmentId || "")
          const name = String(row.name || row.departmentName || "")
          if (id && name && !looksLikeDbId(name)) map.set(id, name)
        }
        setDeptById(map)
      })
      .catch(() => {
        /* owners map is enough for most cycles */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!cycle?.id) {
      setWorkspace(null)
      return
    }
    let cancelled = false
    setWorkspaceLoading(true)
    void fpaApi
      .getOwnerWorkspace(cycle.id)
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) setWorkspace(res.data)
        else setWorkspace(null)
        setDeptById((prev) => {
          const next = new Map(prev)
          for (const o of cycle.owners || []) {
            if (o.departmentId && o.departmentName && !looksLikeDbId(o.departmentName)) {
              next.set(o.departmentId, o.departmentName)
            }
          }
          for (const row of res.data?.departmentBudgetRegister || []) {
            const id = String(row.departmentId || "")
            const name = String(row.departmentName || "")
            if (id && name && !looksLikeDbId(name)) next.set(id, name)
          }
          return next
        })
      })
      .catch(() => {
        if (!cancelled) setWorkspace(null)
      })
      .finally(() => {
        if (!cancelled) setWorkspaceLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cycle?.id, cycle?.status, cycle?.updatedAt])

  if (!cycle) {
    return (
      <aside className="rounded-md border border-[#e2e8f0] bg-white p-5 text-sm text-[#94a3b8]">
        Select a cycle to see what to do next.
      </aside>
    )
  }

  const st = cycle.status
  const myOwnerRow =
    (currentUserId
      ? cycle.owners?.find((o) => o.assigneeId === currentUserId)
      : null) ||
    cycle.owners?.find((o) => myTasks?.some((t) => t.id === o.taskId)) ||
    null
  const myTask =
    myTasks?.find((t) => t.id === myOwnerRow?.taskId) ||
    myTasks?.[0] ||
    null
  const ownerTaskId = myOwnerRow?.taskId || myTask?.id || null
  const myDepartmentId = myOwnerRow?.departmentId || ""
  const myTaskStatus = myTask?.status || myOwnerRow?.status
  const myTaskSubmitted = isOwnerTaskSubmitted(myTaskStatus)
  const isAssignee = Boolean(
    (currentUserId && myOwnerRow?.assigneeId === currentUserId) ||
      myTask ||
      (canSubmitTask && myOwnerRow),
  )
  const isReviewerRole =
    Boolean(isAdmin) ||
    canReviewSubmissions ||
    canApproveBudget ||
    canLockVersion ||
    canAssignTasks
  const showWorkspaceBtn = canEditGrid || isAssignee || isReviewerRole
  const showApprovalsBtn = isReviewerRole
  const ownersList = cycle.owners || []
  const allOwnersSubmitted =
    ownersList.length > 0 && ownersList.every((o) => isOwnerTaskSubmitted(o.status))
  const submittedOwners = ownersList.filter((o) => isOwnerTaskSubmitted(o.status)).length
  const derivedProgressPct =
    ownersList.length > 0 ? Math.round((submittedOwners / ownersList.length) * 100) : 0
  const derivedOpenTaskCount = ownersList.filter((o) => !isOwnerTaskSubmitted(o.status)).length

  const ownerProgressPct = workspace?.budgetProgress?.percent ?? derivedProgressPct
  const dueIso =
    workspace?.submissionDue?.date ||
    myTask?.dueDate ||
    cycle.submissionDeadline ||
    cycle.endDate ||
    null
  const daysRemaining =
    workspace?.submissionDue?.daysRemaining ??
    (() => {
      if (!dueIso) return null
      const due = new Date(dueIso)
      if (!Number.isFinite(due.getTime())) return null
      return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    })()
  const openTaskCount = workspace?.openTasks?.count ?? derivedOpenTaskCount
  const completedTaskCount =
    workspace?.openTasks?.completedCount ?? submittedOwners
  const validationIssueCount =
    workspace?.validationIssues?.count ?? validationErrors.length
  const validationNeedsAttention =
    workspace?.validationIssues?.needsAttention ?? validationPassed === false

  const worksheetQs = new URLSearchParams()
  worksheetQs.set("modelId", modelId)
  if (ownerTaskId) worksheetQs.set("taskId", ownerTaskId)
  if (myDepartmentId) worksheetQs.set("departmentId", myDepartmentId)
  if (cycle.name) worksheetQs.set("cycleName", cycle.name)
  if (myOwnerRow?.departmentName) worksheetQs.set("departmentName", myOwnerRow.departmentName)
  if (dueIso) worksheetQs.set("dueDate", String(dueIso).slice(0, 10))
  if (cycle.versionId) worksheetQs.set("versionId", cycle.versionId)
  if (cycle.scenarioId) worksheetQs.set("scenarioId", cycle.scenarioId)
  const worksheetHref = `/forecasting/budget/${encodeURIComponent(cycle.id)}/workspace?${worksheetQs.toString()}`

  const planningAreas = (workspace?.planningAreas?.length
    ? workspace.planningAreas.map((a) => {
        const meta = BUDGET_INPUT_CATEGORIES.find((c) => c.id === a.area)
        const stLabel =
          a.status === "COMPLETE"
            ? "Complete"
            : a.status === "IN_PROGRESS"
              ? "In Progress"
              : "Not Started"
        return {
          id: `${a.departmentId || ""}-${a.area}`,
          label: meta?.label || a.area,
          status: stLabel as "Complete" | "In Progress" | "Not Started",
          detail:
            a.totalCells != null
              ? `${a.filledCells ?? 0}/${a.totalCells}`
              : undefined,
        }
      })
    : (cycle.inputCategories?.length
        ? cycle.inputCategories
        : BUDGET_INPUT_CATEGORIES.map((c) => c.id)
      ).map((id) => {
        const meta = BUDGET_INPUT_CATEGORIES.find((c) => c.id === id)
        let areaStatus: "Complete" | "In Progress" | "Not Started" = "Not Started"
        if (myTaskSubmitted || allOwnersSubmitted) areaStatus = "Complete"
        else if (st === "OPEN_FOR_INPUT" || st === "RETURNED_FOR_CORRECTION") {
          areaStatus = "In Progress"
        }
        return { id, label: meta?.label || id, status: areaStatus, detail: undefined as string | undefined }
      }))

  const registerRows =
    workspace?.departmentBudgetRegister?.length
      ? workspace.departmentBudgetRegister.map((r) => {
          const dept = humanDeptName(r.departmentId, r.departmentName, cycle.owners, deptById)
          return {
            key: `${r.departmentId}-${r.account}`,
            label: `${dept}${r.account ? ` · ${r.account}` : ""}`,
            right:
              r.currentBudget != null
                ? `${Number(r.currentBudget).toLocaleString()}${
                    r.changePct != null ? ` (${r.changePct > 0 ? "+" : ""}${r.changePct}%)` : ""
                  }`
                : r.status || r.method || "—",
          }
        })
      : (cycle.owners || []).map((o) => ({
          key: `${o.departmentId}-${o.assigneeId || o.taskId || ""}`,
          label: `${humanDeptName(o.departmentId, o.departmentName, cycle.owners, deptById)}${
            o.assigneeName ? ` · ${o.assigneeName}` : ""
          }`,
          right: o.status || "Pending",
          badge: true as boolean,
          status: o.status,
        }))

  const next = getCycleNextStep({
    status: st,
    myTaskStatus,
    owners: cycle.owners,
    canEditGrid,
    canSubmitTask,
    canAssignTasks,
    canReviewSubmissions,
    canApproveBudget,
    canLockVersion,
    validationPassed,
    hasBoardPack: Boolean(cycle.boardPackUrl),
  })

  const showDraftOpen = canAssignTasks && st === "DRAFT"

  const showPrep =
    canAssignTasks &&
    (st === "DRAFT" ||
      st === "LOADING_ACTUALS" ||
      st === "LOADING_BASELINE" ||
      st === "OPEN_FOR_INPUT") &&
    !allOwnersSubmitted

  const showOwnerSubmit =
    canSubmitTask &&
    Boolean(ownerTaskId) &&
    !myTaskSubmitted &&
    (st === "OPEN_FOR_INPUT" || st === "RETURNED_FOR_CORRECTION")

  const submitUnmet: string[] = []
  if (workspace?.unmetRequirements?.length) {
    workspace.unmetRequirements.forEach((u) =>
      submitUnmet.push(humanizeDeptIdsInText(u.message, deptById)),
    )
  } else {
    if (!ownerTaskId) submitUnmet.push("No open owner task is assigned to you for this cycle.")
    if (myTaskSubmitted) submitUnmet.push("Your departmental plan is already submitted.")
    if (validationPassed === false && validationErrors.length) {
      validationErrors.forEach((e) =>
        submitUnmet.push(
          humanizeDeptIdsInText(
            e.message + (e.category ? ` (${e.category})` : ""),
            deptById,
          ),
        ),
      )
    }
  }
  const ownerSubmitBlocked =
    workspace?.canSubmit === false ||
    (workspace?.canSubmit == null && submitUnmet.length > 0)

  const showValidate =
    canAssignTasks &&
    (st === "OPEN_FOR_INPUT" ||
      st === "RETURNED_FOR_CORRECTION" ||
      st === "PENDING_VALIDATION") &&
    (allOwnersSubmitted || validationPassed !== null || next.primaryKind === "validate")

  const showSubmitFpa =
    canAssignTasks &&
    (st === "OPEN_FOR_INPUT" ||
      st === "RETURNED_FOR_CORRECTION" ||
      st === "PENDING_VALIDATION") &&
    validationPassed === true

  const anyBusy = busyKey != null
  const isBusy = (key: string) => busyKey === key

  const primaryClass =
    "h-10 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#2563eb] text-white text-sm font-medium disabled:opacity-50"
  const secondaryClass =
    "h-9 w-full inline-flex items-center justify-center gap-1 rounded-full border border-[#e2e8f0] bg-white text-xs font-medium text-[#0f172a] disabled:opacity-50"

  return (
    <aside className="rounded-md border border-[#e2e8f0] bg-white p-4 sm:p-5 space-y-4 h-fit xl:sticky xl:top-16">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#0f172a] truncate">{cycle.name}</h2>
          <p className="text-[11px] text-[#64748b] mt-1">
            FY{cycle.fiscalYear} · {formatStageLabel(cycle.currentStage)}
            {workspaceLoading ? " · Loading workspace…" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <FpaStatusBadge tone={statusTone(cycle.status)}>
            {BUDGET_STATUS_LABEL[cycle.status] || cycle.status}
          </FpaStatusBadge>
          <button
            type="button"
            disabled={anyBusy}
            onClick={() => void onRefresh()}
            className="h-7 w-7 inline-flex items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f8fafc] disabled:opacity-50"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", anyBusy && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
          What to do next
        </p>
        <p className="text-sm font-semibold text-[#0f172a] mt-1">{next.title}</p>
        <p className="text-[12px] text-[#64748b] mt-0.5 leading-relaxed">{next.body}</p>
      </div>

      {validationPassed !== null && (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-[11px]",
            validationPassed
              ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
              : "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
          )}
        >
          {validationPassed
            ? "Validation passed — you can submit to FP&A"
            : `Validation failed — ${validationErrors.length} requirement${validationErrors.length === 1 ? "" : "s"} remain:`}
          {validationErrors.length > 0 && (
            <ul className="mt-1.5 space-y-1 list-disc pl-4 text-[#7f1d1d]">
              {validationErrors.map((e, i) => (
                <li key={`${e.code}-${i}`}>
                  {humanizeDeptIdsInText(
                    e.message + (e.category ? ` (${e.category})` : ""),
                    deptById,
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Owner workspace summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-2">
          <p className="text-[10px] font-medium text-[#94a3b8]">Budget progress</p>
          <p className="text-sm font-semibold text-[#0f172a] mt-0.5 tabular-nums">
            {ownerProgressPct}%
          </p>
          <p className="text-[10px] text-[#64748b]">
            {completedTaskCount}/{ownersList.length || completedTaskCount + openTaskCount} submitted
          </p>
        </div>
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-2">
          <p className="text-[10px] font-medium text-[#94a3b8]">Submission due</p>
          <p className="text-sm font-semibold text-[#0f172a] mt-0.5">
            {dueIso ? String(dueIso).slice(0, 10) : "Due date pending"}
          </p>
          <p className="text-[10px] text-[#64748b]">
            {daysRemaining == null
              ? "—"
              : daysRemaining < 0
                ? `${Math.abs(daysRemaining)}d overdue`
                : `${daysRemaining}d remaining`}
          </p>
        </div>
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-2">
          <p className="text-[10px] font-medium text-[#94a3b8]">Open tasks</p>
          <p className="text-sm font-semibold text-[#0f172a] mt-0.5 tabular-nums">
            {openTaskCount}
          </p>
          <p className="text-[10px] text-[#64748b]">{completedTaskCount} completed</p>
        </div>
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-2">
          <p className="text-[10px] font-medium text-[#94a3b8]">Validation issues</p>
          <p className="text-sm font-semibold text-[#0f172a] mt-0.5 tabular-nums">
            {validationIssueCount}
          </p>
          <p className="text-[10px] text-[#64748b]">
            {validationNeedsAttention
              ? "Needs attention"
              : validationPassed
                ? "Clear"
                : "Not run"}
          </p>
        </div>
      </div>

      {planningAreas.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-[#0f172a] mb-1.5">Planning areas</p>
          <ul className="space-y-1">
            {planningAreas.map((a) => (
              <li
                key={a.id}
                className="text-[11px] flex justify-between gap-2 rounded-md px-2.5 py-1.5 bg-[#f8fafc]"
              >
                <span className="text-[#0f172a]">
                  {a.label}
                  {a.detail ? (
                    <span className="text-[#94a3b8]"> · {a.detail}</span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "font-medium shrink-0",
                    a.status === "Complete" && "text-[#166534]",
                    a.status === "In Progress" && "text-[#2563eb]",
                    a.status === "Not Started" && "text-[#94a3b8]",
                  )}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showOwnerSubmit && ownerSubmitBlocked && (
        <div className="rounded-md border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[11px] text-[#92400e]">
          <p className="font-semibold text-[#0f172a]">
            Submit blocked — {submitUnmet.length}{" "}
            {submitUnmet.length === 1 ? "requirement unmet" : "requirements unmet"}:
          </p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            {submitUnmet.map((m, i) => (
              <li key={`${m}-${i}`}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {showDraftOpen && (
          <>
            <ActionBtn
              busy={isBusy("validate-setup")}
              blocked={anyBusy && !isBusy("validate-setup")}
              label="Validate setup"
              primary
              fullWidth
              onClick={() =>
                void onAction(
                  "Setup validation complete",
                  async () => {
                    const res = await fpaApi.validateBudgetSetup(cycle.id)
                    if (!res.success || !res.data) {
                      throw new Error(res.message || "validate-setup failed")
                    }
                    onValidation(res.data.passed, res.data.errors || [])
                    if (!res.data.passed) {
                      const n = res.data.errors?.length || 0
                      throw new Error(
                        res.data.message?.split("\n")[0] ||
                          (n
                            ? `Planning cycle cannot be opened. ${n} requirements remain.`
                            : "Setup incomplete"),
                      )
                    }
                    return undefined
                  },
                  `/v1/fpa/budget-cycles/${cycle.id}/validate-setup`,
                  "validate-setup",
                )
              }
            />
            <ActionBtn
              busy={isBusy("open-cycle")}
              blocked={anyBusy && !isBusy("open-cycle")}
              label="Open cycle for input"
              fullWidth
              onClick={() =>
                void onAction(
                  "Cycle opened for input",
                  async () => {
                    const res = await fpaApi.openBudgetCycle(cycle.id, {
                      loadPriorActuals: true,
                      loadBaseline: true,
                    })
                    if (!res.success || !res.data) {
                      const errs = (res as { errors?: Array<{ message?: string }> }).errors
                      if (Array.isArray(errs) && errs.length) {
                        onValidation(false, errs.map((e) => ({
                          code: "SETUP_INCOMPLETE",
                          message: e.message || "Requirement unmet",
                        })))
                      }
                      throw new Error(res.message || "open failed")
                    }
                    const rows = res.data.actualsRowCount
                    const reason = res.data.actualsLoadReason
                    if (typeof rows === "number") {
                      toast.message(
                        `Actuals loaded: ${rows} rows${reason ? ` — ${reason}` : ""}`,
                      )
                    }
                    return res.data
                  },
                  `/v1/fpa/budget-cycles/${cycle.id}/open`,
                  "open-cycle",
                )
              }
            />
          </>
        )}

        {/* Navigation CTAs — workspace for assignees; workspace + approvals for CFO/admin */}
        {showWorkspaceBtn && (
          <Link
            href={worksheetHref}
            className={
              showApprovalsBtn && (st === "PENDING_FPA_REVIEW" || st === "PENDING_CFO_REVIEW" || st === "APPROVED" || st === "LOCKED")
                ? secondaryClass
                : next.primaryKind === "worksheet" || st === "LOCKED" || st === "APPROVED"
                  ? primaryClass
                  : secondaryClass
            }
          >
            Open my workspace
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {showApprovalsBtn && (
          <Link
            href={`/forecasting/workflow?cycleId=${encodeURIComponent(cycle.id)}`}
            className={
              st === "PENDING_FPA_REVIEW" ||
              st === "PENDING_CFO_REVIEW" ||
              st === "APPROVED" ||
              st === "LOCKED"
                ? primaryClass
                : secondaryClass
            }
          >
            Open in Workflow & Approvals
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {(showOwnerSubmit || showSubmitFpa) && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#0f172a]">
              {showOwnerSubmit ? "Change notes" : "Comment"}
            </label>
            <textarea
              className="w-full min-h-[64px] rounded-xl border border-[#e2e8f0] px-3 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8]"
              placeholder={
                showOwnerSubmit
                  ? "What changed vs prior year / baseline? (saved on submit)"
                  : "Optional comment for FP&A"
              }
              value={comment}
              onChange={(e) => onComment(e.target.value)}
            />
          </div>
        )}

        {next.primaryKind === "submit_task" && showOwnerSubmit && (
          <ActionBtn
            busy={isBusy("submit-task")}
            blocked={(anyBusy && !isBusy("submit-task")) || ownerSubmitBlocked}
            label="Submit my budget"
            primary
            fullWidth
            onClick={() =>
              void onAction(
                "Task submitted",
                async () => {
                  try {
                    const res = await fpaApi.submitTask(ownerTaskId!, {
                      changeNotes: comment.trim() || undefined,
                      comment: comment.trim() || undefined,
                    })
                    if (!res.success) throw new Error(res.message || "submit failed")
                    onComment("")
                    return undefined
                  } catch (err) {
                    const code = (err as { response?: { code?: string } })?.response?.code
                    const apiErrs = (
                      err as { response?: { errors?: Array<{ message?: string }> } }
                    )?.response?.errors
                    if (code === "SUBMISSION_BLOCKED" && Array.isArray(apiErrs) && apiErrs.length) {
                      onValidation(
                        false,
                        apiErrs.map((e) => ({
                          code: "SUBMISSION_BLOCKED",
                          message: e.message || "Requirement unmet",
                        })),
                      )
                    }
                    throw err
                  }
                },
                `/v1/fpa/tasks/${ownerTaskId}/submit`,
              )
            }
          />
        )}

        {next.primaryKind === "validate" && showValidate && (
          <ActionBtn
            busy={isBusy("validate")}
            blocked={anyBusy && !isBusy("validate")}
            label="Validate completeness"
            primary
            fullWidth
            onClick={() =>
              void onAction(
                "Validation complete",
                async () => {
                  const res = await fpaApi.validateBudgetCycle(cycle.id)
                  if (!res.success || !res.data) throw new Error(res.message || "validate failed")
                  onValidation(res.data.passed, res.data.errors || [])
                  if (!res.data.passed) {
                    const n = res.data.errors?.length || 0
                    throw new Error(
                      n
                        ? `Validation failed — ${n} requirement${n === 1 ? "" : "s"} remain`
                        : "Validation failed",
                    )
                  }
                  return undefined
                },
                `/v1/fpa/budget-cycles/${cycle.id}/validate`,
              )
            }
          />
        )}

        {next.primaryKind === "submit_fpa" && showSubmitFpa && (
          <ActionBtn
            busy={isBusy("submit-fpa")}
            blocked={anyBusy && !isBusy("submit-fpa")}
            label="Submit to FP&A"
            primary
            fullWidth
            onClick={() =>
              void onAction(
                "Submitted to FP&A review",
                async () => {
                  const res = await fpaApi.submitBudgetForFpaReview(cycle.id, {
                    comment: comment.trim() || undefined,
                  })
                  if (!res.success || !res.data) throw new Error(res.message || "submit-fpa failed")
                  return res.data
                },
                `/v1/fpa/budget-cycles/${cycle.id}/submit-fpa`,
              )
            }
          />
        )}

        {/* Review / approve / lock live on Workflow & Approvals — handled by showApprovalsBtn above */}

        {/* After worksheet primary, offer submit when owner still needs to */}
        {next.primaryKind === "worksheet" && showOwnerSubmit && (
          <ActionBtn
            busy={isBusy("submit-task")}
            blocked={(anyBusy && !isBusy("submit-task")) || ownerSubmitBlocked}
            label="Submit my budget"
            fullWidth
            onClick={() =>
              void onAction(
                "Task submitted",
                async () => {
                  const res = await fpaApi.submitTask(ownerTaskId!, {
                    changeNotes: comment.trim() || undefined,
                    comment: comment.trim() || undefined,
                  })
                  if (!res.success) throw new Error(res.message || "submit failed")
                  onComment("")
                  return undefined
                },
                `/v1/fpa/tasks/${ownerTaskId}/submit`,
              )
            }
          />
        )}

        {/* After validate primary, or when validation already passed */}
        {next.primaryKind === "validate" && validationPassed === true && showSubmitFpa && (
          <ActionBtn
            busy={isBusy("submit-fpa")}
            blocked={anyBusy && !isBusy("submit-fpa")}
            label="Submit to FP&A"
            fullWidth
            onClick={() =>
              void onAction(
                "Submitted to FP&A review",
                async () => {
                  const res = await fpaApi.submitBudgetForFpaReview(cycle.id, {
                    comment: comment.trim() || undefined,
                  })
                  if (!res.success || !res.data) throw new Error(res.message || "submit-fpa failed")
                  return res.data
                },
                `/v1/fpa/budget-cycles/${cycle.id}/submit-fpa`,
              )
            }
          />
        )}

        {/* Coordinator can still validate if waiting on owners but wants to check */}
        {next.primaryKind === "none" &&
          canAssignTasks &&
          showValidate &&
          !allOwnersSubmitted &&
          (st === "OPEN_FOR_INPUT" || st === "PENDING_VALIDATION") && (
            <ActionBtn
              busy={isBusy("validate")}
            blocked={anyBusy && !isBusy("validate")}
              label="Validate completeness"
              fullWidth
              onClick={() =>
                void onAction(
                  "Validation complete",
                  async () => {
                    const res = await fpaApi.validateBudgetCycle(cycle.id)
                    if (!res.success || !res.data) throw new Error(res.message || "validate failed")
                    onValidation(res.data.passed, res.data.errors || [])
                    if (!res.data.passed) {
                      const n = res.data.errors?.length || 0
                      throw new Error(
                        n
                          ? `Validation failed — ${n} requirement${n === 1 ? "" : "s"} remain`
                          : "Validation failed",
                      )
                    }
                    return undefined
                  },
                  `/v1/fpa/budget-cycles/${cycle.id}/validate`,
                )
              }
          />
          )}

        {st === "LOCKED" &&
          cycle.versionId &&
          (canLockVersion || canApproveBudget || canAssignTasks) && (
            <div className="space-y-2 rounded-xl border border-[#e2e8f0] p-3">
              <p className="text-[11px] font-medium text-[#0f172a]">Request reopen</p>
              <p className="text-[10px] text-[#64748b] leading-relaxed">
                Creates a new DRAFT working copy — the locked version stays locked.
              </p>
              <textarea
                className="w-full min-h-[56px] rounded-xl border border-[#e2e8f0] px-3 py-2 text-xs"
                placeholder="Reason (required)"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
              <ActionBtn
                busy={isBusy("request-reopen")}
                blocked={anyBusy && !isBusy("request-reopen")}
                label="Request reopen (new working copy)"
                fullWidth
                onClick={() => {
                  if (!reopenReason.trim()) {
                    toast.error("Reason is required to reopen")
                    return
                  }
                  void onAction(
                    "Working copy created from locked version",
                    async () => {
                      const res = await fpaApi.requestReopenVersion(cycle.versionId!, {
                        reason: reopenReason.trim(),
                      })
                      if (!res.success || !res.data) {
                        throw new Error(res.message || "request-reopen failed")
                      }
                      const copied = res.data.cellsCopied
                      toast.message(
                        `New DRAFT version${res.data.version?.name ? `: ${res.data.version.name}` : ""}${
                          typeof copied === "number" ? ` · ${copied} cells copied` : ""
                        }`,
                      )
                      setReopenReason("")
                      return undefined
                    },
                    `/v1/fpa/versions/${cycle.versionId}/request-reopen`,
                    "request-reopen",
                  )
                }}
              />
            </div>
          )}
      </div>

      {showPrep && (
        <details className="rounded-xl border border-[#e2e8f0] px-3 py-2">
          <summary className="text-[11px] font-medium text-[#64748b] cursor-pointer select-none">
            Prep data (optional)
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <ActionBtn
              busy={isBusy("load-actuals")}
            blocked={anyBusy && !isBusy("load-actuals")}
              label="Load prior actuals"
              fullWidth
              onClick={() =>
                void onAction(
                  "Prior actuals loaded",
                  async () => {
                    const res = await fpaApi.loadBudgetActuals(cycle.id)
                    if (!res.success || !res.data) throw new Error(res.message || "load-actuals failed")
                    const rows = res.data.rowCount ?? res.data.actualsRowCount
                    if (typeof rows === "number") toast.message(`Actuals synced: ${rows} rows`)
                    return res.data
                  },
                  `/v1/fpa/budget-cycles/${cycle.id}/load-actuals`,
                )
              }
          />
            <ActionBtn
              busy={isBusy("load-baseline")}
            blocked={anyBusy && !isBusy("load-baseline")}
              label="Load baseline"
              fullWidth
              onClick={() =>
                void onAction(
                  "Baseline loaded",
                  async () => {
                    const res = await fpaApi.loadBudgetBaseline(cycle.id, {
                      mode: (cycle.baselineMode as FpaBaselineMode) || "PRIOR_YEAR_ACTUAL",
                    })
                    if (!res.success || !res.data) throw new Error(res.message || "load-baseline failed")
                    return res.data
                  },
                  `/v1/fpa/budget-cycles/${cycle.id}/load-baseline`,
                )
              }
          />
          </div>
        </details>
      )}

      {registerRows.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-[#0f172a] mb-1.5">
            Department budget register
          </p>
          <ul className="space-y-1">
            {registerRows.map((r) => (
              <li
                key={r.key}
                className="text-[11px] flex justify-between gap-2 rounded-md px-2.5 py-1.5 bg-[#f8fafc]"
              >
                <span className="min-w-0 truncate text-[#0f172a]">{r.label}</span>
                {"badge" in r && r.badge ? (
                  <FpaStatusBadge tone={statusTone(String(r.status || "pending"))}>
                    {r.status || "Pending"}
                  </FpaStatusBadge>
                ) : (
                  <span className="shrink-0 tabular-nums text-[#475569]">{r.right}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {st === "LOCKED" && (
        <p className="text-[11px] text-[#166534] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Approved budget is locked for planning control and reporting.
        </p>
      )}
    </aside>
  )
}

function ActionBtn({
  label,
  onClick,
  busy,
  blocked,
  primary,
  danger,
  fullWidth,
}: {
  label: string
  onClick: () => void
  busy: boolean
  blocked?: boolean
  primary?: boolean
  danger?: boolean
  fullWidth?: boolean
}) {
  return (
    <button
      type="button"
      disabled={busy || !!blocked}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-full px-3 text-[11px] font-medium disabled:opacity-50",
        fullWidth ? "h-10 w-full text-sm" : "h-8",
        primary && "bg-[#2563eb] text-white",
        danger && "border border-[#fecaca] text-[#b91c1c] bg-[#fef2f2]",
        !primary && !danger && "border border-[#e2e8f0] text-[#0f172a] bg-white",
      )}
    >
      {busy && <Loader2 className="w-3 h-3 animate-spin" />}
      {label}
    </button>
  )
}

function userDeptId(u: AppUser): string | null {
  if (u.departmentId) return String(u.departmentId)
  if (u.department && typeof u.department === "object" && u.department.id) {
    return String(u.department.id)
  }
  return null
}

/** Match user to a dept by id, or by name when API only has userDepartment string. */
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
  const r = raw as Record<string, unknown> | unknown[] | null
  const list = Array.isArray(r)
    ? r
    : Array.isArray((r as { departments?: unknown[] })?.departments)
      ? (r as { departments: unknown[] }).departments
      : Array.isArray((r as { data?: unknown[] })?.data)
        ? (r as { data: unknown[] }).data
        : []
  return list
    .map((d) => {
      const row = d as Record<string, unknown>
      const id = String(row.id || row.departmentId || "")
      const name = String(row.name || row.label || "")
      return id && name ? { id, name } : null
    })
    .filter(Boolean) as Array<{ id: string; name: string }>
}

function normalizeUsers(raw: unknown): AppUser[] {
  const r = raw as Record<string, unknown> | unknown[] | null
  const list = Array.isArray(r)
    ? r
    : Array.isArray((r as { data?: unknown[] })?.data)
      ? (r as { data: unknown[] }).data
      : Array.isArray((r as { users?: unknown[] })?.users)
        ? (r as { users: unknown[] }).users
        : []
  return list as AppUser[]
}

function userLabel(u: AppUser) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id
}

function PillSelect({
  value,
  onValueChange,
  placeholder,
  disabled,
  options,
  emptyLabel,
}: {
  value: string
  onValueChange: (v: string) => void
  placeholder: string
  disabled?: boolean
  options: Array<{ value: string; label: string }>
  emptyLabel?: string
}) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={SELECT_TRIGGER}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-[#e2e8f0]">
        {options.length === 0 ? (
          <div className="px-3 py-2 text-xs text-[#94a3b8]">{emptyLabel || "No options"}</div>
        ) : (
          options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="rounded-lg text-sm">
              {o.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

const CREATE_CYCLE_STEPS = [
  { id: "type", short: "1", label: "Type & model" },
  { id: "horizon", short: "2", label: "Horizon & cut-off" },
  { id: "owners", short: "3", label: "Departments & owners" },
  { id: "baseline", short: "4", label: "Baseline & workflow" },
  { id: "validate", short: "5", label: "Validate & open" },
] as const

type CreateCycleStepId = (typeof CREATE_CYCLE_STEPS)[number]["id"]

export function CreateBudgetCycleModal({
  models,
  initialModelId,
  initialVersionId,
  initialScenarioId,
  initialScenarios,
  initialVersions,
  fiscalYear,
  onClose,
  onCreated,
}: {
  models: FpaModel[]
  initialModelId: string | null
  initialVersionId: string | null
  initialScenarioId: string | null
  initialScenarios: FpaScenario[]
  initialVersions: FpaVersion[] | Array<{ id: string; name: string }>
  fiscalYear: number
  onClose: () => void
  onCreated: (cycle: FpaBudgetCycle) => void
}) {
  const dispatch = useAppDispatch()
  const [step, setStep] = useState<CreateCycleStepId>("type")
  const [modelId, setModelId] = useState(initialModelId || models[0]?.id || "")
  const [cycleType, setCycleType] = useState("ANNUAL_BUDGET")
  const [name, setName] = useState(`FY${fiscalYear} Annual Budget`)
  const [year, setYear] = useState(String(fiscalYear))
  const [startDate, setStartDate] = useState(`${fiscalYear}-01-01`)
  const [endDate, setEndDate] = useState(`${fiscalYear}-12-31`)
  const [actualsCutoffDate, setActualsCutoffDate] = useState(`${fiscalYear - 1}-12-31`)
  const [forecastStartPeriod, setForecastStartPeriod] = useState(`${fiscalYear}-01-01`)
  const [submissionDeadline, setSubmissionDeadline] = useState("")
  const [draftCycleId, setDraftCycleId] = useState<string | null>(null)
  const [scenarioId, setScenarioId] = useState(initialScenarioId || "")
  const [verId, setVerId] = useState(initialVersionId || "")
  const [scenarios, setScenarios] = useState<FpaScenario[]>(initialScenarios)
  const [versions, setVersions] = useState(initialVersions)
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(true)
  const [lookupsError, setLookupsError] = useState<string | null>(null)
  const [selectedDeptId, setSelectedDeptId] = useState("")
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("")
  const [owners, setOwners] = useState<
    Array<{
      departmentId: string
      departmentName: string
      assigneeId: string
      assigneeName: string
      dueDate?: string
      baselineMethod?: FpaBaselineMode
    }>
  >([])
  const [ownerDraftDueDate, setOwnerDraftDueDate] = useState("")
  const [ownerDraftBaselineMethod, setOwnerDraftBaselineMethod] =
    useState<FpaBaselineMode>("PRIOR_YEAR_ACTUAL")
  const [categories, setCategories] = useState<FpaBudgetInputCategory[]>(
    BUDGET_INPUT_CATEGORIES.map((c) => c.id),
  )
  const [baselineMode, setBaselineMode] = useState<FpaBaselineMode>("PRIOR_YEAR_ACTUAL")
  const [workflowTemplateId, setWorkflowTemplateId] = useState("")
  const [workflows, setWorkflows] = useState<FpaWorkflow[]>([])
  const [loadActuals, setLoadActuals] = useState(true)
  const [loadBaseline, setLoadBaseline] = useState(true)
  const [busy, setBusy] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [setupErrors, setSetupErrors] = useState<string[]>([])
  const stepIdx = CREATE_CYCLE_STEPS.findIndex((s) => s.id === step)

  const syncHorizonFromYear = (y: string) => {
    const n = Number(y)
    if (!Number.isFinite(n) || n < 2000) return
    setStartDate(`${n}-01-01`)
    // Monthly models often end on the first of December, not Dec 31.
    setEndDate(`${n}-12-01`)
    setActualsCutoffDate(`${n - 1}-12-31`)
    setForecastStartPeriod(`${n}-01-01`)
  }

  const buildCycleBody = (openImmediately: boolean): FpaBudgetCycleCreateRequest => ({
    modelId,
    name: name.trim(),
    fiscalYear: Number(year) || fiscalYear,
    planningType: cycleType,
    versionId: verId || undefined,
    scenarioId: scenarioId || undefined,
    startDate,
    endDate,
    actualsCutoffDate: actualsCutoffDate || null,
    forecastStartPeriod: forecastStartPeriod || null,
    submissionDeadline: submissionDeadline || null,
    baselineMode,
    workflowTemplateId: workflowTemplateId || null,
    loadPriorActuals: loadActuals,
    loadBaseline,
    openImmediately,
    inputCategories: categories,
    owners: owners.map((o) => ({
      departmentId: o.departmentId,
      assigneeId: o.assigneeId,
      categories,
      dueDate: o.dueDate || submissionDeadline || null,
      baselineMethod: o.baselineMethod || baselineMode,
    })),
  })

  const applyApiErrors = (err: unknown, fallback: string[] = []) => {
    const apiErrs = (err as { response?: { errors?: Array<{ message?: string; code?: string }> }; errors?: Array<{ message?: string; code?: string }> })
      ?.response?.errors
      || (err as { errors?: Array<{ message?: string; code?: string }> })?.errors
    if (Array.isArray(apiErrs) && apiErrs.length) {
      setSetupErrors(
        apiErrs.map((e) =>
          e.message
            ? e.code
              ? `${e.code}: ${e.message}`
              : e.message
            : e.code || "Requirement unmet",
        ),
      )
      return
    }
    if (fallback.length) setSetupErrors(fallback)
  }

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true)
    setLookupsError(null)
    const errors: string[] = []
    try {
      let depts: Array<{ id: string; name: string }> = []
      try {
        const deptRes = await departmentApiService.getDepartments()
        depts = normalizeDepartments(deptRes)
      } catch (err) {
        const status = (err as { status?: number })?.status
        errors.push(
          status === 404
            ? "Departments: GET /api/departments returned 404"
            : `Departments: ${errorMessage(err)}`,
        )
      }
      setDepartments(depts)
      if (!depts.length && !errors.some((e) => e.startsWith("Departments:"))) {
        errors.push("Departments: GET /departments returned no rows with id + name")
      }

      let userList: AppUser[] = []
      try {
        const userRes = await usersApi.getAll()
        userList = normalizeUsers(userRes)
      } catch (err) {
        errors.push(`Users: ${errorMessage(err)}`)
      }
      setUsers(
        userList.map((u) => {
          const raw = u as AppUser & { userDepartment?: string | null }
          if (!raw.departmentId && typeof raw.userDepartment === "string" && raw.userDepartment) {
            return { ...raw, department: raw.userDepartment }
          }
          return u
        }),
      )
      if (!userList.length && !errors.some((e) => e.startsWith("Users:"))) {
        errors.push("Users: GET /users returned no users")
      }

      try {
        const wfRes = await fpaApi.listWorkflows({ status: "ACTIVE" })
        if (wfRes.success && Array.isArray(wfRes.data)) {
          setWorkflows(wfRes.data)
        }
      } catch {
        /* optional — validate-setup still checks CFO stage */
      }

      setLookupsError(errors.length ? errors.join(" · ") : null)
    } finally {
      setLookupsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  const loadModelContext = useCallback(async (id: string) => {
    if (!id) return
    setModelLoading(true)
    try {
      const detail = await fpaApi.getModel(id)
      if (detail.success && detail.data) {
        const sc = detail.data.scenarios || []
        const ver = detail.data.versions || []
        setScenarios(sc)
        setVersions(ver)
        const base =
          sc.find((s) => s.scenarioType === "BASE" || /base/i.test(s.name))?.id || sc[0]?.id || ""
        setScenarioId((prev) => (prev && sc.some((s) => s.id === prev) ? prev : base))
        setVerId((prev) => (prev && ver.some((v) => v.id === prev) ? prev : ver[0]?.id || ""))
        if (detail.data.startPeriod) {
          const y = new Date(detail.data.startPeriod).getUTCFullYear()
          setYear(String(y))
          setName((n) => (n.startsWith("FY") ? `FY${y} Annual Budget` : n))
          setStartDate(
            detail.data.startPeriod.slice(0, 10) || `${y}-01-01`,
          )
          setEndDate(
            detail.data.endPeriod?.slice(0, 10) || `${y}-12-31`,
          )
          setActualsCutoffDate(`${y - 1}-12-31`)
          setForecastStartPeriod(
            detail.data.startPeriod.slice(0, 10) || `${y}-01-01`,
          )
        }
      }
    } catch (err) {
      toast.error(errorMessage(err, "Failed to load model scenarios/versions"))
    } finally {
      setModelLoading(false)
    }
  }, [])

  useEffect(() => {
    if (modelId) void loadModelContext(modelId)
  }, [modelId, loadModelContext])

  const assigneeOptions = useMemo(() => {
    if (!selectedDeptId) return users
    const dept = departments.find((d) => d.id === selectedDeptId)
    const linked = users.filter((u) => userMatchesDept(u, dept))
    return linked.length ? linked : users
  }, [users, selectedDeptId, departments])

  const collectSetupRequirements = (): string[] => {
    const reqs: string[] = []
    if (!modelId) reqs.push("Select a published source model.")
    if (!name.trim()) reqs.push("Cycle name is required.")
    if (!year.trim() || !Number(year)) reqs.push("Financial year is required.")
    if (!startDate || !endDate) reqs.push("Planning horizon (start and end dates) is required.")
    if (startDate && endDate && startDate > endDate) {
      reqs.push("Planning start date must be on or before the end date.")
    }
    if (!owners.length) reqs.push("Assign at least one department budget owner.")
    if (owners.some((o) => !o.assigneeId)) {
      reqs.push("Every participating department must have an assigned budget owner.")
    }
    if (!categories.length) reqs.push("Select at least one input category (planning area).")
    if (!scenarioId) reqs.push("Base scenario is required.")
    if (!verId) reqs.push("Published / working model version is required.")
    return reqs
  }

  const stepRequirements = (id: CreateCycleStepId): string[] => {
    switch (id) {
      case "type": {
        const reqs: string[] = []
        if (!modelId) reqs.push("Select a published source model.")
        if (!name.trim()) reqs.push("Cycle name is required.")
        if (!year.trim() || !Number(year)) reqs.push("Financial year is required.")
        return reqs
      }
      case "horizon": {
        const reqs: string[] = []
        if (!startDate || !endDate) {
          reqs.push("Planning horizon (start and end dates) is required.")
        }
        if (startDate && endDate && startDate > endDate) {
          reqs.push("Planning start date must be on or before the end date.")
        }
        return reqs
      }
      case "owners": {
        const reqs: string[] = []
        if (!owners.length) reqs.push("Assign at least one department budget owner.")
        if (owners.some((o) => !o.assigneeId)) {
          reqs.push("Every participating department must have an assigned budget owner.")
        }
        if (!categories.length) reqs.push("Select at least one input category (planning area).")
        return reqs
      }
      case "baseline": {
        const reqs: string[] = []
        if (!scenarioId) reqs.push("Base scenario is required.")
        if (!verId) reqs.push("Published / working model version is required.")
        return reqs
      }
      default:
        return collectSetupRequirements()
    }
  }

  const goToStep = (id: CreateCycleStepId) => {
    const target = CREATE_CYCLE_STEPS.findIndex((s) => s.id === id)
    if (target <= stepIdx) {
      setStep(id)
      setSetupErrors([])
      return
    }
    for (let i = 0; i < target; i++) {
      const reqs = stepRequirements(CREATE_CYCLE_STEPS[i].id)
      if (reqs.length) {
        setStep(CREATE_CYCLE_STEPS[i].id)
        setSetupErrors(reqs)
        toast.error(`${reqs.length} requirement${reqs.length === 1 ? "" : "s"} remain on this step.`)
        return
      }
    }
    setSetupErrors([])
    setStep(id)
  }

  const onBack = () => {
    if (stepIdx <= 0) return
    setSetupErrors([])
    setStep(CREATE_CYCLE_STEPS[stepIdx - 1].id)
  }

  const onNext = () => {
    const reqs = stepRequirements(step)
    if (reqs.length) {
      setSetupErrors(reqs)
      toast.error(`${reqs.length} requirement${reqs.length === 1 ? "" : "s"} remain on this step.`)
      return
    }
    setSetupErrors([])
    if (stepIdx < CREATE_CYCLE_STEPS.length - 1) {
      setStep(CREATE_CYCLE_STEPS[stepIdx + 1].id)
    }
  }

  const addOwner = () => {
    if (!selectedDeptId) {
      toast.error("Select a department")
      return
    }
    if (!selectedAssigneeId) {
      toast.error("Select an assigned user for this department")
      return
    }
    if (owners.some((o) => o.departmentId === selectedDeptId)) {
      toast.error("Department already added")
      return
    }
    const dept = departments.find((d) => d.id === selectedDeptId)
    const user = users.find((u) => u.id === selectedAssigneeId)
    setOwners((prev) => [
      ...prev,
      {
        departmentId: selectedDeptId,
        departmentName: dept?.name || selectedDeptId,
        assigneeId: selectedAssigneeId,
        assigneeName: user ? userLabel(user) : selectedAssigneeId,
        dueDate: ownerDraftDueDate || submissionDeadline || undefined,
        baselineMethod: ownerDraftBaselineMethod,
      },
    ])
    setSelectedDeptId("")
    setSelectedAssigneeId("")
    setOwnerDraftDueDate("")
    setSetupErrors([])
  }

  const persistDraft = async (): Promise<FpaBudgetCycle | null> => {
    const body = buildCycleBody(false)
    if (draftCycleId) {
      const res = await fpaApi.updateBudgetCycle(draftCycleId, body)
      if (!res.success || !res.data) {
        applyApiErrors(res, [])
        throw new Error(res.message || "Failed to update draft cycle")
      }
      return res.data
    }
    const res = await fpaApi.createBudgetCycle(body)
    if (!res.success || !res.data) {
      applyApiErrors(res, [])
      throw new Error(res.message || "Failed to create draft cycle")
    }
    setDraftCycleId(res.data.id)
    return res.data
  }

  const saveDraft = async () => {
    const reqs = collectSetupRequirements()
    if (reqs.length) {
      setSetupErrors(reqs)
      toast.error(`Cannot save draft. ${reqs.length} requirements remain.`)
      return
    }
    setSetupErrors([])
    setBusy(true)
    try {
      const cycle = await persistDraft()
      if (!cycle) return
      toast.success(
        cycle.status === "DRAFT"
          ? "Draft cycle saved — validate setup before opening"
          : `Cycle saved (${cycle.status})`,
      )
      if (cycle.status !== "DRAFT") {
        dispatch(setSelectedModelId(modelId))
        onCreated(cycle)
      }
    } catch (err) {
      applyApiErrors(err)
      const status = (err as { status?: number })?.status
      const code = (err as { response?: { code?: string } })?.response?.code
      if (status === 409 || code === "CONFLICT") {
        toast.error(errorMessage(err, "An unlocked cycle already exists for this model and year"))
      } else {
        logFpaGap({
          category: "broken",
          path: draftCycleId
            ? `/v1/fpa/budget-cycles/${draftCycleId}`
            : "/v1/fpa/budget-cycles",
          method: draftCycleId ? "PATCH" : "POST",
          message: errorMessage(err),
          impact: "Save draft budget cycle failed",
          response: err,
        })
        toast.error(errorMessage(err, "Failed to save draft cycle"))
      }
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    const reqs = collectSetupRequirements()
    if (reqs.length) {
      setSetupErrors(reqs)
      toast.error(`Planning cycle cannot be opened. ${reqs.length} requirements remain.`)
      return
    }
    setSetupErrors([])
    setBusy(true)
    try {
      const draft = await persistDraft()
      if (!draft) return

      const validateRes = await fpaApi.validateBudgetSetup(draft.id)
      const validateData = validateRes.data
      const errors = validateData?.errors || []
      if (!validateRes.success || !validateData?.passed) {
        const msgs = errors.map((e) => e.message || e.code || "Requirement unmet")
        setSetupErrors(
          msgs.length
            ? msgs
            : [validateData?.message || validateRes.message || "Setup validation failed"],
        )
        toast.error(
          validateData?.message?.split("\n")[0] ||
            `Planning cycle cannot be opened. ${msgs.length || "Some"} requirements remain.`,
        )
        return
      }

      const openRes = await fpaApi.openBudgetCycle(draft.id, {
        loadPriorActuals: loadActuals,
        loadBaseline,
      })
      if (!openRes.success || !openRes.data) {
        applyApiErrors(openRes)
        throw new Error(openRes.message || "Failed to open cycle")
      }
      dispatch(setSelectedModelId(modelId))
      const rows = openRes.data.actualsRowCount
      const reason = openRes.data.actualsLoadReason
      toast.success(
        typeof rows === "number"
          ? `Budget cycle opened — owners notified · actuals ${rows} rows${reason ? ` (${reason})` : ""}`
          : "Budget cycle opened for input — owners notified",
      )
      onCreated(openRes.data)
    } catch (err) {
      applyApiErrors(err)
      const status = (err as { status?: number })?.status
      const code = (err as { response?: { code?: string; errors?: Array<{ message?: string }> } })
        ?.response?.code
      const apiErrs = (err as { response?: { errors?: Array<{ message?: string }> } })?.response
        ?.errors
      if (Array.isArray(apiErrs) && apiErrs.length) {
        setSetupErrors(apiErrs.map((e) => e.message || "Requirement unmet"))
      }
      if (status === 409 || code === "CONFLICT") {
        toast.error(errorMessage(err, "An unlocked cycle already exists for this model and year"))
      } else if (code === "SETUP_INCOMPLETE") {
        toast.error(
          errorMessage(err, "Planning cycle cannot be opened — setup requirements remain"),
        )
      } else if (code === "VERSION_NOT_READY") {
        toast.error(errorMessage(err, "Selected version is not ready for budgeting"))
      } else {
        logFpaGap({
          category: "broken",
          path: "/v1/fpa/budget-cycles",
          method: "POST",
          message: errorMessage(err),
          impact: "Staged create/open budget cycle failed",
          response: err,
        })
        toast.error(errorMessage(err, "Failed to open budget cycle"))
      }
    } finally {
      setBusy(false)
    }
  }

  const fieldHint = "text-[10px] text-[#94a3b8]"
  const currentLabel = CREATE_CYCLE_STEPS[stepIdx]?.label ?? ""
  const isLast = step === "validate"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-cycle-title"
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-[#e2e8f0] bg-white shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[#e2e8f0] shrink-0">
          <div>
            <h2 id="create-cycle-title" className="text-sm font-semibold text-[#0f172a]">
              Create planning cycle
            </h2>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Step {stepIdx + 1} of {CREATE_CYCLE_STEPS.length} · {currentLabel}
              {draftCycleId ? " · Draft saved" : " · Opens as DRAFT until you validate"}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#475569]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <aside className="hidden sm:block w-52 shrink-0 border-r border-[#e2e8f0] overflow-y-auto p-3 bg-[#f8fafc]">
            <ol className="space-y-0.5">
              {CREATE_CYCLE_STEPS.map((s, i) => {
                const active = s.id === step
                const done = i < stepIdx
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => goToStep(s.id)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px]",
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

          <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="sm:hidden flex gap-1 overflow-x-auto pb-1">
              {CREATE_CYCLE_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => goToStep(s.id)}
                  className={cn(
                    "h-7 shrink-0 rounded-full border px-2.5 text-[10px]",
                    s.id === step
                      ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb] font-medium"
                      : i < stepIdx
                        ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]"
                        : "border-[#e2e8f0] text-[#64748b]",
                  )}
                >
                  {s.short}. {s.label}
                </button>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-[#0f172a]">{currentLabel}</h3>

            {setupErrors.length > 0 && (
              <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#7f1d1d]">
                <p className="font-semibold text-[#0f172a]">
                  {isLast
                    ? `Planning cycle cannot be opened. ${setupErrors.length} requirement${
                        setupErrors.length === 1 ? "" : "s"
                      } remain:`
                    : `${setupErrors.length} requirement${
                        setupErrors.length === 1 ? "" : "s"
                      } remain on this step:`}
                </p>
                <ul className="mt-1.5 space-y-1 list-disc pl-4">
                  {setupErrors.map((msg, i) => (
                    <li key={`${msg}-${i}`}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {step === "type" && (
              <div className="space-y-3">
                <div className="block text-xs text-[#64748b]">
                  Planning type
                  <PillSelect
                    value={cycleType}
                    onValueChange={setCycleType}
                    options={PLANNING_CYCLE_TYPES.map((t) => ({
                      value: t.id,
                      label: t.label,
                    }))}
                  />
                  <p className={cn(fieldHint, "mt-1")}>
                    Annual budget is the primary path; other planning types use the same staged open.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="block text-xs text-[#64748b] sm:col-span-2">
                    Source model
                    <PillSelect
                      value={modelId}
                      onValueChange={setModelId}
                      placeholder="Select model…"
                      emptyLabel="No models available"
                      options={models.map((m) => ({
                        value: m.id,
                        label: `${m.name} (${m.modelType})`,
                      }))}
                    />
                  </div>
                  <label className="block text-xs text-[#64748b]">
                    Cycle name
                    <input
                      className={FIELD}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs text-[#64748b]">
                    Financial year
                    <input
                      className={FIELD}
                      type="number"
                      value={year}
                      onChange={(e) => {
                        setYear(e.target.value)
                        syncHorizonFromYear(e.target.value)
                        setName((n) =>
                          n.match(/^FY\d+/) ? `FY${e.target.value} Annual Budget` : n,
                        )
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {step === "horizon" && (
              <div className="space-y-3">
                <p className="text-[11px] text-[#64748b]">
                  Set the planning window, actuals cut-off, forecast start, and optional submission
                  deadline for owners.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-[#64748b]">
                    Planning start
                    <input
                      className={FIELD}
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs text-[#64748b]">
                    Planning end
                    <input
                      className={FIELD}
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs text-[#64748b]">
                    Actuals cut-off
                    <input
                      className={FIELD}
                      type="date"
                      value={actualsCutoffDate}
                      onChange={(e) => setActualsCutoffDate(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs text-[#64748b]">
                    Forecast start period
                    <input
                      className={FIELD}
                      type="date"
                      value={forecastStartPeriod}
                      onChange={(e) => setForecastStartPeriod(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs text-[#64748b] sm:col-span-2">
                    Submission deadline (optional)
                    <input
                      className={FIELD}
                      type="date"
                      value={submissionDeadline}
                      onChange={(e) => setSubmissionDeadline(e.target.value)}
                    />
                    <span className={fieldHint}>Shown on owner workspace when set</span>
                  </label>
                </div>
              </div>
            )}

            {step === "owners" && (
              <div className="space-y-3">
                <p className={fieldHint}>
                  Assign each participating department an owner. Grid rows scope by cycle assignment
                  when opened with cycleId.
                </p>
                {lookupsLoading && (
                  <span className="text-[11px] text-[#64748b] inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading departments & users…
                  </span>
                )}
                {lookupsError && (
                  <div className="flex items-start justify-between gap-2 text-[11px] text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-md px-2.5 py-2">
                    <span>{lookupsError}</span>
                    <button
                      type="button"
                      onClick={() => void loadLookups()}
                      className="shrink-0 rounded-full border border-[#fecaca] px-2 py-0.5"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                  <div className="block text-xs text-[#64748b]">
                    Department
                    <PillSelect
                      value={selectedDeptId}
                      onValueChange={(v) => {
                        setSelectedDeptId(v)
                        setSelectedAssigneeId("")
                      }}
                      placeholder="Select department…"
                      emptyLabel="No departments"
                      options={departments.map((d) => ({ value: d.id, label: d.name }))}
                    />
                  </div>
                  <div className="block text-xs text-[#64748b]">
                    Budget owner
                    <PillSelect
                      value={selectedAssigneeId}
                      onValueChange={setSelectedAssigneeId}
                      placeholder={selectedDeptId ? "Select user…" : "Pick department first"}
                      disabled={!selectedDeptId}
                      emptyLabel="No users"
                      options={assigneeOptions.map((u) => ({
                        value: u.id,
                        label: userLabel(u),
                      }))}
                    />
                  </div>
                  <div className="block text-xs text-[#64748b]">
                    Owner due date
                    <input
                      type="date"
                      className={FIELD}
                      value={ownerDraftDueDate}
                      onChange={(e) => setOwnerDraftDueDate(e.target.value)}
                    />
                  </div>
                  <div className="block text-xs text-[#64748b]">
                    Owner baseline
                    <PillSelect
                      value={ownerDraftBaselineMethod}
                      onValueChange={(v) => setOwnerDraftBaselineMethod(v as FpaBaselineMode)}
                      placeholder="Baseline method…"
                      options={BUDGET_BASELINE_METHODS.map((m) => ({
                        value: m.id,
                        label: m.label,
                      }))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addOwner}
                    className="h-9 rounded-full bg-[#2563eb] px-3 text-xs text-white whitespace-nowrap"
                  >
                    Add owner
                  </button>
                </div>

                {owners.length === 0 ? (
                  <p className="text-[11px] text-[#94a3b8]">
                    Select a department and owner, then Add. Every department needs an assignee.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {owners.map((o) => (
                      <li
                        key={o.departmentId}
                        className="rounded-md border border-[#f1f5f9] px-3 py-2 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-[#0f172a]">
                            {o.departmentName}
                          </span>
                          <button
                            type="button"
                            className="text-[11px] text-[#dc2626]"
                            onClick={() =>
                              setOwners((prev) =>
                                prev.filter((x) => x.departmentId !== o.departmentId),
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="block text-[11px] text-[#64748b]">
                            Assigned user
                            <PillSelect
                              value={o.assigneeId}
                              onValueChange={(v) => {
                                const u = users.find((x) => x.id === v)
                                setOwners((prev) =>
                                  prev.map((x) =>
                                    x.departmentId === o.departmentId
                                      ? {
                                          ...x,
                                          assigneeId: v,
                                          assigneeName: u ? userLabel(u) : v,
                                        }
                                      : x,
                                  ),
                                )
                              }}
                              placeholder="Select user…"
                              options={users.map((u) => ({ value: u.id, label: userLabel(u) }))}
                            />
                          </div>
                          <div className="block text-[11px] text-[#64748b]">
                            Due date
                            <input
                              type="date"
                              className={FIELD}
                              value={o.dueDate || ""}
                              onChange={(e) =>
                                setOwners((prev) =>
                                  prev.map((x) =>
                                    x.departmentId === o.departmentId
                                      ? { ...x, dueDate: e.target.value || undefined }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="block text-[11px] text-[#64748b]">
                            Baseline method
                            <PillSelect
                              value={o.baselineMethod || baselineMode}
                              onValueChange={(v) =>
                                setOwners((prev) =>
                                  prev.map((x) =>
                                    x.departmentId === o.departmentId
                                      ? { ...x, baselineMethod: v as FpaBaselineMode }
                                      : x,
                                  ),
                                )
                              }
                              placeholder="Baseline…"
                              options={BUDGET_BASELINE_METHODS.map((m) => ({
                                value: m.id,
                                label: m.label,
                              }))}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div>
                  <p className="text-xs text-[#64748b] mb-1.5">Planning areas (input categories)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BUDGET_INPUT_CATEGORIES.map((c) => {
                      const on = categories.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setCategories((prev) =>
                              on ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                            )
                          }
                          className={cn(
                            "h-7 rounded-full border px-2.5 text-[11px]",
                            on
                              ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                              : "border-[#e2e8f0]",
                          )}
                        >
                          {on && <Check className="w-3 h-3 inline mr-1" />}
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === "baseline" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="block text-xs text-[#64748b]">
                    Base scenario
                    <PillSelect
                      value={scenarioId}
                      onValueChange={setScenarioId}
                      placeholder="Select scenario…"
                      disabled={modelLoading || !modelId}
                      emptyLabel="No scenarios on this model"
                      options={scenarios.map((s) => ({
                        value: s.id,
                        label: s.scenarioType ? `${s.name} (${s.scenarioType})` : s.name,
                      }))}
                    />
                  </div>
                  <div className="block text-xs text-[#64748b]">
                    Base / working version
                    <PillSelect
                      value={verId}
                      onValueChange={setVerId}
                      placeholder="Select version…"
                      disabled={modelLoading || !modelId}
                      emptyLabel="No versions on this model"
                      options={versions.map((v) => ({ value: v.id, label: v.name }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="block text-xs text-[#64748b]">
                    Cycle baseline method
                    <PillSelect
                      value={baselineMode}
                      onValueChange={(v) => setBaselineMode(v as FpaBaselineMode)}
                      placeholder="Select method…"
                      options={BUDGET_BASELINE_METHODS.map((m) => ({
                        value: m.id,
                        label: m.label,
                      }))}
                    />
                    <span className={fieldHint}>
                      Applied on open when Load baseline is checked (owners can override).
                    </span>
                  </div>
                  <div className="block text-xs text-[#64748b]">
                    Approval workflow
                    <PillSelect
                      value={workflowTemplateId}
                      onValueChange={setWorkflowTemplateId}
                      placeholder="Default budget workflow (auto)"
                      emptyLabel="No active workflows — leave blank for default"
                      options={workflows.map((w) => ({
                        value: w.id,
                        label: w.name || w.id,
                      }))}
                    />
                    <span className={fieldHint}>
                      Optional template id. Stages are still validated on open (CFO stage, etc.).
                    </span>
                  </div>
                </div>
                <div className="space-y-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <label className="flex items-start gap-2 text-xs text-[#0f172a]">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={loadActuals}
                      onChange={(e) => setLoadActuals(e.target.checked)}
                    />
                    <span>
                      <span className="font-medium">Load prior-year actuals on open</span>
                      <span className="block text-[11px] text-[#64748b] mt-0.5 font-normal">
                        Pull last year’s figures as reference before owners enter the new plan.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-[#0f172a]">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={loadBaseline}
                      onChange={(e) => setLoadBaseline(e.target.checked)}
                    />
                    <span>
                      <span className="font-medium">Load baseline assumptions on open</span>
                      <span className="block text-[11px] text-[#64748b] mt-0.5 font-normal">
                        Seed the working version so owners are not starting from a blank sheet.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {step === "validate" && (
              <div className="space-y-3">
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  Saves as <span className="font-medium text-[#0f172a]">DRAFT</span>, runs{" "}
                  <span className="font-medium text-[#0f172a]">validate-setup</span> (full error
                  list), then <span className="font-medium text-[#0f172a]">open</span> to notify
                  owners and set status OPEN_FOR_INPUT.
                </p>
                <dl className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] divide-y divide-[#e2e8f0] text-[12px]">
                  <div className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-[#64748b]">Type</dt>
                    <dd className="font-medium text-[#0f172a] text-right">
                      {PLANNING_CYCLE_TYPES.find((t) => t.id === cycleType)?.label || cycleType}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-[#64748b]">Model</dt>
                    <dd className="font-medium text-[#0f172a] text-right truncate max-w-[60%]">
                      {models.find((m) => m.id === modelId)?.name || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-[#64748b]">Cycle</dt>
                    <dd className="font-medium text-[#0f172a] text-right">{name || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-[#64748b]">Horizon</dt>
                    <dd className="font-medium text-[#0f172a] text-right">
                      {startDate} → {endDate}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-[#64748b]">Owners</dt>
                    <dd className="font-medium text-[#0f172a] text-right">
                      {owners.length} department{owners.length === 1 ? "" : "s"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-[#64748b]">Planning areas</dt>
                    <dd className="font-medium text-[#0f172a] text-right">{categories.length}</dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-[#64748b]">Baseline method</dt>
                    <dd className="font-medium text-[#0f172a] text-right">
                      {BUDGET_BASELINE_METHODS.find((m) => m.id === baselineMode)?.label ||
                        baselineMode}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-[#64748b]">Load on open</dt>
                    <dd className="font-medium text-[#0f172a] text-right">
                      {[loadActuals && "Actuals", loadBaseline && "Baseline"]
                        .filter(Boolean)
                        .join(", ") || "None"}
                    </dd>
                  </div>
                </dl>
                {owners.length > 0 && (
                  <ul className="text-[11px] text-[#475569] space-y-1">
                    {owners.map((o) => (
                      <li key={o.departmentId}>
                        <span className="font-medium text-[#0f172a]">{o.departmentName}</span>
                        {" · "}
                        {o.assigneeName}
                        {o.dueDate ? ` · due ${o.dueDate}` : ""}
                        {o.baselineMethod
                          ? ` · ${
                              BUDGET_BASELINE_METHODS.find((m) => m.id === o.baselineMethod)
                                ?.label || o.baselineMethod
                            }`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-[#e2e8f0] shrink-0 bg-white">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-9 rounded-full border border-[#e2e8f0] px-4 text-xs text-[#475569]"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy || stepIdx === 0}
              onClick={onBack}
              className="h-9 inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] px-3 text-xs text-[#475569] disabled:opacity-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
            {isLast ? (
              <>
                <button
                  type="button"
                  disabled={busy || !modelId}
                  onClick={() => void saveDraft()}
                  className="h-9 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] px-3 text-xs font-medium text-[#0f172a] disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={busy || !modelId}
                  onClick={() => void submit()}
                  className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Validate & open cycle
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onNext}
                className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
