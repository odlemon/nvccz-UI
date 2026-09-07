"use client"

import { useState, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, AlertCircle, Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDepartmentsWithRoles } from "@/lib/store/slices/adminSlice"

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingUser?: any | null
  loading?: boolean
}

export function UserForm({ isOpen, onClose, onSubmit, editingUser, loading }: UserFormProps) {
  const dispatch = useAppDispatch()
  const { departmentsWithRoles } = useAppSelector(state => state.admin)
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const hasLoadedRef = useRef(false)
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: editingUser || {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      roleCode: '',
      departmentRole: ''
    }
  })

  // Load departments and roles when form opens
  useEffect(() => {
    if (isOpen && departmentsWithRoles.length === 0) {
      dispatch(fetchDepartmentsWithRoles())
    }
  }, [isOpen, departmentsWithRoles.length, dispatch])

  useEffect(() => {
    if (editingUser) {
      reset(editingUser)
      setSelectedDepartment(editingUser.department || editingUser.userDepartment || '')
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        roleCode: '',
        departmentRole: ''
      })
    }
  }, [editingUser, reset])

  const selectedDept = departmentsWithRoles.find(d => d.department === selectedDepartment)
  const departmentRoleOptions = ['HEAD', 'OFFICER', 'MEMBER']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-hidden overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {editingUser ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogDescription>
            {editingUser ? 'Update user information and role assignment' : 'Create a new user account with role and department'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <Input {...field} placeholder="e.g., John" className="rounded-full" />
                  )}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: 'Last name is required' }}
                  render={({ field }) => (
                    <Input {...field} placeholder="e.g., Doe" className="rounded-full" />
                  )}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Email *</Label>
                <Controller
                  name="email"
                  control={control}
                  rules={{ 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  }}
                  render={({ field }) => (
                    <Input {...field} type="email" placeholder="e.g., john.doe@nvccz.co.zw" className="rounded-full" />
                  )}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Department & Role */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Department & Role</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Controller
                  name="department"
                  control={control}
                  rules={{ required: 'Department is required' }}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedDepartment(value)
                        setValue('roleCode', '')
                      }} 
                      value={field.value}
                    >
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentsWithRoles.map((dept) => (
                          <SelectItem key={dept.departmentCode} value={dept.department}>
                            {dept.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.department && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.department.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Department Role *</Label>
                <Controller
                  name="departmentRole"
                  control={control}
                  rules={{ required: 'Department role is required' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder="Select role level..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentRoleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.departmentRole && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.departmentRole.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Role Code *</Label>
                <Controller
                  name="roleCode"
                  control={control}
                  rules={{ required: 'Role code is required' }}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedDepartment}
                    >
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder={selectedDepartment ? "Select role..." : "Select department first..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDept?.roles.map((role) => (
                          <SelectItem key={role.code} value={role.code}>
                            <div className="flex flex-col">
                              <span className="font-medium">{role.name}</span>
                              <span className="text-xs text-gray-500">{role.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.roleCode && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.roleCode.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingUser ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingUser ? 'Update User' : 'Create User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
