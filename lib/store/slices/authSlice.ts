import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authApiService, UserDetails, LoginCredentials } from '@/lib/api/auth-api'
import { getAuthToken, getAuthUser, getUserProfile, setCookie, setUserProfile, clearAuthCookies } from '@/lib/utils/cookies'
import { safeJsonStringify } from '@/lib/utils/safe-json'

function rolePermissionsToArray(
  rolePerms: unknown
): Array<{ name: string; value: boolean }> {
  const permissions: Array<{ name: string; value: boolean }> = []
  if (!rolePerms) return permissions

  if (Array.isArray(rolePerms)) {
    rolePerms.forEach((p: { name?: string; value?: boolean }) => {
      if (p?.name) permissions.push({ name: p.name, value: !!p.value })
    })
    return permissions
  }

  if (typeof rolePerms === 'object') {
    Object.entries(rolePerms as Record<string, unknown>).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        values.forEach((value) => {
          permissions.push({ name: `${key}:${String(value)}`, value: true })
        })
      }
    })
  }

  return permissions
}

// Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  permissions: Array<{
    name: string
    value: boolean
  }>
}

export interface AuthState {
  user: User | null
  userDetails: UserDetails | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isFetchingDetails: boolean
  error: string | null
}

// Initial state — isLoading starts true so ModuleGuards don't flash Access Denied
// before AuthProvider finishes checkAuthStatus on first paint.
const initialState: AuthState = {
  user: null,
  userDetails: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isFetchingDetails: false,
  error: null,
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { dispatch, rejectWithValue }) => {
    try {
      const response = await authApiService.login(credentials)

      // Store token and basic user data in cookies
      if (typeof document !== 'undefined') {
        const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token'
        const userKey = process.env.NEXT_PUBLIC_AUTH_USER_KEY || 'user'
        const maxAge = parseInt(process.env.NEXT_PUBLIC_AUTH_COOKIE_MAX_AGE || '604800') // 7 days

        setCookie(tokenKey, response.token, { maxAge })
        setCookie(userKey, encodeURIComponent(safeJsonStringify(response.user)), { maxAge })
      }

      // Fetch full user details
      dispatch(fetchUserDetails(response.user.id))

      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  }
)

const AUTH_DETAILS_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

export const fetchUserDetails = createAsyncThunk(
  'auth/fetchUserDetails',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await withTimeout(
        authApiService.getUserDetails(userId),
        AUTH_DETAILS_TIMEOUT_MS,
        'User details request timed out',
      )
      
      // Store full user profile in cookies
      if (typeof document !== 'undefined') {
        try {
          setUserProfile(response.data)
        } catch {
          /* profile cookie is optional — do not block auth */
        }
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user details')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Call logout API
      await authApiService.logout()
      
      // Clear cookies
      clearAuthCookies()
      
      return true
    } catch (error) {
      // Clear cookies even if API call fails
      clearAuthCookies()
      return rejectWithValue('Logout completed with warnings')
    }
  }
)

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      if (typeof document === 'undefined') {
        return rejectWithValue('Server side')
      }

      const token = getAuthToken()
      const user = getAuthUser()
      const userProfile = getUserProfile()

      if (token && user) {
        if (userProfile) {
          return { token, user, userProfile }
        }

        try {
          const details = await dispatch(fetchUserDetails(user.id)).unwrap()
          return { token, user, userProfile: details }
        } catch {
          return { token, user, userProfile: null }
        }
      }

      return rejectWithValue('No valid session found')
    } catch (error) {
      return rejectWithValue('Auth check failed')
    }
  }
)

export const refreshUserDetails = createAsyncThunk(
  'auth/refreshUserDetails',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await authApiService.getUserDetails(userId)
      
      // Update profile in cookies
      if (typeof document !== 'undefined') {
        try {
          setUserProfile(response.data)
        } catch {
          /* optional cookie */
        }
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh user details')
    }
  }
)

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authApiService.forgotPassword(email)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send reset email')
    }
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authApiService.resetPassword(token, newPassword)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reset password')
    }
  }
)

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    updateUserDetails: (state, action: PayloadAction<UserDetails>) => {
      state.userDetails = action.payload
      if (typeof document !== 'undefined') {
        try {
          setUserProfile(action.payload)
        } catch {
          /* optional cookie */
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = {
          id: action.payload.user.id,
          email: action.payload.user.email,
          firstName: action.payload.user.firstName,
          lastName: action.payload.user.lastName,
          role: action.payload.user.role || 'applicant',
          permissions: []
        }
        state.token = action.payload.token
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.userDetails = null
        state.token = null
        state.error = action.payload as string
      })
      // Fetch User Details
      .addCase(fetchUserDetails.pending, (state) => {
        state.isFetchingDetails = true
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.isFetchingDetails = false
        state.userDetails = action.payload
        // Update user with role info
        if (state.user) {
          state.user.role = action.payload.role.name
          state.user.permissions = rolePermissionsToArray(action.payload.role.permissions)
        }
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.isFetchingDetails = false
        state.error = action.payload as string
      })
      // Refresh User Details
      .addCase(refreshUserDetails.pending, (state) => {
        state.isFetchingDetails = true
      })
      .addCase(refreshUserDetails.fulfilled, (state, action) => {
        state.isFetchingDetails = false
        state.userDetails = action.payload
        // Update user with role info
        if (state.user) {
          state.user.role = action.payload.role.name
          state.user.permissions = rolePermissionsToArray(action.payload.role.permissions)
        }
      })
      .addCase(refreshUserDetails.rejected, (state) => {
        state.isFetchingDetails = false
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.userDetails = null
        state.token = null
        state.error = null
      })
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.isLoading = false
        state.user = {
          id: action.payload.user.id,
          email: action.payload.user.email,
          firstName: action.payload.user.firstName,
          lastName: action.payload.user.lastName,
          role: action.payload.user.role || 'applicant',
          permissions: []
        }
        state.token = action.payload.token
        
        // If we have user profile, set it
        if (action.payload.userProfile) {
          state.userDetails = action.payload.userProfile
          state.user.role = action.payload.userProfile.role?.name || action.payload.user.role || 'applicant'
          state.user.permissions = rolePermissionsToArray(
            action.payload.userProfile.role?.permissions
          )
        }
        
        state.error = null
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.userDetails = null
        state.token = null
      })
  },
})

export const { clearError, setLoading, updateUserDetails } = authSlice.actions
export default authSlice.reducer

// Add helper selectors at the end of the file
export const selectUserPermissions = (state: { auth: AuthState }) => {
  const userDetails = state.auth.userDetails
  if (!userDetails) return null
  
  return {
    role: userDetails.role.code,
    department: userDetails.role.department,
    level: userDetails.role.level,
    permissions: userDetails.role.permissions,
  }
}
