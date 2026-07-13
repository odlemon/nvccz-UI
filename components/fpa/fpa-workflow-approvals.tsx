"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FpaExportDownloadModal } from "@/components/fpa/fpa-export-download-modal"
import { WorkflowPlanningCycleCard } from "@/components/fpa/workflow/workflow-cycle-header"
import { WorkflowPageSkeleton } from "@/components/fpa/workflow/workflow-page-skeleton"
import {
  WorkflowRecentApprovalsCard,
  WorkflowReviewQueueCard,
} from "@/components/fpa/workflow/workflow-review-cards"
import {
  WorkflowRecentApprovalsModal,
  WorkflowReviewQueueModal,
} from "@/components/fpa/workflow/workflow-view-all-modals"
import {
  WorkflowActivityFeed,
  WorkflowDeptProgress,
} from "@/components/fpa/workflow/workflow-side-panels"
import { WorkflowTaskDetailPanel } from "@/components/fpa/workflow/workflow-task-drawer"
import { WorkflowTasksTable } from "@/components/fpa/workflow/workflow-tasks-table"
import { WorkflowTasksToolbar } from "@/components/fpa/workflow/workflow-tasks-toolbar"
import {
  countReviewQueue,
  deptProgressRows,
  getTaskActionControls,
  humanDeptName,
  isPendingReviewStatus,
  isReturnedStatus,
  mergeWorkflowTasks,
  normalizeTaskStatus,
  workflowStagesFromApi,
  type WorkflowTab,
  type WorkflowTaskRow,
} from "@/components/fpa/workflow/workflow-utils"
import { extractFpaExportId } from "@/lib/fpa/download-export"
import { looksLikeDbId } from "@/lib/fpa/humanize-dept-message"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import {
  fpaApi,
  type FpaApprovalEvent,
  type FpaBudgetCycle,
  type FpaCycleTask,
  type FpaReviewWorkspace,
  type FpaTaskSummary,
  type FpaTaskAttachment,
  type FpaWorkflowComment,
} from "@/lib/api/fpa-api"
import { departmentApiService } from "@/lib/api/department-api"
import { usersApi, type AppUser } from "@/lib/api/users-api"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchMyFpaTasks } from "@/lib/store/slices/fpaSlice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BUDGET_STATUS_LABEL } from "@/components/fpa/budget/budget-constants"

const PAGE_SIZE = 12

