"use client"

import { useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { useAppSelector } from "@/lib/store"
import { format } from "date-fns"

const goalSchema = yup.object({
  title: yup.string().required("Title is required").min(3),
  description: yup.string().required("Description is required"),
  type: yup.string().oneOf(["company", "department", "individual"]).required("Type is required"),
  scorecardPillar: yup.string().when("type", {
    is: "company",
    then: (schema) => schema.oneOf(["FINANCIAL", "CUSTOMER", "INTERNAL_OPS", "LEARNING_GROWTH"]).required("Scorecard pillar is required for company goals"),
    otherwise: (schema) => schema.nullable(),
  }),
  targetValue: yup.number().typeError("Target must be a number").required("Target value is required"),
  targetUnit: yup.string().required("Target unit is required"),
  kpiName: yup.string().required("A backing KPI is required"),
  dataSourceModule: yup.string().nullable(),
  dataSourceField: yup.string().nullable(),
  departmentName: yup.string().when("type", {
    is: (val: string) => val === "department" || val === "individual",
    then: (schema) => schema.required("Department is required for this goal type"),
    otherwise: (schema) => schema.nullable(),
  }),
  parentGoalId: yup.string().nullable(),
  startDate: yup.date().required("Start date is required"),
  endDate: yup.date().required("End date is required"),
})

interface GoalFormModalProps {
  isOpen: boolean
  onClose: () => void
  goal?: any
  onSubmit: (data: any) => void
}

export function GoalFormModal({ isOpen, onClose, goal, onSubmit }: GoalFormModalProps) {
  const { availableDepartments, goals, availableKPIs } = useAppSelector((state) => state.performance)

  const getErrorMessage = (error: any) => {
    if (!error) return ""
    return typeof error.message === "string" ? error.message : "Invalid value"
  }

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: yupResolver(goalSchema),
    defaultValues: {
      title: goal?.title || "",
      description: goal?.description || "",
      type: goal?.type || "company",
      scorecardPillar: goal?.scorecardPillar || "FINANCIAL",
      targetValue: goal?.targetValue || 0,
      targetUnit: goal?.targetUnit || "USD",
      kpiName: goal?.kpi?.name || "",
      dataSourceModule: goal?.dataSourceModule || null,
      dataSourceField: goal?.dataSourceField || null,
      departmentName: goal?.departmentName || null,
      parentGoalId: goal?.parentGoalId || null,
      startDate: goal?.startDate ? new Date(goal.startDate) : new Date(),
      endDate: goal?.endDate ? new Date(goal.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  })

  const goalType = watch("type")
  const selectedPillar = watch("scorecardPillar")

  const availableParentGoals = Array.isArray(goals)
    ? goals.filter((g) => {
        if (goalType === "department") return g.type === "company"
        if (goalType === "individual") return g.type === "department"
        return false
      })
    : []

  const validDepartments = Array.isArray(availableDepartments) ? availableDepartments : []
  const allKPIs = Array.isArray(availableKPIs) ? availableKPIs : []

  // Filter KPIs based on selected scorecard pillar
  const validKPIs = useMemo(() => {
    if (!selectedPillar) return allKPIs
    return allKPIs.filter((kpi: any) => {
      const isFinancial = kpi.isFinancial || kpi.hardcodedDetails?.isFinancial
      switch (selectedPillar) {
        case "FINANCIAL":
          return isFinancial
        case "CUSTOMER":
        case "INTERNAL_OPS":
        case "LEARNING_GROWTH":
          return !isFinancial
        default:
          return true
      }
    })
  }, [allKPIs, selectedPillar])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  {...field}
                  placeholder="e.g., Achieve $5M Fund I AUM by Q4"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-600">{getErrorMessage(errors.title)}</p>}
              </div>
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...field}
                  placeholder="Describe the strategic importance of the goal"
                  className={errors.description ? "border-red-500" : ""}
                  rows={4}
                />
                {errors.description && <p className="text-sm text-red-600">{getErrorMessage(errors.description)}</p>}
              </div>
            )}
          />

          {/* Type */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-600">{getErrorMessage(errors.type)}</p>}
              </div>
            )}
          />

          {goalType === "company" && (
            <Controller
              name="scorecardPillar"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Scorecard Pillar *</Label>
                  <Select onValueChange={field.onChange} value={field.value || "FINANCIAL"}>
                    <SelectTrigger className={errors.scorecardPillar ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select scorecard pillar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="CUSTOMER">Customer & Market</SelectItem>
                      <SelectItem value="INTERNAL_OPS">Internal Operations</SelectItem>
                      <SelectItem value="LEARNING_GROWTH">Learning, Growth & HR</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.scorecardPillar && <p className="text-sm text-red-600">{getErrorMessage(errors.scorecardPillar)}</p>}
                </div>
              )}
            />
          )}

          {/* Department and Parent Goal */}
          {(goalType === "department" || goalType === "individual") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="departmentName"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                      disabled={validDepartments.length === 0}
                    >
                      <SelectTrigger className={errors.departmentName ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Company-wide)</SelectItem>
                        {validDepartments.map((dept: any) => (
                          <SelectItem key={dept.name} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.departmentName && <p className="text-sm text-red-600">{getErrorMessage(errors.departmentName)}</p>}
                    {validDepartments.length === 0 && (
                      <p className="text-xs text-amber-500">No departments available</p>
                    )}
                  </div>
                )}
              />
              {availableParentGoals.length > 0 && (
                <Controller
                  name="parentGoalId"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Parent Goal</Label>
                      <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {availableParentGoals.map((g: any) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              )}
            </div>
          )}

          {/* KPI and Target */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="kpiName"
              control={control}
              render={({ field }) => (
                <div className="space-y-2 col-span-1">
                  <Label>Backing KPI *</Label>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={validKPIs.length === 0}
                  >
                    <SelectTrigger className={errors.kpiName ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select KPI" />
                    </SelectTrigger>
                    <SelectContent>
                      {validKPIs.map((kpi: any) => (
                        <SelectItem key={kpi.name} value={kpi.name}>
                          {kpi.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.kpiName && <p className="text-sm text-red-600">{getErrorMessage(errors.kpiName)}</p>}
                  {validKPIs.length === 0 && (
                    <p className="text-xs text-amber-500">No KPIs available</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="targetValue"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="targetValue">Target Value *</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    placeholder="e.g., 5000000"
                    className={errors.targetValue ? "border-red-500" : ""}
                  />
                  {errors.targetValue && <p className="text-sm text-red-600">{getErrorMessage(errors.targetValue)}</p>}
                </div>
              )}
            />
            <Controller
              name="targetUnit"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="targetUnit">Target Unit *</Label>
                  <Input
                    id="targetUnit"
                    {...field}
                    placeholder="e.g., USD, %, items"
                    className={errors.targetUnit ? "border-red-500" : ""}
                  />
                  {errors.targetUnit && <p className="text-sm text-red-600">{getErrorMessage(errors.targetUnit)}</p>}
                </div>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    allowFutureDates={true}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && <p className="text-sm text-red-600">{getErrorMessage(errors.startDate)}</p>}
                </div>
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <DatePicker
                    value={field.value}
                    allowFutureDates={true}
                    onChange={field.onChange}
                    className={errors.endDate ? "border-red-500" : ""}
                  />
                  {errors.endDate && <p className="text-sm text-red-600">{getErrorMessage(errors.endDate)}</p>}
                </div>
              )}
            />
          </div>

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
              disabled={isSubmitting}
              className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {goal ? "Updating..." : "Creating..."}
                </>
              ) : (
                goal ? "Update Goal" : "Create Goal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
