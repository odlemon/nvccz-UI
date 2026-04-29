import { apiClient } from "./api-client"

export type TaskStage =
  | "todo"
  | "in_progress"
  | "overdue"
  | "delayed"
  | "completed"
  | "amber"
  | "red"

export type TaskPriority = "low" | "medium" | "high" | "urgent" | "critical"

export interface TaskAssignee {
  id: string
  fullName?: string
  firstName?: string
  lastName?: string
  email: string
  avatar?: string
}

// API uses both shapes — comments endpoint returns {url, sizeBytes},
// task attachments returns {fileUrl, fileSize}. Accept both.
export interface TaskAttachment {
  fileName: string
  url?: string
  fileUrl?: string
  filePath?: string
  mimeType?: string
  sizeBytes?: number
  fileSize?: number
  uploadedAt?: string
}

/** Resolve the download URL across both shapes. */
export const getAttachmentUrl = (a: TaskAttachment): string =>
  a.fileUrl || a.url || ""

/** Resolve file size across both shapes. */
export const getAttachmentSize = (a: TaskAttachment): number | undefined =>
  a.fileSize ?? a.sizeBytes

export interface TaskComment {
  id: string
  taskId: string
  storagePath?: string
  activityType: string
  title?: string
  content: string
  isDeleted?: boolean
  deletedAt?: string | null
  deletedById?: string | null
  mentions?: Array<{ userId: string; name: string }>
  attachments?: TaskAttachment[]
  eventType?: string
  createdAt: string
  author?: { id: string; fullName: string; email: string }
}

/** Activity log entry as embedded in /tasks/my (rich format). */
export interface TaskActivityLog {
  id: string
  userId: string
  activityType: string
  title?: string
  /** JSON-stringified payload — parse via parseActivityLogDescription */
  description: string
  goalId?: string | null
  taskId: string
  monetaryValueAchieved?: string | null
  percentValueAchieved?: string | null
  status?: string
  createdAt: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
  goal?: any
  documents?: any[]
}

/** Simpler activity entry returned by /tasks/{id} */
export interface TaskActivity {
  by: string
  date: string
  type: string
  activity: string
  attachment?: TaskAttachment
}

export interface ParsedActivityDescription {
  kind?: "comment" | "system" | string
  content?: string
  mentions?: Array<{ userId: string; name: string }>
  attachments?: TaskAttachment[]
  isDeleted?: boolean
  deletedAt?: string | null
  deletedById?: string | null
  eventType?: string | null
  createdAt?: string
  raw?: string
}

/** Safely parse the JSON-stringified `description` field on activity logs. */
export const parseActivityLogDescription = (
  desc: string
): ParsedActivityDescription => {
  if (!desc) return {}
  try {
    const parsed = JSON.parse(desc)
    if (parsed && typeof parsed === "object") return parsed
  } catch {
    // not JSON — return as plain content
    return { content: desc, raw: desc }
  }
  return { content: desc, raw: desc }
}

