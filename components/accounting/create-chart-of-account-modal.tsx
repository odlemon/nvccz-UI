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
import { useAppDispatch } from "@/lib/store"
import { addChartOfAccount, updateChartOfAccount } from "@/lib/store/slices/accountingSlice"
import { accountingApi, ChartOfAccounts, CreateChartOfAccountsRequest } from "@/lib/api/accounting-api"

interface CreateChartOfAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  account?: ChartOfAccounts | null
}

const ACCOUNT_TYPES = [
  'Current Asset',
  'Fixed Asset', 
  'Long-Term Asset',
  'Contra-Asset',
  'Current Liability',
  'Long-Term Liability',
  'Equity',
  'Revenue',
  'Expense',
  'Income'
]

const FINANCIAL_STATEMENTS = [
  'Balance Sheet',
  'Income Statement',
  'Cash Flow',
  'Income Statement / Cash Flow'
]

export function CreateChartOfAccountModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  account 
}: CreateChartOfAccountModalProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateChartOfAccountsRequest>({
    accountNo: '',
    accountName: '',
    accountType: '',
    financialStatement: '',
    notes: '',
    parentId: '',
    isActive: true
  })

  const isEdit = !!account

  useEffect(() => {
    if (account) {
      setFormData({
        accountNo: account.accountNo,
        accountName: account.accountName,
        accountType: account.accountType,
        financialStatement: account.financialStatement,
        notes: account.notes || '',
        parentId: account.parentId || '',
        isActive: account.isActive
      })
    } else {
      setFormData({
        accountNo: '',
        accountName: '',
        accountType: '',
        financialStatement: '',
        notes: '',
        parentId: '',
        isActive: true
      })
    }
  }, [account, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.accountNo.trim() || !formData.accountName.trim() || 
        !formData.accountType || !formData.financialStatement) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    
    try {
      const submitData = {
        ...formData,
        notes: formData.notes || undefined,
        parentId: formData.parentId || undefined
      }
      
      const response = isEdit 
        ? await accountingApi.updateChartOfAccount(account!.id, submitData)
        : await accountingApi.createChartOfAccount(submitData)
      
      if (response.success && response.data) {
        if (isEdit) {
          dispatch(updateChartOfAccount(response.data))
          toast.success("Account updated successfully")
        } else {
          dispatch(addChartOfAccount(response.data))
          toast.success("Account created successfully")
        }
        onSuccess()
      } else {
        throw new Error(response.error || `Failed to ${isEdit ? 'update' : 'create'} account`)
      }
    } catch (error: any) {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} account`, { 
        description: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isEdit ? 'Edit Account' : 'Create New Account'}</span>
              <p className="text-sm text-gray-500 font-normal">
                {isEdit ? 'Update account details' : 'Add a new account to your chart'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Number & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNo">Account No. *</Label>
              <Input
                id="accountNo"
                value={formData.accountNo}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNo: e.target.value }))}
                placeholder="e.g., 1000"
                required
                className="rounded-full h-10 px-4"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                placeholder="e.g., Cash"
                required
                className="rounded-full h-10 px-4"
              />
            </div>
          </div>

          {/* Account Type & Financial Statement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type *</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="financialStatement">Financial Statement *</Label>
              <Select
                value={formData.financialStatement}
                onValueChange={(value) => setFormData(prev => ({ ...prev, financialStatement: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select statement" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCIAL_STATEMENTS.map((statement) => (
                    <SelectItem key={statement} value={statement}>
                      {statement}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this account..."
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Account Status</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <span className="text-sm text-gray-600">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-full h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant={isEdit ? "gradient-update" : "gradient-create"}
              className="flex-1 rounded-full h-10"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}