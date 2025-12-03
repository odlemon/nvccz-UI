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
import { salaryStructureFormSchema, SalaryStructureFormData } from "@/lib/validations/payroll"
import { SalaryStructure, AllowanceType, allowanceTypesApi } from "@/lib/api/payroll-api"
import { DollarSign, Calendar, AlertCircle, Loader2 } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/store"
import { accountingApi } from "@/lib/api/accounting-api"
import { setCurrencies, setCurrenciesError, setCurrenciesLoading } from "@/lib/store/slices/currenciesSlice"
import { toast } from "sonner"

interface SalaryStructureFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SalaryStructureFormData) => void
  editingStructure?: SalaryStructure | null
  employeeId: string
  loading?: boolean
}

const getDefaultCurrencyId = (currencies: { id: string; isDefault: boolean }[]) => {
  const def = currencies.find(c => c.isDefault)
  return def ? def.id : currencies[0]?.id || ""
}

export function SalaryStructureForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingStructure, 
  employeeId,
  loading 
}: SalaryStructureFormProps) {
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([])
  const [loadingAllowanceTypes, setLoadingAllowanceTypes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const { items: currencies, loading: currenciesLoading } = useAppSelector(state => state.currencies)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<SalaryStructureFormData>({
    resolver: yupResolver(salaryStructureFormSchema),
    defaultValues: editingStructure ? {
      employeeId: editingStructure.employeeId,
      allowanceTypeId: editingStructure.allowanceTypeId,
      amount: parseFloat(editingStructure.amount),
      currencyId: editingStructure.currencyId,
      effectiveDate: new Date(editingStructure.effectiveDate),
      endDate: editingStructure.endDate ? new Date(editingStructure.endDate) : null
    } : {
      employeeId: employeeId,
      allowanceTypeId: '',
      amount: 0,
      currencyId: '',
      effectiveDate: new Date(),
      endDate: null
    }
  })

  // Load allowance types when form opens
  useEffect(() => {
    if (isOpen) {
      loadAllowanceTypes()
    }
  }, [isOpen])

  // Reset form when editingStructure changes
  useEffect(() => {
    if (editingStructure) {
      const formData = {
        employeeId: editingStructure.employeeId,
        allowanceTypeId: editingStructure.allowanceTypeId,
        amount: parseFloat(editingStructure.amount),
        currencyId: editingStructure.currencyId,
        effectiveDate: new Date(editingStructure.effectiveDate),
        endDate: editingStructure.endDate ? new Date(editingStructure.endDate) : null
      }
      reset(formData)
    } else {
      reset(prev => ({
        ...prev,
        employeeId: employeeId,
        allowanceTypeId: '',
        amount: 0,
        currencyId: '',
        effectiveDate: new Date(),
        endDate: null
      }))
    }
  }, [editingStructure, employeeId, reset])

  const loadAllowanceTypes = async () => {
    try {
      setLoadingAllowanceTypes(true)
      const response = await allowanceTypesApi.getAll()
      if (response.success && response.data) {
        setAllowanceTypes(response.data)
      } else {
        toast.error('Failed to load allowance types')
      }
    } catch (error) {
      console.error('Error loading allowance types:', error)
      toast.error('Failed to load allowance types')
    } finally {
      setLoadingAllowanceTypes(false)
    }
  }

  const handleFormSubmit = async (data: SalaryStructureFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      if (!editingStructure) {
        reset()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load currencies once
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        dispatch(setCurrenciesLoading(true))
        dispatch(setCurrenciesError(null))
        const res = await accountingApi.currencies.getAll()
        const list = res.data || []
        dispatch(setCurrencies(list))
        if (!editingStructure) {
          // set default
          reset(prev => ({ ...prev, currencyId: getDefaultCurrencyId(list) }))
        }
      } catch (e: any) {
        dispatch(setCurrenciesError(e?.message || 'Failed to load currencies'))
      } finally {
        dispatch(setCurrenciesLoading(false))
      }
    }
    if (!currencies || currencies.length === 0) {
      loadCurrencies()
    } else if (!editingStructure) {
      reset(prev => ({ ...prev, currencyId: getDefaultCurrencyId(currencies) }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => {
    onClose()
    if (!editingStructure) {
      reset()
    }
  }

  const selectedAllowanceTypeId = watch('allowanceTypeId')
  const selectedAllowanceType = allowanceTypes.find(type => type.id === selectedAllowanceTypeId)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <DollarSign className="w-5 h-5" />
            {editingStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editingStructure 
              ? 'Update salary structure allowance details'
              : 'Assign allowance to employee with amount and effective dates'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Allowance Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Allowance Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowanceTypeId">Allowance Type *</Label>
                <Controller
                  name="allowanceTypeId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={loadingAllowanceTypes}>
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder={loadingAllowanceTypes ? "Loading allowance types..." : "Choose allowance type..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {allowanceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{type.name}</span>
                              <span className="text-sm text-gray-500">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.allowanceTypeId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.allowanceTypeId.message}
                  </p>
                )}
              </div>

              {selectedAllowanceType && (
                <div className="space-y-2">
                  <Label>Selected Allowance</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="font-medium text-gray-900">
                      {selectedAllowanceType.name}
                    </div>
                    <div className="text-sm text-gray-600">{selectedAllowanceType.description}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Taxable: {selectedAllowanceType.isTaxable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Amount & Currency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="e.g., 500.00"
                      className="rounded-full"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.amount && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.amount.message}
                  </p>
                )}
              </div>

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

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Effective Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Controller
                  name="effectiveDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
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
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      placeholder="Select end date (optional)"
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
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
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
              className="gradient-primary"
              disabled={isSubmitting || loadingAllowanceTypes}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingStructure ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingStructure ? 'Update Structure' : 'Create Structure'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
