"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AccountingCurrency, CreateCurrencyRequest, accountingApi } from "@/lib/api/accounting-api"
import { cn } from "@/lib/utils"

interface CreateCurrencyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currency?: AccountingCurrency | null
}

export function CreateCurrencyModal({ isOpen, onClose, onSuccess, currency }: CreateCurrencyModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
    isDefault: false,
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!currency

  useEffect(() => {
    if (currency) {
      setFormData({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        isDefault: currency.isDefault,
        isActive: currency.isActive
      })
    } else {
      setFormData({
        code: "",
        name: "",
        symbol: "",
        isDefault: false,
        isActive: true
      })
    }
    setErrors({})
  }, [currency, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = "Currency code is required"
    } else if (formData.code.length < 2 || formData.code.length > 10) {
      newErrors.code = "Currency code must be between 2-10 characters"
    }

    if (!formData.name.trim()) {
      newErrors.name = "Currency name is required"
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = "Currency name must be between 2-100 characters"
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = "Currency symbol is required"
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = "Currency symbol must be less than 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const url = currency 
        ? `/api/accounting/currencies/${currency.id}`
        : '/api/accounting/currencies'
      
      const method = currency ? 'PUT' : 'POST'

      const currencyData = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        symbol: formData.symbol,
        isDefault: formData.isDefault,
        isActive: formData.isActive
      }

      const response = currency 
        ? await accountingApi.updateCurrency(currency.id, currencyData)
        : await accountingApi.createCurrency(currencyData)
      
      if (response.success) {
        toast.success(`Currency ${isEditing ? 'updated' : 'created'} successfully`)
        onSuccess()
      } else {
        throw new Error(response.error || `Failed to ${isEditing ? 'update' : 'create'} currency`)
      }
    } catch (error: any) {
      console.error('Error saving currency:', error)
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} currency`, { 
        description: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Currency' : 'Create New Currency'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the currency details below.'
              : 'Add a new currency to your accounting system.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Currency Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Currency Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="e.g., USD, EUR, ZWL"
                className={cn("rounded-full h-10", errors.code ? 'border-red-500' : '')}
                maxLength={10}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            {/* Currency Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Currency Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., US Dollar, Euro, Zimbabwean Dollar"
                className={cn("rounded-full h-10", errors.name ? 'border-red-500' : '')}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Currency Symbol */}
            <div className="space-y-2">
              <Label htmlFor="symbol">
                Currency Symbol <span className="text-red-500">*</span>
              </Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
                placeholder="e.g., $, €, Z$"
                className={cn("rounded-full h-10", errors.symbol ? 'border-red-500' : '')}
                maxLength={10}
              />
              {errors.symbol && (
                <p className="text-sm text-red-500">{errors.symbol}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-sm text-gray-500">
                  Whether this currency can be used in transactions
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
            </div>

            {/* Default Currency */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Default Currency</Label>
                <p className="text-sm text-gray-500">
                  Set as the primary currency for the system
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-full h-10 px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant={isEditing ? "gradient-update" : "gradient-create"} className="rounded-full h-10 px-6">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Currency' : 'Create Currency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}