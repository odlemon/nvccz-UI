"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { departmentApiService } from "@/lib/api/department-api"
import { toast } from "sonner"

const goalValidationSchema = yup.object({
  title: yup
    .string()
    .required('Goal title is required')
    .min(5, 'Goal title must be at least 5 characters')
    .max(200, 'Goal title must not exceed 200 characters'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  
  type: yup
    .string()
    .required('Goal type is required')
    .oneOf(['company', 'department', 'individual'], 'Invalid goal type'),
  
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['financial', 'operational', 'strategic', 'growth'], 'Invalid category'),
  
  priority: yup
    .string()
    .required('Priority is required')
    .oneOf(['low', 'medium', 'high'], 'Invalid priority'),
  
  startDate: yup
    .string()
    .required('Start date is required'),
  
  endDate: yup
    .string()
    .required('End date is required'),
  
  monetaryValue: yup
    .number()
    .min(0, 'Monetary value must be positive'),
  
  percentValue: yup
    .number()
    .min(0, 'Percent value must be positive')
    .max(100, 'Percent value must not exceed 100'),
  
  assignedToId: yup
    .string()
    .max(50, 'Assigned to ID must not exceed 50 characters')
})

export type GoalFormData = yup.InferType<typeof goalValidationSchema>

interface GoalFormProps {
  departmentId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function GoalForm({ departmentId, isOpen, onClose, onSuccess }: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<GoalFormData>({
    resolver: yupResolver(goalValidationSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "department",
      category: "strategic",
      priority: "medium",
      startDate: "",
      endDate: "",
      monetaryValue: 0,
      percentValue: 0,
      assignedToId: "",
    },
    mode: "onChange"
  })

  const onSubmit = async (data: GoalFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await departmentApiService.createGoal({
        ...data,
        departmentId
      })
      toast.success("Performance goal created successfully")
      reset()
      onSuccess()
    } catch (error: any) {
      console.error('Failed to create goal:', error)
      toast.error(error.message || "Failed to create goal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Performance Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title *</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="title"
                    placeholder="Goal Title"
                    className={errors.title ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Goal Type *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="description"
                  placeholder="Goal Description"
                  className={errors.description ? "border-red-500" : ""}
                />
              )}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="strategic">Strategic</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.priority ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && (
                <p className="text-sm text-red-500">{errors.priority.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="startDate"
                    type="date"
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="endDate"
                    type="date"
                    className={errors.endDate ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="monetaryValue">Monetary Value</Label>
              <Controller
                name="monetaryValue"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="monetaryValue"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className={errors.monetaryValue ? "border-red-500" : ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
              {errors.monetaryValue && (
                <p className="text-sm text-red-500">{errors.monetaryValue.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="percentValue">Percent Value</Label>
              <Controller
                name="percentValue"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="percentValue"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    className={errors.percentValue ? "border-red-500" : ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
              {errors.percentValue && (
                <p className="text-sm text-red-500">{errors.percentValue.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToId">Assigned To ID</Label>
            <Controller
              name="assignedToId"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="assignedToId"
                  placeholder="User ID (optional)"
                  className={errors.assignedToId ? "border-red-500" : ""}
                />
              )}
            />
            {errors.assignedToId && (
              <p className="text-sm text-red-500">{errors.assignedToId.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary text-white"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
