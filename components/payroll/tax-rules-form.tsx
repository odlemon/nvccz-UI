"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { taxRuleFormSchema, TaxRuleFormData } from "@/lib/validations/payroll"
import { TaxRule } from "@/lib/api/payroll-api"
import { CiDollar, CiCalendar, CiPercent } from "react-icons/ci"
import { Minus, Shield, Info, AlertCircle } from "lucide-react"

interface TaxRulesFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TaxRuleFormData) => void
  editingRule?: TaxRule | null
  loading?: boolean
}

const TAX_TYPE_INFO = {
  PAYE: {
    title: "PAYE Tax",
    description: "Pay As You Earn income tax",
    icon: <CiDollar className="w-5 h-5" />,
    fields: {
      threshold: { required: true, label: "Threshold Amount", description: "Minimum income before tax applies" },
      ceiling: { required: false, label: "Ceiling Amount", description: "Maximum income for this tax bracket" }
    }
  },
  NSSA: {
    title: "NSSA Contribution",
    description: "National Social Security Authority contribution",
    icon: <CiPercent className="w-5 h-5" />,
    fields: {
      threshold: { required: false, label: "Threshold Amount", description: "Minimum income before contribution applies" },
      ceiling: { required: true, label: "Ceiling Amount", description: "Maximum income for contribution calculation" }
    }
  },
  AIDS_LEVY: {
    title: "AIDS Levy",
    description: "Health levy for AIDS prevention",
    icon: <Minus className="w-5 h-5" />,
    fields: {
      threshold: { required: false, label: "Threshold Amount", description: "Minimum income before levy applies" },
      ceiling: { required: false, label: "Ceiling Amount", description: "Maximum income for levy calculation" }
    }
  },
  NEC: {
    title: "NEC",
    description: "National Employment Council levy",
    icon: <CiPercent className="w-5 h-5" />,
    fields: {
      threshold: { required: false, label: "Threshold Amount", description: "Minimum income before NEC applies" },
      ceiling: { required: false, label: "Ceiling Amount", description: "Maximum income for NEC calculation" }
    }
  },
  STANDARDS_LEVY: {
    title: "Standards Levy",
    description: "Standards Association of Zimbabwe levy",
    icon: <Shield className="w-5 h-5" />,
    fields: {
      threshold: { required: false, label: "Threshold Amount", description: "Minimum income before levy applies" },
      ceiling: { required: false, label: "Ceiling Amount", description: "Maximum income for levy calculation" }
    }
  },
  ZIMDEV: {
    title: "ZimDev",
    description: "Zimbabwe Development Fund levy",
    icon: <CiDollar className="w-5 h-5" />,
    fields: {
      threshold: { required: false, label: "Threshold Amount", description: "Minimum income before ZimDev applies" },
      ceiling: { required: false, label: "Ceiling Amount", description: "Maximum income for ZimDev calculation" }
    }
  }
}

