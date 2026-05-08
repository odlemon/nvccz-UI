"use client"

import { useState, useEffect } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { bankTemplateFormSchema, BankTemplateFormData } from "@/lib/validations/payroll"
import { BankTemplate } from "@/lib/api/payroll-api"
import { FileText, Plus, X, AlertCircle, GripVertical } from "lucide-react"

interface BankTemplatesFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BankTemplateFormData) => void
  editingTemplate?: BankTemplate | null
  loading?: boolean
}

const defaultColumns = [
  "Employee Name",
  "Bank Name", 
  "Branch Code",
  "Account Number",
  "Payment Amount (Net Pay)",
  "Payment Reference"
]

// Parse columnOrder from JSON string or return array
const getColumnOrder = (columnOrder: any): string[] => {
  try {
    if (typeof columnOrder === 'string') {
      return JSON.parse(columnOrder)
    }
    return Array.isArray(columnOrder) ? columnOrder : defaultColumns
  } catch (error) {
    console.error('Error parsing columnOrder:', error)
    return defaultColumns
  }
}

const availableColumns = [
  "Employee Name",
  "Employee ID",
  "Bank Name",
  "Branch Code", 
  "Account Number",
  "Account Name",
  "Payment Amount (Net Pay)",
  "Payment Amount (Gross)",
  "Payment Reference",
  "Employee Number",
  "Department",
  "Job Title",
  "Currency Code",
  "Payment Date",
  "Pay Period Start",
  "Pay Period End"
]

export function BankTemplatesForm({ isOpen, onClose, onSubmit, editingTemplate, loading = false }: BankTemplatesFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<BankTemplateFormData>({
    resolver: yupResolver(bankTemplateFormSchema),
    defaultValues: editingTemplate ? {
      name: editingTemplate.name,
      bankName: editingTemplate.bankName,
      delimiter: editingTemplate.delimiter,
      hasHeader: editingTemplate.hasHeader,
      columnOrder: getColumnOrder(editingTemplate.columnOrder)
    } : {
      name: '',
      bankName: '',
      delimiter: ',',
      hasHeader: true,
      columnOrder: defaultColumns
    }
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "columnOrder"
  })

  // Reset form when editingTemplate changes
  useEffect(() => {
    if (editingTemplate) {
      const formData = {
        name: editingTemplate.name,
        bankName: editingTemplate.bankName,
        delimiter: editingTemplate.delimiter,
        hasHeader: editingTemplate.hasHeader,
        columnOrder: getColumnOrder(editingTemplate.columnOrder)
      }
      reset(formData)
    } else {
      reset({
        name: '',
        bankName: '',
        delimiter: ',',
        hasHeader: true,
        columnOrder: defaultColumns
      })
    }
  }, [editingTemplate, reset])

  const handleFormSubmit = (data: BankTemplateFormData) => {
    onSubmit(data)
    if (!editingTemplate) {
      reset()
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const addColumn = () => {
    append("")
  }

  const removeColumn = (index: number) => {
    remove(index)
  }

  const moveColumn = (from: number, to: number) => {
    move(from, to)
  }

  const hasHeader = watch('hasHeader')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <FileText className="w-5 h-5" />
            {editingTemplate ? 'Edit Bank Template' : 'Create Bank Template'}
          </DialogTitle>
          <DialogDescription>
            {editingTemplate ? 'Update the bank template configuration' : 'Configure a new bank file template for payroll processing'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Standard Bank Template"
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
            </div>
          </div>

          {/* File Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <FileText className="w-5 h-5" />
              File Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delimiter">Delimiter *</Label>
                <Controller
                  name="delimiter"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder="Select delimiter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">Comma (,)</SelectItem>
                        <SelectItem value=";">Semicolon (;)</SelectItem>
                        <SelectItem value="|">Pipe (|)</SelectItem>
                        <SelectItem value="\t">Tab</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.delimiter && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.delimiter.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hasHeader">File Format</Label>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="hasHeader" className="text-base font-medium">
                        Include Header Row
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {hasHeader 
                          ? "First row will contain column names"
                          : "File will start directly with data"
                        }
                      </p>
                    </div>
                    <Controller
                      name="hasHeader"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  {errors.hasHeader && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hasHeader.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Column Order
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addColumn}
                className="rounded-full h-9 px-4"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Column
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Define the order of columns in the bank file *</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <div className="flex-1">
                      <Controller
                        name={`columnOrder.${index}`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-full">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((column) => (
                                <SelectItem key={column} value={column}>
                                  {column}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColumn(index)}
                      className="rounded-full w-8 h-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {errors.columnOrder && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.columnOrder.message}
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
              variant={editingTemplate ? "gradient-update" : "gradient-create"}
              disabled={loading}
              className="rounded-full h-10 px-6 shadow-sm"
            >
              {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}