import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { departmentApiService } from "@/lib/api/department-api"
import { kpiApiService } from '@/lib/api/kpi-api'
import { goalApiService, type GoalActivity, type GoalRollupData } from "@/lib/api/goal-api"
import { performanceApi, type PerformanceDashboardData, type PerformanceDashboardParams } from "@/lib/api/performance-api"
import { performanceBscApiService, type ContractCreatePayload } from "@/lib/api/performance-bsc-api"

// KPI Types
export interface KPI {
  id: string
  name: string
  description?: string
  type: "Percentage" | "Number" | "Currency" | "Ratio" | "Metric"
  branch?: string | null
  weightValue: string
  hasUnit: boolean
  unitCategory?: string | null
  unit: string
  unitSymbol?: string | null
  unitPosition: "prefix" | "suffix"
  isActive: boolean
  createdAt: string
  updatedAt: string
  performanceGoals?: PerformanceGoal[]
  _count?: {
    performanceGoals: number
  }
  // Additional fields for frontend compatibility
  targetValue?: number
  currentValue?: number
  category?: "sales" | "financial" | "operational" | "investment"
  frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  departmentId?: string
}

// Department Types
export interface Department {
  id: string
  name: string
  description: string
  branch: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  users: any[]
  goals: PerformanceGoal[]
  _count: {
    users: number
    goals: number
  }
}

// Performance Goal Types
export interface PerformanceGoal {
  id: string
  title: string
  description: string
  type: "company" | "department" | "individual"
  category: "financial" | "operational" | "strategic"
  departmentId: string
  monetaryValue?: number
  percentValue?: number
  priority: "low" | "medium" | "high" | "critical"
  startDate: string
  endDate: string
  assignedToId: string
  status: "not_started" | "in_progress" | "completed" | "cancelled"
  progress: number
  createdAt: string
  updatedAt: string
}

// Task Types
export interface Task {
  id: string
  title: string
  description: string
  category: "investment" | "operational" | "strategic" | "compliance"
  priority: "low" | "medium" | "high" | "critical"
  startDate: string
  endDate: string
  assignedToId: string
  team: string[]
  goalId?: string
  performanceCategory: "deal_sourcing" | "due_diligence" | "portfolio_management" | "reporting"
  isPerformanceTask: boolean
  monetaryValue?: number
  percentValue?: number
  kpi?: {
    type: "Metric" | "Percentage" | "Currency"
    target: number
    unit: string
  }
  ruleset: ">=" | "<=" | "=" | ">" | "<"
  status: "not_started" | "in_progress" | "completed" | "cancelled"
  progress: number
  createdAt: string
  updatedAt: string
}

// Performance Dashboard Metrics
export interface PerformanceMetrics {
  totalKPIs: number
  activeKPIs: number
  completedGoals: number
  totalGoals: number
  completedTasks: number
  totalTasks: number
  averageGoalProgress: number
  averageTaskProgress: number
  departmentPerformance: {
    departmentId: string
    departmentName: string
    kpiCount: number
    goalCount: number
    taskCount: number
    averageProgress: number
  }[]
}

interface GetGoalsParams {
  type?: 'company' | 'department' | 'individual' | ''
  department?: string
}

interface PerformanceState {
  // Data
  kpis: KPI[]
  departments: Department[]
  goals: any[]
  tasks: Task[]
  metrics: PerformanceMetrics | null
  selectedGoal: any | null
  selectedKPI: KPI | null
  selectedTask: Task | null
  
  // UI State
  loading: boolean
  crudLoading: boolean
  error: string | null
  
  // Filters
  selectedDepartment: string
  selectedCategory: string
  selectedPriority: string
  selectedStatus: string
  searchTerm: string
  
  // KPI Filters
  selectedKPIType: string
  selectedKPICategory: string
  selectedKPIDepartment: string
  selectedKPIStatus: string
  kpiSearchTerm: string
  
  // Goal Filters
  selectedGoalType: string
  selectedGoalCategory: string
  selectedGoalDepartment: string
  selectedGoalAssignedTo: string
  
  // Pagination
  currentPage: number
  itemsPerPage: number

  // Available Departments
  availableDepartments: { name: string; description: string }[]
  availableDepartmentsLoading: boolean

