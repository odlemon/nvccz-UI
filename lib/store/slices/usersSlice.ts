import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AppUser } from '@/lib/api/users-api'

interface UsersState {
  items: AppUser[]
  loading: boolean
  error: string | null
}

const initialState: UsersState = {
  items: [],
  loading: false,
  error: null,
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsersLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setUsersError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setUsers: (state, action: PayloadAction<AppUser[]>) => {
      state.items = action.payload
    },
  },
})

export const { setUsersLoading, setUsersError, setUsers } = usersSlice.actions
export default usersSlice.reducer


