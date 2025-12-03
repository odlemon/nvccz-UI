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
import { deductionTypeFormSchema, DeductionTypeFormData } from "@/lib/validations/payroll"
import { DeductionType } from "@/lib/api/payroll-api"
import { Building, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface DeductionTypesFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DeductionTypeFormData) => void
  editingType?: DeductionType | null
  loading?: boolean
}

export function DeductionTypesForm({ isOpen, onClose, onSubmit, editingType, loading = false }: DeductionTypesFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<DeductionTypeFormData>({
    resolver: yupResolver(deductionTypeFormSchema),
    defaultValues: editingType ? {
      name: editingType.name,
      code: editingType.code,
      description: editingType.description,
      type: 'LOAN', // Default for display
      isStatutory: editingType.isStatutory
    } : {
      name: '',
      code: '',
      description: '',
      type: 'LOAN',
      isStatutory: false
    }
  })

  // Reset form when editingType changes
  useEffect(() => {
    if (editingType) {
      const formData = {
        name: editingType.name,
        code: editingType.code,
        description: editingType.description,
        type: 'LOAN', // Default for display
        isStatutory: editingType.isStatutory
      }
      reset(formData)
    } else {
      reset({
        name: '',
        code: '',
        description: '',
        type: 'LOAN',
        isStatutory: false
      })
    }
  }, [editingType, reset])

  const handleFormSubmit = (data: DeductionTypeFormData) => {
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

  const isStatutory = watch('isStatutory')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <Building className="w-5 h-5" />
            {editingType ? 'Edit Deduction Type' : 'Create Deduction Type'}
          </DialogTitle>
          <DialogDescription>
            {editingType ? 'Update the deduction type configuration' : 'Configure a new deduction type for your payroll system'}
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
                <Label htmlFor="name">Deduction Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Staff Loan"
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
                      placeholder="e.g., LOAN"
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
              <Label htmlFor="type">Deduction Type *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select deduction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOAN">Staff Loan</SelectItem>
                      <SelectItem value="PENSION">Pension Contribution</SelectItem>
                      <SelectItem value="ADVANCE">Salary Advance</SelectItem>
                      <SelectItem value="OTHER">Other Deduction</SelectItem>
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
                    placeholder="e.g., Monthly loan repayment deduction"
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

          {/* Statutory Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              {isStatutory ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-600" />
              )}
              Statutory Configuration
            </h3>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isStatutory" className="text-base font-medium">
                    Statutory Deduction
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {isStatutory 
                      ? "This is a legally required deduction (e.g., NSSA, pension)"
                      : "This is an optional deduction (e.g., loan, advance)"
                    }
                  </p>
                </div>
                <Controller
                  name="isStatutory"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              {errors.isStatutory && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.isStatutory.message}
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
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full gradient-primary text-white"
            >
              {loading ? 'Saving...' : editingType ? 'Update Type' : 'Create Type'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}