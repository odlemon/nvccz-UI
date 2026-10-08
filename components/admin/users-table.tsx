"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  setSelectedDepartmentFilter,
  setSelectedRoleFilter,
  setSearchTerm,
  resetFilters
} from "@/lib/store/slices/adminSlice"
import { fetchDepartmentsWithRoles } from "@/lib/store/slices/adminSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserForm } from "./user-form"
import { UserDrawer } from "./user-drawer"
import { User, CreateUserRequest, adminApiService } from "@/lib/api/admin-api"
import { toast } from "sonner"
import { Users, Search, X, Plus, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Mail, Loader2 } from "lucide-react"
import { UsersTableSkeleton } from "./users-table-skeleton"
import { STATUS_BADGE_CLASS, STATUS_LABELS, formatDateTime, formatMoney, humanize, statusLabel } from "./user-master-shared"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Simple data table component for users
function UsersDataTable({ 
  data, 
  columns, 
  onView, 
  onEdit, 
  onDelete,
  onResendCredentials,
  resendingId,
}: { 
  data: any[]
  columns: any[]
  onView: (item: any) => void
  onEdit: (item: any) => void
  onDelete: (item: any) => void
  onResendCredentials: (item: any) => void
  resendingId: string | null
}) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 ml-1 inline" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 inline" />
      : <ArrowDown className="w-3 h-3 ml-1 inline" />
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr 
                key={row.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onView(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="gradient-update"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(row)
                      }}
                      className="rounded-full h-8 w-8 p-0 shadow-sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Resend login credentials"
                      aria-label="Resend login credentials"
                      disabled={resendingId === row.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onResendCredentials(row)
                      }}
                      className="rounded-full h-8 w-8 p-0 shadow-sm"
                    >
                      {resendingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="gradient-danger"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(row)
                      }}
                      className="rounded-full h-8 w-8 p-0 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} users
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

