import { apiClient, type ApiResponse } from '@/lib/api/api-client'

export interface NewsletterAuthor {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Newsletter {
  id: string
  title: string
  content: string
  imageUrl: string | null
  authorId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  author: NewsletterAuthor
}

export const newslettersApi = {
  getAll: async (): Promise<ApiResponse<Newsletter[]>> => {
    return apiClient.get<ApiResponse<Newsletter[]>>('/newsletters')
  },
  create: async (data: { title: string; content: string; imageUrl?: string | null }): Promise<ApiResponse<Newsletter>> => {
    return apiClient.post<ApiResponse<Newsletter>>('/newsletters', data)
  },
  update: async (id: string, data: Partial<{ title: string; content: string; imageUrl: string | null }>): Promise<ApiResponse<Newsletter>> => {
    return apiClient.put<ApiResponse<Newsletter>>(`/newsletters/${id}`, data)
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/newsletters/${id}`)
  },
}


