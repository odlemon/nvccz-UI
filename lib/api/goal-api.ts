import { apiClient } from './api-client'

interface GetGoalsParams {
  type?: 'company' | 'department' | 'individual' | ''
  department?: string
  pillarId?: string
  strategicThemeId?: string
  scorecardPillar?: string
  status?: string
  search?: string
  assignedToId?: string
  parentGoalId?: string
}

export interface GoalActivity {
  id: string
  userId: string
  activityType: string
  title: string
  description: string
  goalId: string
  taskId: string | null
  kpiId: string | null
  monetaryValueAchieved: string | null
  percentValueAchieved: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  task?: {
    id: string
    title: string
    monetaryValue: string | null
    stage: string
  }
}

export interface GoalRollupData {
  goal: {
    id: string
    title: string
    type: string
    category: string
    targetValue: string | null
    currentValue: string
    progressPercentage: string
    stage: string
    kpi: {
      id: string
      name: string
      type: string
      unitSymbol: string
      unitPosition: string
    }
  }
  rollup: {
    totalSubGoals: number
    completedSubGoals: number
    inProgressSubGoals: number
    notStartedSubGoals: number
    totalTargetValue: number
    totalCurrentValue: number
    overallProgressPercentage: string
    departmentBreakdown: Array<{
      id: string
      title: string
      department: string
      targetValue: string
      currentValue: string
      progressPercentage: string
      stage: string
      individualGoals?: Array<{
        id: string
        title: string
        assignedTo: string
        targetValue: string | null
        currentValue: string
        progressPercentage: string
        stage: string
      }>
    }>
    individualBreakdown: Array<{
      id: string
      title: string
      assignedTo: string
      targetValue: string | null
      currentValue: string
      progressPercentage: string
      stage: string
    }>
  }
}

export const goalApiService = {
  // Get all performance goals with optional filters
  async getGoals(params: GetGoalsParams = {}): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params.type && params.type !== 'all') {
      queryParams.append('type', params.type)
    }
    if (params.department && params.department !== 'all') {
      queryParams.append('department', params.department)
    }
    if (params.pillarId && params.pillarId !== 'all') {
      queryParams.append('pillarId', params.pillarId)
    }
    if (params.strategicThemeId && params.strategicThemeId !== 'all') {
      queryParams.append('strategicThemeId', params.strategicThemeId)
    }
    if (params.scorecardPillar && params.scorecardPillar !== 'all') {
      queryParams.append('scorecardPillar', params.scorecardPillar)
    }
    if (params.status && params.status !== 'all') {
      queryParams.append('status', params.status)
    }
    if (params.search) {
      queryParams.append('search', params.search)
    }
    if (params.assignedToId) {
      queryParams.append('assignedToId', params.assignedToId)
    }
    if (params.parentGoalId) {
      queryParams.append('parentGoalId', params.parentGoalId)
    }
    const queryString = queryParams.toString()
    return apiClient.get(`/performance/goals${queryString ? `?${queryString}` : ''}`)
  },

  // Get a single performance goal by ID
  async getGoal(goalId: string): Promise<any> {
    return apiClient.get(`/performance/goals/${goalId}`)
  },

  // Get all performance goals associated with a given KPI id.
  // Backend response: { success, count, goals: GoalDetailed[] }
  async getGoalsByKpi(kpiId: string): Promise<{ success: boolean; count: number; goals: any[] }> {
    return apiClient.get(`/performance/goals/by-kpi/${kpiId}`)
  },

  // Create a new performance goal
  async createGoal(goalData: any): Promise<any> {
    return apiClient.post('/performance/goals', goalData)
  },

  // Update a performance goal
  async updateGoal(goalId: string, updateData: any): Promise<any> {
    return apiClient.patch(`/performance/goals/${goalId}`, updateData)
  },

  // Delete a performance goal
  async deleteGoal(goalId: string): Promise<any> {
    return apiClient.delete(`/performance/goals/${goalId}`)
  },

  // Breakdown company goal to departments
  async breakdownToDepartments(data: any): Promise<any> {
    return apiClient.post('/performance/breakdown/departments', data)
  },

  // Get users for a department for breakdown
  async getUsersForBreakdown(departmentName: string): Promise<{ success: boolean; users: any[] }> {
    console.log('API call: getUsersForBreakdown with departmentName:', departmentName)
    return apiClient.get(`/performance/breakdown/users/${departmentName}`)
  },

  // Breakdown department goal to individuals
  async breakdownToIndividuals(data: any): Promise<any> {
    return apiClient.post('/performance/breakdown/individuals', data)
  },

  // Recalculate goal rollup
  async recalculateRollup(goalId: string): Promise<any> {
    return apiClient.post(`/performance/rollup/${goalId}/recalculate`, {})
  },

  // Get goal activities
  async getGoalActivities(goalId: string): Promise<{ success: boolean; message: string; data: GoalActivity[]; timestamp: string }> {
    return apiClient.get(`/activities/goal/${goalId}`)
  },

  // Get goal rollup data
  async getGoalRollup(goalId: string): Promise<{ success: boolean; message: string; data: GoalRollupData; timestamp: string }> {
    return apiClient.get(`/performance/rollup/${goalId}`)
  },
}
