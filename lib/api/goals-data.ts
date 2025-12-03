const API_BASE_URL = 'https://nvccz-pi.vercel.app/api/performance/goals'
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU0MGVqZmIwMDAydW5vMDFqaHo3Ym84Iiwicm9sZUlkIjoiY21lNDBlZ3hrMDAwMHVubzBleWJ5YmQzeCIsInJvbGVOYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQG52Y2N6LmNvLnp3IiwiZmlyc3ROYW1lIjoiQWRtaW4iLCJsYXN0TmFtZSI6IlVzZXIiLCJwZXJtaXNzaW9ucyI6W3sibmFtZSI6InZpZXdfZGFzaGJvYXJkIiwidmFsdWUiOnRydWV9LHsibmFtZSI6InZpZXdfcmVwb3J0cyIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJ2aWV3X3N0cnVjdHVyZSIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJtYW5hZ2Vfc3RydWN0dXJlIiwidmFsdWUiOnRydWV9LHsibmFtZSI6InZpZXdfYWNjb3VudGluZyIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJtYW5hZ2VfYWNjb3VudGluZyIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJ2aWV3X2ZpbmFuY2lhbF9yZXBvcnRzIiwidmFsdWUiOnRydWV9LHsibmFtZSI6Im1hbmFnZV9maW5hbmNpYWxfcmVwb3J0cyIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJ2aWV3X2xlZGdlciIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJtYW5hZ2VfbGVkZ2VyIiwidmFsdWUiOnRydWV9LHsibmFtZSI6Im1hbmFnZV91c2VycyIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJtYW5hZ2Vfcm9sZXMiLCJ2YWx1ZSI6dHJ1ZX0seyJuYW1lIjoiY3JlYXRlX3dvcmtsb2ciLCJ2YWx1ZSI6dHJ1ZX0seyJuYW1lIjoiZWRpdF93b3JrbG9nIiwidmFsdWUiOnRydWV9LHsibmFtZSI6ImRlbGV0ZV93b3JrbG9nIiwidmFsdWUiOnRydWV9LHsibmFtZSI6InZpZXdfd29ya2xvZyIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJ2aWV3X2J1c2luZXNzX29wZXJhdGlvbnMiLCJ2YWx1ZSI6dHJ1ZX0seyJuYW1lIjoibWFuYWdlX2J1c2luZXNzX29wZXJhdGlvbnMiLCJ2YWx1ZSI6dHJ1ZX0seyJuYW1lIjoidmlld19jb21wYW55X2RhdGEiLCJ2YWx1ZSI6dHJ1ZX0seyJuYW1lIjoibWFuYWdlX2NvbXBhbnlfZGF0YSIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJ2aWV3X2VycF9yZXBvcnRzIiwidmFsdWUiOnRydWV9LHsibmFtZSI6Im1hbmFnZV9lcnBfcmVwb3J0cyIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJ2aWV3X3N1YnNjcmlwdGlvbiIsInZhbHVlIjp0cnVlfSx7Im5hbWUiOiJtYW5hZ2Vfc3Vic2NyaXB0aW9uIiwidmFsdWUiOnRydWV9LHsibmFtZSI6Im1hbmFnZV9maXJtX3NldHRpbmdzIiwidmFsdWUiOnRydWV9LHsibmFtZSI6ImJhbmtfcmVjb25jaWxpYXRpb24iLCJ2YWx1ZSI6dHJ1ZX1dLCJpYXQiOjE3NTg4MjIyNDIsImV4cCI6MTc1OTQyNzA0Mn0.4uRj2bOQqahL4o8N3ItpxaACuPcOzvpIU87Smi25tbc'

export interface Goal {
  id: string
  title: string
  description: string
  type: 'company' | 'department' | 'individual'
  category: 'financial' | 'operational' | 'strategic'
  departmentId: string
  monetaryValue?: string
  percentValue?: string
  monetaryValueAchieved?: string
  percentValueAchieved?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  startDate: string
  endDate: string
  assignedToId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
  stage: 'planning' | 'in_progress' | 'completed'
  progress: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  parentGoalId?: string
  kpiId?: string
  createdById: string
  
  // Relational fields
  kpi?: {
    id: string
    name: string
    type: string
    unitSymbol?: string
    unitPosition?: string
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  department?: {
    id: string
    name: string
  }
  parentGoal?: {
    id: string
    title: string
    type: string
  }
  subGoals?: Goal[]
  tasks?: any[]
  _count?: {
    subGoals?: number
    tasks?: number
  }
}

export interface GoalsResponse {
  success: boolean
  count: number
  goals: Goal[]
}

export interface GoalFilters {
  type?: string
  category?: string
  departmentId?: string
  assignedToId?: string
  status?: string
  priority?: string
}

class GoalsDataService {
  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getGoals(filters: GoalFilters = {}): Promise<GoalsResponse> {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        queryParams.append(key, value)
      }
    })

    const url = queryParams.toString() 
      ? `${API_BASE_URL}?${queryParams.toString()}`
      : API_BASE_URL

    return this.makeRequest(url)
  }

  async getGoalById(id: string): Promise<{ success: boolean; goal: Goal }> {
    return this.makeRequest(`${API_BASE_URL}/${id}`)
  }

  async createGoal(goalData: Partial<Goal>): Promise<Goal> {
    const response = await this.makeRequest(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(goalData),
    })
    return response.goal
  }

  async updateGoal(id: string, goalData: Partial<Goal>): Promise<Goal> {
    const response = await this.makeRequest(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    })
    return response.goal
  }

  async deleteGoal(id: string): Promise<void> {
    await this.makeRequest(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    })
  }
}

export const goalsDataService = new GoalsDataService()
