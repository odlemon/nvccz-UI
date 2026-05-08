"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { configureContraEntry, fetchContraConfigs } from "@/lib/store/slices/cashbookSlice"
import { fetchChartOfAccounts } from "@/lib/store/slices/accountingSlice"
import type { AppDispatch, RootState } from "@/lib/store"

interface CreateContraEntryModalProps {
  isOpen: boolean
  onClose: () => void
  contraConfig?: any | null
}

export function CreateContraEntryModal({ isOpen, onClose, contraConfig }: CreateContraEntryModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const chartOfAccounts = useSelector((state: RootState) => state.accounting.chartOfAccounts)
  
  const [formData, setFormData] = useState({
    entryType: "RECEIPT" as "RECEIPT" | "PAYMENT",
    glAccountId: "",
    contraType: "DETAILED" as "DETAILED" | "SUMMARY",
    isEnabled: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchChartOfAccounts())
    }
  }, [isOpen, dispatch])

  useEffect(() => {
    if (contraConfig) {
      setFormData({
        entryType: contraConfig.entryType || "RECEIPT",
        glAccountId: contraConfig.glAccountId || "",
        contraType: contraConfig.contraType || "DETAILED",
        isEnabled: contraConfig.isEnabled ?? true,
      })
    } else {
      setFormData({
        entryType: "RECEIPT",
        glAccountId: "",
        contraType: "DETAILED",
        isEnabled: true,
      })
    }
  }, [contraConfig, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.glAccountId) {
      toast.error("GL Account is required")
      return
    }

    setLoading(true)
    try {
      await dispatch(configureContraEntry(formData)).unwrap()
      toast.success(contraConfig ? "Contra entry updated successfully" : "Contra entry configured successfully")
      dispatch(fetchContraConfigs())
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to configure contra entry")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contraConfig ? "Edit Contra Entry" : "Configure Contra Entry"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entryType">Entry Type *</Label>
            <Select
              value={formData.entryType}
              onValueChange={(value: "RECEIPT" | "PAYMENT") => 
                setFormData({ ...formData, entryType: value })
              }
            >
              <SelectTrigger id="entryType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECEIPT">Receipt</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="glAccountId">GL Account *</Label>
            <Select
              value={formData.glAccountId}
              onValueChange={(value) => setFormData({ ...formData, glAccountId: value })}
            >
              <SelectTrigger id="glAccountId">
                <SelectValue placeholder="Select GL Account" />
              </SelectTrigger>
              <SelectContent>
                {chartOfAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountNo} - {account.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraType">Contra Type *</Label>
            <Select
              value={formData.contraType}
              onValueChange={(value: "DETAILED" | "SUMMARY") => 
                setFormData({ ...formData, contraType: value })
              }
            >
              <SelectTrigger id="contraType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DETAILED">Detailed</SelectItem>
                <SelectItem value="SUMMARY">Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Label htmlFor="isEnabled">Enabled</Label>
            <Switch
              id="isEnabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant={contraConfig ? "gradient-update" : "gradient-create"}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {contraConfig ? "Update" : "Configure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
