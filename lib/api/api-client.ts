// API Client with Authentication Interceptor
import { getAuthToken, clearAuthCookies } from '@/lib/utils/cookies'

// Public route prefixes — pages that are reachable without authentication.
// When an API call fails with 401 on one of these pages we must NOT redirect
// to /login (the visitor is an unauthenticated vendor / external user — bouncing
// them to /login would just lose their context). Mirrors middleware passThroughRoutes.
const PUBLIC_ROUTE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/permissions-matrix',
  '/events/rsvp',
  '/events/public',
  '/vendor/quotation/submit',
  '/vendor/invoice/submit',
  '/vendor-quote',
  '/vendor-portal',
  '/public-tenders',
  '/applications/form',
  '/vendor-quotations',
]

const isOnPublicRoute = (): boolean => {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))
}

// API Response interface
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  [key: string]: any
}

// API Error class
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// API Client class
class ApiClient {
  private baseURL: string

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://31.220.82.129:3009/api'
  }

  // Get authentication headers
  private getAuthHeaders(excludeContentType = false): HeadersInit {
    const token = getAuthToken()
    const headers: HeadersInit = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    if (!excludeContentType) {
      headers['Content-Type'] = 'application/json'
    }
    
    return headers
  }

  // Handle response and check for authentication errors
  private async handleResponse<T>(response: Response, options?: RequestInit & { responseType?: string }): Promise<T> {
    // Handle unauthorized responses - check both status and response body
    if (response.status === 401) {
      const onPublic = isOnPublicRoute()
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: 'Unauthorized' }
      }

      // Only clear session and redirect when the visitor is *inside* the
      // authenticated app. On public pages (vendor submission forms, public
      // tenders, etc.) a 401 just means the called endpoint requires auth;
      // we must not bounce the vendor to /login.
      if (!onPublic) {
        clearAuthCookies()
        if (typeof window !== 'undefined' && localStorage) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }

      throw new ApiError(
        errorData.message || 'Unauthorized - Please login again',
        401,
        errorData
      )
    }

    // Handle other HTTP errors
    if (!response.ok) {
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` }
      }

      // Check if error message indicates unauthorized — same public-route guard.
      if (errorData.message?.toLowerCase().includes('unauthorized') && !isOnPublicRoute()) {
        clearAuthCookies()
        if (typeof window !== 'undefined' && localStorage) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }

      throw new ApiError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      )
    }

    // Handle different response types for successful responses
    const responseType = options?.responseType
    if (responseType === 'text') {
      return response.text() as Promise<T>
    }
    if (responseType === 'blob') {
      return response.blob() as Promise<T>
    }

    // Default to JSON parsing
    try {
      const data = await response.json()
      return data
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError)
      throw new ApiError('Invalid response format', response.status)
    }
  }

  // Make authenticated request
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { responseType?: string } = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // Get authentication headers
    const headers = this.getAuthHeaders(options.body instanceof FormData)

    // Merge headers
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse<T>(response, options)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      console.error('API request failed:', error)
      throw new ApiError('Network error occurred', 0)
    }
  }

  // GET request
  async get<T>(endpoint: string, options?: RequestInit & { responseType?: string }): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  // POST request
  async post<T>(endpoint: string, data?: any, options?: RequestInit & { responseType?: string }): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    })
  }

  // POST FormData
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
    })
  }

  // PUT request
  async put<T>(endpoint: string, data?: any, options?: RequestInit & { responseType?: string }): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    })
  }

  // PUT FormData
  async putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: formData,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string, options?: RequestInit & { responseType?: string }): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any, options?: RequestInit & { responseType?: string }): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export types
export { ApiResponse, ApiError }
