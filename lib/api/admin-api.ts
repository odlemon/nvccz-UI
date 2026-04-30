import { apiClient } from './api-client'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  userDepartment: string | null
  departmentRole: string | null
  roleCode: string | null
  role: {
    id: string
    name: string
    description: string
  }
  createdAt: string
  updatedAt: string
}

export interface UsersResponse {
  success: boolean
  message: string
  data: User[]
  count: number
}

export interface UserResponse {
  success: boolean
  message: string
  data: User
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  department: string
  roleCode: string
  departmentRole: string
}

export interface CreateUserResponse {
  success: boolean
  message: string
  data: {
    user: User
    temporaryPassword?: string
  }
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
  department?: string
  roleCode?: string
  departmentRole?: string
  roleId?: string
}

export interface UpdateUserResponse {
  success: boolean
  message: string
  data: User
}

export interface DeleteUserResponse {
  success: boolean
  message: string
}

export interface HardcodedRole {
  code: string
  name: string
  level: number
  department: string
  description: string
}

export interface DepartmentWithRoles {
  department: string
  departmentCode: string
  description: string
  roles: HardcodedRole[]
}

export interface RolesResponse {
  success: boolean
  message: string
  data: HardcodedRole[]
}

export interface DepartmentsWithRolesResponse {
  success: boolean
  message: string
  data: DepartmentWithRoles[]
  count: number
}

export interface UserDetailsResponse {
  success: boolean
  message: string
  data: User & {
    role: {
      id: string
      name: string
      description: string
      permissions: Array<{
        name: string
        value: boolean
      }>
    }
  }
}

export interface BoardVotingMember {
  id: string
  firstName: string
  lastName: string
  email: string
  roleCode: string
  departmentRole: string
  votingPower: number
  /** When true, the member cannot cast votes regardless of votingPower. */
  boardVotingDisabled?: boolean
}

export interface SetBoardVotingDisabledRequest {
  disabled: boolean
}

export interface SetBoardVotingDisabledResponse {
  success: boolean
  message: string
  data?: BoardVotingMember
}

export interface BoardVotingMembersResponse {
  success: boolean
  message: string
  data: BoardVotingMember[]
  timestamp: string
}

export interface UpdateVotingPowerRequest {
  votingPower: number
}

export interface UpdateVotingPowerResponse {
  success: boolean
  message: string
  data: BoardVotingMember
}

export const adminApiService = {
  // User Management
  async getUsers(): Promise<UsersResponse> {
    const response = await apiClient.get('/users')
    return response
  },

  async getUserById(userId: string): Promise<UserResponse> {
    const response = await apiClient.get(`/users/${userId}`)
    return response
  },

  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await apiClient.post('/users', data)
    return response
  },

  async updateUser(userId: string, data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const response = await apiClient.put(`/users/${userId}`, data)
    return response
  },

  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    const response = await apiClient.delete(`/users/${userId}`)
    return response
  },

  // Roles Management
  async getAllRoles(): Promise<RolesResponse> {
    const response = await apiClient.get('/hardcoded-roles')
    return response
  },

  async getDepartmentsWithRoles(): Promise<DepartmentsWithRolesResponse> {
    const response = await apiClient.get('/hardcoded-roles/departments-with-roles')
    return response
  },

  async getUserDetails(userId: string): Promise<UserDetailsResponse> {
    const response = await apiClient.get(`/users/${userId}`)
    return response
  },

  // Board Voting Members Management
  async getBoardVotingMembers(): Promise<BoardVotingMembersResponse> {
    const response = await apiClient.get('/board-reviews/voting-members')
    return response
  },

  async updateVotingPower(userId: string, votingPower: number): Promise<UpdateVotingPowerResponse> {
    const response = await apiClient.put(`/board-reviews/voting-members/${userId}/voting-power`, {
      votingPower
    })
    return response
  },

  async setBoardVotingDisabled(userId: string, disabled: boolean): Promise<SetBoardVotingDisabledResponse> {
    const response = await apiClient.put(`/board-reviews/voting-members/${userId}/disable`, {
      disabled,
    })
    return response
  },
}

export default adminApiService
