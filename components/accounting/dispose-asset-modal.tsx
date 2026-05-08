"use client"

import { useState } from "react"
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
import { CalendarIcon, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Asset } from "@/lib/api/accounting-api"
import { accountingApi } from "@/lib/api/accounting-api"

interface DisposeAssetModalProps {
  isOpen: boolean
  onClose: () => void
  asset: Asset
  onSuccess: () => void
}

const disposalMethods = [
  { value: 'SALE', label: 'Sale' },
  { value: 'SCRAP', label: 'Scrap' },
  { value: 'DONATION', label: 'Donation' },
  { value: 'TRADE_IN', label: 'Trade In' }
]

export function DisposeAssetModal({ isOpen, onClose, asset, onSuccess }: DisposeAssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [disposalDate, setDisposalDate] = useState<Date>(new Date())
  const [formData, setFormData] = useState({
    disposalAmount: '',
    disposalValue: '',
    disposalMethod: '',
    notes: ''
  })

  const resetForm = () => {
    setFormData({
      disposalAmount: '',
      disposalValue: '',
      disposalMethod: '',
      notes: ''
    })
    setDisposalDate(new Date())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.disposalMethod || !formData.disposalAmount || !formData.disposalValue) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      const data = {
        disposalDate: format(disposalDate, 'yyyy-MM-dd'),
        disposalAmount: parseFloat(formData.disposalAmount),
        disposalValue: parseFloat(formData.disposalValue),
        disposalMethod: formData.disposalMethod as 'SALE' | 'SCRAP' | 'DONATION' | 'TRADE_IN',
        notes: formData.notes
      }

      const response = await accountingApi.disposeAsset(asset.id, data)
      
      if (response.success) {
        toast.success('Asset disposed successfully')
        resetForm()
        onSuccess()
      } else {
        toast.error(response.error || 'Failed to dispose asset')
      }
    } catch (error: any) {
      toast.error('Failed to dispose asset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Dispose Asset
          </DialogTitle>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Warning</h4>
              <p className="text-sm text-red-700">
                This action will permanently mark the asset as disposed and cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Asset: {asset.assetName}</h3>
            <p className="text-sm text-gray-600">Code: {asset.assetCode}</p>
            <p className="text-sm text-gray-600">
              Current Book Value: ${parseFloat(asset.currentBookValue).toLocaleString()}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Disposal Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-full h-10 px-4",
                      !disposalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {disposalDate ? format(disposalDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={disposalDate}
                    onSelect={(date) => date && setDisposalDate(date)}
                    initialFocus
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Disposal Method *</Label>
              <Select 
                value={formData.disposalMethod} 
                onValueChange={(value) => setFormData({...formData, disposalMethod: value})}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Select disposal method" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {disposalMethods.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="disposalAmount">Disposal Amount *</Label>
                <Input
                  id="disposalAmount"
                  type="number"
                  step="0.01"
                  value={formData.disposalAmount}
                  onChange={(e) => setFormData({...formData, disposalAmount: e.target.value})}
                  required
                  className="rounded-full"
                />
              </div>
              <div>
                <Label htmlFor="disposalValue">Disposal Value *</Label>
                <Input
                  id="disposalValue"
                  type="number"
                  step="0.01"
                  value={formData.disposalValue}
                  onChange={(e) => setFormData({...formData, disposalValue: e.target.value})}
                  required
                  className="rounded-full"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes about the disposal..."
                rows={3}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-full h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="gradient-danger"
              className="rounded-full h-10 px-6"
            >
              {loading ? 'Disposing...' : 'Dispose Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
