import { apiClient, type ApiResponse } from '@/lib/api/api-client'

export interface AppUser {
  id: string
  firstName: string
  lastName: string
  email: string
  backgroundImage?: string | null
  createdAt: string
  updatedAt: string
  lastSeen?: string
  departmentId?: string | null
  department?: { id?: string; name?: string } | string | null
  role?: {
    id: string
    name: string
    description?: string
  }
}

export const usersApi = {
  getAll: async (): Promise<ApiResponse<AppUser[]>> => {
    return apiClient.get<ApiResponse<AppUser[]>>('/users')
  },
}