  // KPI Statistics
  availableKPIs: any[]
  kpiStatistics: any | null
  selectedViewMode: 'all' | 'department' | 'accountType'
  selectedAccountType: string
  selectedDepartmentFilter: string
  selectedAccountTypeFilter: string

  // Financial KPIs
  financialKPIs: any[]
  financialKPIsLoading: boolean

  // Goals
  goalsLoading: boolean
  goalError: string | null

  // Breakdown
  breakdownUsers: any[]
  breakdownUsersLoading: boolean

  // Goal Details
  selectedGoalDetails: any | null
  selectedGoalDetailsLoading: boolean

  // KPI Analytics
  kpiAnalytics: any[]
  kpiAnalyticsLoading: boolean
  kpiAnalyticsSummary: any | null

  // Goal Activities
  goalActivities: GoalActivity[]
  goalActivitiesLoading: boolean

  // Goal Rollup Data
  goalRollupData: GoalRollupData | null
  goalRollupDataLoading: boolean

  // Dashboard Analytics
  dashboardData: any | null
  departmentComparison: any | null
  dashboardLoading: boolean
  departmentComparisonLoading: boolean

  // Dashboard V2
  performanceDashboardData: PerformanceDashboardData | null
  performanceDashboardLoading: boolean
  performanceDashboardError: string | null

  // BSC Operations
  bscOperationLoading: boolean
  bscOperationError: string | null
  budgetVarianceReports: any[]
  statutorySubmissions: any[]
}

const initialState: PerformanceState = {
  departments: [],
  goals: [],
  kpis: [],
  tasks: [],
  metrics: null,
  loading: false,
  crudLoading: false,
  error: null,
  selectedGoal: null,
  selectedKPI: null,
  selectedTask: null,
  availableDepartments: [], // Ensure it's initialized as empty array
  availableDepartmentsLoading: false,

  // Filters
  selectedDepartment: "all",
  selectedCategory: "all",
  selectedPriority: "all",
  selectedStatus: "all",
  searchTerm: "",
  
  // KPI Filters
  selectedKPIType: "all",
  selectedKPICategory: "all",
  selectedKPIDepartment: "all",
  selectedKPIStatus: "all",
  kpiSearchTerm: "",
  
  // Goal Filters
  selectedGoalType: "all",
  selectedGoalCategory: "all",
  selectedGoalDepartment: "all",
  selectedGoalAssignedTo: "all",
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 10,

  // KPI Statistics
  availableKPIs: [],
  kpiStatistics: null,
  selectedDepartmentFilter: 'all',
  selectedViewMode: 'all',
  selectedAccountType: 'all',
  selectedAccountTypeFilter: 'all',

  // Financial KPIs
  financialKPIs: [],
  financialKPIsLoading: false,

  // Goals
  goalsLoading: false,
  goalError: null,

  // Breakdown
  breakdownUsers: [],
  breakdownUsersLoading: false,

  // Goal Details
  selectedGoalDetails: null,
  selectedGoalDetailsLoading: false,

  // KPI Analytics
  kpiAnalytics: [],
  kpiAnalyticsLoading: false,
  kpiAnalyticsSummary: null,

  // Goal Activities
  goalActivities: [],
  goalActivitiesLoading: false,

  // Goal Rollup Data
  goalRollupData: null,
  goalRollupDataLoading: false,

  // Dashboard Analytics
  dashboardData: null,
  departmentComparison: null,
  dashboardLoading: false,
  departmentComparisonLoading: false,

  // Dashboard V2
  performanceDashboardData: null,
  performanceDashboardLoading: false,
  performanceDashboardError: null,

  // BSC Operations
  bscOperationLoading: false,
  bscOperationError: null,
  budgetVarianceReports: [],
  statutorySubmissions: [],
}

// Async thunks
export const fetchAvailableDepartments = createAsyncThunk(
  'performance/fetchAvailableDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await departmentApiService.getAvailableDepartments()
      return response || []
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch available departments')
    }
  }
)

// Async thunks for KPIs
export const fetchAvailableKPIs = createAsyncThunk(
  "performance/fetchAvailableKPIs",
  async (_, { getState }) => {
    // Check if KPIs already exist in state
    const state = getState() as any
    if (state.performance.availableKPIs?.length > 0) {
      return { data: state.performance.availableKPIs }
    }
    
    const response = await kpiApiService.getAvailableKPIs()
    return response
  }
)

