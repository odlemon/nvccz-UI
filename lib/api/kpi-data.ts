import { kpiApiService, KPI, KPICreateRequest, KPIUpdateRequest, KPIFilters } from './kpi-api'

// Transform backend KPI data to frontend format
const transformKPIData = (backendKPI: any): KPI => {
  return {
    id: backendKPI.id,
    name: backendKPI.name,
    description: backendKPI.description,
    type: backendKPI.type,
    unit: backendKPI.unit,
    targetValue: backendKPI.targetValue,
    currentValue: backendKPI.currentValue,
    category: backendKPI.category,
    frequency: backendKPI.frequency,
    departmentId: backendKPI.departmentId,
    weightValue: parseFloat(backendKPI.weightValue) || 0,
    isActive: backendKPI.isActive,
    hasUnit: backendKPI.hasUnit,
    unitCategory: backendKPI.unitCategory,
    unitSymbol: backendKPI.unitSymbol,
    unitPosition: backendKPI.unitPosition,
    createdAt: backendKPI.createdAt,
    updatedAt: backendKPI.updatedAt,
    performanceGoals: backendKPI.performanceGoals || [],
    _count: backendKPI._count || { performanceGoals: 0 }
  }
}

export const kpiDataService = {
  getKPIs: async (filters?: KPIFilters): Promise<KPI[]> => {
    try {
      const response = await kpiApiService.getKPIs(filters)
      return response.kpis.map(transformKPIData)
    } catch (error: any) {
      console.error('Failed to fetch KPIs:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch KPIs'
      throw new Error(errorMessage)
    }
  },

  getKPI: async (id: string): Promise<KPI> => {
    try {
      const response = await kpiApiService.getKPI(id)
      return transformKPIData(response.kpi)
    } catch (error: any) {
      console.error('Failed to fetch KPI:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch KPI'
      throw new Error(errorMessage)
    }
  },

  createKPI: async (data: KPICreateRequest): Promise<KPI> => {
    try {
      const response = await kpiApiService.createKPI(data)
      return transformKPIData(response.kpi)
    } catch (error: any) {
      console.error('Failed to create KPI:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create KPI'
      throw new Error(errorMessage)
    }
  },

  updateKPI: async (id: string, data: KPIUpdateRequest): Promise<KPI> => {
    try {
      const response = await kpiApiService.updateKPI(id, data)
      return transformKPIData(response.kpi)
    } catch (error: any) {
      console.error('Failed to update KPI:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update KPI'
      throw new Error(errorMessage)
    }
  },

  deleteKPI: async (id: string): Promise<void> => {
    try {
      await kpiApiService.deleteKPI(id)
    } catch (error: any) {
      console.error('Failed to delete KPI:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete KPI'
      throw new Error(errorMessage)
    }
  },

  // Get all available KPIs
  getAvailableKPIs: async (): Promise<any> => {
    const response = await kpiApiService.getAvailableKPIs()
    return response
  },

  // Get KPIs by department name
  getKPIsByDepartment: async (departmentName: string): Promise<any> => {
    const response = await kpiApiService.getKPIsByDepartment(departmentName)
    return response
  },

  // Get KPIs by account type
  getKPIsByAccountType: async (accountType: string): Promise<any> => {
    const response = await kpiApiService.getKPIsByAccountType(accountType)
    return response
  },

  // Get KPI statistics
  getKPIStatistics: async (): Promise<any> => {
    const response = await kpiApiService.getKPIStatistics()
    return response.data
  }
}
