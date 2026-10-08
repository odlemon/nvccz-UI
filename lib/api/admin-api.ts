import { apiClient } from './api-client'

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'DEACTIVATED'

/** SRD "User Master" fields, as returned by GET /users and GET /users/:id. */
export interface UserMasterFields {
  status?: UserStatus
  fullName?: string
  employeeCode?: string | null
  mobileNumber?: string | null
  location?: string | null
  jobTitle?: string | null
  branch?: string | null
  businessUnit?: string | null
  costCentre?: string | null
  reportingManagerId?: string | null
  reportingManagerName?: string | null
  procurementFunction?: string | null
  accessProfile?: string | null
  approvalLevel?: number | null
  approvalLimitAmount?: number | null
  delegatedApproverId?: string | null
  delegatedApproverName?: string | null
  sodRestrictions?: string[]
  ssoUsername?: string | null
  uatRole?: string | null
  effectiveDate?: string | null
  endDate?: string | null
  lastLoginAt?: string | null
  createdById?: string | null
  createdByName?: string | null
  updatedById?: string | null
  updatedByName?: string | null
  deactivatedAt?: string | null
}

export interface User extends UserMasterFields {
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

/** Editable User Master fields sent on create/update. `null` clears a field. */
export interface UserMasterInput {
  employeeCode?: string | null
  mobileNumber?: string | null
  location?: string | null
  jobTitle?: string | null
  branch?: string | null
  businessUnit?: string | null
  costCentre?: string | null
  reportingManagerId?: string | null
  procurementFunction?: string | null
  accessProfile?: string | null
  approvalLevel?: number | null
  approvalLimitAmount?: number | null
  delegatedApproverId?: string | null
  sodRestrictions?: string[]
  ssoUsername?: string | null
  uatRole?: string | null
  effectiveDate?: string | null
  endDate?: string | null
}

export interface UserMasterOptions {
  statuses: UserStatus[]
  procurementFunctions: string[]
  accessProfiles: string[]
  sodRestrictions: { code: string; label: string }[]
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

export interface CreateUserRequest extends UserMasterInput {
  firstName: string
  lastName: string
  email: string
  department: string
  roleCode: string
  departmentRole: string
  status?: UserStatus
}

export interface CreateUserResponse {
  success: boolean
  message: string
  data: {
    user: User
    temporaryPassword?: string
  }
}

export interface UpdateUserRequest extends UserMasterInput {
  firstName?: string
  lastName?: string
  email?: string
  department?: string
  roleCode?: string
  departmentRole?: string
  roleId?: string
  status?: UserStatus
}

export interface UpdateUserResponse {
  success: boolean
  message: string
  data: User
}

export interface DeleteUserResponse {
  success: boolean
  message: string
  /** True when the user had transaction history and was deactivated instead of deleted. */
  deactivated?: boolean
}

export interface UserMasterOptionsResponse {
  success: boolean
  data: UserMasterOptions
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

  async getUserMasterOptions(): Promise<UserMasterOptionsResponse> {
    const response = await apiClient.get('/users/master-options')
    return response
  },

  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    const response = await apiClient.delete(`/users/${userId}`)
    return response
  },

  /** POST /users/:id/resend-credentials — new temporary password (forced change at sign-in) emailed with the login link. */
  async resendCredentials(userId: string): Promise<{ success: boolean; message: string; data?: { email: string } }> {
    return apiClient.post<{ success: boolean; message: string; data?: { email: string } }>(`/users/${userId}/resend-credentials`, {})
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
