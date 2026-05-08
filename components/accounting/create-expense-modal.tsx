"use client"

import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Receipt, Loader2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createExpense, updateExpense } from "@/lib/store/slices/accountingSlice"
import { AccountingCurrency, Vendor, ExpenseCategory, CreateExpenseRequest, Expense } from "@/lib/api/accounting-api"
import type { AppDispatch } from "@/lib/store"

interface CreateExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currencies: AccountingCurrency[]
  vendors: Vendor[]
  categories: ExpenseCategory[]
  expense?: Expense | null // For editing
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Credit/Debit Card' },
  { value: 'CHEQUE', label: 'Cheque' }
] as const

export function CreateExpenseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currencies,
  vendors,
  categories,
  expense 
}: CreateExpenseModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const isEditing = !!expense
  
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    vendorId: "",
    categoryId: "",
    amount: 0,
    currencyId: "",
    transactionDate: new Date().toISOString().split('T')[0],
    description: "",
    receiptNumber: "",
    isTaxable: true,
    paymentMethod: "BANK" as const,
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get default currency
  useEffect(() => {
    const defaultCurrency = currencies.find(c => c.isDefault) || currencies[0]
    if (defaultCurrency && !formData.currencyId) {
      setFormData(prev => ({ ...prev, currencyId: defaultCurrency.id }))
    }
  }, [currencies, formData.currencyId])

  useEffect(() => {
    if (isOpen) {
      if (isEditing && expense) {
        // Populate form with expense data for editing
        setFormData({
          vendorId: expense.vendorId,
          categoryId: expense.categoryId,
          amount: parseFloat(expense.amount),
          currencyId: expense.currencyId,
          transactionDate: expense.transactionDate.split('T')[0],
          description: expense.description,
          receiptNumber: expense.receiptNumber || "",
          isTaxable: expense.isTaxable,
          paymentMethod: expense.paymentMethod,
          isActive: expense.isActive
        })
      } else {
        // Reset form for creating new expense
        setFormData({
          vendorId: "",
          categoryId: "",
          amount: 0,
          currencyId: currencies.find(c => c.isDefault)?.id || currencies[0]?.id || "",
          transactionDate: new Date().toISOString().split('T')[0],
          description: "",
          receiptNumber: "",
          isTaxable: true,
          paymentMethod: "BANK",
          isActive: true
        })
      }
      setErrors({})
    }
  }, [isOpen, currencies, isEditing, expense])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.vendorId) {
      newErrors.vendorId = "Please select a vendor"
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = "Please select a category"
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }
    
    if (!formData.currencyId) {
      newErrors.currencyId = "Please select a currency"
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Please enter a description"
    }
    
    if (!formData.transactionDate) {
      newErrors.transactionDate = "Please select a transaction date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      if (isEditing && expense) {
        await dispatch(updateExpense({ id: expense.id, data: formData })).unwrap()
        toast.success("Expense updated successfully")
      } else {
        await dispatch(createExpense(formData)).unwrap()
        toast.success("Expense created successfully")
      }
      onSuccess()
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} expense`, {
        description: error.message || 'Unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateExpenseRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isEditing ? 'Edit Expense' : 'Create New Expense'}</span>
              <p className="text-sm text-gray-500 font-normal">
                {isEditing ? 'Update expense details' : 'Record a new business expense'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor & Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor *</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(value) => handleInputChange("vendorId", value)}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.vendorId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.filter(v => v.isActive).map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorId && (
                <p className="text-sm text-red-500">{errors.vendorId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleInputChange("categoryId", value)}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.isActive).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-500">{errors.categoryId}</p>
              )}
            </div>
          </div>

          {/* Amount & Currency Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ""}
                onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                disabled={isLoading}
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyId">Currency *</Label>
              <Select
                value={formData.currencyId}
                onValueChange={(value) => handleInputChange("currencyId", value)}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.currencyId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.filter(c => c.isActive).map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currencyId && (
                <p className="text-sm text-red-500">{errors.currencyId}</p>
              )}
            </div>
          </div>

          {/* Transaction Date & Payment Method Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Transaction Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-full h-10 px-4",
                      !formData.transactionDate && "text-muted-foreground",
                      errors.transactionDate && "border-red-500"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.transactionDate ? (
                      format(new Date(formData.transactionDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.transactionDate ? new Date(formData.transactionDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange("transactionDate", format(date, "yyyy-MM-dd"))
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.transactionDate && (
                <p className="text-sm text-red-500">{errors.transactionDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange("paymentMethod", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description & Receipt Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the expense..."
                disabled={isLoading}
                rows={3}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input
                id="receiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => handleInputChange("receiptNumber", e.target.value)}
                placeholder="e.g., INV-001"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Taxable Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isTaxable">Taxable Expense</Label>
              <p className="text-sm text-gray-500">Include VAT/Tax calculations</p>
            </div>
            <Switch
              id="isTaxable"
              checked={formData.isTaxable}
              onCheckedChange={(checked) => handleInputChange("isTaxable", checked)}
              disabled={isLoading}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full px-6 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              variant={isEditing ? "gradient-update" : "gradient-create"}
              className="rounded-full px-6 h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Expense' : 'Create Expense'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}