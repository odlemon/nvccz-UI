import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import {
  performanceTasksApi,
  PerformanceTask,
  TaskStage,
  MyTasksFilters,
} from "@/lib/api/performance-tasks-api"

interface PerformanceTasksState {
  tasks: PerformanceTask[]
  selectedTaskId: string | null
  filters: MyTasksFilters
  selectedTaskIds: string[]
  loading: boolean
  saving: boolean
  error: string | null
}

const initialState: PerformanceTasksState = {
  tasks: [],
  selectedTaskId: null,
  filters: {},
  selectedTaskIds: [],
  loading: false,
  saving: false,
  error: null,
}

export const fetchMyKanbanTasks = createAsyncThunk(
  "performanceTasks/fetchMy",
  async (filters: MyTasksFilters | undefined) => {
    const res = await performanceTasksApi.getMyTasks(filters)
    return res.tasks || []
  }
)

export const fetchDepartmentKanbanTasks = createAsyncThunk(
  "performanceTasks/fetchDepartment",
  async (filters: MyTasksFilters | undefined) => {
    const res = await performanceTasksApi.getDepartmentTasks(filters)
    return res.tasks || []
  }
)

export const createKanbanTask = createAsyncThunk(
  "performanceTasks/create",
  async (data: Partial<PerformanceTask> & { title: string; team: string[] }) => {
    const res = await performanceTasksApi.createTask(data)
    return res.task
  }
)

export const updateKanbanTask = createAsyncThunk(
  "performanceTasks/update",
  async ({
    id,
    data,
  }: {
    id: string
    data: Partial<PerformanceTask> & { team?: string[] }
  }) => {
    await performanceTasksApi.updateTask(id, data)
    const fresh = await performanceTasksApi.getTask(id)
    return fresh.task
  }
)

export const deleteKanbanTask = createAsyncThunk(
  "performanceTasks/delete",
  async (id: string) => {
    const res = await performanceTasksApi.deleteTask(id)
    return { id, affectedGoalIds: res.data?.affectedGoalIds || [] }
  }
)

export const moveKanbanTaskStage = createAsyncThunk(
  "performanceTasks/moveStage",
  async ({
    id,
    stage,
    monetaryValueAchieved,
    percentValueAchieved,
  }: {
    id: string
    stage: TaskStage
    monetaryValueAchieved?: number
    percentValueAchieved?: number
  }) => {
    await performanceTasksApi.updateStage(id, {
      stage,
      ...(monetaryValueAchieved !== undefined ? { monetaryValueAchieved } : {}),
      ...(percentValueAchieved !== undefined ? { percentValueAchieved } : {}),
    })
    return { id, stage }
  }
)

export const bulkMoveStage = createAsyncThunk(
  "performanceTasks/bulkMoveStage",
  async ({ taskIds, stage }: { taskIds: string[]; stage: TaskStage }) => {
    await performanceTasksApi.bulkUpdateStage(taskIds, stage)
    return { taskIds, stage }
  }
)

export const bulkStatusUpdate = createAsyncThunk(
  "performanceTasks/bulkStatusUpdate",
  async ({
    taskIds,
    stage,
    monetaryValueAchieved,
  }: {
    taskIds: string[]
    stage: TaskStage
    monetaryValueAchieved?: number
  }) => {
    const res = await performanceTasksApi.bulkStatusUpdate(
      taskIds,
      stage,
      monetaryValueAchieved
    )
    return {
      taskIds,
      stage,
      affectedGoalIds: res.affectedGoalIds || [],
      tasks: res.tasks || [],
    }
  }
)

export const uploadTaskAttachments = createAsyncThunk(
  "performanceTasks/uploadAttachments",
  async ({ id, files }: { id: string; files: File[] }) => {
    await performanceTasksApi.uploadAttachments(id, files)
    const fresh = await performanceTasksApi.getTask(id)
    return fresh.task
  }
)

const slice = createSlice({
  name: "performanceTasks",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<MyTasksFilters>) {
      state.filters = action.payload
    },
    setSelectedTaskId(state, action: PayloadAction<string | null>) {
      state.selectedTaskId = action.payload
    },
    toggleTaskSelection(state, action: PayloadAction<string>) {
      const id = action.payload
      const idx = state.selectedTaskIds.indexOf(id)
      if (idx >= 0) state.selectedTaskIds.splice(idx, 1)
      else state.selectedTaskIds.push(id)
    },
    clearTaskSelection(state) {
      state.selectedTaskIds = []
    },
    optimisticMoveStage(
      state,
      action: PayloadAction<{ id: string; stage: TaskStage }>
    ) {
      const t = state.tasks.find((t) => t.id === action.payload.id)
      if (t) t.stage = action.payload.stage
    },
    upsertTaskFromSocket(state, action: PayloadAction<PerformanceTask>) {
      const idx = state.tasks.findIndex((t) => t.id === action.payload.id)
      if (idx >= 0) state.tasks[idx] = { ...state.tasks[idx], ...action.payload }
      else state.tasks.unshift(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyKanbanTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyKanbanTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
      })
      .addCase(fetchMyKanbanTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to load tasks"
      })
      .addCase(fetchDepartmentKanbanTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDepartmentKanbanTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
      })
      .addCase(fetchDepartmentKanbanTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to load tasks"
      })
      .addCase(createKanbanTask.fulfilled, (state, action) => {
        if (action.payload) state.tasks.unshift(action.payload)
      })
      .addCase(updateKanbanTask.fulfilled, (state, action) => {
        if (!action.payload) return
        const idx = state.tasks.findIndex((t) => t.id === action.payload.id)
        if (idx >= 0) state.tasks[idx] = action.payload
      })
      .addCase(deleteKanbanTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload.id)
      })
      .addCase(moveKanbanTaskStage.fulfilled, (state, action) => {
        const t = state.tasks.find((t) => t.id === action.payload.id)
        if (t) t.stage = action.payload.stage
      })
      .addCase(bulkMoveStage.fulfilled, (state, action) => {
        action.payload.taskIds.forEach((id) => {
          const t = state.tasks.find((t) => t.id === id)
          if (t) t.stage = action.payload.stage
        })
        state.selectedTaskIds = []
      })
      .addCase(bulkStatusUpdate.fulfilled, (state, action) => {
        action.payload.taskIds.forEach((id) => {
          const t = state.tasks.find((t) => t.id === id)
          if (t) t.stage = action.payload.stage
        })
        state.selectedTaskIds = []
      })
      .addCase(uploadTaskAttachments.fulfilled, (state, action) => {
        if (!action.payload) return
        const idx = state.tasks.findIndex((t) => t.id === action.payload.id)
        if (idx >= 0) state.tasks[idx] = action.payload
      })
  },
})

export const {
  setFilters,
  setSelectedTaskId,
  toggleTaskSelection,
  clearTaskSelection,
  optimisticMoveStage,
  upsertTaskFromSocket,
} = slice.actions
export default slice.reducer
