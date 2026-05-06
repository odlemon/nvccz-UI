"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CiFloppyDisk, CiSquareRemove } from "react-icons/ci"
import { useAppSelector } from "@/lib/store"
import { performanceConfigApi, type ScorecardPillar } from "@/lib/api/performance-config-api"

const schema = yup.object({
  name: yup.string().required("KPI name is required"),
  isReverseKpi: yup.boolean().required(),
  hasUnit: yup.boolean().required(),
  unitCategory: yup.string().nullable(),
  unit: yup.string().nullable(),
  unitSymbol: yup.string().nullable(),
  unitPosition: yup.string().oneOf(["prefix", "suffix"]).nullable(),
  code: yup.string().required("Code is required"),
  description: yup.string().required("Description is required"),
  accountType: yup.string().when("isFinancial", {
    is: true,
    then: (s) =>
      s
        .oneOf(["Asset", "Liability", "Equity", "Revenue", "Expense"])
        .required("Account type is required for financial KPIs"),
    otherwise: (s) => s.nullable(),
  }),
  accountNumber: yup.string().when("isFinancial", {
    is: true,
    then: (s) => s.required("Account number is required for financial KPIs"),
    otherwise: (s) => s.nullable(),
  }),
  journalEntryType: yup.string().when("isFinancial", {
    is: true,
    then: (s) =>
      s
        .oneOf(["Debit", "Credit"])
        .required("Journal entry type is required for financial KPIs"),
    otherwise: (s) => s.nullable(),
  }),
  isFinancial: yup.boolean().required(),
  pillarId: yup.string().required("Scorecard pillar is required"),
})

interface KPIFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  kpi?: any
  isLoading?: boolean
}

const getErrorMessage = (error: any) => {
  if (!error) return ""
  return typeof error.message === "string" ? error.message : "Invalid value"
}

