import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authApiService, UserDetails, LoginCredentials } from '@/lib/api/auth-api'
import { getAuthToken, getAuthUser, getUserProfile, setCookie, setUserProfile, clearAuthCookies } from '@/lib/utils/cookies'

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

// Initial state
const initialState: AuthState = {
  user: null,
  userDetails: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
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
        setCookie(userKey, encodeURIComponent(JSON.stringify(response.user)), { maxAge })
      }

      // Fetch full user details
      dispatch(fetchUserDetails(response.user.id))

      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  }
)

export const fetchUserDetails = createAsyncThunk(
  'auth/fetchUserDetails',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await authApiService.getUserDetails(userId)
      
      // Store full user profile in cookies
      if (typeof document !== 'undefined') {
        setUserProfile(response.data)
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
        // If we have profile, use it, otherwise fetch it
        if (userProfile) {
          return { token, user, userProfile }
        } else {
          // Fetch user details if not in cookies
          dispatch(fetchUserDetails(user.id))
          return { token, user, userProfile: null }
        }
      } else {
        return rejectWithValue('No valid session found')
      }
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
        setUserProfile(response.data)
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh user details')
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
      // Update profile in cookies
      if (typeof document !== 'undefined') {
        setUserProfile(action.payload)
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
          // Convert permissions to array format
          const permissions: Array<{ name: string; value: boolean }> = []
          Object.entries(action.payload.role.permissions).forEach(([key, values]) => {
            if (Array.isArray(values)) {
              values.forEach((value) => {
                permissions.push({ name: `${key}:${value}`, value: true })
              })
            }
          })
          state.user.permissions = permissions
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
          const permissions: Array<{ name: string; value: boolean }> = []
          Object.entries(action.payload.role.permissions).forEach(([key, values]) => {
            if (Array.isArray(values)) {
              values.forEach((value) => {
                permissions.push({ name: `${key}:${value}`, value: true })
              })
            }
          })
          state.user.permissions = permissions
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
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
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
        
        // If we have user profile, set it
        if (action.payload.userProfile) {
          state.userDetails = action.payload.userProfile
          state.user.role = action.payload.userProfile.role.name
          const permissions: Array<{ name: string; value: boolean }> = []
          Object.entries(action.payload.userProfile.role.permissions).forEach(([key, values]) => {
            if (Array.isArray(values)) {
              values.forEach((value) => {
                permissions.push({ name: `${key}:${value}`, value: true })
              })
            }
          })
          state.user.permissions = permissions
        }
        
        state.error = null
      })
      .addCase(checkAuthStatus.rejected, (state) => {
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
