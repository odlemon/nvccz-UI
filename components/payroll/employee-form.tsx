"use client"

import { useState, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command"
import { employeeFormSchema, EmployeeFormData } from "@/lib/validations/payroll"
import { Employee } from "@/lib/api/payroll-api"
import { User, Building2, DollarSign, AlertCircle, Loader2, ImageIcon, X, Camera } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { usersApi } from "@/lib/api/users-api"
import { setUsers, setUsersError, setUsersLoading } from "@/lib/store/slices/usersSlice"
import { accountingApi } from "@/lib/api/accounting-api"
import { setCurrencies, setCurrenciesError, setCurrenciesLoading } from "@/lib/store/slices/accountingSlice"


interface EmployeeFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EmployeeFormData, picture?: File) => void
  editingEmployee?: Employee | null
  loading?: boolean
}

const getDefaultCurrencyId = (currencies: { id: string; isDefault: boolean }[]) => {
  const def = currencies.find(c => c.isDefault)
  return def ? def.id : currencies[0]?.id || ""
}

export function EmployeeForm({ isOpen, onClose, onSubmit, editingEmployee, loading }: EmployeeFormProps) {
  const dispatch = useAppDispatch()
  const { items: users } = useAppSelector(state => state.users)
  const { currencies, currenciesLoading } = useAppSelector(state => state.accounting)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [picture, setPicture] = useState<File | null>(null)
  const [picturePreview, setPicturePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    control,
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

  // Reset form when editingEmployee changes
  useEffect(() => {
    if (editingEmployee) {
      reset({
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
      })
      setPicturePreview(editingEmployee.pictureUrl || null)
      setPicture(null)
    } else {
      reset({
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
      })
      setPicturePreview(null)
      setPicture(null)
    }
  }, [editingEmployee, reset])

  // Load users and currencies on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        dispatch(setUsersLoading(true))
        dispatch(setUsersError(null))
        const res = await usersApi.getAll()
        dispatch(setUsers(res.data || []))
      } catch (e: any) {
        dispatch(setUsersError(e?.message || 'Failed to load users'))
      } finally {
        dispatch(setUsersLoading(false))
      }
    }
    const loadCurrencies = async () => {
      try {
        dispatch(setCurrenciesLoading(true))
        dispatch(setCurrenciesError(null))
        const response = await accountingApi.getCurrencies()
        if (response.success && response.data) {
          dispatch(setCurrencies(response.data))
          if (!editingEmployee) {
            reset(prev => ({ ...prev, currencyId: getDefaultCurrencyId(response.data) }))
          }
        } else {
          dispatch(setCurrenciesError('Failed to load currencies'))
        }
      } catch (e: any) {
        dispatch(setCurrenciesError(e?.message || 'Failed to load currencies'))
      } finally {
        dispatch(setCurrenciesLoading(false))
      }
    }
    loadUsers()
    if (!currencies || currencies.length === 0) loadCurrencies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPicture(file)
    setPicturePreview(URL.createObjectURL(file))
  }

  const handleRemovePicture = () => {
    setPicture(null)
    setPicturePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFormSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data, picture ?? undefined)
      if (!editingEmployee) {
        reset()
        setPicture(null)
        setPicturePreview(null)
      }
    } catch (e) {
      // no-op, parent should toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    if (!editingEmployee) {
      reset()
      setPicture(null)
      setPicturePreview(null)
    }
  }

  const selectedUserId = watch('userId')
  const selectedUser = users.find(user => user.id === selectedUserId)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <User className="w-5 h-5" />
            {editingEmployee ? 'Edit Employee' : 'Create Employee'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editingEmployee 
              ? 'Update employee information and payroll details'
              : 'Create a new employee from an existing user account'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* User Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              User Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Select User *</Label>
                <Controller
                  name="userId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={isUserOpen} onOpenChange={setIsUserOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between rounded-full">
                          {field.value ? (
                            <span>
                              {users.find(u => u.id === field.value)?.firstName} {users.find(u => u.id === field.value)?.lastName}
                              <span className="text-gray-500 text-xs ml-2">{users.find(u => u.id === field.value)?.email}</span>
                            </span>
                          ) : (
                            <span className="text-gray-500">Choose a user...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[420px]" align="start">
                        <Command>
                          <CommandInput placeholder="Search users by name or email..." />
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            {users.map(user => (
                              <CommandItem
                                key={user.id}
                                value={`${user.firstName} ${user.lastName} ${user.email}`}
                                onSelect={() => {
                                  field.onChange(user.id)
                                  setIsUserOpen(false)
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                                  <span className="text-sm text-gray-500">{user.email}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.userId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.userId.message}
                  </p>
                )}
              </div>

              {selectedUser && (
                <div className="space-y-2">
                  <Label>Selected User</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="font-medium text-gray-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{selectedUser.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Banking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Banking Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Controller
                  name="bankName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Standard Bank"
                      className="rounded-full"
                    />
                  )}
                />
                {errors.bankName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.bankName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchCode">Branch Code *</Label>
                <Controller
                  name="branchCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., 001"
                      className="rounded-full"
                    />
                  )}
                />
                {errors.branchCode && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.branchCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Controller
                  name="accountNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., 1234567890"
                      className="rounded-full"
                    />
                  )}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Salary Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Salary *</Label>
                <Controller
                  name="basicSalary"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="e.g., 2500.00"
                      className="rounded-full"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.basicSalary && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.basicSalary.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencyId">Currency *</Label>
                <Controller
                  name="currencyId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder={currenciesLoading ? 'Loading...' : 'Select currency...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{currency.symbol}</span>
                              <span>{currency.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.currencyId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.currencyId.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number *</Label>
                <Controller
                  name="idNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., 38-2024495Q38"
                      className="rounded-full"
                    />
                  )}
                />
                {errors.idNumber && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.idNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextOfKin">Next of Kin *</Label>
                <Controller
                  name="nextOfKin"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Kundai"
                      className="rounded-full"
                    />
                  )}
                />
                {errors.nextOfKin && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.nextOfKin.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., * Dan Judson Rd"
                      className="rounded-full"
                    />
                  )}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Employee Photo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {picturePreview ? (
                  <div className="flex items-center gap-4 p-3 border rounded-xl bg-gray-50">
                    <div className="relative shrink-0">
                      <img
                        src={picturePreview}
                        alt="Employee photo preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePicture}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {picture ? picture.name : 'Current photo'}
                      </p>
                      {picture && (
                        <p className="text-xs text-gray-500">
                          {(picture.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full mt-2 h-8"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-3 h-3 mr-1.5" />
                        Change Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                      Click to upload employee photo
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP, GIF · Max 5MB</p>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || isSubmitting}
              className="rounded-full h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={editingEmployee ? "gradient-update" : "gradient-create"}
              className="rounded-full h-10 px-6 shadow-sm"
              disabled={loading || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingEmployee ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingEmployee ? 'Update Employee' : 'Create Employee'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
