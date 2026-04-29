"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  performanceTasksApi,
  PerformanceTask,
  TaskActivityLog,
  TaskActivity,
  hydratedTeam,
  teamMemberIds,
  parseActivityLogDescription,
  getAttachmentUrl,
} from "@/lib/api/performance-tasks-api"
import { AppUser } from "@/lib/api/users-api"
import { useAppSelector } from "@/lib/store"
import { TaskAttachmentsPanel } from "./task-attachments-panel"
import { TaskChatPanel } from "../collaboration/task-chat-panel"
import { TaskEditDialog } from "./task-edit-dialog"
import { TaskActivityModal } from "@/components/applications/task-activity-modal"
import {
  Calendar,
  Tag,
  Users,
  Loader2,
  Trash2,
  Paperclip,
  MessageCircle,
  X,
  AlertCircle,
  Activity,
  Pencil,
  Target,
  ListChecks,
  FileText,
  DollarSign,
  TrendingUp,
  Download,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { deleteKanbanTask } from "@/lib/store/slices/performanceTasksSlice"
import { extractApiError } from "@/lib/utils/api-error"
import { cn } from "@/lib/utils"
import { DocumentPreviewModal } from "@/components/applications/document-preview-modal"

interface Props {
  taskId: string | null
  onClose: () => void
}

type DrawerTab = "details" | "activity" | "files" | "chat"

const STAGE_BADGE_CLASS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  delayed: "bg-orange-100 text-orange-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
}

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  urgent: "bg-purple-100 text-purple-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
}

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  if (firstName || lastName) {
    return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase() || "?"
  }
  if (email) return email[0].toUpperCase()
  return "?"
}

