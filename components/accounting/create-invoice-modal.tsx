"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FileText, Loader2, CalendarIcon, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AccountingCurrency, CreateInvoiceRequest, Invoice, InvoiceItem, accountingApi } from "@/lib/api/accounting-api"
import { CreateCustomerModal } from "./create-customer-modal"

type InvoiceCustomerOption = {
  id: string
  name: string
  isActive: boolean
}

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onCustomerCreated?: () => void | Promise<void>
  currencies: AccountingCurrency[]
  customers: InvoiceCustomerOption[]
  invoice?: Invoice | null // For editing
}

export function CreateInvoiceModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onCustomerCreated,
  currencies,
  customers,
  invoice 
}: CreateInvoiceModalProps) {
  const isEditing = !!invoice
  
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    customerId: "",
    amount: 0,
    currencyId: "",
    transactionDate: new Date().toISOString().split('T')[0],
    description: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    isTaxable: true,
    items: [
      {
        description: "",
        amount: 0,
        category: ""
      }
    ]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false)
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
      if (isEditing && invoice) {
        // Populate form with invoice data for editing
        setFormData({
          customerId: invoice.customerId,
          amount: parseFloat(invoice.amount),
          currencyId: invoice.currencyId,
          transactionDate: invoice.transactionDate.split('T')[0],
          description: invoice.description,
          invoiceDate: invoice.transactionDate.split('T')[0],
          isTaxable: invoice.isTaxable,
          items: invoice.items.length > 0 ? invoice.items.map(i => ({
            description: i.description || "",
            amount: i.amount || 0,
            category: i.category || "",
            quantity: i.quantity || 1,
            unitPrice: i.unitPrice || 0,
          })) : [{ description: "", amount: 0, category: "", quantity: 1, unitPrice: 0 }]
        })
      } else {
        // Reset form for creating new invoice
        setFormData({
          customerId: "",
          amount: 0,
          currencyId: currencies.find(c => c.isDefault)?.id || currencies[0]?.id || "",
          transactionDate: new Date().toISOString().split('T')[0],
          description: "",
          invoiceDate: new Date().toISOString().split('T')[0],
          isTaxable: true,
          items: [{ description: "", amount: 0, category: "", quantity: 1, unitPrice: 0 }]
        })
      }
      setErrors({})
    }
  }, [isOpen, currencies, isEditing, invoice])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = "Please select a customer"
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

    if (formData.items.length === 0) {
      newErrors.items = "Please add at least one item"
    } else {
      const hasInvalidItems = formData.items.some(item => !item.description.trim() || (item.amount || 0) <= 0)
      if (hasInvalidItems) {
        newErrors.items = "All items must have description and valid amount"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateTotalAmount = () => {
    return formData.items.reduce((total, item) => total + (item.amount || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const totalAmount = calculateTotalAmount()
    const submitData = {
      ...formData,
      amount: totalAmount
    }

    setIsLoading(true)
    try {
      if (isEditing && invoice) {
        await accountingApi.updateInvoice(invoice.id, submitData)
        toast.success("Invoice updated successfully")
      } else {
        await accountingApi.createInvoice(submitData)
        toast.success("Invoice created successfully")
      }
      onSuccess()
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} invoice`, {
        description: error.message || 'Unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateInvoiceRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, items: newItems }))
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: "" }))
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", amount: 0, category: "", quantity: 1, unitPrice: 0 }]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, items: newItems }))
    }
  }

  const handleCreateCustomerSuccess = async () => {
    setIsCreateCustomerModalOpen(false)
    if (onCustomerCreated) {
      await onCustomerCreated()
    }
    toast.success("Customer created. You can now select them from the list.")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update invoice details' : 'Create a new customer invoice'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & Currency Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => setIsCreateCustomerModalOpen(true)}
                  disabled={isLoading}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create Customer
                </Button>
              </div>
              <Select
                value={formData.customerId}
                onValueChange={(value) => handleInputChange("customerId", value)}
                disabled={isLoading || !customers || customers.length === 0}
              >
                <SelectTrigger className={errors.customerId ? "border-red-500" : ""}>
                  <SelectValue placeholder={
                    !customers || customers.length === 0 
                      ? "Loading customers..." 
                      : "Select customer"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {customers && customers.length > 0 ? (
                    customers.filter(c => c.isActive).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No customers available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-red-500">{errors.customerId}</p>
              )}
              {(!customers || customers.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  No customers yet. Click "Create Customer" to add one without leaving this form.
                </p>
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
                  {currencies && currencies.length > 0 ? (
                    currencies.filter(c => c.isActive).map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No currencies available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.currencyId && (
                <p className="text-sm text-red-500">{errors.currencyId}</p>
              )}
            </div>
          </div>

          {/* Transaction Date & Invoice Number */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Transaction Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the invoice..."
              disabled={isLoading}
              rows={2}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Invoice Items *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                disabled={isLoading}
                className="rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-4 border rounded-lg">
                  <div className="col-span-4">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Category"
                      value={item.category || ""}
                      onChange={(e) => handleItemChange(index, "category", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity || 1}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1
                        const newItems = [...formData.items]
                        newItems[index] = { ...newItems[index], quantity: qty, amount: qty * (item.unitPrice || 0) }
                        setFormData(prev => ({ ...prev, items: newItems }))
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit Price"
                      value={item.unitPrice || ""}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0
                        const newItems = [...formData.items]
                        newItems[index] = { ...newItems[index], unitPrice: price, amount: (item.quantity || 1) * price }
                        setFormData(prev => ({ ...prev, items: newItems }))
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount"
                      value={item.amount || ""}
                      onChange={(e) => handleItemChange(index, "amount", parseFloat(e.target.value) || 0)}
                      disabled={isLoading}
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeItem(index)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {errors.items && (
              <p className="text-sm text-red-500">{errors.items}</p>
            )}
          </div>

          {/* Taxable Status */}
          {/* <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isTaxable">Taxable Invoice</Label>
              <p className="text-sm text-gray-500">Include VAT/Tax calculations</p>
            </div>
            <Switch
              id="isTaxable"
              checked={formData.isTaxable}
              onCheckedChange={(checked) => handleInputChange("isTaxable", checked)}
              disabled={isLoading}
            />
          </div> */}

          {/* Total Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-green-600">
                {currencies.find(c => c.id === formData.currencyId)?.symbol || '$'}{calculateTotalAmount().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Invoice' : 'Create Invoice'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      <CreateCustomerModal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        onSuccess={handleCreateCustomerSuccess}
      />
    </Dialog>
  )
}