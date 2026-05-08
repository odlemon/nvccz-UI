"use client"

import { useEffect, useMemo } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppSelector, useAppDispatch } from "@/lib/store"
import { MultiSelect } from "@/components/ui/multi-select"
import { toast } from "sonner"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { Skeleton } from "@/components/ui/skeleton"

interface DepartmentBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  parentGoal: any
  onSubmit: (data: any) => void
}

// Yup validation schema
const breakdownSchema = yup.object({
  parentGoalId: yup.string().required("Parent goal ID is required"),
  selectedDepartments: yup
    .array()
    .of(yup.string())
    .min(1, "At least one department must be selected")
    .required("Please select at least one department"),
  breakdownData: yup.array().of(
    yup.object({
      title: yup.string().required("Title is required").min(3, "Title must be at least 3 characters"),
      targetValue: yup
        .number()
        .typeError("Target value must be a number")
        .required("Target value is required")
        .min(0.01, "Target value must be greater than 0"),
      targetUnit: yup.string().required("Target unit is required"),
      description: yup.string(),
      departmentName: yup.string().required(),
    })
  ),
})

export function DepartmentBreakdownModal({ isOpen, onClose, parentGoal, onSubmit }: DepartmentBreakdownModalProps) {
  const dispatch = useAppDispatch()
  const { availableDepartments, availableDepartmentsLoading } = useAppSelector((state) => state.performance)
  
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(breakdownSchema),
    defaultValues: {
      parentGoalId: parentGoal?.id || "",
      selectedDepartments: [],
      breakdownData: [],
    },
  })

  const { fields, replace } = useFieldArray({
    control,
    name: "breakdownData",
  })

  const selectedDepartments = watch("selectedDepartments", [])

  // Fetch departments when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAvailableDepartments())
    }
  }, [isOpen, dispatch])

  // Update parent goal ID when it changes
  useEffect(() => {
    if (parentGoal?.id) {
      setValue("parentGoalId", parentGoal.id)
    }
  }, [parentGoal?.id, setValue])

  // Generate breakdown data when departments are selected
  useEffect(() => {
    if (!parentGoal) return
    
    const newFields = selectedDepartments.map((deptName: string) => ({
      title: `${deptName}: Contribution to ${parentGoal.title}`,
      targetValue: 0,
      targetUnit: parentGoal.targetUnit || "USD",
      description: `Breakdown goal for ${deptName} department.`,
      departmentName: deptName,
    }))
    replace(newFields)
  }, [selectedDepartments, parentGoal, replace])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const departmentOptions = useMemo(() => {
    if (!Array.isArray(availableDepartments) || availableDepartments.length === 0) {
      return []
    }
    return availableDepartments.map((dept: any) => ({
      value: dept.name,
      label: dept.name,
    }))
  }, [availableDepartments])

  const handleFormSubmit = async (data: any) => {
    try {
      // Call onSubmit and wait for backend response
      const result = await onSubmit(data)
      
      // Only show success and close modal if backend succeeded
      if (result !== false) {
        toast.success("Breakdown goals created successfully", {
          description: "All department goals have been created."
        })
        reset()
        onClose()
      }
    } catch (error: any) {
      console.error("Error submitting form:", error)
      toast.error("Failed to create breakdown goals", {
        description: error.message || "An error occurred while creating goals"
      })
      // Don't close modal on error so user can retry
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Breakdown Goal: {parentGoal?.title || 'Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Department Selection */}
          <Controller
            name="selectedDepartments"
            control={control}
            render={({ field }) => (
              <div>
                <Label>Select Departments *</Label>
                {availableDepartmentsLoading ? (
                  <div className="space-y-2 mt-2">
                    <Skeleton className="h-10 w-full" />
                    <p className="text-xs text-muted-foreground">Loading departments...</p>
                  </div>
                ) : (
                  <>
                    <MultiSelect
                      options={departmentOptions}
                      onValueChange={field.onChange}
                      value={field.value}
                      placeholder="Select departments to assign goals..."
                      disabled={departmentOptions.length === 0}
                      className="mt-2"
                    />
                    {errors.selectedDepartments && (
                      <p className="text-xs text-red-500 mt-1">{errors.selectedDepartments.message}</p>
                    )}
                    {departmentOptions.length === 0 && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-700 font-medium">
                          No departments available. Please ensure departments are created in the system.
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => dispatch(fetchAvailableDepartments())}
                          className="h-auto p-0 text-amber-700 underline mt-1"
                        >
                          Retry loading departments
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          />

          {/* Breakdown Data Fields */}
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
                <h4 className="font-medium text-lg">Goal for: {selectedDepartments[index]}</h4>
                
                {/* Title */}
                <Controller
                  name={`breakdownData.${index}.title`}
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input 
                        {...field}
                        placeholder="Enter goal title"
                        className={errors.breakdownData?.[index]?.title ? "border-red-500" : ""}
                      />
                      {errors.breakdownData?.[index]?.title && (
                        <p className="text-xs text-red-500">{errors.breakdownData[index].title?.message}</p>
                      )}
                    </div>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Target Value */}
                  <Controller
                    name={`breakdownData.${index}.targetValue`}
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Target Value *</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          placeholder="Enter target value"
                          className={errors.breakdownData?.[index]?.targetValue ? "border-red-500" : ""}
                        />
                        {errors.breakdownData?.[index]?.targetValue && (
                          <p className="text-xs text-red-500">{errors.breakdownData[index].targetValue?.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* Target Unit */}
                  <Controller
                    name={`breakdownData.${index}.targetUnit`}
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Target Unit *</Label>
                        <Input 
                          {...field}
                          placeholder="e.g., USD, %"
                          className={errors.breakdownData?.[index]?.targetUnit ? "border-red-500" : ""}
                        />
                        {errors.breakdownData?.[index]?.targetUnit && (
                          <p className="text-xs text-red-500">{errors.breakdownData[index].targetUnit?.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Description */}
                <Controller
                  name={`breakdownData.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        {...field}
                        placeholder="Enter goal description (optional)"
                        rows={3}
                      />
                    </div>
                  )}
                />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {selectedDepartments.length === 0 && !availableDepartmentsLoading && (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
              <p>Please select departments to create breakdown goals</p>
            </div>
          )}

          {/* Footer Buttons */}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={selectedDepartments.length === 0 || isSubmitting || availableDepartmentsLoading}
              className="rounded-full"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Breakdown Goals"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