export const fetchKPIsByDepartment = createAsyncThunk(
  'performance/fetchKPIsByDepartment',
  async (departmentName: string, { rejectWithValue }) => {
    try {
      const response = await kpiApiService.getKPIsByDepartment(departmentName)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load department KPIs')
    }
  }
)

export const fetchKPIsByAccountType = createAsyncThunk(
  'performance/fetchKPIsByAccountType',
  async (accountType: string, { rejectWithValue }) => {
    try {
      const response = await kpiApiService.getKPIsByAccountType(accountType)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load KPIs by account type')
    }
  }
)

export const fetchKPIStatistics = createAsyncThunk(
  'performance/fetchKPIStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await kpiApiService.getKPIStatistics()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load KPI statistics')
    }
  }
)

export const fetchFinancialKPIs = createAsyncThunk(
  'performance/fetchFinancialKPIs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await kpiApiService.getFinancialKPIs()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load financial KPIs')
    }
  }
)

// Async thunks for Goals
export const fetchGoals = createAsyncThunk(
  'performance/fetchGoals',
  async (params: GetGoalsParams = {}, { rejectWithValue }) => {
    try {
      const response = await goalApiService.getGoals(params)
      return response.goals
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load goals')
    }
  },
)

export const createGoal = createAsyncThunk(
  'performance/createGoal',
  async (goalData: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await goalApiService.createGoal(goalData)
      dispatch(fetchGoals({})) // Refetch goals after creation
      return response.goal
    } catch (error: any) {
      const apiMessage = error?.response?.message || error?.response?.error || error?.message
      return rejectWithValue(apiMessage || 'Failed to create goal')
    }
  },
)

export const deleteGoal = createAsyncThunk(
  'performance/deleteGoal',
  async (goalId: string, { dispatch, rejectWithValue }) => {
    try {
      await goalApiService.deleteGoal(goalId)
      dispatch(fetchGoals({})) // Refetch goals after deletion
      return goalId
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete goal')
    }
  },
)

export const updateGoal = createAsyncThunk(
  'performance/updateGoal',
  async ({ goalId, data }: { goalId: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = await goalApiService.updateGoal(goalId, data)
      dispatch(fetchGoals({})) // Refetch goals after update
      return response.goal
    } catch (error: any) {
      const apiMessage = error?.response?.message || error?.response?.error || error?.message
      return rejectWithValue(apiMessage || 'Failed to update goal')
    }
  },
)

// Async thunks for Goal Breakdown
export const breakdownGoalToDepartments = createAsyncThunk(
  'performance/breakdownToDepartments',
  async (data: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await goalApiService.breakdownToDepartments(data)
      
      // Refetch goals to show new sub-goals
      await dispatch(fetchGoals({}))
      
      // Return the response for success handling
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to breakdown goal')
    }
  },
)

export const fetchUsersForBreakdown = createAsyncThunk(
  'performance/fetchUsersForBreakdown',
  async (departmentName: string, { rejectWithValue }) => {
    try {
      console.log('Thunk: Fetching users for department:', departmentName)
      const response = await goalApiService.getUsersForBreakdown(departmentName)
      console.log('Thunk: Users response:', response)
      return response.users || []
    } catch (error: any) {
      console.error('Thunk: Error fetching users:', error)
      return rejectWithValue(error.message || 'Failed to fetch users')
    }
  },
)

export const breakdownGoalToIndividuals = createAsyncThunk(
  'performance/breakdownToIndividuals',
  async (data: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await goalApiService.breakdownToIndividuals(data)
      dispatch(fetchGoals({})) // Refetch goals to show new sub-goals
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to breakdown goal')
    }
  },
)

export const fetchGoalDetails = createAsyncThunk(
  'performance/fetchGoalDetails',
  async (goalId: string, { rejectWithValue }) => {
    try {
      const response = await goalApiService.getGoal(goalId)
      return response.goal
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch goal details')
    }
  },
)

// Async thunks for KPI Analytics
export const fetchKPIAnalytics = createAsyncThunk(
  "performance/fetchKPIAnalytics",
  async (params?: {
    kpiId?: string
    department?: string
    startDate?: string
    endDate?: string
  }) => {
    const response = await kpiApiService.getKPIAnalytics(params)
    return response
  }
)

