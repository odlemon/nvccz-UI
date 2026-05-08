"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { payrollRunFormSchema, PayrollRunFormData } from "@/lib/validations/payroll"
import { PayrollRun } from "@/lib/api/payroll-api"
import { accountingApi, type Currency } from "@/lib/api/accounting-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setCurrencies, setCurrenciesError, setCurrenciesLoading } from "@/lib/store/slices/currenciesSlice"
import { Calendar, AlertCircle, Loader2, Play } from "lucide-react"
import { toast } from "sonner"
import { fetchCurrencies } from "@/lib/store/slices/accountingSlice"

interface PayrollRunFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PayrollRunFormData) => void
  editingRun?: PayrollRun | null
  loading?: boolean
}

// Helper to get default currency id from list
const getDefaultCurrencyId = (currencies: Currency[]) => {
  const def = currencies.find(c => c.isDefault)
  return def ? def.id : currencies[0]?.id || ""
}

export function PayrollRunForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingRun,
  loading 
}: PayrollRunFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const { currencies, currenciesLoading: currenciesLoading } = useAppSelector(state => state.accounting)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PayrollRunFormData>({
    resolver: yupResolver(payrollRunFormSchema),
    defaultValues: editingRun ? {
      name: editingRun.name,
      payPeriod: editingRun.payPeriod,
      startDate: new Date(editingRun.startDate),
      endDate: new Date(editingRun.endDate),
      currencyId: editingRun.currencyId
    } : {
      name: '',
      payPeriod: '',
      startDate: new Date(),
      endDate: new Date(),
      currencyId: ''
    }
  })

    useEffect(() => {
      // Load initial data
      dispatch(fetchCurrencies())
    }, [dispatch])

  // Reset form when editingRun changes
  useEffect(() => {
    if (editingRun) {
      const formData = {
        name: editingRun.name,
        payPeriod: editingRun.payPeriod,
        startDate: new Date(editingRun.startDate),
        endDate: new Date(editingRun.endDate),
        currencyId: editingRun.currencyId
      }
      reset(formData)
    } else {
      reset(prev => ({
        ...prev,
        name: '',
        payPeriod: '',
        startDate: new Date(),
        endDate: new Date(),
        currencyId: ''
      }))
    }
  }, [editingRun, reset])

  

  const handleFormSubmit = async (data: PayrollRunFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      if (!editingRun) {
        reset()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    if (!editingRun) {
      reset()
    }
  }

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <Play className="w-5 h-5" />
            {editingRun ? 'Edit Payroll Run' : 'Create Payroll Run'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editingRun 
              ? 'Update payroll run details and configuration'
              : 'Create a new payroll run for processing employee payments'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Payroll Run Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., March 2024 Payroll"
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
                <Label htmlFor="payPeriod">Pay Period *</Label>
                <Controller
                  name="payPeriod"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., March 2024"
                      className="rounded-full"
                    />
                  )}
                />
                {errors.payPeriod && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.payPeriod.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Pay Period Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      placeholder="Select start date"
                      allowFutureDates={true}
                    />
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
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
            </div>

            {/* Date Range Summary */}
            {startDate && endDate && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Pay Period:</strong> {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Currency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={editingRun ? "gradient-update" : "gradient-create"}
              className="rounded-full h-10 px-6 shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingRun ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingRun ? 'Update Run' : 'Create Run'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