export function TaxRulesForm({ isOpen, onClose, onSubmit, editingRule, loading = false }: TaxRulesFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<TaxRuleFormData>({
    resolver: yupResolver(taxRuleFormSchema),
    defaultValues: editingRule ? {
      name: editingRule.name,
      type: editingRule.type,
      rate: parseFloat(editingRule.rate),
      threshold: editingRule.threshold ? parseFloat(editingRule.threshold) : undefined,
      ceiling: editingRule.ceiling ? parseFloat(editingRule.ceiling) : undefined,
      effectiveDate: editingRule.effectiveDate.split('T')[0],
      endDate: editingRule.endDate ? editingRule.endDate.split('T')[0] : undefined,
      currencyId: editingRule.currencyId
    } : {
      name: '',
      type: 'PAYE',
      rate: 0,
      threshold: undefined,
      ceiling: undefined,
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
      currencyId: 'cmefh5k3m0003un8gyi9sy1zk'
    }
  })

  // Watch the type field to get the current selected tax type
  const selectedTaxType = watch('type') as 'PAYE' | 'NSSA' | 'AIDS_LEVY' | 'NEC' | 'STANDARDS_LEVY' | 'ZIMDEV'

  // Reset form when editingRule changes
  useEffect(() => {
    if (editingRule) {
      const formData = {
        name: editingRule.name,
        type: editingRule.type,
        rate: parseFloat(editingRule.rate),
        threshold: editingRule.threshold ? parseFloat(editingRule.threshold) : undefined,
        ceiling: editingRule.ceiling ? parseFloat(editingRule.ceiling) : undefined,
        effectiveDate: editingRule.effectiveDate.split('T')[0],
        endDate: editingRule.endDate ? editingRule.endDate.split('T')[0] : undefined,
        currencyId: editingRule.currencyId
      }
      reset(formData)
    } else {
      reset({
        name: '',
        type: 'PAYE',
        rate: 0,
        threshold: undefined,
        ceiling: undefined,
        effectiveDate: new Date().toISOString().split('T')[0],
        endDate: undefined,
        currencyId: 'cmefh5k3m0003un8gyi9sy1zk'
      })
    }
  }, [editingRule, reset])

  const handleFormSubmit = (data: TaxRuleFormData) => {
    onSubmit(data)
    if (!editingRule) {
      reset()
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const currentTaxInfo = TAX_TYPE_INFO[selectedTaxType]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            {currentTaxInfo.icon}
            {editingRule ? 'Edit Tax Rule' : 'Create Tax Rule'}
          </DialogTitle>
          <DialogDescription>
            {editingRule ? 'Update the tax rule configuration' : 'Configure a new tax rule for your payroll system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Hidden input for tax type to ensure it's submitted */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />
          
          {/* Tax Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-normal">Tax Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(TAX_TYPE_INFO).map(([key, info]) => (
                    <div
                      key={key}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        field.value === key
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => field.onChange(key)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {info.icon}
                        <span className="font-medium">{info.title}</span>
                      </div>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="e.g., PAYE Tax - USD"
                        className="rounded-full pl-10"
                      />
                      <CiDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
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
                <Label htmlFor="rate">Rate (%) *</Label>
                <Controller
                  name="rate"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="e.g., 20.0"
                        className="rounded-full pl-10"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <CiPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  )}
                />
                {errors.rate && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.rate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Fields Based on Tax Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <Info className="w-5 h-5" />
              {currentTaxInfo.title} Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Threshold Field */}
              <div className="space-y-2">
                <Label htmlFor="threshold">
                  {currentTaxInfo.fields.threshold.label}
                  {currentTaxInfo.fields.threshold.required && ' *'}
                </Label>
                <Controller
                  name="threshold"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="e.g., 500.00"
                        className="rounded-full pl-10"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                      <CiDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  )}
                />
                <p className="text-xs text-gray-500">{currentTaxInfo.fields.threshold.description}</p>
                {errors.threshold && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.threshold.message}
                  </p>
                )}
              </div>

              {/* Ceiling Field */}
              <div className="space-y-2">
                <Label htmlFor="ceiling">
                  {currentTaxInfo.fields.ceiling.label}
                  {currentTaxInfo.fields.ceiling.required && ' *'}
                </Label>
                <Controller
                  name="ceiling"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1000.00"
                        className="rounded-full pl-10"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                      <CiDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  )}
                />
                <p className="text-xs text-gray-500">{currentTaxInfo.fields.ceiling.description}</p>
                {errors.ceiling && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.ceiling.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dates and Currency */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal flex items-center gap-2">
              <CiCalendar className="w-5 h-5" />
              Dates & Currency
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Controller
                  name="effectiveDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Select effective date"
                      allowFutureDates={true}
                    />
                  )}
                />
                {errors.effectiveDate && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.effectiveDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Select end date"
                      allowFutureDates={true}
                    />
                  )}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencyId">Currency *</Label>
                <Controller
                  name="currencyId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cmefh5k3m0003un8gyi9sy1zk">USD - US Dollar</SelectItem>
                        <SelectItem value="ZWL_CURRENCY_ID">ZWL - Zimbabwe Dollar</SelectItem>
                        <SelectItem value="EUR_CURRENCY_ID">EUR - Euro</SelectItem>
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
              {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}