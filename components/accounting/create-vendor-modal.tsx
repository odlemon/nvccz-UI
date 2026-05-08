"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Building, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { accountingApi, Vendor, CreateVendorRequest } from "@/lib/api/accounting-api"

interface CreateVendorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vendor?: Vendor | null
}

export function CreateVendorModal({ isOpen, onClose, onSuccess, vendor }: CreateVendorModalProps) {
  const [formData, setFormData] = useState<CreateVendorRequest>({
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

  const isEditing = !!vendor

  useEffect(() => {
    if (isOpen) {
      if (vendor) {
        setFormData({
          name: vendor.name,
          taxNumber: vendor.taxNumber || "",
          contactPerson: vendor.contactPerson || "",
          email: vendor.email || "",
          phone: vendor.phone || "",
          address: vendor.address || "",
          paymentTerms: vendor.paymentTerms || "",
          isActive: vendor.isActive
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
  }, [isOpen, vendor])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Vendor name is required"
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
      if (isEditing && vendor) {
        response = await accountingApi.updateVendor(vendor.id, payload)
      } else {
        response = await accountingApi.createVendor(payload)
      }

      if (response.success) {
        toast.success(isEditing ? "Vendor updated successfully" : "Vendor created successfully")
        onSuccess()
      } else {
        throw new Error(response.error || 'Failed to save vendor')
      }
    } catch (error: any) {
      toast.error(isEditing ? "Failed to update vendor" : "Failed to create vendor", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateVendorRequest, value: string | boolean) => {
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
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isEditing ? "Edit Vendor" : "Create New Vendor"}</span>
              <p className="text-sm text-gray-500 font-normal">
                {isEditing ? "Update vendor information" : "Add a new vendor to your database"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Name & Contact Person Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Vendor Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Office Supplies Ltd"
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
                placeholder="e.g., contact@vendor.com"
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
              placeholder="Vendor's physical address"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-sm text-gray-500">Enable this vendor for transactions</p>
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
                isEditing ? "Update Vendor" : "Create Vendor"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}