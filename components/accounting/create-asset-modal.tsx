"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { RootState } from "@/lib/store/store"
import { accountingApi } from "@/lib/api/accounting-api"

interface CreateAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateAssetModal({ isOpen, onClose, onSuccess }: CreateAssetModalProps) {
  const { chartOfAccounts } = useSelector((state: RootState) => state.accounting)
  const [loading, setLoading] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date())
  
  const [formData, setFormData] = useState({
    assetName: '',
    assetCode: '',
    description: '',
    cost: '',
    usefulLifeYears: 5,
    depreciationMethod: 'STRAIGHT_LINE',
    assetAccountId: '',
    accumulatedDepreciationAccountId: '',
    depreciationExpenseAccountId: '',
    location: '',
    vendor: ''
  })

  const resetForm = () => {
    setFormData({
      assetName: '',
      assetCode: '',
      description: '',
      cost: '',
      usefulLifeYears: 5,
      depreciationMethod: 'STRAIGHT_LINE',
      assetAccountId: '',
      accumulatedDepreciationAccountId: '',
      depreciationExpenseAccountId: '',
      location: '',
      vendor: ''
    })
    setPurchaseDate(new Date())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.assetName || !formData.assetCode || !formData.cost) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!formData.assetAccountId || !formData.accumulatedDepreciationAccountId || !formData.depreciationExpenseAccountId) {
      toast.error('Please select all required accounts')
      return
    }

    try {
      setLoading(true)
      
      const assetData = {
        ...formData,
        cost: parseFloat(formData.cost),
        purchaseDate: format(purchaseDate, 'yyyy-MM-dd')
      }

      const response = await accountingApi.createAsset(assetData)
      
      if (response.success) {
        toast.success('Asset created successfully')
        resetForm()
        onSuccess()
      } else {
        toast.error(response.error || 'Failed to create asset')
      }
    } catch (error: any) {
      toast.error('Failed to create asset')
    } finally {
      setLoading(false)
    }
  }

  const assetAccounts = chartOfAccounts.filter(account => 
    account.accountType === 'Fixed Asset' || account.accountType === 'Current Asset'
  )
  const depreciationAccounts = chartOfAccounts.filter(account => 
    account.accountType === 'Contra-Asset'
  )
  const expenseAccounts = chartOfAccounts.filter(account => 
    account.accountType === 'Expense'
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden overflow-y-auto rounded-2xl">
        <DialogHeader>/
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Create New Asset
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assetName">Asset Name *</Label>
              <Input
                id="assetName"
                value={formData.assetName}
                onChange={(e) => setFormData({...formData, assetName: e.target.value})}
                required
                className="rounded-full"
              />
            </div>
            <div>
              <Label htmlFor="assetCode">Asset Code *</Label>
              <Input
                id="assetCode"
                value={formData.assetCode}
                onChange={(e) => setFormData({...formData, assetCode: e.target.value})}
                required
                className="rounded-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="rounded-2xl"
            />
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cost">Purchase Cost *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                required
                className="rounded-full"
              />
            </div>
            <div>
              <Label htmlFor="usefulLife">Useful Life (Years) *</Label>
              <Input
                id="usefulLife"
                type="number"
                min="1"
                value={formData.usefulLifeYears}
                onChange={(e) => setFormData({...formData, usefulLifeYears: parseInt(e.target.value)})}
                required
                className="rounded-full"
              />
            </div>
            <div>
              <Label>Purchase Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-full",
                      !purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={(date) => date && setPurchaseDate(date)}
                    initialFocus
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Depreciation Method</Label>
            <Select 
              value={formData.depreciationMethod} 
              onValueChange={(value) => setFormData({...formData, depreciationMethod: value})}
            >
              <SelectTrigger className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="STRAIGHT_LINE">Straight Line</SelectItem>
                <SelectItem value="DECLINING_BALANCE">Declining Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Mapping */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Mapping</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Asset Account *</Label>
                <Select 
                  value={formData.assetAccountId} 
                  onValueChange={(value) => setFormData({...formData, assetAccountId: value})}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select asset account" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {assetAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountNo} - {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Accumulated Depreciation Account *</Label>
                <Select 
                  value={formData.accumulatedDepreciationAccountId} 
                  onValueChange={(value) => setFormData({...formData, accumulatedDepreciationAccountId: value})}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select depreciation account" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {depreciationAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountNo} - {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Depreciation Expense Account *</Label>
                <Select 
                  value={formData.depreciationExpenseAccountId} 
                  onValueChange={(value) => setFormData({...formData, depreciationExpenseAccountId: value})}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select expense account" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {expenseAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountNo} - {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="rounded-full"
              />
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="rounded-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
