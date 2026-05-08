"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { employeeFormSchema, EmployeeFormData } from "@/lib/validations/payroll"
import { Employee } from "@/lib/api/payroll-api"
import { CiUser, CiDollar } from "react-icons/ci"
import { Building, Tag } from "lucide-react"

interface EmployeesFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EmployeeFormData) => void
  editingEmployee?: Employee | null
  loading?: boolean
}

// Mock users data - in real app, this would come from an API
const mockUsers = [
  { id: "user1", name: "John Doe", email: "john@example.com" },
  { id: "user2", name: "Jane Smith", email: "jane@example.com" },
  { id: "user3", name: "Bob Johnson", email: "bob@example.com" },
]

export function EmployeesForm({ isOpen, onClose, onSubmit, editingEmployee, loading = false }: EmployeesFormProps) {
  const [users, setUsers] = useState(mockUsers)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<EmployeeFormData>({
    resolver: yupResolver(employeeFormSchema),
    defaultValues: editingEmployee ? {
      userId: editingEmployee.userId,
      bankName: editingEmployee.bankName,
      branchCode: editingEmployee.branchCode,
      accountNumber: editingEmployee.accountNumber,
      basicSalary: parseFloat(editingEmployee.basicSalary),
      currencyId: editingEmployee.currencyId,
      idNumber: editingEmployee.idNumber,
      nextOfKin: editingEmployee.nextOfKin,
      address: editingEmployee.address,
      pictureUrl: editingEmployee.pictureUrl
    } : {
      userId: '',
      bankName: '',
      branchCode: '',
      accountNumber: '',
      basicSalary: 0,
      currencyId: '',
      idNumber: '',
      nextOfKin: '',
      address: '',
      pictureUrl: ''
    }
  })

  const handleFormSubmit = (data: EmployeeFormData) => {
    onSubmit(data)
    if (!editingEmployee) {
      reset()
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <CiUser className="w-5 h-5" />
            {editingEmployee ? 'Edit Employee' : 'Create Employee'}
          </DialogTitle>
          <DialogDescription>
            Add employee payroll information from existing users
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-normal">User</Label>
            <Select {...register('userId')}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <CiUser className="w-4 h-4" />
                      <span>{user.name}</span>
                      <span className="text-gray-500">({user.email})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-sm text-red-600">{errors.userId.message}</p>
            )}
          </div>

          {/* Bank Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <Building className="w-5 h-5" />
              Bank Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-normal">Bank Name</Label>
                <div className="relative">
                  <Input
                    {...register('bankName')}
                    placeholder="e.g., Standard Bank"
                    className="rounded-full pl-10"
                  />
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {errors.bankName && (
                  <p className="text-sm text-red-600">{errors.bankName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-normal">Branch Code</Label>
                <div className="relative">
                  <Input
                    {...register('branchCode')}
                    placeholder="e.g., 001"
                    className="rounded-full pl-10"
                  />
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {errors.branchCode && (
                  <p className="text-sm text-red-600">{errors.branchCode.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-normal">Account Number</Label>
              <div className="relative">
                <Input
                  {...register('accountNumber')}
                  placeholder="e.g., 1234567890"
                  className="rounded-full pl-10"
                />
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {errors.accountNumber && (
                <p className="text-sm text-red-600">{errors.accountNumber.message}</p>
              )}
            </div>
          </div>

          {/* Salary Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <CiDollar className="w-5 h-5" />
              Salary Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-normal">Basic Salary</Label>
                <div className="relative">
                  <Input
                    {...register('basicSalary')}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="rounded-full pl-10"
                  />
                  <CiDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {errors.basicSalary && (
                  <p className="text-sm text-red-600">{errors.basicSalary.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-normal">Currency</Label>
                <Select {...register('currencyId')}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - United States Dollar</SelectItem>
                    <SelectItem value="ZWL">ZWL - Zimbabwean Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currencyId && (
                  <p className="text-sm text-red-600">{errors.currencyId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <CiUser className="w-5 h-5" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-normal">ID Number</Label>
                <div className="relative">
                  <Input
                    {...register('idNumber')}
                    placeholder="e.g., 38-2024495Q38"
                    className="rounded-full pl-10"
                  />
                  <CiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {errors.idNumber && (
                  <p className="text-sm text-red-600">{errors.idNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-normal">Next of Kin</Label>
                <div className="relative">
                  <Input
                    {...register('nextOfKin')}
                    placeholder="e.g., Kundai"
                    className="rounded-full pl-10"
                  />
                  <CiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {errors.nextOfKin && (
                  <p className="text-sm text-red-600">{errors.nextOfKin.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-normal">Address</Label>
              <div className="relative">
                <Input
                  {...register('address')}
                  placeholder="e.g., * Dan Judson Rd"
                  className="rounded-full pl-10"
                />
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-normal">Picture URL</Label>
              <div className="relative">
                <Input
                  {...register('pictureUrl')}
                  placeholder="e.g., http://example.com/picture.jpg"
                  className="rounded-full pl-10"
                />
                <CiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {errors.pictureUrl && (
                <p className="text-sm text-red-600">{errors.pictureUrl.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-full h-10 px-6"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={editingEmployee ? "gradient-update" : "gradient-create"}
              className="rounded-full h-10 px-6 shadow-sm"
              disabled={loading}
            >
              {loading ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
