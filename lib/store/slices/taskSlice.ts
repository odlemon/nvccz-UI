import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import {
  taskApiService,
  type Task,
  type TaskActivity,
  type TaskFilters,
  type CreateActivityPayload,
} from "@/lib/api/task-api"

// Task Types
export type { Task, TaskActivity, TaskFilters }

export interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  filters: TaskFilters
  searchTerm: string
  currentPage: number
  totalPages: number
  selectedTask: Task | null
  activities: TaskActivity[]
  activitiesLoading: boolean
  activitiesError: string | null
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  filters: {},
  searchTerm: "",
  currentPage: 1,
  totalPages: 1,
  selectedTask: null,
  activities: [],
  activitiesLoading: false,
  activitiesError: null,
}

// Async Thunks

export const fetchMyTasks = createAsyncThunk("tasks/fetchMyTasks", async (_, { rejectWithValue }) => {
  try {
    const response = await taskApiService.getMyTasks()
    return response.tasks || response.data || []
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const fetchDepartmentTasks = createAsyncThunk(
  "tasks/fetchDepartmentTasks",
  async (department: string, { rejectWithValue }) => {
    try {
      const response = await taskApiService.getDepartmentTasks(department)
      return response.tasks || response.data || []
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (filters: TaskFilters = {}, { rejectWithValue, getState }) => {
    const { tasks: taskState } = getState() as { tasks: TaskState }
    if (taskState.loading) {
      return rejectWithValue("Already fetching tasks.")
    }
    try {
      const response = await taskApiService.getTasks(filters)
      return response.data || []
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData: Partial<Task>, { rejectWithValue }) => {
    try {
      const response = await taskApiService.createTask(taskData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ taskId, taskData }: { taskId: string; taskData: Partial<Task> }, { rejectWithValue }) => {
    try {
      const response = await taskApiService.updateTask(taskId, taskData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const updateTaskStage = createAsyncThunk(
  "tasks/updateTaskStage",
  async ({ taskId, stage, notes }: { taskId: string; stage: string; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await taskApiService.updateTaskStage(taskId, stage, notes)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const deleteTask = createAsyncThunk("tasks/deleteTask", async (taskId: string, { rejectWithValue }) => {
  try {
    await taskApiService.deleteTask(taskId)
    return taskId
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const createActivity = createAsyncThunk(
  "tasks/createActivity",
  async (activityData: CreateActivityRequest, { rejectWithValue }) => {
    try {
      const response = await taskApiService.createActivity(activityData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const createTaskActivity = createAsyncThunk(
  "tasks/createTaskActivity",
  async (payload: CreateActivityPayload, { rejectWithValue }) => {
    try {
      const response = await taskApiService.createActivity(payload)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const addTaskActivity = createAsyncThunk(
  "tasks/addTaskActivity",
  async ({ taskId, activityData }: { taskId: string; activityData: { title: string; description?: string } }, { rejectWithValue }) => {
    try {
      const response = await taskApiService.addTaskActivity(taskId, activityData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const fetchTaskActivities = createAsyncThunk(
  "tasks/fetchTaskActivities",
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await taskApiService.getTaskActivities(taskId)
      if (response.success) {
        return response.data
      }
      return rejectWithValue(response.message || "Failed to fetch activities")
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

// Task Slice
const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        // Accept both array and object payloads to avoid runtime errors and loops
        if (Array.isArray(action.payload)) {
          state.tasks = action.payload
          state.totalPages = 1
        } else if (action.payload && typeof action.payload === "object") {
          const maybeTasks = (action.payload as any).tasks
          const maybeCount = (action.payload as any).count
          state.tasks = Array.isArray(maybeTasks) ? maybeTasks : []
          state.totalPages = Math.ceil((Number(maybeCount) || 0) / 10) || 1
        } else {
          state.tasks = []
          state.totalPages = 1
        }
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch tasks"
      })
      
      // Fetch My Tasks
      .addCase(fetchMyTasks.pending, (state) => {
        state.loading = true
        state.error = null
        state.tasks = []
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch Department Tasks
      .addCase(fetchDepartmentTasks.pending, (state) => {
        state.loading = true
        state.error = null
        state.tasks = []
      })
      .addCase(fetchDepartmentTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
      })
      .addCase(fetchDepartmentTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Create Task
      .addCase(createTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false
        state.tasks.unshift(action.payload)
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to create task"
      })
      
      // Update Task
      .addCase(updateTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false
        const index = state.tasks.findIndex((task) => task.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to update task"
      })
      
      // Update Task Stage
      .addCase(updateTaskStage.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((task) => task.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
      })

      // Delete Task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => task.id !== action.payload)
        if (state.selectedTask?.id === action.payload) {
          state.selectedTask = null
        }
      })

      // Create Activity Log
      .addCase(createActivity.fulfilled, (state, action) => {
        // This doesn't directly add to the list,
        // as we refetch the activities for the task to ensure consistency.
        // We could optionally add it to the list here for a more optimistic update.
      })
      .addCase(createTaskActivity.fulfilled, (state, action) => {
        state.activities.unshift(action.payload)
      })

      // Add Task Activity (updates the task with new activity)
      .addCase(addTaskActivity.fulfilled, (state, action) => {
        const updatedTask = action.payload.task
        if (updatedTask) {
          const idx = state.tasks.findIndex((t) => t.id === updatedTask.id)
          if (idx !== -1) {
            state.tasks[idx] = updatedTask
          }
        }
      })

      // Fetch Task Activities
      .addCase(fetchTaskActivities.pending, (state) => {
        state.activitiesLoading = true
        state.activitiesError = null
        state.activities = [] // Clear previous activities
      })
      .addCase(fetchTaskActivities.fulfilled, (state, action: PayloadAction<TaskActivity[]>) => {
        state.activitiesLoading = false
        state.activities = action.payload
      })
      .addCase(fetchTaskActivities.rejected, (state, action) => {
        state.activitiesLoading = false
        state.activitiesError = action.payload as string
      })
  }
})

export const {
  setFilters,
  setSearchTerm,
  setCurrentPage,
  setSelectedTask,
  clearError
} = taskSlice.actions

export default taskSlice.reducer
