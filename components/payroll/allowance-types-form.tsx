"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { allowanceTypeFormSchema, AllowanceTypeFormData } from "@/lib/validations/payroll"
import { AllowanceType } from "@/lib/api/payroll-api"
import { Building, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface AllowanceTypesFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AllowanceTypeFormData) => void
  editingType?: AllowanceType | null
  loading?: boolean
}

export function AllowanceTypesForm({ isOpen, onClose, onSubmit, editingType, loading = false }: AllowanceTypesFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<AllowanceTypeFormData>({
    resolver: yupResolver(allowanceTypeFormSchema),
    defaultValues: editingType ? {
      name: editingType.name,
      code: editingType.code,
      description: editingType.description,
      type: 'HOUSING', // Default for display
      isTaxable: editingType.isTaxable
    } : {
      name: '',
      code: '',
      description: '',
      type: 'HOUSING',
      isTaxable: true
    }
  })

  // Reset form when editingType changes
  useEffect(() => {
    if (editingType) {
      const formData = {
        name: editingType.name,
        code: editingType.code,
        description: editingType.description,
        type: 'HOUSING', // Default for display
        isTaxable: editingType.isTaxable
      }
      reset(formData)
    } else {
      reset({
        name: '',
        code: '',
        description: '',
        type: 'HOUSING',
        isTaxable: true
      })
    }
  }, [editingType, reset])

  const handleFormSubmit = (data: AllowanceTypeFormData) => {
    // Remove type field before sending to API
    const { type, ...apiData } = data
    onSubmit(apiData)
    if (!editingType) {
      reset()
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const isTaxable = watch('isTaxable')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <Building className="w-5 h-5" />
            {editingType ? 'Edit Allowance Type' : 'Create Allowance Type'}
          </DialogTitle>
          <DialogDescription>
            {editingType ? 'Update the allowance type configuration' : 'Configure a new allowance type for your payroll system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <Building className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Allowance Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Housing Allowance"
                      className="rounded-full"
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., HOUSING"
                      className="rounded-full font-mono"
                    />
                  )}
                />
                {errors.code && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Allowance Type *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select allowance type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOUSING">Housing Allowance</SelectItem>
                      <SelectItem value="TRANSPORT">Transport Allowance</SelectItem>
                      <SelectItem value="MEDICAL">Medical Allowance</SelectItem>
                      <SelectItem value="SHORT_TIME">Short-time Allowance</SelectItem>
                      <SelectItem value="SICK_LEAVE">Sick Leave Allowance</SelectItem>
                      <SelectItem value="ANNUAL_LEAVE">Annual Leave Allowance</SelectItem>
                      <SelectItem value="UNPAID_LEAVE">Unpaid Leave Allowance</SelectItem>
                      <SelectItem value="OTHER">Other Allowance</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="e.g., Monthly housing allowance for employees"
                    className="rounded-xl min-h-[100px]"
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Tax Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              {isTaxable ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-600" />
              )}
              Tax Configuration
            </h3>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isTaxable" className="text-base font-medium">
                    Taxable Allowance
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {isTaxable 
                      ? "This allowance will be included in taxable income calculations"
                      : "This allowance will be excluded from taxable income calculations"
                    }
                  </p>
                </div>
                <Controller
                  name="isTaxable"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              {errors.isTaxable && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.isTaxable.message}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-full h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={editingType ? "gradient-update" : "gradient-create"}
              disabled={loading}
              className="rounded-full h-10 px-6 shadow-sm"
            >
              {loading ? 'Saving...' : editingType ? 'Update Type' : 'Create Type'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}