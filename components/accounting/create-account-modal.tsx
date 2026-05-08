"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calculator, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { accountingApi, ChartOfAccount, CreateChartOfAccountRequest } from "@/lib/api/accounting-api"

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  account?: ChartOfAccount | null
}

const ACCOUNT_TYPES = [
  { value: "Current Asset", label: "Current Asset" },
  { value: "Fixed Asset", label: "Fixed Asset" },
  { value: "Long-Term Asset", label: "Long-Term Asset" },
  { value: "Current Liability", label: "Current Liability" },
  { value: "Long-Term Liability", label: "Long-Term Liability" },
  { value: "Equity", label: "Equity" },
  { value: "Revenue", label: "Revenue" },
  { value: "Expense", label: "Expense" },
  { value: "Income", label: "Income" },
  { value: "Contra-Asset", label: "Contra-Asset" }
]

const FINANCIAL_STATEMENTS = [
  { value: "Balance Sheet", label: "Balance Sheet" },
  { value: "Income Statement", label: "Income Statement" },
  { value: "Cash Flow", label: "Cash Flow" },
  { value: "Cash Flow / Tracking", label: "Cash Flow / Tracking" },
  { value: "Income Statement / Cash Flow", label: "Income Statement / Cash Flow" }
]

export function CreateAccountModal({ isOpen, onClose, onSuccess, account }: CreateAccountModalProps) {
  const [formData, setFormData] = useState<CreateChartOfAccountRequest>({
    accountNo: "",
    accountName: "",
    accountType: "",
    financialStatement: "",
    notes: "",
    parentId: "",
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!account

  useEffect(() => {
    if (isOpen) {
      if (account) {
        setFormData({
          accountNo: account.accountNo,
          accountName: account.accountName,
          accountType: account.accountType,
          financialStatement: account.financialStatement,
          notes: account.notes || "",
          parentId: account.parentId || "",
          isActive: account.isActive
        })
      } else {
        setFormData({
          accountNo: "",
          accountName: "",
          accountType: "",
          financialStatement: "",
          notes: "",
          parentId: "",
          isActive: true
        })
      }
      setErrors({})
    }
  }, [isOpen, account])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.accountNo.trim()) {
      newErrors.accountNo = "Account number is required"
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = "Account name is required"
    }

    if (!formData.accountType) {
      newErrors.accountType = "Account type is required"
    }

    if (!formData.financialStatement) {
      newErrors.financialStatement = "Financial statement is required"
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
        notes: formData.notes?.trim() || undefined,
        parentId: formData.parentId?.trim() || undefined
      }

      let response
      if (isEditing && account) {
        response = await accountingApi.updateChartOfAccount(account.id, payload)
      } else {
        response = await accountingApi.createChartOfAccount(payload)
      }

      if (response.success) {
        toast.success(isEditing ? "Account updated successfully" : "Account created successfully")
        onSuccess()
      } else {
        throw new Error(response.error || 'Failed to save account')
      }
    } catch (error: any) {
      toast.error(isEditing ? "Failed to update account" : "Failed to create account", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateChartOfAccountRequest, value: string | boolean) => {
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
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isEditing ? "Edit Account" : "Create New Account"}</span>
              <p className="text-sm text-gray-500 font-normal">
                {isEditing ? "Update account information" : "Add a new account to your chart of accounts"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Number & Account Name Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNo">Account Number *</Label>
              <Input
                id="accountNo"
                value={formData.accountNo}
                onChange={(e) => handleInputChange("accountNo", e.target.value)}
                placeholder="e.g., 1000"
                disabled={isLoading}
                className={errors.accountNo ? "border-red-500" : ""}
              />
              {errors.accountNo && (
                <p className="text-sm text-red-500">{errors.accountNo}</p>
              )}
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) => handleInputChange("accountName", e.target.value)}
                placeholder="e.g., Cash and Cash Equivalents"
                disabled={isLoading}
                className={errors.accountName ? "border-red-500" : ""}
              />
              {errors.accountName && (
                <p className="text-sm text-red-500">{errors.accountName}</p>
              )}
            </div>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type *</Label>
            <Select
              value={formData.accountType}
              onValueChange={(value) => handleInputChange("accountType", value)}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.accountType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountType && (
              <p className="text-sm text-red-500">{errors.accountType}</p>
            )}
          </div>

          {/* Financial Statement */}
          <div className="space-y-2">
            <Label htmlFor="financialStatement">Financial Statement *</Label>
            <Select
              value={formData.financialStatement}
              onValueChange={(value) => handleInputChange("financialStatement", value)}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.financialStatement ? "border-red-500" : ""}>
                <SelectValue placeholder="Select financial statement" />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_STATEMENTS.map((statement) => (
                  <SelectItem key={statement.value} value={statement.value}>
                    {statement.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.financialStatement && (
              <p className="text-sm text-red-500">{errors.financialStatement}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Optional notes about this account"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-sm text-gray-500">Enable this account for transactions</p>
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
                isEditing ? "Update Account" : "Create Account"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}