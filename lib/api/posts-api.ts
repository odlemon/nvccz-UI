import { apiClient, type ApiResponse } from '@/lib/api/api-client'

export interface PostAuthor {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  expiresAt: string | null
  isNotified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  author: PostAuthor
  replies: Reply[]
}

export interface ReplyAuthor {
  id: string
  firstName: string
  lastName: string
  email?: string
  fullName?: string
}

export interface Reply {
  id: string
  content: string
  postId: string
  authorId: string
  parentReplyId: string | null
  createdAt: string
  updatedAt: string
  author: ReplyAuthor
  // Nested replies are not returned in list; we will compute tree client-side
}

export const postsApi = {
  getAll: async (): Promise<ApiResponse<Post[]>> => {
    return apiClient.get<ApiResponse<Post[]>>('/posts')
  },
  create: async (data: {
    title: string
    content: string
    expiresAt?: string | null
    isNotified?: boolean
  }): Promise<ApiResponse<Post>> => {
    return apiClient.post<ApiResponse<Post>>('/posts', data)
  },
  update: async (id: string, data: Partial<{ title: string; content: string; expiresAt: string | null; isNotified: boolean }>): Promise<ApiResponse<Post>> => {
    return apiClient.put<ApiResponse<Post>>(`/posts/${id}`, data)
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/posts/${id}`)
  },

  // Replies
  createReplyOnPost: async (postId: string, data: { content: string }): Promise<ApiResponse<Reply>> => {
    return apiClient.post<ApiResponse<Reply>>(`/posts/${postId}/replies`, data)
  },
  createReplyOnReply: async (replyId: string, data: { content: string }): Promise<ApiResponse<Reply>> => {
    return apiClient.post<ApiResponse<Reply>>(`/posts/replies/${replyId}/replies`, data)
  },
  updateReply: async (replyId: string, data: { content: string }): Promise<ApiResponse<Reply>> => {
    return apiClient.put<ApiResponse<Reply>>(`/posts/replies/${replyId}`, data)
  },
  deleteReply: async (replyId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/posts/replies/${replyId}`)
  },
}


