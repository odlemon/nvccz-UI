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

export interface NewsletterRecipientUser {
  id: string
  firstName: string
  lastName: string
  email: string
  roleName: string
  selected: boolean
  excluded: boolean
}

export interface NewsletterRecipientsConfig {
  includeUserIds: string[]
  excludeUserIds: string[]
  includeEmails: string[]
  excludeEmails: string[]
  updatedById: string | null
  updatedAt: string | null
}

export interface NewsletterRecipientsResponse {
  users: NewsletterRecipientUser[]
  config: NewsletterRecipientsConfig
}

export const newslettersApi = {
  getAll: async (): Promise<ApiResponse<Newsletter[]>> => {
    return apiClient.get<ApiResponse<Newsletter[]>>('/newsletters')
  },
  create: async (data: { title: string; content: string; image?: File | null }): Promise<ApiResponse<Newsletter>> => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('content', data.content)
    if (data.image) {
      formData.append('image', data.image)
    }
    return apiClient.postFormData<ApiResponse<Newsletter>>('/newsletters', formData)
  },
  update: async (id: string, data: Partial<{ title: string; content: string; image: File | null; imageUrl: string | null }>): Promise<ApiResponse<Newsletter>> => {
    if (data.image) {
      const formData = new FormData()
      if (typeof data.title === 'string') formData.append('title', data.title)
      if (typeof data.content === 'string') formData.append('content', data.content)
      formData.append('image', data.image)
      return apiClient.putFormData<ApiResponse<Newsletter>>(`/newsletters/${id}`, formData)
    }
    const { image, ...rest } = data
    return apiClient.put<ApiResponse<Newsletter>>(`/newsletters/${id}`, rest)
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/newsletters/${id}`)
  },
  getRecipientsConfig: async (): Promise<ApiResponse<NewsletterRecipientsResponse>> => {
    return apiClient.get<ApiResponse<NewsletterRecipientsResponse>>('/newsletters/recipients/config')
  },
  updateRecipientsConfig: async (data: {
    includeUserIds?: string[]
    excludeUserIds?: string[]
    includeEmails?: string[]
    excludeEmails?: string[]
  }): Promise<ApiResponse<any>> => {
    return apiClient.put<ApiResponse<any>>('/newsletters/recipients/config', data)
  },
}
