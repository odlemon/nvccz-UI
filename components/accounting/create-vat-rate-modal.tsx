"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { accountingApi, VatRate } from "@/lib/api/accounting-api"

interface CreateVatRateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vatRate?: VatRate | null
}

export function CreateVatRateModal({ isOpen, onClose, onSuccess, vatRate }: CreateVatRateModalProps) {
  const [formData, setFormData] = useState({ name: "", rateDecimal: "", isActive: true })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!vatRate

  useEffect(() => {
    if (vatRate) {
      setFormData({
        name: vatRate.name,
        rateDecimal: (parseFloat(vatRate.rateDecimal) * 100).toFixed(2),
        isActive: vatRate.isActive,
      })
    } else {
      setFormData({ name: "", rateDecimal: "", isActive: true })
    }
    setErrors({})
  }, [vatRate, isOpen])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name.trim()) e.name = "Name is required"
    const rate = parseFloat(formData.rateDecimal)
    if (isNaN(rate) || rate < 0 || rate > 100) e.rateDecimal = "Enter a valid rate between 0 and 100"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        rateDecimal: parseFloat(formData.rateDecimal) / 100,
        isActive: formData.isActive,
      }
      const response = vatRate
        ? await accountingApi.updateVatRate(vatRate.id, payload)
        : await accountingApi.createVatRate(payload)

      if (response.success) {
        toast.success(`VAT rate ${isEditing ? "updated" : "created"} successfully`)
        onSuccess()
      } else {
        throw new Error(response.error || `Failed to ${isEditing ? "update" : "create"} VAT rate`)
      }
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? "update" : "create"} VAT rate`, { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const set = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit VAT Rate" : "Create VAT Rate"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the VAT rate details below." : "Add a new VAT rate to your accounting system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => set("name", e.target.value)}
                placeholder="e.g. Standard VAT 15%"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateDecimal">Rate (%) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="rateDecimal"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={formData.rateDecimal}
                  onChange={e => set("rateDecimal", e.target.value)}
                  placeholder="e.g. 15"
                  className={errors.rateDecimal ? "border-red-500 pr-8" : "pr-8"}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
              {errors.rateDecimal && <p className="text-sm text-red-500">{errors.rateDecimal}</p>}
              <p className="text-xs text-gray-400">Enter as a percentage, e.g. 15 for 15%</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-gray-500">Whether this rate can be used in transactions</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={v => set("isActive", v)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update VAT Rate" : "Create VAT Rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
