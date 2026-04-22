"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FileText, Loader2, CalendarIcon, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AccountingCurrency, Vendor, CreatePurchaseInvoiceRequest, PurchaseInvoice, PurchaseInvoiceItem, VatRate, accountingApi } from "@/lib/api/accounting-api"
import { useAppDispatch } from "@/lib/store"
import { createPurchaseInvoice, updatePurchaseInvoice } from "@/lib/store/slices/purchase-invoices-slice"
import { CreateVendorModal } from "./create-vendor-modal"

interface CreatePurchaseInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onVendorCreated?: () => void | Promise<void>
  currencies: AccountingCurrency[]
  vendors: Vendor[]
  invoice?: PurchaseInvoice | null
}

export function CreatePurchaseInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  onVendorCreated,
  currencies,
  vendors,
  invoice
}: CreatePurchaseInvoiceModalProps) {
  const isEditing = !!invoice
  const dispatch = useAppDispatch()

  const [formData, setFormData] = useState<CreatePurchaseInvoiceRequest>({
    vendorId: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currencyId: "",
    description: "",
    items: [
      {
        itemName: "",
        description: "",
        quantity: "" as any,
        unitPrice: "" as any,
        unit: "",
        vatRate: 0
      }
    ],
    isTaxable: false,
    invoiceNumber: "",
    notes: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeVatRate, setActiveVatRate] = useState<VatRate | null>(null)
  const [isVatLoading, setIsVatLoading] = useState(false)
  const [isCreateVendorModalOpen, setIsCreateVendorModalOpen] = useState(false)

  useEffect(() => {
    const defaultCurrency = currencies.find(c => c.isDefault) || currencies[0]
    if (defaultCurrency && !formData.currencyId) {
      setFormData(prev => ({ ...prev, currencyId: defaultCurrency.id }))
    }
  }, [currencies, formData.currencyId])

  useEffect(() => {
    if (isOpen) {
      if (isEditing && invoice) {
        setFormData({
          vendorId: invoice.vendorId,
          invoiceDate: invoice.invoiceDate.split('T')[0],
          dueDate: invoice.dueDate.split('T')[0],
          currencyId: invoice.currencyId,
          description: invoice.description,
          items: invoice.items.length > 0 ? invoice.items : [{ itemName: "", description: "", quantity: 1, unitPrice: 0, unit: "pcs", vatRate: 0 }],
          isTaxable: invoice.isTaxable,
          invoiceNumber: invoice.invoiceNumber,
          notes: invoice.notes
        })
      } else {
        setFormData({
          vendorId: "",
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          currencyId: currencies.find(c => c.isDefault)?.id || currencies[0]?.id || "",
          description: "",
          items: [{ itemName: "", description: "", quantity: "" as any, unitPrice: "" as any, unit: "", vatRate: 0 }],
          isTaxable: false,
          invoiceNumber: "",
          notes: ""
        })
      }
      setErrors({})
    }
  }, [isOpen, currencies, isEditing, invoice])

  useEffect(() => {
    if (!isOpen) return
    if (!formData.isTaxable) return
    if (activeVatRate) return

    let cancelled = false
    setIsVatLoading(true)
    accountingApi.getActiveVatRate()
      .then(res => {
        if (cancelled) return
        if (res.success && res.data) {
          setActiveVatRate(res.data)
        } else {
          toast.error("No active VAT rate configured", {
            description: "Set one in Accounting Settings → VAT Rates."
          })
        }
      })
      .catch(err => {
        if (cancelled) return
        toast.error("Failed to load active VAT rate", {
          description: err?.message || 'Unknown error'
        })
      })
      .finally(() => {
        if (!cancelled) setIsVatLoading(false)
      })

    return () => { cancelled = true }
  }, [isOpen, formData.isTaxable, activeVatRate])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.vendorId) newErrors.vendorId = "Please select a vendor"
    if (!formData.currencyId) newErrors.currencyId = "Please select a currency"
    if (!formData.description.trim()) newErrors.description = "Please enter a description"
    if (!formData.invoiceDate) newErrors.invoiceDate = "Please select an invoice date"
    if (!formData.dueDate) newErrors.dueDate = "Please select a due date"

    if (formData.items.length === 0) {
      newErrors.items = "Please add at least one item"
    } else {
      const hasInvalidItems = formData.items.some(item =>
        !item.itemName.trim() || !item.description.trim() || !item.unit ||
        (item.quantity as any) === "" || Number(item.quantity) <= 0 ||
        (item.unitPrice as any) === "" || Number(item.unitPrice) <= 0
      )
      if (hasInvalidItems) {
        newErrors.items = "All items must have name, description, unit, valid quantity, and price"
      }
    }

    if (formData.isTaxable && !activeVatRate) {
      newErrors.vatRate = "No active VAT rate available"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const activeRateDecimal = activeVatRate ? Number(activeVatRate.rateDecimal) : 0

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => total + (Number(item.quantity) * Number(item.unitPrice)), 0)
  }

  const calculateVAT = () => {
    if (!formData.isTaxable || !activeVatRate) return 0
    return calculateSubtotal() * activeRateDecimal
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const payload: CreatePurchaseInvoiceRequest = {
      ...formData,
      items: formData.items.map(item => ({
        itemName: item.itemName,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        unit: item.unit,
        vatRate: 0
      }))
    }

    setIsLoading(true)
    try {
      if (isEditing && invoice) {
        await dispatch(updatePurchaseInvoice({ id: invoice.id, data: payload })).unwrap()
        toast.success("Purchase invoice updated successfully")
      } else {
        await dispatch(createPurchaseInvoice(payload)).unwrap()
        toast.success("Purchase invoice created successfully")
      }
      onSuccess()
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} purchase invoice`, {
        description: error.message || 'Unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreatePurchaseInvoiceRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleItemChange = (index: number, field: keyof PurchaseInvoiceItem, value: any) => {
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
      items: [...prev.items, { itemName: "", description: "", quantity: "" as any, unitPrice: "" as any, unit: "", vatRate: 0 }]
    }))
  }

  const handleCreateVendorSuccess = async () => {
    setIsCreateVendorModalOpen(false)
    if (onVendorCreated) {
      await onVendorCreated()
    }
    toast.success("Vendor created. You can now select them from the list.")
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, items: newItems }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isEditing ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update purchase invoice details' : 'Create a new vendor purchase invoice'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor & Currency Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="vendorId">Vendor *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => setIsCreateVendorModalOpen(true)}
                  disabled={isLoading}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Vendor
                </Button>
              </div>
              <Select
                value={formData.vendorId}
                onValueChange={(value) => handleInputChange("vendorId", value)}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.vendorId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors && vendors.length > 0 ? (
                    vendors.filter(v => v.isActive).map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No vendors available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.vendorId && (
                <p className="text-sm text-red-500">{errors.vendorId}</p>
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

          {/* Invoice Date & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 rounded-full border-gray-300 bg-white px-4 justify-start text-left font-normal",
                      !formData.invoiceDate && "text-muted-foreground",
                      errors.invoiceDate && "border-red-500"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.invoiceDate ? (
                      format(new Date(formData.invoiceDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.invoiceDate ? new Date(formData.invoiceDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange("invoiceDate", format(date, "yyyy-MM-dd"))
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.invoiceDate && (
                <p className="text-sm text-red-500">{errors.invoiceDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 rounded-full border-gray-300 bg-white px-4 justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground",
                      errors.dueDate && "border-red-500"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(new Date(formData.dueDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange("dueDate", format(date, "yyyy-MM-dd"))
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate}</p>
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
              placeholder="Describe the purchase..."
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
            
            {/* Table Headings */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
              <div className="col-span-3">Item Name</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-1">Unit</div>
              <div className="col-span-1">Action</div>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-4 border rounded-lg">
                  <div className="col-span-3">
                    <Input
                      placeholder="Item name"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value === "" ? "" : parseInt(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", e.target.value === "" ? "" : parseFloat(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-1">
                    <Select
                      value={item.unit}
                      onValueChange={(value) => handleItemChange(index, "unit", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                        <SelectItem value="set">set</SelectItem>
                        <SelectItem value="unit">unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => removeItem(index)}
                      disabled={isLoading || formData.items.length === 1}
                      className="h-9 w-9 rounded-full border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 disabled:opacity-40"
                      title={formData.items.length === 1 ? "At least one item required" : "Remove item"}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {errors.items && (
              <p className="text-sm text-red-500">{errors.items}</p>
            )}
          </div>

          {/* Taxable Status & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="isTaxable">Taxable Invoice</Label>
                <p className="text-sm text-gray-500">
                  {formData.isTaxable
                    ? (isVatLoading
                        ? "Loading active VAT rate…"
                        : activeVatRate
                          ? `VAT will be applied at ${(activeRateDecimal * 100).toFixed(2)}% (${activeVatRate.name})`
                          : "No active VAT rate set — check Accounting Settings")
                    : "VAT/Tax will not be calculated"}
                </p>
              </div>
              <Switch
                id="isTaxable"
                checked={formData.isTaxable}
                onCheckedChange={(checked) => handleInputChange("isTaxable", checked)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes..."
                disabled={isLoading}
                rows={2}
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Subtotal:</span>
              <span className="font-medium">
                {currencies.find(c => c.id === formData.currencyId)?.symbol || '$'}{calculateSubtotal().toFixed(2)}
              </span>
            </div>
            {formData.isTaxable && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    VAT {activeVatRate ? `(${(activeRateDecimal * 100).toFixed(2)}%)` : ""}:
                  </span>
                  <span className="font-medium">
                    {currencies.find(c => c.id === formData.currencyId)?.symbol || '$'}{calculateVAT().toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  The subtotal is submitted; VAT is calculated on the backend using the active rate.
                </p>
              </>
            )}
            <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t">
              <span>Total Amount{formData.isTaxable ? " (incl. VAT)" : ""}:</span>
              <span className="text-green-600">
                {currencies.find(c => c.id === formData.currencyId)?.symbol || '$'}{calculateTotal().toFixed(2)}
              </span>
            </div>
            {errors.vatRate && (
              <p className="text-sm text-red-500">{errors.vatRate}</p>
            )}
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
              className="rounded-full px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200"
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

      <CreateVendorModal
        isOpen={isCreateVendorModalOpen}
        onClose={() => setIsCreateVendorModalOpen(false)}
        onSuccess={handleCreateVendorSuccess}
      />
    </Dialog>
  )
}
