"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Users, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { accountingApi, Customer, CreateCustomerRequest } from "@/lib/api/accounting-api"

interface CreateCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customer?: Customer | null
}

export function CreateCustomerModal({ isOpen, onClose, onSuccess, customer }: CreateCustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: "",
    taxNumber: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    paymentTerms: "",
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!customer

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          name: customer.name,
          taxNumber: customer.taxNumber || "",
          contactPerson: customer.contactPerson || "",
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          paymentTerms: customer.paymentTerms || "",
          isActive: customer.isActive
        })
      } else {
        setFormData({
          name: "",
          taxNumber: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
          paymentTerms: "",
          isActive: true
        })
      }
      setErrors({})
    }
  }, [isOpen, customer])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        taxNumber: formData.taxNumber?.trim() || undefined,
        contactPerson: formData.contactPerson?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        paymentTerms: formData.paymentTerms?.trim() || undefined
      }

      let response
      if (isEditing && customer) {
        response = await accountingApi.updateCustomer(customer.id, payload)
      } else {
        response = await accountingApi.createCustomer(payload)
      }

      if (response.success) {
        toast.success(isEditing ? "Customer updated successfully" : "Customer created successfully")
        onSuccess()
      } else {
        throw new Error(response.error || 'Failed to save customer')
      }
    } catch (error: any) {
      toast.error(isEditing ? "Failed to update customer" : "Failed to create customer", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateCustomerRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isEditing ? "Edit Customer" : "Create New Customer"}</span>
              <p className="text-sm text-gray-500 font-normal">
                {isEditing ? "Update customer information" : "Add a new customer to your database"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name & Contact Person Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., ABC Company Ltd"
                disabled={isLoading}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                placeholder="e.g., John Smith"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email & Phone Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="e.g., contact@company.com"
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="e.g., +263 4 123 456"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Tax Number & Payment Terms Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tax Number */}
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Tax Number</Label>
              <Input
                id="taxNumber"
                value={formData.taxNumber}
                onChange={(e) => handleInputChange("taxNumber", e.target.value)}
                placeholder="e.g., TAX123456789"
                disabled={isLoading}
              />
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                placeholder="e.g., Net 30"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Customer's physical address"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-sm text-gray-500">Enable this customer for transactions</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
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
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Customer" : "Create Customer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}