export function TaskDetailDialog({ taskId, onClose }: Props) {
  const dispatch = useAppDispatch()
  const [task, setTask] = useState<PerformanceTask | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<DrawerTab>("details")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDocs, setPreviewDocs] = useState<any[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)

  const reload = async () => {
    if (!taskId) return
    setLoading(true)
    try {
      const res = await performanceTasksApi.getTask(taskId)
      setTask(res.task)
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to load task"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!taskId) return
    setActiveTab("details")
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const handleDelete = async () => {
    if (!taskId) return
    setDeleting(true)
    try {
      await dispatch(deleteKanbanTask(taskId)).unwrap()
      toast.success("Task deleted")
      setDeleteConfirmOpen(false)
      onClose()
    } catch (e: any) {
      toast.error(extractApiError(e, "Delete failed"))
    } finally {
      setDeleting(false)
    }
  }

  const tabs: { id: DrawerTab; label: string; icon: any; count?: number }[] = [
    { id: "details", label: "Task Details", icon: ListChecks },
    { id: "activity", label: "Activity Log", icon: Activity },
    {
      id: "files",
      label: "Files",
      icon: Paperclip,
      count: task?.attachments?.length,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageCircle,
      count: task?.commentCount,
    },
  ]

  if (!taskId) return null

  return (
    <>
      <Sheet open={taskId !== null} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-[800px] sm:max-w-[800px] p-0 flex flex-col">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 bg-white border-b">
            <div className="px-6 pt-6 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Task View
                  </p>
                  <h2 className="text-xl font-semibold text-gray-900 mt-0.5 truncate">
                    {task?.title || "Loading..."}
                  </h2>
                </div>

                {/* Top-right action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => setActivityOpen(true)}
                    className="rounded-full h-10 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Log Activity
                  </Button>
                  <Button
                    onClick={() => setEditOpen(true)}
                    className="rounded-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirmOpen(true)}
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-10 w-10 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Status pills */}
              {task && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <Badge className={STAGE_BADGE_CLASS[task.stage] || "bg-gray-100"}>
                    {task.stage?.replace("_", " ")}
                  </Badge>
                  {task.priority && (
                    <Badge className={PRIORITY_BADGE_CLASS[task.priority] || ""}>
                      {task.priority}
                    </Badge>
                  )}
                  {task.isPerformanceTask && (
                    <Badge variant="outline" className="border-purple-300 text-purple-700">
                      Performance
                    </Badge>
                  )}
                  {task.isOverdue && task.stage !== "completed" && (
                    <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Tab Navigation (matches original TaskDrawerView style) */}
            <nav className="flex space-x-6 px-6 -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 py-3 px-1 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                      active
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            {loading || !task ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className={cn("h-full", activeTab === "chat" && "p-0 -m-6")}>
                {activeTab === "details" && (
                  <DetailsTab
                    task={task}
                    onPreview={(docs, idx) => {
                      setPreviewDocs(docs)
                      setPreviewIndex(idx)
                      setPreviewOpen(true)
                    }}
                  />
                )}
                {activeTab === "activity" && (
                  <ActivityTab task={task} onLogActivity={() => setActivityOpen(true)} />
                )}
                {activeTab === "files" && (
                  <TaskAttachmentsPanel
                    taskId={task.id}
                    attachments={task.attachments || []}
                    onPreview={(docs, idx) => {
                      setPreviewDocs(docs)
                      setPreviewIndex(idx)
                      setPreviewOpen(true)
                    }}
                  />
                )}
                {activeTab === "chat" && (
                  <TaskChatPanel
                    taskId={task.id}
                    onPreview={(docs, idx) => {
                      setPreviewDocs(docs)
                      setPreviewIndex(idx)
                      setPreviewOpen(true)
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={(o) => !o && setDeleteConfirmOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-deletes the task. Linked goal progress will be recalculated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      {task && (
        <TaskEditDialog
          open={editOpen}
          task={task}
          onOpenChange={setEditOpen}
          onSaved={async () => {
            await reload()
            setEditOpen(false)
          }}
        />
      )}

      {/* Log Activity modal */}
      {task && activityOpen && (
        <TaskActivityModal
          isOpen={activityOpen}
          onClose={() => setActivityOpen(false)}
          taskId={task.id}
          taskTitle={task.title}
          onSuccess={() => {
            reload()
            setActivityOpen(false)
          }}
        />
      )}
      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documents={previewDocs}
        initialDocumentIndex={previewIndex}
      />
    </>
  )
}

/* ---------- Details Tab ---------- */
function DetailsTab({
  task,
  onPreview
}: {
  task: PerformanceTask
  onPreview: (docs: any[], idx: number) => void
}) {
  const due = task.dueDate || task.date

  return (
    <div className="space-y-4">
      {task.description && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Description
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {task.description}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {due && (
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" /> Due Date
              </p>
              <p className="text-sm font-medium text-gray-800">
                {format(new Date(due), "PPP")}
              </p>
            </div>
          )}
          {task.department && (
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3" /> Department
              </p>
              <p className="text-sm font-medium text-gray-800">{task.department}</p>
            </div>
          )}
          {task.performanceCategory && (
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3" /> Category
              </p>
              <p className="text-sm font-medium text-gray-800">
                {task.performanceCategory}
              </p>
            </div>
          )}
          {task.goalId && (
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Target className="w-3 h-3" /> Linked Goal
              </p>
              <p className="text-sm font-mono text-gray-800 truncate">{task.goalId}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {(() => {
        const ids = teamMemberIds(task.team)
        const hydrated = hydratedTeam(task.team)
        const users = useAppSelector((s) => s.users.items)

        // Resolve IDs to user objects from store if not already hydrated
        const resolvedObjects = ids.map(id => {
          const existing = hydrated.find(h => h.id === id)
          if (existing) return existing
          const storeUser = users.find(u => u.id === id)
          if (storeUser) return {
            id: storeUser.id,
            firstName: storeUser.firstName,
            lastName: storeUser.lastName,
            email: storeUser.email,
            fullName: `${storeUser.firstName || ""} ${storeUser.lastName || ""}`.trim()
          }
          return null
        }).filter((u): u is any => u !== null)

        const resolvedIds = new Set(resolvedObjects.map((u) => u.id))
        const remainingPlaceholderIds = ids.filter((id) => !resolvedIds.has(id))

        if (ids.length === 0) return null
        return (
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> Team ({ids.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {resolvedObjects.map((u) => (
                  <Badge
                    key={u.id}
                    variant="secondary"
                    className="px-2 py-1 gap-1.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] inline-flex items-center justify-center font-bold">
                      {getInitials(u.firstName, u.lastName, u.email)}
                    </span>
                    {u.fullName ||
                      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                      u.email}
                  </Badge>
                ))}
                {remainingPlaceholderIds.map((id) => (
                  <Badge
                    key={id}
                    variant="outline"
                    className="px-2 py-1 gap-1.5 text-gray-600"
                  >
                    <span className="w-5 h-5 rounded-full bg-gray-300 text-white text-[10px] inline-flex items-center justify-center">
                      <Users className="w-3 h-3" />
                    </span>
                    <span className="font-mono text-[10px]">{id.slice(0, 10)}…</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {task.isOverdue && task.stage !== "completed" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">This task is overdue.</p>
        </div>
      )}

      {(task.monetaryValueAchieved !== undefined ||
        task.percentValueAchieved !== undefined ||
        task.targetValue !== undefined) && (
          <Card>
            <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {task.targetValue !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3" /> Target Value
                  </p>
                  <p className="text-base font-semibold text-gray-800">
                    {Number(task.targetValue).toLocaleString()}
                  </p>
                </div>
              )}
              {task.monetaryValueAchieved !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3" /> Value Achieved
                  </p>
                  <p className="text-base font-semibold text-emerald-700">
                    ${Number(task.monetaryValueAchieved).toLocaleString()}
                  </p>
                </div>
              )}
              {task.percentValueAchieved !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3" /> % Achieved
                  </p>
                  <p className="text-base font-semibold text-blue-700">
                    {task.percentValueAchieved}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Performance zone + completion percentage */}
      {(task.performanceZone || task.taskPercentage !== undefined) && (
        <Card>
          <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {task.performanceZone && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Performance Zone</p>
                <Badge
                  className={
                    task.performanceZone === "GREEN ZONE"
                      ? "bg-green-100 text-green-800"
                      : task.performanceZone === "RED"
                        ? "bg-red-100 text-red-800"
                        : task.performanceZone === "AMBER"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-800"
                  }
                >
                  {task.performanceZone}
                </Badge>
              </div>
            )}
            {task.taskPercentage !== undefined && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Task Completion</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{
                        width: `${Math.min(100, Math.max(0, task.taskPercentage))}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {task.taskPercentage}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Created by */}
      {task.creator && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 mb-2">Created By</p>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] inline-flex items-center justify-center font-bold">
                {getInitials(
                  task.creator.firstName,
                  task.creator.lastName,
                  task.creator.email
                )}
              </span>
              <div>
                <p className="text-sm font-medium">
                  {`${task.creator.firstName || ""} ${task.creator.lastName || ""}`.trim() ||
                    task.creator.email}
                </p>
                <p className="text-[11px] text-gray-500">{task.creator.email}</p>
              </div>
              {task.createdAt && (
                <span className="ml-auto text-[11px] text-gray-400">
                  {format(new Date(task.createdAt), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task metadata (deal id, source module etc) */}
      {task.taskMetadata && Object.keys(task.taskMetadata).length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 mb-2">Metadata</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {Object.entries(task.taskMetadata).map(([k, v]) => (
                <div key={k}>
                  <span className="text-[11px] text-gray-500">{k}</span>
                  <p className="font-mono text-xs text-gray-800 truncate">
                    {String(v)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked application (due-diligence tasks) */}
      {task.application && (
        <Card className="border-l-4 border-l-blue-500 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 border-b bg-blue-50/30">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                Linked Application
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                {task.application.businessName || "Unknown Application"}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {task.application.dealReference && (
                  <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 font-mono">
                    {task.application.dealReference}
                  </Badge>
                )}
                {task.application.currentStage && (
                  <Badge className="bg-blue-600 text-white border-transparent">
                    {task.application.currentStage.replace(/_/g, " ")}
                  </Badge>
                )}
                {task.application.industry && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {task.application.industry}
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Applicant</p>
                  <p className="text-sm font-medium text-gray-900">{task.application.applicantName || "N/A"}</p>
                  <p className="text-xs text-gray-500">{task.application.applicantEmail}</p>
                  <p className="text-xs text-gray-500">{task.application.applicantPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Business Details</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.application.businessStage?.replace(/_/g, " ") || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Founded: {task.application.foundingDate ? format(new Date(task.application.foundingDate), "MMM yyyy") : "N/A"}
                  </p>
                  {task.application.requestedAmount && (
                    <p className="text-sm font-bold text-emerald-600 mt-1">
                      ${Number(task.application.requestedAmount).toLocaleString()} requested
                    </p>
                  )}
                </div>
              </div>

              {task.application.businessDescription && (
                <div className="pt-2 border-t">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Description</p>
                  <p className="text-xs text-gray-700 leading-relaxed italic">
                    "{task.application.businessDescription}"
                  </p>
                </div>
              )}

              {/* Application Documents */}
              {task.application.documents && task.application.documents.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3 h-3" /> Application Documents ({task.application.documents.length})
                  </p>
                  <div className="space-y-2">
                    {task.application.documents.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {doc.documentType?.replace(/_/g, " ") || doc.fileName}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">{doc.fileName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] gap-1"
                            onClick={() => onPreview(task.application!.documents!, idx)}
                          >
                            <FileText className="w-3 h-3" /> View
                          </Button>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Download className="w-3 h-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ---------- Activity Tab ---------- */
const STATUS_BADGE: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

interface NormalizedActivity {
  id: string
  date: string
  authorId?: string
  authorName?: string
  type: string
  title?: string
  content?: string
  attachments?: any[]
  mentions?: any[]
  monetaryValueAchieved?: string | number | null
  percentValueAchieved?: string | number | null
  status?: string
  source: "rich" | "simple"
}

const normalizeActivities = (
  task: PerformanceTask,
  users: AppUser[]
): NormalizedActivity[] => {
  const result: NormalizedActivity[] = []
  const userById = new Map(users.map((u) => [u.id, u]))

    // Rich activityLogs (from /tasks/my)
    ; (task.activityLogs || []).forEach((log: TaskActivityLog) => {
      const parsed = parseActivityLogDescription(log.description)
      const authorName =
        log.user
          ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() ||
          log.user.email
          : undefined
      result.push({
        id: log.id,
        date: log.createdAt,
        authorId: log.userId,
        authorName,
        type: log.activityType,
        title: log.title,
        content: parsed.content,
        attachments: parsed.attachments,
        mentions: parsed.mentions,
        monetaryValueAchieved: log.monetaryValueAchieved,
        percentValueAchieved: log.percentValueAchieved,
        status: log.status,
        source: "rich",
      })
    })

    // Simple activities (from /tasks/{id})
    ; (task.activities || []).forEach((act: TaskActivity, idx) => {
      const u = userById.get(act.by)
      const authorName = u
        ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email
        : undefined
      result.push({
        id: `${act.date}-${idx}`,
        date: act.date,
        authorId: act.by,
        authorName,
        type: act.type,
        content: act.activity,
        attachments: act.attachment ? [act.attachment] : undefined,
        source: "simple",
      })
    })

  // Dedupe by date+content (rich and simple may overlap)
  const seen = new Set<string>()
  const deduped: NormalizedActivity[] = []
  for (const a of result) {
    const key = `${a.date}|${a.content?.slice(0, 30) || ""}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(a)
    }
  }

  // Sort newest first
  deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return deduped
}

function ActivityTab({
  task,
  onLogActivity,
}: {
  task: PerformanceTask
  onLogActivity: () => void
}) {
  const users = useAppSelector((s) => s.users.items)
  const sorted = normalizeActivities(task, users)

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="pt-4 pb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-purple-900">
            <Activity className="w-4 h-4" />
            Log progress, work done, monetary value achieved, or blockers.
          </div>
          <Button
            onClick={onLogActivity}
            className="rounded-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
          >
            <Activity className="w-4 h-4 mr-2" /> Log Activity
          </Button>
        </CardContent>
      </Card>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-sm text-gray-500">
            <Activity className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            No activity yet. Click "Log Activity" to record progress.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((log) => {
            const userName = log.authorName || "Unknown"
            const isCompletion =
              log.type === "task_completion" || log.type === "todo"
            const isComment = log.type === "task_comment"
            const isSystem =
              log.type === "task_system_message" ||
              log.type === "attachment_upload"

            return (
              <Card
                key={log.id}
                className={cn(
                  "border-l-4",
                  isCompletion && "border-l-emerald-500",
                  isComment && "border-l-blue-500",
                  isSystem && "border-l-gray-400"
                )}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">
                        {userName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {log.type.replace("task_", "").replace("_", " ")}
                      </Badge>
                      {log.status && STATUS_BADGE[log.status] && (
                        <Badge className={STATUS_BADGE[log.status]}>
                          {log.status.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {format(new Date(log.date), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>

                  {(log.title || log.content) && (
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                      {log.content || log.title}
                    </p>
                  )}

                  {/* Completion stats */}
                  {(log.monetaryValueAchieved || log.percentValueAchieved) && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {log.monetaryValueAchieved && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                          <DollarSign className="w-3 h-3" />$
                          {Number(log.monetaryValueAchieved).toLocaleString()}
                        </span>
                      )}
                      {log.percentValueAchieved && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          {log.percentValueAchieved}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Mentions */}
                  {log.mentions && log.mentions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.mentions.map((m: any) => (
                        <Badge
                          key={m.userId}
                          variant="outline"
                          className="text-[10px] border-blue-300 text-blue-700"
                        >
                          @{m.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Attachments */}
                  {log.attachments && log.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {log.attachments.map((a: any, i: number) => {
                        const url = getAttachmentUrl(a)
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-white border rounded-lg px-2 py-1 hover:bg-blue-50 text-xs"
                          >
                            <Paperclip className="w-3 h-3 text-gray-500" />
                            <span className="max-w-[140px] truncate text-gray-700">
                              {a.fileName}
                            </span>
                          </a>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