export interface PerformanceTask {
  id: string
  title: string
  description?: string
  stage: TaskStage
  priority: TaskPriority
  date?: string
  dueDate?: string
  /** Backend returns string[] of user IDs. Sometimes hydrated to objects. */
  team?: string[] | TaskAssignee[]
  assignees?: string[]
  goalId?: string | null
  department?: string | null
  performanceCategory?: string | null
  isPerformanceTask?: boolean
  attachments?: TaskAttachment[]
  /** Rich format from /tasks/my */
  activityLogs?: TaskActivityLog[]
  /** Simple format from /tasks/{id} */
  activities?: TaskActivity[]
  commentCount?: number
  isOverdue?: boolean
  monetaryValueAchieved?: number | string
  percentValueAchieved?: number | string
  targetValue?: number
  taskPercentage?: number
  performanceZone?: string
  category?: string
  taskMetadata?: Record<string, any>
  applicationId?: string | null
  fromDueDiligence?: boolean
  status?: string
  isTrashed?: boolean
  createdBy?: string
  creator?: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
  application?: any
  goal?: any
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

/** Helper: returns the team as a string[] of user IDs regardless of shape. */
export const teamMemberIds = (team?: PerformanceTask["team"]): string[] => {
  if (!team) return []
  return team.map((t: any) => (typeof t === "string" ? t : t?.id)).filter(Boolean)
}

/** Helper: returns hydrated team objects when available, otherwise empty. */
export const hydratedTeam = (
  team?: PerformanceTask["team"]
): TaskAssignee[] => {
  if (!team) return []
  return team.filter((t): t is TaskAssignee => typeof t !== "string")
}

export interface MyTasksFilters {
  stage?: TaskStage | string
  priority?: TaskPriority | string
  department?: string
  performanceCategory?: string
  isPerformanceTask?: boolean
  goalId?: string
  isOverdue?: boolean
  search?: string
}

export interface MentionUser {
  id: string
  name: string
  email: string
}

export const performanceTasksApi = {
  getMyTasks: (filters?: MyTasksFilters) => {
    const qs = filters
      ? "?" +
        new URLSearchParams(
          Object.entries(filters)
            .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
            .map(([k, v]) => [k, String(v)]) as [string, string][]
        ).toString()
      : ""
    return apiClient.get<{ success: boolean; count: number; tasks: PerformanceTask[] }>(
      `/tasks/my${qs}`
    )
  },

  getTask: (id: string) =>
    apiClient.get<{ success: boolean; task: PerformanceTask }>(`/tasks/${id}`),

  createTask: (data: Partial<PerformanceTask> & { title: string; team: string[] }) =>
    apiClient.post<{ success: boolean; task: PerformanceTask }>("/tasks", data),

  updateTask: (id: string, data: Partial<PerformanceTask> & { team?: string[] }) =>
    apiClient.put<{ success: boolean; task?: PerformanceTask }>(`/tasks/${id}`, data),

  deleteTask: (id: string) =>
    apiClient.delete<{
      success: boolean
      data?: { trashedTaskIds: string[]; affectedGoalIds: string[] }
    }>(`/tasks/${id}`),

  updateStage: (
    id: string,
    payload: { stage: TaskStage; monetaryValueAchieved?: number; percentValueAchieved?: number }
  ) => apiClient.put<{ success: boolean }>(`/tasks/${id}/stage`, payload),

  bulkUpdateStage: (taskIds: string[], stage: TaskStage) =>
    apiClient.put<{ success: boolean }>("/tasks/bulk/stage", { taskIds, stage }),

  bulkStatusUpdate: (
    taskIds: string[],
    stage: TaskStage,
    monetaryValueAchieved?: number
  ) =>
    apiClient.put<{
      success: boolean
      count: number
      affectedGoalCount: number
      affectedGoalIds: string[]
      tasks: PerformanceTask[]
    }>("/tasks/bulk/status-update", {
      taskIds,
      stage,
      ...(monetaryValueAchieved !== undefined ? { monetaryValueAchieved } : {}),
    }),

  uploadAttachments: (id: string, files: File[]) => {
    const fd = new FormData()
    files.forEach((f) => fd.append("attachments", f))
    return apiClient.postFormData<{ success: boolean; result: any }>(
      `/tasks/${id}/attachments`,
      fd
    )
  },

  uploadAttachmentBase64: (
    id: string,
    payload: { fileName: string; contentBase64: string; mimeType?: string }
  ) =>
    apiClient.post<{ success: boolean; result: any }>(
      `/tasks/${id}/attachments/base64`,
      payload
    ),

  getMentionSuggestions: (id: string, q?: string) => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : ""
    return apiClient.get<{ success: boolean; users: MentionUser[] }>(
      `/tasks/${id}/mention-suggestions${qs}`
    )
  },

  getComments: (id: string) =>
    apiClient.get<{ success: boolean; comments: TaskComment[] }>(
      `/tasks/${id}/comments`
    ),

  postComment: (
    id: string,
    payload: { content: string; mentionUserIds?: string[]; attachments?: File[] }
  ) => {
    const fd = new FormData()
    fd.append("content", payload.content)
    if (payload.mentionUserIds && payload.mentionUserIds.length > 0) {
      fd.append("mentionUserIds", JSON.stringify(payload.mentionUserIds))
    }
    if (payload.attachments) {
      payload.attachments.forEach((f) => fd.append("attachments", f))
    }
    return apiClient.postFormData<TaskComment>(`/tasks/${id}/comments`, fd)
  },

  deleteComment: (taskId: string, commentId: string) =>
    apiClient.delete<{ success: boolean }>(`/tasks/${taskId}/comments/${commentId}`),
}