export const recalculateGoalRollup = createAsyncThunk(
  "performance/recalculateGoalRollup",
  async (goalId: string) => {
    const response = await goalApiService.recalculateRollup(goalId)
    return response
  }
)

export const fetchGoalActivities = createAsyncThunk(
  "performance/fetchGoalActivities",
  async (goalId: string) => {
    const response = await goalApiService.getGoalActivities(goalId)
    return response.data
  }
)

export const fetchGoalRollup = createAsyncThunk(
  "performance/fetchGoalRollup",
  async (goalId: string) => {
    const response = await goalApiService.getGoalRollup(goalId)
    return response.data
  }
)

// New async thunks for dashboard analytics
export const fetchDashboardAnalytics = createAsyncThunk(
  'performance/fetchDashboardAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await kpiApiService.getDashboardAnalytics()
      return data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard analytics')
    }
  }
)

export const fetchDepartmentComparison = createAsyncThunk(
  'performance/fetchDepartmentComparison',
  async (_, { rejectWithValue }) => {
    try {
      const data = await kpiApiService.getDepartmentComparison()
      return data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department comparison')
    }
  }
)

// Dashboard V2 thunk
export const fetchPerformanceDashboard = createAsyncThunk(
  'performance/fetchPerformanceDashboard',
  async (params: PerformanceDashboardParams = {}, { rejectWithValue }) => {
    try {
      console.log('Thunk: Calling performanceApi.getDashboard with params:', params)
      const response = await performanceApi.getDashboard(params)
      console.log('Thunk: API response received:', response)
      if (!response.success) {
        console.log('Thunk: Response not successful, rejecting')
        return rejectWithValue(response.message || 'Failed to fetch performance dashboard')
      }
      console.log('Thunk: Returning response.data:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Thunk: Error caught:', error)
      return rejectWithValue(error.message || 'Failed to fetch performance dashboard')
    }
  }
)

export const createPerformanceContract = createAsyncThunk(
  'performance/createPerformanceContract',
  async (
    { type, payload }: { type: 'BOARD' | 'CEO' | 'DEPARTMENT' | 'EMPLOYEE'; payload: ContractCreatePayload },
    { rejectWithValue }
  ) => {
    try {
      if (type === 'BOARD') return await performanceBscApiService.createBoardContract(payload)
      if (type === 'CEO') return await performanceBscApiService.createCeoContract(payload)
      if (type === 'DEPARTMENT') {
        return await performanceBscApiService.createDepartmentContract(payload as ContractCreatePayload & { departmentName: string })
      }
      return await performanceBscApiService.createEmployeeContract(payload as ContractCreatePayload & { subjectUserId: string })
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create performance contract')
    }
  }
)

export const submitBscFinancialOutcomeRoi = createAsyncThunk(
  'performance/submitBscFinancialOutcomeRoi',
  async (
    payload: {
      goalId: string
      netProfit: number
      totalCapitalInvested: number
      currencyCode?: string
      periodLabel?: string
      periodStart?: string
      periodEnd?: string
      skipCeoBoardMirror?: boolean
    },
    { rejectWithValue }
  ) => {
    try {
      return await performanceBscApiService.recordFinancialOutcomeRoi(payload)
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to submit ROI entry')
    }
  }
)

export const createBscBudgetVarianceReport = createAsyncThunk(
  'performance/createBscBudgetVarianceReport',
  async (
    payload: {
      performanceGoalId?: string
      goalId?: string
      narrative?: string
      varianceAnalysis?: string
      periodLabel?: string
      periodStart?: string
      periodEnd?: string
      actualSpend?: number
      strategicAllocation?: number
    },
    { rejectWithValue }
  ) => {
    try {
      return await performanceBscApiService.createBudgetVarianceReport(payload)
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create budget variance report')
    }
  }
)

export const fetchBscBudgetVarianceReportsByGoal = createAsyncThunk(
  'performance/fetchBscBudgetVarianceReportsByGoal',
  async (goalId: string, { rejectWithValue }) => {
    try {
      return await performanceBscApiService.getBudgetVarianceReportsByGoal(goalId)
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to load budget variance reports')
    }
  }
)

