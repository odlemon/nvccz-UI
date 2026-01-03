"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { accountingApi } from "@/lib/api/accounting-api"
import { setCurrencies, setCurrenciesError, setCurrenciesLoading } from "@/lib/store/slices/accountingSlice"
import type { LeaveBalance } from "@/lib/api/payroll-api"

export interface LeaveBalanceFormData {
  employeeId: string
  leaveType: string
  balance: number
  currencyId: string
}

interface LeaveBalanceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LeaveBalanceFormData) => Promise<void> | void
  editing?: LeaveBalance | null
  employeeId: string
}

const getDefaultCurrencyId = (currencies: { id: string; isDefault: boolean }[]) => {
  const def = currencies.find(c => c.isDefault)
  return def ? def.id : currencies[0]?.id || ""
}

export function LeaveBalanceForm({ isOpen, onClose, onSubmit, editing, employeeId }: LeaveBalanceFormProps) {
  const dispatch = useAppDispatch()
  const { currencies, currenciesLoading } = useAppSelector(state => state.accounting)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<LeaveBalanceFormData>({
    defaultValues: editing ? {
      employeeId: editing.employeeId,
      leaveType: editing.leaveType,
      balance: parseFloat(editing.balance),
      currencyId: editing.currencyId,
    } : {
      employeeId,
      leaveType: "Annual Leave",
      balance: 0,
      currencyId: "",
    }
  })

  useEffect(() => {
    if (editing) {
      reset({
        employeeId: editing.employeeId,
        leaveType: editing.leaveType,
        balance: parseFloat(editing.balance),
        currencyId: editing.currencyId,
      })
    } else {
      reset(prev => ({ ...prev, employeeId, leaveType: "Annual Leave", balance: 0, currencyId: prev.currencyId || "" }))
    }
  }, [editing, employeeId, reset])

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        dispatch(setCurrenciesLoading(true))
        dispatch(setCurrenciesError(null))
        const response = await accountingApi.getCurrencies()
        if (response.success && response.data) {
          dispatch(setCurrencies(response.data))
          if (!editing) {
            reset(prev => ({ ...prev, currencyId: getDefaultCurrencyId(response.data || []) }))
          }
        } else {
          dispatch(setCurrenciesError('Failed to load currencies'))
        }
      } catch (e: any) {
        dispatch(setCurrenciesError(e?.message || 'Failed to load currencies'))
      } finally {
        dispatch(setCurrenciesLoading(false))
      }
    }
    if (!currencies || currencies.length === 0) loadCurrencies()
    else if (!editing) reset(prev => ({ ...prev, currencyId: getDefaultCurrencyId(currencies) }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (data: LeaveBalanceFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      if (!editing) reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    if (!editing) reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            {editing ? 'Edit Leave Balance' : 'Create Leave Balance'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editing ? 'Update leave balance details' : 'Set leave balance for this employee'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Controller
                name="leaveType"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., Annual Leave" className="rounded-full" />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Balance *</Label>
              <Controller
                name="balance"
                control={control}
                rules={{ required: true, min: 0 }}
                render={({ field }) => (
                  <Input {...field} type="number" step="0.1" placeholder="e.g., 21" className="rounded-full" onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currencyId">Currency *</Label>
              <Controller
                name="currencyId"
                control={control}
                rules={{ required: true }}
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
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editing ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


