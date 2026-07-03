import { apiClient } from './api-client'

export interface Permission {
  name: string
  value: boolean
}

export interface RolePermissions {
  [key: string]: string[]
}

export interface UserRole {
  id: string
  name: string
  description: string
  permissions: RolePermissions
}

export interface UserDetails {
  id: string
  firstName: string
  lastName: string
  email: string
  userDepartment: string | null
  departmentRole: string | null
  roleCode: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface LoginUser {
  id: string
  email: string
  firstName: string
  lastName: string
  department: string | null
  role: string | null
  isApplicant: boolean
}

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: LoginUser
}

export interface UserDetailsResponse {
  success: boolean
  message: string
  data: UserDetails
}

export interface LoginCredentials {
  email: string
  password: string
}

export const authApiService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nvccz-pi.vercel.app/api'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Login failed')
    }

    return response.json()
  },

  async getUserDetails(userId: string): Promise<UserDetailsResponse> {
    const response = await apiClient.get(`/users/${userId}`)
    return response
  },

  async logout(): Promise<void> {
    // If you have a logout endpoint on the backend
    try {
      await apiClient.post('/auth/logout', {})
    } catch (error) {
      // Handle error silently as we're logging out anyway
      console.error('Logout API error:', error)
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post('/auth/refresh', {})
    return response
  },

  async verifyToken(token: string): Promise<{ valid: boolean }> {
    const response = await apiClient.post('/auth/verify', { token })
    return response
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://31.220.82.129:3010/api'}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to send reset email')
    }

    return response.json()
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    })
    return response
  },
}

// ── MFA (TOTP) — enrollment happens post-login from Account Settings; the
// login-flow verify step is deferred until a real /auth/login MFA-pending
// response sample is available (see plan gaps). ──
export interface MfaEnrollResponse {
  success: boolean
  data: { qrCodeDataUrl: string; manualEntryKey: string }
}

export interface MfaConfirmEnrollmentResponse {
  success: boolean
  data: { backupCodes: string[] }
}

export const mfaApiService = {
  async enroll(): Promise<MfaEnrollResponse> {
    return apiClient.post('/auth/mfa/enroll', {})
  },

  async confirmEnrollment(token: string): Promise<MfaConfirmEnrollmentResponse> {
    return apiClient.post('/auth/mfa/confirm-enrollment', { token })
  },

  async verify(mfaPendingToken: string, token: string): Promise<LoginResponse> {
    return apiClient.post('/auth/mfa/verify', { mfaPendingToken, token })
  },
}

export default authApiService
