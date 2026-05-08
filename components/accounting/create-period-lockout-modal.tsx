"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useDispatch } from "react-redux"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { lockPeriod, fetchPeriods } from "@/lib/store/slices/cashbookSlice"
import type { AppDispatch } from "@/lib/store"

interface CreatePeriodLockoutModalProps {
  isOpen: boolean
  onClose: () => void
  period?: any | null
}

export function CreatePeriodLockoutModal({ isOpen, onClose, period }: CreatePeriodLockoutModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  
  const [formData, setFormData] = useState({
    period: "",
    isLocked: false,
    reason: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (period) {
      setFormData({
        period: period.period || "",
        isLocked: period.isLocked ?? false,
        reason: period.reason || "",
      })
    } else {
      // Generate current period in YYYY-MM format
      const now = new Date()
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setFormData({
        period: currentPeriod,
        isLocked: false,
        reason: "",
      })
    }
  }, [period, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.period) {
      toast.error("Period is required")
      return
    }

    // Validate period format (YYYY-MM)
    const periodRegex = /^\d{4}-\d{2}$/
    if (!periodRegex.test(formData.period)) {
      toast.error("Period must be in format YYYY-MM (e.g., 2024-01)")
      return
    }

    setLoading(true)
    try {
      await dispatch(lockPeriod(formData)).unwrap()
      toast.success(formData.isLocked ? "Period locked successfully" : "Period unlocked successfully")
      dispatch(fetchPeriods({ year: parseInt(formData.period.split('-')[0]) }))
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to update period")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{period ? "Update Period Lockout" : "Lock/Unlock Period"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="period">Period (YYYY-MM) *</Label>
            <Input
              id="period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              placeholder="e.g., 2024-01"
              required
              disabled={!!period}
            />
            <p className="text-xs text-muted-foreground">
              Format: YYYY-MM (e.g., 2024-01 for January 2024)
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="isLocked">Lock Period</Label>
              <p className="text-xs text-muted-foreground">
                Prevent transactions in this period
              </p>
            </div>
            <Switch
              id="isLocked"
              checked={formData.isLocked}
              onCheckedChange={(checked) => setFormData({ ...formData, isLocked: checked })}
            />
          </div>

          {formData.isLocked && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for locking this period..."
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant={period ? "gradient-update" : "gradient"}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {period ? "Update" : formData.isLocked ? "Lock Period" : "Unlock Period"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