export function FpaWorkflowApprovals() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cycleIdFromUrl = searchParams.get("cycleId")
  const taskIdFromUrl = searchParams.get("taskId")

  const dispatch = useAppDispatch()
  const { selectedModelId, tasks: myTasks, userDetails } = useAppSelector((s) => ({
    selectedModelId: s.fpa.selectedModelId,
    tasks: s.fpa.tasks,
    userDetails: s.auth.userDetails,
  }))
  const currentUserId =
    userDetails?.id ||
    (userDetails as { userId?: string } | null)?.userId ||
    null

  const {
    canApproveBudget,
    canReturnTask,
    canAssignTasks,
    canReviewSubmissions,
    canExportBoardPack,
  } = useFpaPermissions()

  const [cycles, setCycles] = useState<FpaBudgetCycle[]>([])
  const [cycleId, setCycleId] = useState<string | null>(cycleIdFromUrl)
  const [cycle, setCycle] = useState<FpaBudgetCycle | null>(null)
  const [review, setReview] = useState<FpaReviewWorkspace | null>(null)
  const [cycleTasks, setCycleTasks] = useState<FpaCycleTask[]>([])
  const [approvalEvents, setApprovalEvents] = useState<FpaApprovalEvent[]>([])
  const [cycleComments, setCycleComments] = useState<FpaWorkflowComment[]>([])
  const [taskSummary, setTaskSummary] = useState<FpaTaskSummary | null>(null)
  const [taskAttachments, setTaskAttachments] = useState<FpaTaskAttachment[]>([])
  const [taskThreadComments, setTaskThreadComments] = useState<FpaWorkflowComment[]>([])
  const [taskThreadDraft, setTaskThreadDraft] = useState("")
  const [taskThreadVisibility, setTaskThreadVisibility] = useState<"ALL" | "INTERNAL">("ALL")
  const [activityVisibility, setActivityVisibility] = useState<"ALL" | "INTERNAL">("ALL")
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const [tab, setTab] = useState<WorkflowTab>("Pending Review")
  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [page, setPage] = useState(0)

  const [selectedId, setSelectedId] = useState<string | null>(taskIdFromUrl)
  const [drawerOpen, setDrawerOpen] = useState(Boolean(taskIdFromUrl))
  const [taskComment, setTaskComment] = useState("")
  const [reassignUserId, setReassignUserId] = useState("")
  const [activityDraft, setActivityDraft] = useState("")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [boardPackOpen, setBoardPackOpen] = useState(false)
  const [queueModalOpen, setQueueModalOpen] = useState(false)
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false)

  const syncUrl = useCallback(
    (nextCycleId: string | null, nextTaskId?: string | null) => {
      const qs = new URLSearchParams()
      if (nextCycleId) qs.set("cycleId", nextCycleId)
      if (nextTaskId) qs.set("taskId", nextTaskId)
      const q = qs.toString()
      router.replace(q ? `/forecasting/workflow?${q}` : "/forecasting/workflow")
    },
    [router],
  )

  const loadMeta = useCallback(async () => {
    try {
      const [deptRes, userRes] = await Promise.all([
        departmentApiService.getDepartments(),
        usersApi.getAll(),
      ])
      const deptRows = Array.isArray(deptRes?.data) ? deptRes.data : []
      setDepartments(
        deptRows
          .map((d: { id?: string; name?: string }) => ({
            id: String(d.id || ""),
            name: String(d.name || ""),
          }))
          .filter((d) => d.id && d.name),
      )
      const userRows = Array.isArray(userRes?.data)
        ? userRes.data
        : Array.isArray((userRes as { users?: AppUser[] })?.users)
          ? (userRes as { users: AppUser[] }).users
          : []
      setUsers(userRows)
    } catch {
      /* non-blocking */
    }
  }, [])

  const loadCycles = useCallback(async () => {
    try {
      const res = await fpaApi.listBudgetCycles(
        selectedModelId ? { modelId: selectedModelId } : undefined,
      )
      if (res.success && Array.isArray(res.data)) {
        setCycles(res.data)
        return res.data
      }
      setCycles([])
      return [] as FpaBudgetCycle[]
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/budget-cycles",
        method: "GET",
        message: errorMessage(err),
        impact: "Workflow cycle picker empty",
        response: err,
      })
      setCycles([])
      return [] as FpaBudgetCycle[]
    }
  }, [selectedModelId])

  const loadCycleBoard = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        const [cycleRes, reviewRes, tasksRes, eventsRes, commentsRes] = await Promise.all([
          fpaApi.getBudgetCycle(id),
          fpaApi.getReviewWorkspace(id).catch(() => null),
          fpaApi.listBudgetCycleTasks(id).catch(() => null),
          fpaApi.listBudgetApprovalEvents(id).catch(() => null),
          fpaApi.listBudgetCycleComments(id).catch(() => null),
        ])
        if (cycleRes.success && cycleRes.data) setCycle(cycleRes.data)
        else setCycle(null)
        if (reviewRes && reviewRes.success && reviewRes.data) setReview(reviewRes.data)
        else setReview(null)
        if (tasksRes && tasksRes.success && Array.isArray(tasksRes.data)) {
          setCycleTasks(tasksRes.data)
        } else {
          setCycleTasks([])
        }
        if (eventsRes && eventsRes.success && Array.isArray(eventsRes.data)) {
          setApprovalEvents(eventsRes.data)
        } else {
          setApprovalEvents([])
        }
        if (commentsRes && commentsRes.success && Array.isArray(commentsRes.data)) {
          setCycleComments(commentsRes.data)
        } else {
          setCycleComments([])
        }
        await dispatch(fetchMyFpaTasks())
      } catch (err) {
        toast.error(errorMessage(err, "Failed to load workflow cycle"))
        setCycle(null)
        setReview(null)
        setCycleTasks([])
        setApprovalEvents([])
        setCycleComments([])
      } finally {
        setLoading(false)
      }
    },
    [dispatch],
  )

  const refresh = useCallback(async () => {
    const list = await loadCycles()
    const preferred =
      cycleIdFromUrl ||
      cycleId ||
      list.find((c) =>
        ["PENDING_FPA_REVIEW", "PENDING_CFO_REVIEW", "APPROVED", "OPEN_FOR_INPUT"].includes(
          String(c.status),
        ),
      )?.id ||
      list[0]?.id ||
      null
    if (preferred && preferred !== cycleId) setCycleId(preferred)
    if (preferred) await loadCycleBoard(preferred)
    else {
      setCycle(null)
      setReview(null)
      setLoading(false)
    }
  }, [cycleId, cycleIdFromUrl, loadCycleBoard, loadCycles])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once / model change
  }, [selectedModelId])

  useEffect(() => {
    if (cycleIdFromUrl && cycleIdFromUrl !== cycleId) {
      setCycleId(cycleIdFromUrl)
      void loadCycleBoard(cycleIdFromUrl)
    }
  }, [cycleIdFromUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (taskIdFromUrl) {
      setSelectedId(taskIdFromUrl)
      setDrawerOpen(true)
    }
  }, [taskIdFromUrl])

  useEffect(() => {
    if (!selectedId) {
      setTaskSummary(null)
      setTaskAttachments([])
      setTaskThreadComments([])
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [sumRes, attRes, commentsRes] = await Promise.all([
          fpaApi.getTaskSummary(selectedId).catch(() => null),
          fpaApi.listTaskAttachments(selectedId).catch(() => null),
          fpaApi.listTaskComments(selectedId).catch(() => null),
        ])
        if (cancelled) return
        setTaskSummary(sumRes?.success ? sumRes.data || null : null)
        setTaskAttachments(
          attRes?.success && Array.isArray(attRes.data) ? attRes.data : [],
        )
        setTaskThreadComments(
          commentsRes?.success && Array.isArray(commentsRes.data) ? commentsRes.data : [],
        )
      } catch {
        if (!cancelled) {
          setTaskSummary(null)
          setTaskAttachments([])
          setTaskThreadComments([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const deptById = useMemo(() => {
    const m = new Map(departments.map((d) => [d.id, d.name]))
    for (const o of cycle?.owners || []) {
      if (o.departmentId && o.departmentName && !looksLikeDbId(o.departmentName)) {
        m.set(o.departmentId, o.departmentName)
      }
    }
    for (const t of cycleTasks) {
      if (t.departmentId && t.departmentName && !looksLikeDbId(t.departmentName)) {
        m.set(t.departmentId, t.departmentName)
      }
    }
    return m
  }, [departments, cycle?.owners, cycleTasks])

  const userById = useMemo(() => {
    const m = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]))
    return m
  }, [users])

  const allTasks: WorkflowTaskRow[] = useMemo(() => {
    const merged = mergeWorkflowTasks({
      myTasks,
      cycleTasks,
      review,
      cycle,
      currentUserId,
    })
    const cycleOwnerName = cycle?.cycleOwnerId
      ? userById.get(cycle.cycleOwnerId) || null
      : null
    return merged.map((t) => {
      const reviewerId = t.reviewerId || null
      const reviewerName =
        t.reviewerName ||
        (reviewerId ? userById.get(reviewerId) : null) ||
        cycleOwnerName ||
        null
      return {
        ...t,
        departmentName: humanDeptName(
          t.departmentId,
          t.departmentName,
          cycle?.owners,
          deptById,
          t.title,
        ),
        assigneeName:
          t.assigneeName ||
          (t.assigneeId ? userById.get(t.assigneeId) : null) ||
          t.assigneeName,
        reviewerId: reviewerId || cycle?.cycleOwnerId || null,
        reviewerName,
      }
    })
  }, [myTasks, cycleTasks, review, cycle, currentUserId, deptById, userById])

  const stages = useMemo(() => workflowStagesFromApi(cycle, review), [cycle, review])
  const pendingDeltaWoW = review?.progress?.pendingDeltaWoW
  const returnedDeltaWoW = review?.progress?.returnedDeltaWoW

  const myTaskIds = useMemo(() => new Set(myTasks.map((t) => t.id)), [myTasks])

  const tabCounts = useMemo(() => {
    return {
      All: allTasks.length,
      "My Tasks": allTasks.filter((t) => myTaskIds.has(t.id) || t.assigneeId === currentUserId)
        .length,
      "Pending Review": allTasks.filter((t) => isPendingReviewStatus(t.status)).length,
      Returned: allTasks.filter((t) => isReturnedStatus(t.status)).length,
    } satisfies Record<WorkflowTab, number>
  }, [allTasks, myTaskIds, currentUserId])

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const st = normalizeTaskStatus(t.status)
      if (tab === "My Tasks" && !(myTaskIds.has(t.id) || t.assigneeId === currentUserId))
        return false
      if (tab === "Pending Review" && !isPendingReviewStatus(st)) return false
      if (tab === "Returned" && !isReturnedStatus(st)) return false
      if (departmentFilter && t.departmentId !== departmentFilter) return false
      if (statusFilter && st !== statusFilter) return false
      if (
        priorityFilter &&
        String(t.priority || "").toUpperCase() !== priorityFilter &&
        !(priorityFilter === "MEDIUM" && String(t.priority || "").toUpperCase() === "NORMAL")
      )
        return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${t.title} ${t.departmentName || ""} ${t.assigneeName || ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [
    allTasks,
    tab,
    myTaskIds,
    currentUserId,
    departmentFilter,
    statusFilter,
    priorityFilter,
    search,
  ])

  useEffect(() => {
    setPage(0)
  }, [tab, search, departmentFilter, statusFilter, priorityFilter, cycleId])

  const queue = countReviewQueue(allTasks)
  const progressRows = deptProgressRows(review, allTasks, {
    owners: cycle?.owners,
    deptById,
  })
  const selected = allTasks.find((t) => t.id === selectedId) || null

  const worksheetHref = useMemo(() => {
    if (!selected || !cycle?.modelId) return null
    const qs = new URLSearchParams()
    qs.set("cycleId", cycle.id)
    qs.set("taskId", selected.id)
    if (selected.departmentId) qs.set("departmentId", selected.departmentId)
    if (cycle.versionId) qs.set("versionId", cycle.versionId)
    if (cycle.scenarioId) qs.set("scenarioId", cycle.scenarioId)
    if (cycle.name) qs.set("cycleName", cycle.name)
    return `/forecasting/models/${cycle.modelId}/worksheet?${qs.toString()}`
  }, [selected, cycle])

  const selectCycle = (id: string) => {
    setCycleId(id)
    setSelectedId(null)
    setDrawerOpen(false)
    syncUrl(id, null)
    void loadCycleBoard(id)
  }

  const st = String(cycle?.status || "").toUpperCase()
  const showBoardPackBtn =
    Boolean(cycle) &&
    canExportBoardPack &&
    (st === "LOCKED" || st === "APPROVED")

  const cyclePicker = (
    <div className="pt-1.5">
      <select
        value={cycleId || ""}
        disabled={loading}
        onChange={(e) => {
          if (e.target.value) selectCycle(e.target.value)
        }}
        className="h-8 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 text-[11px] text-[#475569] max-w-full disabled:opacity-60"
      >
        <option value="">Select budget cycle…</option>
        {cycles.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ·{" "}
            {BUDGET_STATUS_LABEL[c.status as keyof typeof BUDGET_STATUS_LABEL] || c.status}
          </option>
        ))}
      </select>
    </div>
  )

  const selectTask = (id: string) => {
    setSelectedId(id)
    setDrawerOpen(true)
    syncUrl(cycleId, id)
  }

  const clearTask = () => {
    setSelectedId(null)
    setDrawerOpen(false)
    syncUrl(cycleId, null)
  }

  const runCycleAction = async (
    key: string,
    label: string,
    fn: () => Promise<{ success: boolean; message?: string; data?: FpaBudgetCycle }>,
  ) => {
    if (!cycle) return
    setBusyKey(key)
    try {
      const res = await fn()
      if (!res.success) throw new Error(res.message || `${label} failed`)
      if (res.data) setCycle(res.data)
      toast.success(label)
      await loadCycleBoard(cycle.id)
      await dispatch(fetchMyFpaTasks())
    } catch (err) {
      toast.error(errorMessage(err, `${label} failed`))
    } finally {
      setBusyKey(null)
    }
  }

  const onTaskAct = async (action: "approve" | "return" | "reassign") => {
    if (!selected || !cycle) return
    const controls = getTaskActionControls({
      cycleStatus: cycle.status,
      taskStatus: selected.status,
      canApprove: canApproveBudget || canReviewSubmissions,
      canReturn: canReturnTask || canReviewSubmissions,
      canReassign: canAssignTasks,
    })
    if (action === "approve" && !controls.approveEnabled) {
      toast.error(controls.approveTitle)
      return
    }
    if (action === "return" && !controls.returnEnabled) {
      toast.error(controls.returnTitle)
      return
    }
    if (action === "reassign" && !controls.reassignEnabled) {
      toast.error(controls.reassignTitle)
      return
    }
    if (action === "return" && !taskComment.trim()) {
      toast.error("Comment is required to return a task")
      return
    }
    setBusyKey(`task-${action}`)
    try {
      let res
      if (action === "approve") {
        res = await fpaApi.approveTask(
          selected.id,
          taskComment.trim() ? { comment: taskComment.trim() } : undefined,
        )
      } else if (action === "return") {
        res = await fpaApi.returnTask(selected.id, { comment: taskComment.trim() })
      } else {
        res = await fpaApi.reassignTask(selected.id, {
          assigneeId: reassignUserId,
          comment: taskComment.trim() || undefined,
        })
      }
      if (!res.success) throw new Error(res.message || `${action} failed`)
      toast.success(action === "reassign" ? "Task reassigned" : `Task ${action}d`)
      setTaskComment("")
      setReassignUserId("")
      // Keep selection after reassign so the updated assignee is visible.
      if (action !== "reassign") clearTask()
      if (cycleId) await loadCycleBoard(cycleId)
      await dispatch(fetchMyFpaTasks())
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const exportTasks = async () => {
    if (!cycleId) {
      toast.error("Select a cycle to export")
      return
    }
    try {
      const blob = await fpaApi.exportBudgetCycleTasksCsv(cycleId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${(cycle?.name || "workflow-tasks").replace(/[^\w\-]+/g, "_")}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Tasks exported as CSV")
    } catch (err) {
      toast.error(errorMessage(err, "CSV export failed"))
    }
  }

  return (
    <div className="min-h-full bg-[#f1f5f9]">
      <div className="p-4 sm:p-5 space-y-4">
        {loading ? (
          <>
            <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-medium text-[#94a3b8]">Switching cycle</p>
              {cyclePicker}
            </div>
            <WorkflowPageSkeleton />
          </>
        ) : (
          <>
            {/* Top row: Planning Cycle | Review Queue | Recent Approvals */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
              <div className="xl:col-span-6 min-w-0">
                <WorkflowPlanningCycleCard
                  cycle={cycle}
                  stages={stages}
                  onCycleDetails={() => setDetailsOpen(true)}
                  cyclePicker={cyclePicker}
                  boardPack={
                    showBoardPackBtn
                      ? {
                          canShow: true,
                          hasUrl: Boolean(cycle?.boardPackUrl),
                          generating: busyKey === "board-pack",
                          onOpen: () => setBoardPackOpen(true),
                          onGenerate: () =>
                            void runCycleAction("board-pack", "Board pack generated", async () => {
                              const res = await fpaApi.generateBudgetBoardPack(cycle!.id)
                              if (!res.success) throw new Error(res.message || "board-pack failed")
                              const data = res.data as {
                                id?: string
                                exportJobId?: string
                                boardPackUrl?: string
                                url?: string
                                cycle?: FpaBudgetCycle
                              }
                              const packUrl =
                                data?.boardPackUrl ||
                                data?.url ||
                                data?.cycle?.boardPackUrl ||
                                null
                              const updated: FpaBudgetCycle = {
                                ...(data?.cycle || cycle!),
                                boardPackUrl: packUrl || data?.cycle?.boardPackUrl || cycle!.boardPackUrl,
                              }
                              return { success: true, data: updated }
                            }),
                        }
                      : null
                  }
                />
              </div>
              <div className="xl:col-span-3 min-w-0">
                <WorkflowReviewQueueCard
                  pending={queue.pending}
                  returned={queue.returned}
                  pendingDelta={pendingDeltaWoW}
                  returnedDelta={returnedDeltaWoW}
                  onViewAll={() => setQueueModalOpen(true)}
                />
              </div>
              <div className="xl:col-span-3 min-w-0">
                <WorkflowRecentApprovalsCard
                  review={review}
                  tasks={allTasks}
                  events={approvalEvents}
                  onViewAll={() => setApprovalsModalOpen(true)}
                />
              </div>
            </div>

            {!cycleId ? (
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-10 text-center text-sm text-[#64748b]">
                Select a budget cycle to open Workflow & Approvals.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch min-h-[420px] xl:h-[calc(100vh-13rem)] xl:max-h-[calc(100vh-13rem)] xl:overflow-hidden">
                  {/* Left ~50%: Workflow Tasks — shared row height; table scrolls inside */}
                  <div className="xl:col-span-6 min-w-0 flex flex-col min-h-[420px] xl:min-h-0 xl:h-full overflow-hidden">
                    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex-1 min-h-0 overflow-hidden">
                      <WorkflowTasksToolbar
                        tab={tab}
                        onTabChange={setTab}
                        counts={tabCounts}
                        search={search}
                        onSearch={setSearch}
                        department={departmentFilter}
                        onDepartment={setDepartmentFilter}
                        status={statusFilter}
                        onStatus={setStatusFilter}
                        priority={priorityFilter}
                        onPriority={setPriorityFilter}
                        departments={departments}
                        onExport={() => void exportTasks()}
                        onRefresh={() => void refresh()}
                        refreshing={loading}
                      />
                      <WorkflowTasksTable
                        tasks={filteredTasks}
                        selectedId={selectedId}
                        onSelect={selectTask}
                        page={page}
                        pageSize={PAGE_SIZE}
                        onPage={setPage}
                      />
                    </div>
                  </div>

                  {/* Middle ~25%: Progress + Activity — capped to same height, scroll inside */}
                  <div className="xl:col-span-3 min-w-0 flex flex-col gap-3 min-h-[420px] xl:min-h-0 xl:h-full overflow-hidden">
                    <WorkflowDeptProgress
                      rows={progressRows}
                      onViewFull={() => setQueueModalOpen(true)}
                    />
                    <WorkflowActivityFeed
                      review={review}
                      comments={cycleComments}
                      commentDraft={activityDraft}
                      onCommentDraft={setActivityDraft}
                      canComment={
                        Boolean(cycle) &&
                        !["LOCKED", "REPORTS"].includes(String(cycle?.status || "").toUpperCase())
                      }
                      canPostInternal={canApproveBudget || canReviewSubmissions}
                      visibility={activityVisibility}
                      onVisibility={setActivityVisibility}
                      busy={busyKey === "cycle-comment"}
                      onViewAll={() => setApprovalsModalOpen(true)}
                      onAddComment={() => {
                        if (!cycleId || !activityDraft.trim()) return
                        void (async () => {
                          setBusyKey("cycle-comment")
                          try {
                            const res = await fpaApi.postBudgetCycleComment(cycleId, {
                              body: activityDraft.trim(),
                              visibility:
                                canApproveBudget || canReviewSubmissions
                                  ? activityVisibility
                                  : "ALL",
                            })
                            if (!res.success) throw new Error(res.message || "Comment failed")
                            setActivityDraft("")
                            const list = await fpaApi.listBudgetCycleComments(cycleId)
                            if (list.success && Array.isArray(list.data)) setCycleComments(list.data)
                            toast.success("Comment posted")
                          } catch (err) {
                            toast.error(errorMessage(err, "Could not post comment"))
                          } finally {
                            setBusyKey(null)
                          }
                        })()
                      }}
                    />
                  </div>

                  {/* Right ~25%: Task detail — same height; body scrolls */}
                  <div className="xl:col-span-3 min-w-0 flex flex-col min-h-[420px] xl:min-h-0 xl:h-full overflow-hidden">
                    <WorkflowTaskDetailPanel
                      task={selected}
                      cycleStatus={cycle?.status}
                      summary={taskSummary}
                      attachments={taskAttachments}
                      taskComments={taskThreadComments}
                      onClose={clearTask}
                      comment={taskComment}
                      onComment={setTaskComment}
                      reassignUserId={reassignUserId}
                      onReassignUserId={setReassignUserId}
                      users={users}
                      busy={Boolean(busyKey?.startsWith("task-"))}
                      busyAction={
                        busyKey === "task-approve"
                          ? "approve"
                          : busyKey === "task-return"
                            ? "return"
                            : busyKey === "task-reassign"
                              ? "reassign"
                              : busyKey === "task-comment"
                                ? "task-comment"
                                : null
                      }
                      canApprove={canApproveBudget || canReviewSubmissions}
                      canReturn={canReturnTask || canReviewSubmissions}
                      canReassign={canAssignTasks}
                      canPostInternal={canApproveBudget || canReviewSubmissions}
                      worksheetHref={worksheetHref}
                      onApprove={() => void onTaskAct("approve")}
                      onReturn={() => void onTaskAct("return")}
                      onReassign={() => void onTaskAct("reassign")}
                      taskCommentDraft={taskThreadDraft}
                      onTaskCommentDraft={setTaskThreadDraft}
                      taskCommentVisibility={taskThreadVisibility}
                      onTaskCommentVisibility={setTaskThreadVisibility}
                      onPostTaskComment={() => {
                        if (!selected || !taskThreadDraft.trim()) return
                        void (async () => {
                          setBusyKey("task-comment")
                          try {
                            const res = await fpaApi.postTaskComment(selected.id, {
                              body: taskThreadDraft.trim(),
                              visibility:
                                canApproveBudget || canReviewSubmissions
                                  ? taskThreadVisibility
                                  : "ALL",
                            })
                            if (!res.success) throw new Error(res.message || "Comment failed")
                            setTaskThreadDraft("")
                            const list = await fpaApi.listTaskComments(selected.id)
                            if (list.success && Array.isArray(list.data)) {
                              setTaskThreadComments(list.data)
                            }
                            toast.success("Comment posted")
                          } catch (err) {
                            toast.error(errorMessage(err, "Could not post comment"))
                          } finally {
                            setBusyKey(null)
                          }
                        })()
                      }}
                      onUploadAttachment={(file) => {
                        if (!selected) return
                        void (async () => {
                          setBusyKey("task-attach")
                          try {
                            const res = await fpaApi.uploadTaskAttachment(selected.id, file)
                            if (!res.success) throw new Error(res.message || "Upload failed")
                            const list = await fpaApi.listTaskAttachments(selected.id)
                            if (list.success && Array.isArray(list.data)) setTaskAttachments(list.data)
                            toast.success("Attachment uploaded")
                          } catch (err) {
                            toast.error(errorMessage(err, "Upload failed"))
                          } finally {
                            setBusyKey(null)
                          }
                        })()
                      }}
                      onDownloadAttachment={(id, fileName) => {
                        void (async () => {
                          try {
                            const blob = await fpaApi.downloadAttachment(id)
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement("a")
                            a.href = url
                            a.download = fileName || "attachment"
                            a.click()
                            URL.revokeObjectURL(url)
                          } catch (err) {
                            toast.error(errorMessage(err, "Download failed"))
                          }
                        })()
                      }}
                      onDeleteAttachment={(id) => {
                        if (!selected) return
                        void (async () => {
                          setBusyKey("task-attach")
                          try {
                            const res = await fpaApi.deleteAttachment(id)
                            if (!res.success) throw new Error(res.message || "Delete failed")
                            const list = await fpaApi.listTaskAttachments(selected.id)
                            if (list.success && Array.isArray(list.data)) setTaskAttachments(list.data)
                            toast.success("Attachment deleted")
                          } catch (err) {
                            toast.error(errorMessage(err, "Delete failed"))
                          } finally {
                            setBusyKey(null)
                          }
                        })()
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cycle details</DialogTitle>
            <DialogDescription>
              {cycle?.name || "Budget cycle"} · FY{cycle?.fiscalYear || "—"}
            </DialogDescription>
          </DialogHeader>
          {cycle ? (
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[#94a3b8]">Status</dt>
                <dd className="font-medium text-[#0f172a]">{cycle.status}</dd>
              </div>
              <div>
                <dt className="text-[#94a3b8]">Stage</dt>
                <dd className="font-medium text-[#0f172a]">{cycle.currentStage || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#94a3b8]">Start</dt>
                <dd className="font-medium text-[#0f172a]">
                  {cycle.startDate?.slice(0, 10) || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#94a3b8]">End</dt>
                <dd className="font-medium text-[#0f172a]">
                  {cycle.endDate?.slice(0, 10) || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#94a3b8]">Submission deadline</dt>
                <dd className="font-medium text-[#0f172a]">
                  {cycle.submissionDeadline?.slice(0, 10) || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#94a3b8]">Owners</dt>
                <dd className="font-medium text-[#0f172a]">{cycle.owners?.length || 0}</dd>
              </div>
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>

      <WorkflowReviewQueueModal
        open={queueModalOpen}
        onOpenChange={setQueueModalOpen}
        tasks={allTasks}
        onSelectTask={selectTask}
      />

      <WorkflowRecentApprovalsModal
        open={approvalsModalOpen}
        onOpenChange={setApprovalsModalOpen}
        review={review}
        tasks={allTasks}
        events={approvalEvents}
      />

      <FpaExportDownloadModal
        open={boardPackOpen}
        onOpenChange={setBoardPackOpen}
        title="Board pack"
        description={`Download the Excel board pack for ${cycle?.name || "this cycle"}.`}
        url={cycle?.boardPackUrl}
        exportId={cycle?.boardPackUrl ? extractFpaExportId(cycle.boardPackUrl) : null}
        filename={`${(cycle?.name || "board-pack").replace(/[^\w\-]+/g, "_")}.xlsx`}
      />
    </div>
  )
}