export function UsersTable() {
  const dispatch = useAppDispatch()
  const { 
    users, 
    usersLoading, 
    loading,
    selectedDepartmentFilter,
    selectedRoleFilter,
    searchTerm,
    departmentsWithRoles,
  } = useAppSelector(state => state.admin)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [resendingId, setResendingId] = useState<string | null>(null)

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchUsers())
    dispatch(fetchDepartmentsWithRoles())
  }, [dispatch])

  const handleCreate = () => {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser({
      ...user,
      department: user.userDepartment || '',
    } as User)
    setIsFormOpen(true)
  }

  const handleView = (user: User) => {
    setViewingUser(user)
    setIsDrawerOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (window.confirm(`Remove ${user.firstName} ${user.lastName}?\n\nA user with transaction history is deactivated and kept on record; only a user with no history is deleted.`)) {
      try {
        const result = await dispatch(deleteUser(user.id)).unwrap()
        const message = result?.message || 'User removed'
        if (result?.deactivated) toast.info(message)
        else toast.success(message)
      } catch (error: any) {
        toast.error(error || 'Failed to remove user')
      }
    }
  }

  const handleResendCredentials = async (user: User) => {
    if (!window.confirm(`Email ${user.firstName} ${user.lastName} a new temporary password and the login link?\n\nTheir current password stops working and they must set a new one at sign-in.`)) return
    setResendingId(user.id)
    try {
      const result = await adminApiService.resendCredentials(user.id)
      toast.success(result?.message || `Credentials sent to ${user.email}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to resend credentials')
    } finally {
      setResendingId(null)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (editingUser) {
        await dispatch(updateUser({ userId: editingUser.id, data })).unwrap()
        toast.success('User updated successfully')
      } else {
        const result = await dispatch(createUser(data as CreateUserRequest)).unwrap()
        toast.success(
          <div>
            <p>User created successfully!</p>
            {result.data?.temporaryPassword && (
              <p className="text-xs mt-1">Temporary password: <strong>{result.data.temporaryPassword}</strong></p>
            )}
          </div>
        )
      }
      setIsFormOpen(false)
      setEditingUser(null)
    } catch (error: any) {
      toast.error(error || `Failed to ${editingUser ? 'update' : 'create'} user`)
      throw error
    }
  }

  const handleRefresh = () => {
    dispatch(fetchUsers())
    toast.success('Users refreshed')
  }

  const handleResetFilters = () => {
    dispatch(resetFilters())
    setStatusFilter('all')
  }

  // Get unique roles with names from department roles
  const availableRoles = useMemo(() => {
    const rolesMap = new Map<string, string>()
    departmentsWithRoles.forEach(dept => {
      dept.roles.forEach(role => {
        rolesMap.set(role.code, role.name)
      })
    })
    return Array.from(rolesMap.entries()).map(([code, name]) => ({ code, name }))
  }, [departmentsWithRoles])

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = selectedDepartmentFilter === 'all' || 
        user.userDepartment === selectedDepartmentFilter
      
      const matchesRole = selectedRoleFilter === 'all' || 
        user.roleCode === selectedRoleFilter

      const matchesStatus = statusFilter === 'all' ||
        String(user.status || 'ACTIVE').toUpperCase() === statusFilter
      
      return matchesSearch && matchesDepartment && matchesRole && matchesStatus
    })
  }, [users, searchTerm, selectedDepartmentFilter, selectedRoleFilter, statusFilter])

  const getFilterCount = () => {
    let count = 0
    if (selectedDepartmentFilter !== "all") count++
    if (selectedRoleFilter !== "all") count++
    if (statusFilter !== "all") count++
    if (searchTerm) count++
    return count
  }

  const columns = [
    {
      key: 'firstName' as keyof User,
      label: 'Name',
      sortable: true,
      render: (_: any, row: User) => (
        <div>
          <div className="font-medium text-gray-900">{row.firstName} {row.lastName}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
          {row.employeeCode && <div className="text-xs text-gray-400">{row.employeeCode}</div>}
        </div>
      ),
    },
    {
      key: 'userDepartment' as keyof User,
      label: 'Department',
      sortable: true,
      render: (value: string | null) => (
        <span className="text-sm text-gray-900">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'departmentRole' as keyof User,
      label: 'Department Role',
      sortable: true,
      render: (value: string | null) => (
        value ? <Badge variant="secondary">{value}</Badge> : <span className="text-sm text-gray-500">N/A</span>
      ),
    },
    {
      key: 'procurementFunction' as keyof User,
      label: 'Procurement Function',
      sortable: true,
      render: (value: string | null) => (
        value ? <Badge variant="outline" className="bg-purple-50 text-purple-700">{humanize(value)}</Badge> : <span className="text-sm text-gray-500">N/A</span>
      ),
    },
    {
      key: 'approvalLimitAmount' as keyof User,
      label: 'Approval Limit',
      sortable: true,
      render: (value: number | null) => (
        value != null ? <span className="text-sm text-gray-900">{formatMoney(value)}</span> : <span className="text-sm text-gray-500">No limit</span>
      ),
    },
    {
      key: 'role' as keyof User,
      label: 'System Role',
      sortable: true,
      render: (value: any) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">{value.name}</Badge>
      ),
    },
    {
      key: 'status' as keyof User,
      label: 'Status',
      sortable: true,
      render: (value: string | undefined) => {
        const key = String(value || 'ACTIVE').toUpperCase() as keyof typeof STATUS_BADGE_CLASS
        return <Badge variant="outline" className={STATUS_BADGE_CLASS[key]}>{statusLabel(value)}</Badge>
      },
    },
    {
      key: 'lastLoginAt' as keyof User,
      label: 'Last Login',
      sortable: true,
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">{formatDateTime(value) || 'Never'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRefresh}
            disabled={usersLoading}
            variant="outline"
            className="rounded-full h-10 px-6"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleCreate} 
            variant="gradient-create"
            className="rounded-full h-10 px-6 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {getFilterCount() > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getFilterCount()} filter{getFilterCount() !== 1 ? 's' : ''} applied
              </Badge>
              <Button
                onClick={handleResetFilters}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => dispatch(setSearchTerm(e.target.value))}
              className="pl-10"
            />
          </div>

          {/* Department Filter */}
          <Select 
            value={selectedDepartmentFilter} 
            onValueChange={(value) => dispatch(setSelectedDepartmentFilter(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentsWithRoles.map(dept => (
                <SelectItem key={dept.departmentCode} value={dept.department}>
                  {dept.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([code, label]) => (
                <SelectItem key={code} value={code}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Role Filter */}
          <Select 
            value={selectedRoleFilter} 
            onValueChange={(value) => dispatch(setSelectedRoleFilter(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {availableRoles.map(role => (
                <SelectItem key={role.code} value={role.code}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedDepartmentFilter !== 'all' || selectedRoleFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchTerm}"
                <button onClick={() => dispatch(setSearchTerm(""))} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedDepartmentFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Department: {selectedDepartmentFilter}
                <button onClick={() => dispatch(setSelectedDepartmentFilter('all'))} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS] || statusFilter}
                <button onClick={() => setStatusFilter('all')} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedRoleFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Role: {availableRoles.find(r => r.code === selectedRoleFilter)?.name || selectedRoleFilter}
                <button onClick={() => dispatch(setSelectedRoleFilter('all'))} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Users Table */}
      {usersLoading ? (
        <UsersTableSkeleton />
      ) : (
        <UsersDataTable
          data={filteredUsers}
          columns={columns}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResendCredentials={handleResendCredentials}
          resendingId={resendingId}
        />
      )}

      {/* User Form Modal */}
      <UserForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingUser(null)
        }}
        onSubmit={handleSubmit}
        editingUser={editingUser}
        loading={loading}
      />

      {/* User Drawer */}
      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setViewingUser(null)
        }}
        user={viewingUser}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
