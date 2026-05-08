"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createEntryType, updateEntryType, fetchEntryTypes } from "@/lib/store/slices/cashbookSlice"
import { fetchChartOfAccounts } from "@/lib/store/slices/accountingSlice"
import type { AppDispatch, RootState } from "@/lib/store"

interface CreateEntryTypeModalProps {
  isOpen: boolean
  onClose: () => void
  entryType?: any | null
}

export function CreateEntryTypeModal({ isOpen, onClose, entryType }: CreateEntryTypeModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const chartOfAccounts = useSelector((state: RootState) => state.accounting.chartOfAccounts)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    transactionType: "RECEIPT" as "RECEIPT" | "PAYMENT",
    counterpartyType: "GL" as "GL" | "CUSTOMER" | "SUPPLIER",
    defaultGlAccountId: "",
    isActive: true,
    requiresProjectCode: false,
    requiresReference: false,
    autoGenerateReference: false,
    referencePrefix: "",
    debitCreditLogic: "AUTO" as "AUTO" | "MANUAL",
    defaultDebitCredit: "DEBIT" as "DEBIT" | "CREDIT",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchChartOfAccounts())
    }
  }, [isOpen, dispatch])

  useEffect(() => {
    if (entryType) {
      setFormData({
        name: entryType.name || "",
        description: entryType.description || "",
        transactionType: entryType.transactionType || "RECEIPT",
        counterpartyType: entryType.counterpartyType || "GL",
        defaultGlAccountId: entryType.defaultGlAccountId || "",
        isActive: entryType.isActive ?? true,
        requiresProjectCode: entryType.requiresProjectCode ?? false,
        requiresReference: entryType.requiresReference ?? false,
        autoGenerateReference: entryType.autoGenerateReference ?? false,
        referencePrefix: entryType.referencePrefix || "",
        debitCreditLogic: entryType.debitCreditLogic || "AUTO",
        defaultDebitCredit: entryType.defaultDebitCredit || "DEBIT",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        transactionType: "RECEIPT",
        counterpartyType: "GL",
        defaultGlAccountId: "",
        isActive: true,
        requiresProjectCode: false,
        requiresReference: false,
        autoGenerateReference: false,
        referencePrefix: "",
        debitCreditLogic: "AUTO",
        defaultDebitCredit: "DEBIT",
      })
    }
  }, [entryType, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }

    setLoading(true)
    try {
      if (entryType) {
        await dispatch(updateEntryType({ id: entryType.id, data: formData })).unwrap()
        toast.success("Entry type updated successfully")
      } else {
        await dispatch(createEntryType(formData)).unwrap()
        toast.success("Entry type created successfully")
      }
      dispatch(fetchEntryTypes())
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to save entry type")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entryType ? "Edit Entry Type" : "Create Entry Type"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Customer Receipt"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select
                value={formData.transactionType}
                onValueChange={(value: "RECEIPT" | "PAYMENT") => 
                  setFormData({ ...formData, transactionType: value })
                }
              >
                <SelectTrigger id="transactionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIPT">Receipt</SelectItem>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="counterpartyType">Counterparty Type *</Label>
              <Select
                value={formData.counterpartyType}
                onValueChange={(value: "GL" | "CUSTOMER" | "SUPPLIER") => 
                  setFormData({ ...formData, counterpartyType: value })
                }
              >
                <SelectTrigger id="counterpartyType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GL">GL Account</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="SUPPLIER">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultGlAccountId">Default GL Account</Label>
              <Select
                value={formData.defaultGlAccountId}
                onValueChange={(value) => setFormData({ ...formData, defaultGlAccountId: value })}
              >
                <SelectTrigger id="defaultGlAccountId">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referencePrefix">Reference Prefix</Label>
              <Input
                id="referencePrefix"
                value={formData.referencePrefix}
                onChange={(e) => setFormData({ ...formData, referencePrefix: e.target.value })}
                placeholder="e.g., CR"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="debitCreditLogic">Debit/Credit Logic</Label>
              <Select
                value={formData.debitCreditLogic}
                onValueChange={(value: "AUTO" | "MANUAL") => 
                  setFormData({ ...formData, debitCreditLogic: value })
                }
              >
                <SelectTrigger id="debitCreditLogic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">Automatic</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultDebitCredit">Default Debit/Credit</Label>
              <Select
                value={formData.defaultDebitCredit}
                onValueChange={(value: "DEBIT" | "CREDIT") => 
                  setFormData({ ...formData, defaultDebitCredit: value })
                }
              >
                <SelectTrigger id="defaultDebitCredit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requiresProjectCode">Requires Project Code</Label>
              <Switch
                id="requiresProjectCode"
                checked={formData.requiresProjectCode}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresProjectCode: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requiresReference">Requires Reference</Label>
              <Switch
                id="requiresReference"
                checked={formData.requiresReference}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresReference: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoGenerateReference">Auto Generate Reference</Label>
              <Switch
                id="autoGenerateReference"
                checked={formData.autoGenerateReference}
                onCheckedChange={(checked) => setFormData({ ...formData, autoGenerateReference: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant={entryType ? "gradient-update" : "gradient-create"}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {entryType ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
