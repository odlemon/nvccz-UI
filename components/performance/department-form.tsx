"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  CiFloppyDisk,
  CiSquareRemove
} from "react-icons/ci"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const departmentValidationSchema = yup.object({
  name: yup
    .string()
    .required('Department name is required')
    .min(3, 'Department name must be at least 3 characters')
    .max(100, 'Department name must not exceed 100 characters'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  
  branch: yup
    .string()
    .required('Branch is required')
    .max(50, 'Branch must not exceed 50 characters'),
  
  isActive: yup
    .boolean()
    .required('Active status is required')
})

export type DepartmentFormData = yup.InferType<typeof departmentValidationSchema>

interface DepartmentFormProps {
  department?: any
  onSave: (data: DepartmentFormData) => void
  onClose: () => void
  isLoading?: boolean
}

export function DepartmentForm({ department, onSave, onClose, isLoading = false }: DepartmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<DepartmentFormData>({
    resolver: yupResolver(departmentValidationSchema),
    defaultValues: {
      name: department?.name || "",
      description: department?.description || "",
      branch: department?.branch || "main",
      isActive: department?.isActive ?? true,
    },
    mode: "onChange"
  })

  const onSubmit = async (data: DepartmentFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onSave(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Department Name *</Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="name"
              placeholder="Department Name"
              className={errors.name ? "border-red-500" : ""}
            />
          )}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
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
              id="description"
              placeholder="Department Description"
              className={errors.description ? "border-red-500" : ""}
              rows={3}
            />
          )}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="branch">Branch *</Label>
        <Controller
          name="branch"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={errors.branch ? "border-red-500" : ""}>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main_office">Main Office</SelectItem>
                <SelectItem value="main">Main</SelectItem>
                <SelectItem value="branch_1">Branch 1</SelectItem>
                <SelectItem value="branch_2">Branch 2</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.branch && (
          <p className="text-sm text-red-500">{errors.branch.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id="isActive"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="rounded"
            />
          )}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-full bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300"
        >
          <CiSquareRemove className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="rounded-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={!isValid || isSubmitting || isLoading}
        >
          <CiFloppyDisk className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving..." : department ? "Update Department" : "Create Department"}
        </Button>
      </div>
    </form>
  )
}