export function KPIForm({ isOpen, onClose, onSubmit, kpi, isLoading = false }: KPIFormProps) {
  const { availableDepartments } = useAppSelector((state) => state.performance)
  const validDepartments = Array.isArray(availableDepartments) ? availableDepartments : []
  const [pillars, setPillars] = useState<ScorecardPillar[]>([])
  const [pillarsLoading, setPillarsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const load = async () => {
      setPillarsLoading(true)
      try {
        const res = await performanceConfigApi.getScorecardPillars()
        if (!cancelled) setPillars(Array.isArray(res?.data) ? res.data : [])
      } catch (e) {
        if (!cancelled) setPillars([])
      } finally {
        if (!cancelled) setPillarsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      type: "Metric",
      isReverseKpi: false,
      weightValue: 1,
      hasUnit: true,
      unitCategory: "Currency",
      unit: "USD",
      unitSymbol: "$",
      unitPosition: "prefix",
      code: "",
      description: "",
      catalogDepartmentName: "none",
      accountType: "Expense",
      accountNumber: null,
      journalEntryType: "Debit",
      isFinancial: false,
      isActive: true,
      pillarId: "",
    },
  })

  const hasUnit = watch("hasUnit")
  const isFinancial = watch("isFinancial")

  useEffect(() => {
    if (kpi) {
      reset({
        name: kpi.name || "",
        type: kpi.type || "Metric",
        isReverseKpi: Boolean(kpi.isReverseKpi ?? false),
        weightValue: Number.parseFloat(String(kpi.weightValue ?? 1)) || 1,
        hasUnit: Boolean(kpi.hasUnit ?? true),
        unitCategory: kpi.unitCategory || "Currency",
        unit: kpi.unit || "USD",
        unitSymbol: kpi.unitSymbol || "$",
        unitPosition: kpi.unitPosition || "prefix",
        code: kpi.code || kpi.hardcodedDetails?.code || "",
        description: kpi.description || kpi.hardcodedDetails?.description || "",
        catalogDepartmentName: kpi.catalogDepartmentName || kpi.departmentName || "none",
        accountType: kpi.accountType || kpi.hardcodedDetails?.accountType || "Expense",
        accountNumber: kpi.accountNumber || kpi.hardcodedDetails?.accountNumber || null,
        journalEntryType: kpi.journalEntryType || kpi.hardcodedDetails?.journalEntryType || "Debit",
        isFinancial: Boolean(kpi.isFinancial ?? kpi.hardcodedDetails?.isFinancial ?? false),
        isActive: Boolean(kpi.isActive ?? true),
        pillarId: kpi.pillarId || kpi.scorecardPillarId || "",
      })
    } else {
      reset({
        name: "",
        type: "Metric",
        isReverseKpi: false,
        weightValue: 1,
        hasUnit: true,
        unitCategory: "Currency",
        unit: "USD",
        unitSymbol: "$",
        unitPosition: "prefix",
        code: "",
        description: "",
        catalogDepartmentName: "none",
        accountType: "Expense",
        accountNumber: null,
        journalEntryType: "Debit",
        isFinancial: false,
        isActive: true,
        pillarId: "",
      })
    }
  }, [kpi, reset])

  const handleFormSubmit = (data: any) => {
    const payload = {
      ...data,
      catalogDepartmentName:
        !data.catalogDepartmentName || data.catalogDepartmentName === "none" ? null : data.catalogDepartmentName,
      unitCategory: data.hasUnit ? data.unitCategory : null,
      unit: data.hasUnit ? data.unit : null,
      unitSymbol: data.hasUnit ? data.unitSymbol : null,
      unitPosition: data.hasUnit ? data.unitPosition : null,
      accountType: data.accountType,
      accountNumber: data.isFinancial ? data.accountNumber : null,
      journalEntryType: data.journalEntryType,
      pillarId: data.pillarId || null,
    }

    onSubmit(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <CiFloppyDisk className="w-6 h-6 text-white" />
            </div>
            {kpi ? "Edit KPI" : "Create New KPI"}
          </DialogTitle>
          <DialogDescription>
            {kpi ? "Update KPI catalog details." : "Create a KPI in the database catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>KPI Name *</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Training Expense" className={errors.name ? "border-red-500" : ""} />
                )}
              />
              {errors.name && <p className="text-sm text-red-500">{getErrorMessage(errors.name)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Code *</Label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="TRAINING_EXPENSE" className={errors.code ? "border-red-500" : ""} />
                )}
              />
              {errors.code && <p className="text-sm text-red-500">{getErrorMessage(errors.code)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Scorecard Pillar *</Label>
              <Controller
                name="pillarId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange} disabled={pillarsLoading}>
                    <SelectTrigger className={errors.pillarId ? "border-red-500" : ""}>
                      <SelectValue placeholder={pillarsLoading ? "Loading pillars..." : "Select pillar"} />
                    </SelectTrigger>
                    <SelectContent>
                      {pillars.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.displayName}
                        </SelectItem>
                      ))}
                      {pillars.length === 0 && !pillarsLoading && (
                        <div className="px-2 py-1.5 text-sm text-gray-500">No pillars available</div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.pillarId && <p className="text-sm text-red-500">{getErrorMessage(errors.pillarId)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Financial KPI *</Label>
              <Controller
                name="isFinancial"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ? "yes" : "no"} onValueChange={(v) => field.onChange(v === "yes")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Reverse KPI *</Label>
              <Controller
                name="isReverseKpi"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ? "yes" : "no"} onValueChange={(v) => field.onChange(v === "yes")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Has Unit *</Label>
              <Controller
                name="hasUnit"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ? "yes" : "no"} onValueChange={(v) => field.onChange(v === "yes")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {hasUnit && (
              <>
                <div className="space-y-2">
                  <Label>Unit Category</Label>
                  <Controller
                    name="unitCategory"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || "Currency"} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Currency">Currency</SelectItem>
                          <SelectItem value="Percentage">Percentage</SelectItem>
                          <SelectItem value="Count">Count</SelectItem>
                          <SelectItem value="Ratio">Ratio</SelectItem>
                          <SelectItem value="Metric">Metric</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => <Input {...field} value={field.value || ""} placeholder="USD" />}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit Symbol</Label>
                  <Controller
                    name="unitSymbol"
                    control={control}
                    render={({ field }) => <Input {...field} value={field.value || ""} placeholder="$" />}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit Position</Label>
                  <Controller
                    name="unitPosition"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || "prefix"} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prefix">Prefix</SelectItem>
                          <SelectItem value="suffix">Suffix</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </>
            )}

            {isFinancial && (
              <>
                <div className="space-y-2">
                  <Label>Account Type *</Label>
                  <Controller
                    name="accountType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || "Expense"} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.accountType ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asset">Asset</SelectItem>
                          <SelectItem value="Liability">Liability</SelectItem>
                          <SelectItem value="Equity">Equity</SelectItem>
                          <SelectItem value="Revenue">Revenue</SelectItem>
                          <SelectItem value="Expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.accountType && <p className="text-sm text-red-500">{getErrorMessage(errors.accountType)}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Journal Entry Type *</Label>
                  <Controller
                    name="journalEntryType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || "Debit"} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.journalEntryType ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select journal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Debit">Debit</SelectItem>
                          <SelectItem value="Credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.journalEntryType && (
                    <p className="text-sm text-red-500">{getErrorMessage(errors.journalEntryType)}</p>
                  )}
                </div>
              </>
            )}

            {isFinancial && (
              <>
                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Controller
                    name="accountNumber"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="5090"
                        className={errors.accountNumber ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.accountNumber && <p className="text-sm text-red-500">{getErrorMessage(errors.accountNumber)}</p>}
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Employee training and development costs"
                  rows={3}
                  className={errors.description ? "border-red-500" : ""}
                />
              )}
            />
            {errors.description && <p className="text-sm text-red-500">{getErrorMessage(errors.description)}</p>}
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              <CiSquareRemove className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {kpi ? "Updating..." : "Creating..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CiFloppyDisk className="w-4 h-4" />
                  {kpi ? "Update KPI" : "Create KPI"}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
