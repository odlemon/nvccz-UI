// Department API Service for Backend Integration with Authentication
import { apiClient, ApiResponse } from './api-client'

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

export interface PerformanceGoal {
  id: string
  title: string
  status: string
  stage: string
}

export interface DepartmentCreateRequest {
  name: string
  description: string
  branch: string
  isActive?: boolean
}

export interface DepartmentCreateResponse extends ApiResponse {
  department: Department
}

export interface DepartmentsResponse extends ApiResponse {
  count?: number
  /** Canonical list from GET /departments */
  data?: Department[]
  /** Legacy shape — some callers still read this */
  departments?: Department[]
}

export interface GoalCreateRequest {
  title: string
  description: string
  type: "company" | "department" | "individual"
  category: "financial" | "operational" | "strategic" | "growth"
  departmentId: string
  monetaryValue?: number
  percentValue?: number
  priority: "low" | "medium" | "high"
  startDate: string
  endDate: string
  assignedToId?: string
}

export interface GoalCreateResponse extends ApiResponse {
  goal: any
}

export interface TaskCreateRequest {
  title: string
  description: string
  category: "investment" | "operational" | "strategic" | "compliance"
  priority: "low" | "medium" | "high"
  startDate: string
  endDate: string
  assignedToId?: string
  team?: string[]
  goalId?: string
  performanceCategory?: string
  isPerformanceTask?: boolean
  monetaryValue?: number
  percentValue?: number
  kpi?: {
    type: string
    target: number
    unit: string
  }
  ruleset?: string
}

export interface TaskCreateResponse extends ApiResponse {
  task: any
}

class DepartmentApiService {
  // Get all available departments (simplified endpoint)
  async getAvailableDepartments(): Promise<{ name: string; description: string }[]> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      departments: { name: string; description: string }[];
    }>('/performance/breakdown/departments/available')
    return response.departments || []
  }

  /**
   * GET /departments — active rows by default.
   * Pass includeInactive: true to include inactive departments.
   * Response: { success, data: [{ id, name, … }], count }
   */
  async getDepartments(filters?: {
    includeInactive?: boolean
    /** @deprecated Prefer omit (active default) or includeInactive; ignored by current API */
    isActive?: boolean
    branch?: string
  }): Promise<DepartmentsResponse> {
    const queryParams = new URLSearchParams()
    if (filters?.includeInactive === true) {
      queryParams.append('includeInactive', 'true')
    }
    if (filters?.branch) {
      queryParams.append('branch', filters.branch)
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/departments?${queryString}` : '/departments'

    const res = await apiClient.get<DepartmentsResponse>(url)
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.departments)
        ? res.departments
        : []
    return { ...res, data: list, departments: list, count: res.count ?? list.length }
  }

  // Create a new department
  async createDepartment(departmentData: DepartmentCreateRequest): Promise<DepartmentCreateResponse> {
    return apiClient.post<DepartmentCreateResponse>('/departments', departmentData)
  }

  // Update an existing department
  async updateDepartment(id: string, departmentData: Partial<DepartmentCreateRequest>): Promise<DepartmentCreateResponse> {
    return apiClient.put<DepartmentCreateResponse>(`/departments/${id}`, departmentData)
  }

  // Delete a department
  async deleteDepartment(id: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/departments/${id}`)
  }

  // Get a single department by ID
  async getDepartment(id: string): Promise<DepartmentCreateResponse> {
    return apiClient.get<DepartmentCreateResponse>(`/departments/${id}`)
  }

  // Create a performance goal
  async createGoal(goalData: GoalCreateRequest): Promise<GoalCreateResponse> {
    return apiClient.post<GoalCreateResponse>('/performance/goals', goalData)
  }

  // Create a task
  async createTask(taskData: TaskCreateRequest): Promise<TaskCreateResponse> {
    return apiClient.post<TaskCreateResponse>('/tasks', taskData)
  }
}

export const departmentApiService = new DepartmentApiService()