export const fetchBscStatutorySubmissionsByGoal = createAsyncThunk(
  'performance/fetchBscStatutorySubmissionsByGoal',
  async (goalId: string, { rejectWithValue }) => {
    try {
      return await performanceBscApiService.getStatutorySubmissionsByGoal(goalId)
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to load statutory submissions')
    }
  }
)

const performanceSlice = createSlice({
  name: "performance",
  initialState,
  reducers: {
    // Loading and Error
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setCrudLoading: (state, action: PayloadAction<boolean>) => {
      state.crudLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    
    // KPIs
    setKPIs: (state, action: PayloadAction<KPI[]>) => {
      state.kpis = action.payload
    },
    addKPI: (state, action: PayloadAction<KPI>) => {
      state.kpis.unshift(action.payload)
    },
    updateKPI: (state, action: PayloadAction<{ id: string; updates: Partial<KPI> }>) => {
      const index = state.kpis.findIndex((kpi) => kpi.id === action.payload.id)
      if (index !== -1) {
        state.kpis[index] = { ...state.kpis[index], ...action.payload.updates }
      }
    },
    removeKPI: (state, action: PayloadAction<string>) => {
      state.kpis = state.kpis.filter((kpi) => kpi.id !== action.payload)
    },
    
    // Departments
    setDepartments: (state, action: PayloadAction<Department[]>) => {
      state.departments = action.payload
    },
    addDepartment: (state, action: PayloadAction<Department>) => {
      state.departments.unshift(action.payload)
    },
    updateDepartment: (state, action: PayloadAction<{ id: string; updates: Partial<Department> }>) => {
      const index = state.departments.findIndex((dept) => dept.id === action.payload.id)
      if (index !== -1) {
        state.departments[index] = { ...state.departments[index], ...action.payload.updates }
      }
    },
    removeDepartment: (state, action: PayloadAction<string>) => {
      state.departments = state.departments.filter((dept) => dept.id !== action.payload)
    },
    
    // Goals
    setGoals: (state, action: PayloadAction<any[]>) => {
      state.goals = action.payload
    },
    addGoal: (state, action: PayloadAction<any>) => {
      state.goals.unshift(action.payload)
    },
    removeGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter((goal) => goal.id !== action.payload)
    },
    
    // Tasks
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.unshift(action.payload)
    },
    updateTask: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const index = state.tasks.findIndex((task) => task.id === action.payload.id)
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload.updates }
      }
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload)
    },
    
    // Metrics
    setMetrics: (state, action: PayloadAction<PerformanceMetrics>) => {
      state.metrics = action.payload
    },
    
    // Filters
    setSelectedDepartment: (state, action: PayloadAction<string>) => {
      state.selectedDepartment = action.payload
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload
    },
    setSelectedPriority: (state, action: PayloadAction<string>) => {
      state.selectedPriority = action.payload
    },
    setSelectedStatus: (state, action: PayloadAction<string>) => {
      state.selectedStatus = action.payload
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    
    // KPI Filters
    setSelectedKPIType: (state, action: PayloadAction<string>) => {
      state.selectedKPIType = action.payload
    },
    setSelectedKPICategory: (state, action: PayloadAction<string>) => {
      state.selectedKPICategory = action.payload
    },
    setSelectedKPIDepartment: (state, action: PayloadAction<string>) => {
      state.selectedKPIDepartment = action.payload
    },
    setSelectedKPIStatus: (state, action: PayloadAction<string>) => {
      state.selectedKPIStatus = action.payload
    },
    setKPISearchTerm: (state, action: PayloadAction<string>) => {
      state.kpiSearchTerm = action.payload
    },
    
    // Goal Filters
    setSelectedGoalType: (state, action: PayloadAction<string>) => {
      state.selectedGoalType = action.payload
    },
    setSelectedGoalCategory: (state, action: PayloadAction<string>) => {
      state.selectedGoalCategory = action.payload
    },
    setSelectedGoalDepartment: (state, action: PayloadAction<string>) => {
      state.selectedGoalDepartment = action.payload
    },
    setSelectedGoalAssignedTo: (state, action: PayloadAction<string>) => {
      state.selectedGoalAssignedTo = action.payload
    },
    
    // Pagination
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload
    },
    
    // Available Departments
    setAvailableDepartments: (state, action: PayloadAction<{ name: string; description: string }[]>) => {
      state.availableDepartments = action.payload
    },
    
    // KPI Statistics
    setSelectedViewMode: (state, action: PayloadAction<'all' | 'department' | 'accountType'>) => {
      state.selectedViewMode = action.payload
    },
    setSelectedAccountType: (state, action: PayloadAction<string>) => {
      state.selectedAccountType = action.payload
    },
    
    // New reducers
    setSelectedDepartmentFilter: (state, action: PayloadAction<string>) => {
      state.selectedDepartmentFilter = action.payload
    },
    setSelectedAccountTypeFilter: (state, action: PayloadAction<string>) => {
      state.selectedAccountTypeFilter = action.payload
    },
    clearAvailableKPIs: (state) => {
      state.availableKPIs = []
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.selectedDepartment = "all"
      state.selectedCategory = "all"
      state.selectedPriority = "all"
      state.selectedStatus = "all"
      state.searchTerm = ""
      state.currentPage = 1
    },
    
    // Reset KPI filters
    resetKPIFilters: (state) => {
      state.selectedKPIType = "all"
      state.selectedKPICategory = "all"
      state.selectedKPIDepartment = "all"
      state.selectedKPIStatus = "all"
      state.kpiSearchTerm = ""
      state.currentPage = 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableDepartments.pending, (state) => {
        state.availableDepartmentsLoading = true
      })
      .addCase(fetchAvailableDepartments.fulfilled, (state, action) => {
        state.availableDepartmentsLoading = false
        // Ensure payload is always an array
        state.availableDepartments = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchAvailableDepartments.rejected, (state, action) => {
        state.availableDepartmentsLoading = false
        state.error = action.error.message || 'Failed to fetch available departments'
        // Reset to empty array on error
        state.availableDepartments = []
      })
      // Fetch available KPIs
      .addCase(fetchAvailableKPIs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAvailableKPIs.fulfilled, (state, action) => {
        state.loading = false
        state.availableKPIs = action.payload.data || []
        state.error = null
      })
      .addCase(fetchAvailableKPIs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch KPIs by department
      .addCase(fetchKPIsByDepartment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchKPIsByDepartment.fulfilled, (state, action) => {
        state.loading = false
        state.availableKPIs = action.payload.data || []
        state.error = null
      })
      .addCase(fetchKPIsByDepartment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch KPIs by account type
      .addCase(fetchKPIsByAccountType.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchKPIsByAccountType.fulfilled, (state, action) => {
        state.loading = false
        state.availableKPIs = action.payload.data || []
        state.error = null
      })
      .addCase(fetchKPIsByAccountType.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch KPI statistics
      .addCase(fetchKPIStatistics.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchKPIStatistics.fulfilled, (state, action) => {
        state.loading = false
        state.kpiStatistics = action.payload
      })
      .addCase(fetchKPIStatistics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch financial KPIs
      .addCase(fetchFinancialKPIs.pending, (state) => {
        state.financialKPIsLoading = true
        state.error = null
      })
      .addCase(fetchFinancialKPIs.fulfilled, (state, action) => {
        state.financialKPIsLoading = false
        state.financialKPIs = action.payload.data || []
      })
      .addCase(fetchFinancialKPIs.rejected, (state, action) => {
        state.financialKPIsLoading = false
        state.error = action.payload as string
      })
      // Goals Reducers
      .addCase(fetchGoals.pending, (state) => {
        state.goalsLoading = true
        state.goalError = null
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.goalsLoading = false
        state.goals = action.payload
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.goalsLoading = false
        state.goalError = action.payload as string
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        // The list is refetched, but we can add the new goal for immediate UI update
        state.goals.unshift(action.payload)
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter((g) => g.id !== action.payload)
      })
      // Breakdown Reducers
      .addCase(fetchUsersForBreakdown.pending, (state) => {
        state.breakdownUsersLoading = true
      })
      .addCase(fetchUsersForBreakdown.fulfilled, (state, action) => {
        state.breakdownUsersLoading = false
        state.breakdownUsers = action.payload
      })
      .addCase(fetchUsersForBreakdown.rejected, (state) => {
        state.breakdownUsersLoading = false
        state.breakdownUsers = []
      })
      // Goal Details
      .addCase(fetchGoalDetails.pending, (state) => {
        state.selectedGoalDetailsLoading = true
        state.selectedGoalDetails = null
      })
      .addCase(fetchGoalDetails.fulfilled, (state, action) => {
        state.selectedGoalDetailsLoading = false
        state.selectedGoalDetails = action.payload
      })
      .addCase(fetchGoalDetails.rejected, (state) => {
        state.selectedGoalDetailsLoading = false
      })
      // KPI Analytics
      .addCase(fetchKPIAnalytics.pending, (state) => {
        state.kpiAnalyticsLoading = true
        state.error = null
      })
      .addCase(fetchKPIAnalytics.fulfilled, (state, action) => {
        state.kpiAnalyticsLoading = false
        console.log('KPI Analytics Response:', action.payload)
        // The payload now directly contains kpiAnalytics and summary
        state.kpiAnalytics = action.payload?.kpiAnalytics || []
        state.kpiAnalyticsSummary = action.payload?.summary || null
        console.log('KPI Analytics State:', state.kpiAnalytics)
        console.log('KPI Analytics Summary:', state.kpiAnalyticsSummary)
      })
      .addCase(fetchKPIAnalytics.rejected, (state, action) => {
        state.kpiAnalyticsLoading = false
        state.error = action.error.message || "Failed to fetch KPI analytics"
        console.error('KPI Analytics Error:', action.error)
      })
      // Recalculate Goal Rollup
      .addCase(recalculateGoalRollup.pending, (state) => {
        state.loading = true
      })
      .addCase(recalculateGoalRollup.fulfilled, (state, action) => {
        state.loading = false
        // Optionally, you can update the state with the new rollup data
        // For example, if the rollup affects the goals in the state:
        const updatedGoal = action.payload
        const index = state.goals.findIndex((goal) => goal.id === updatedGoal.id)
        if (index !== -1) {
          state.goals[index] = updatedGoal
        }
      })
      .addCase(recalculateGoalRollup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch goal activities
      .addCase(fetchGoalActivities.pending, (state) => {
        state.goalActivitiesLoading = true
        state.error = null
      })
      .addCase(fetchGoalActivities.fulfilled, (state, action) => {
        state.goalActivitiesLoading = false
        state.goalActivities = action.payload
      })
      .addCase(fetchGoalActivities.rejected, (state, action) => {
        state.goalActivitiesLoading = false
        state.error = action.error.message || "Failed to fetch goal activities"
      })
      // Fetch goal rollup data
      .addCase(fetchGoalRollup.pending, (state) => {
        state.goalRollupDataLoading = true
        state.error = null
      })
      .addCase(fetchGoalRollup.fulfilled, (state, action) => {
        state.goalRollupDataLoading = false
        state.goalRollupData = action.payload
      })
      .addCase(fetchGoalRollup.rejected, (state, action) => {
        state.goalRollupDataLoading = false
        state.error = action.error.message || "Failed to fetch goal rollup data"
      })
      // Fetch dashboard analytics
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.dashboardLoading = true
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.dashboardLoading = false
        state.dashboardData = action.payload
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.dashboardLoading = false
        state.error = action.payload as string
      })
      // Fetch department comparison
      .addCase(fetchDepartmentComparison.pending, (state) => {
        state.departmentComparisonLoading = true
      })
      .addCase(fetchDepartmentComparison.fulfilled, (state, action) => {
        state.departmentComparisonLoading = false
        state.departmentComparison = action.payload
      })
      .addCase(fetchDepartmentComparison.rejected, (state, action) => {
        state.departmentComparisonLoading = false
        state.error = action.payload as string
      })
      // Fetch performance dashboard V2
      .addCase(fetchPerformanceDashboard.pending, (state) => {
        console.log('Reducer: fetchPerformanceDashboard.pending')
        state.performanceDashboardLoading = true
        state.performanceDashboardError = null
      })
      .addCase(fetchPerformanceDashboard.fulfilled, (state, action) => {
        console.log('Reducer: fetchPerformanceDashboard.fulfilled with payload:', action.payload)
        state.performanceDashboardLoading = false
        state.performanceDashboardData = action.payload || null
      })
      .addCase(fetchPerformanceDashboard.rejected, (state, action) => {
        console.log('Reducer: fetchPerformanceDashboard.rejected with error:', action.payload)
        state.performanceDashboardLoading = false
        state.performanceDashboardError = action.payload as string
      })
      // Create performance contract
      .addCase(createPerformanceContract.pending, (state) => {
        state.bscOperationLoading = true
        state.bscOperationError = null
      })
      .addCase(createPerformanceContract.fulfilled, (state) => {
        state.bscOperationLoading = false
      })
      .addCase(createPerformanceContract.rejected, (state, action) => {
        state.bscOperationLoading = false
        state.bscOperationError = action.payload as string
      })
      // Submit ROI BSC entry
      .addCase(submitBscFinancialOutcomeRoi.pending, (state) => {
        state.bscOperationLoading = true
        state.bscOperationError = null
      })
      .addCase(submitBscFinancialOutcomeRoi.fulfilled, (state) => {
        state.bscOperationLoading = false
      })
      .addCase(submitBscFinancialOutcomeRoi.rejected, (state, action) => {
        state.bscOperationLoading = false
        state.bscOperationError = action.payload as string
      })
      // Create budget variance report
      .addCase(createBscBudgetVarianceReport.pending, (state) => {
        state.bscOperationLoading = true
        state.bscOperationError = null
      })
      .addCase(createBscBudgetVarianceReport.fulfilled, (state) => {
        state.bscOperationLoading = false
      })
      .addCase(createBscBudgetVarianceReport.rejected, (state, action) => {
        state.bscOperationLoading = false
        state.bscOperationError = action.payload as string
      })
      // Fetch budget variance reports by goal
      .addCase(fetchBscBudgetVarianceReportsByGoal.pending, (state) => {
        state.bscOperationLoading = true
        state.bscOperationError = null
      })
      .addCase(fetchBscBudgetVarianceReportsByGoal.fulfilled, (state, action) => {
        state.bscOperationLoading = false
        state.budgetVarianceReports = (action.payload as any)?.data || []
      })
      .addCase(fetchBscBudgetVarianceReportsByGoal.rejected, (state, action) => {
        state.bscOperationLoading = false
        state.bscOperationError = action.payload as string
      })
      // Fetch statutory submissions by goal
      .addCase(fetchBscStatutorySubmissionsByGoal.pending, (state) => {
        state.bscOperationLoading = true
        state.bscOperationError = null
      })
      .addCase(fetchBscStatutorySubmissionsByGoal.fulfilled, (state, action) => {
        state.bscOperationLoading = false
        state.statutorySubmissions = (action.payload as any)?.data || []
      })
      .addCase(fetchBscStatutorySubmissionsByGoal.rejected, (state, action) => {
        state.bscOperationLoading = false
        state.bscOperationError = action.payload as string
      })
  },
})

export const {
  // Loading and Error
  setLoading,
  setCrudLoading,
  setError,
  
  // KPIs
  setKPIs,
  addKPI,
  updateKPI,
  removeKPI,
  
  // Departments
  setDepartments,
  addDepartment,
  updateDepartment,
  removeDepartment,
  
  // Goals
  setGoals,
  addGoal,
  removeGoal,
  
  // Tasks
  setTasks,
  addTask,
  updateTask,
  removeTask,
  
  // Metrics
  setMetrics,
  
  // Filters
  setSelectedDepartment,
  setSelectedCategory,
  setSelectedPriority,
  setSelectedStatus,
  setSearchTerm,
  
  // KPI Filters
  setSelectedKPIType,
  setSelectedKPICategory,
  setSelectedKPIDepartment,
  setSelectedKPIStatus,
  setKPISearchTerm,
  
  // Goal Filters
  setSelectedGoalType,
  setSelectedGoalCategory,
  setSelectedGoalDepartment,
  setSelectedGoalAssignedTo,
  
  // Pagination
  setCurrentPage,
  setItemsPerPage,
  
  // Available Departments
  setAvailableDepartments,

  // KPI Statistics
  setSelectedViewMode,
  setSelectedAccountType,
  
  // New exports
  setSelectedDepartmentFilter,
  setSelectedAccountTypeFilter,
  clearAvailableKPIs,
  
  // Reset
  resetFilters,
  resetKPIFilters,
} = performanceSlice.actions

export default performanceSlice.reducer
