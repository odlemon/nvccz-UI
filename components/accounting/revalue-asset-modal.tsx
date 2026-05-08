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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Asset } from "@/lib/api/accounting-api"
import { accountingApi } from "@/lib/api/accounting-api"

interface RevalueAssetModalProps {
  isOpen: boolean
  onClose: () => void
  asset: Asset
  onSuccess: () => void
}

export function RevalueAssetModal({ isOpen, onClose, asset, onSuccess }: RevalueAssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [revaluationDate, setRevaluationDate] = useState<Date>(new Date())
  const [formData, setFormData] = useState({
    newValue: '',
    notes: ''
  })

  const resetForm = () => {
    setFormData({
      newValue: '',
      notes: ''
    })
    setRevaluationDate(new Date())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.newValue) {
      toast.error('Please enter a new asset value')
      return
    }

    const newValue = parseFloat(formData.newValue)
    if (newValue <= 0) {
      toast.error('New value must be greater than zero')
      return
    }

    try {
      setLoading(true)
      
      const data = {
        newValue,
        revaluationDate: format(revaluationDate, 'yyyy-MM-dd'),
        notes: formData.notes
      }

      const response = await accountingApi.revalueAsset(asset.id, data)
      
      if (response.success) {
        toast.success('Asset revalued successfully')
        resetForm()
        onSuccess()
      } else {
        toast.error(response.error || 'Failed to revalue asset')
      }
    } catch (error: any) {
      toast.error('Failed to revalue asset')
    } finally {
      setLoading(false)
    }
  }

  const currentValue = parseFloat(asset.currentBookValue)
  const newValue = parseFloat(formData.newValue) || 0
  const difference = newValue - currentValue
  const percentageChange = currentValue > 0 ? (difference / currentValue) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <TrendingUp className="w-5 h-5" />
            Revalue Asset
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Asset: {asset.assetName}</h3>
            <p className="text-sm text-gray-600">Code: {asset.assetCode}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Current Book Value:</span>
                <span className="font-bold text-blue-900">
                  ${currentValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Revaluation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-full h-10 px-4",
                      !revaluationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {revaluationDate ? format(revaluationDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={revaluationDate}
                    onSelect={(date) => date && setRevaluationDate(date)}
                    initialFocus
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="newValue">New Asset Value *</Label>
              <Input
                id="newValue"
                type="number"
                step="0.01"
                value={formData.newValue}
                onChange={(e) => setFormData({...formData, newValue: e.target.value})}
                placeholder="Enter new asset value"
                required
                className="rounded-full"
              />
            </div>

            {/* Revaluation Impact */}
            {formData.newValue && newValue > 0 && (
              <div className={cn(
                "border rounded-xl p-4",
                difference >= 0 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              )}>
                <h4 className="font-semibold mb-2">Revaluation Impact</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Current Value:</span>
                    <span className="font-mono">${currentValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Value:</span>
                    <span className="font-mono">${newValue.toLocaleString()}</span>
                  </div>
                  <div className={cn(
                    "flex justify-between font-semibold pt-2 border-t",
                    difference >= 0 ? "text-green-700" : "text-red-700"
                  )}>
                    <span>Change:</span>
                    <span className="font-mono">
                      {difference >= 0 ? '+' : ''}${difference.toLocaleString()} 
                      ({percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Revaluation Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Reason for revaluation, methodology used, etc..."
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
              variant="gradient-update"
              className="rounded-full h-10 px-6 shadow-sm"
            >
              {loading ? 'Revaluing...' : 'Revalue Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
