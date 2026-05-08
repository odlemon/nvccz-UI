"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Landmark, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store/store"
import { cashbookApi, CashbookBank, CreateCashbookBankRequest, GlAccountForBank } from "@/lib/api/cashbook-api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface CreateBankAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bank?: CashbookBank | null
  isEditing?: boolean
}

export function CreateBankAccountModal({ isOpen, onClose, onSuccess, bank, isEditing }: CreateBankAccountModalProps) {
  const currencies = useSelector((state: RootState) => state.accounting.currencies)

  const [formData, setFormData] = useState<CreateCashbookBankRequest>({
    name: "",
    accountNumber: "",
    currencyId: "",
    glAccountId: "",
    bankCode: "",
    branchCode: "",
    isActive: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [glAccounts, setGlAccounts] = useState<GlAccountForBank[]>([])
  const [glAccountsLoading, setGlAccountsLoading] = useState(false)
  const [glOpen, setGlOpen] = useState(false)
  const [glSearch, setGlSearch] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadGlAccounts()
      if (isEditing && bank) {
        setFormData({
          name: bank.name,
          accountNumber: bank.accountNumber,
          currencyId: bank.currencyId,
          glAccountId: bank.glAccountId,
          bankCode: (bank as any).bankCode || "",
          branchCode: (bank as any).branchCode || "",
          isActive: bank.isActive,
        })
      } else {
        setFormData({
          name: "",
          accountNumber: "",
          currencyId: currencies.find(c => c.isDefault)?.id || currencies[0]?.id || "",
          glAccountId: "",
          bankCode: "",
          branchCode: "",
          isActive: true,
        })
      }
      setErrors({})
    }
  }, [isOpen, isEditing, bank, currencies])

  const loadGlAccounts = async () => {
    try {
      setGlAccountsLoading(true)
      const response = await cashbookApi.getGlAccountsForBank()
      if (response.success && response.data) {
        setGlAccounts(response.data)
      }
    } catch (error) {
      console.error("Failed to load GL accounts", error)
    } finally {
      setGlAccountsLoading(false)
    }
  }

  const filteredGlAccounts = useMemo(() => {
    return glAccounts.filter(a =>
      a.accountName.toLowerCase().includes(glSearch.toLowerCase()) ||
      a.accountNo.toLowerCase().includes(glSearch.toLowerCase())
    )
  }, [glAccounts, glSearch])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Bank name is required"
    if (!formData.accountNumber.trim()) newErrors.accountNumber = "Account number is required"
    if (!formData.currencyId) newErrors.currencyId = "Currency is required"
    if (!formData.glAccountId) newErrors.glAccountId = "GL Account is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const payload: any = { ...formData }
      if (!payload.bankCode) delete payload.bankCode
      if (!payload.branchCode) delete payload.branchCode

      if (isEditing && bank) {
        const response = await cashbookApi.updateCashbookBank(bank.id, payload)
        if (response.success) {
          toast.success("Bank account updated successfully")
          onSuccess()
          onClose()
        } else {
          throw new Error(response.error || "Failed to update bank account")
        }
      } else {
        const response = await cashbookApi.createCashbookBank(payload)
        if (response.success) {
          toast.success("Bank account created successfully")
          onSuccess()
          onClose()
        } else {
          throw new Error(response.error || "Failed to create bank account")
        }
      }
    } catch (error: any) {
      toast.error(isEditing ? "Failed to update bank account" : "Failed to create bank account", {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-teal-600" />
            {isEditing ? "Edit Bank Account" : "Add Bank Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. CBZ Bank"
              disabled={isLoading}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="e.g. 1234530"
              disabled={isLoading}
            />
            {errors.accountNumber && <p className="text-sm text-red-500">{errors.accountNumber}</p>}
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label>Currency *</Label>
            <Select
              value={formData.currencyId}
              onValueChange={(val) => setFormData(prev => ({ ...prev, currencyId: val }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currencyId && <p className="text-sm text-red-500">{errors.currencyId}</p>}
          </div>

          {/* GL Account (searchable) */}
          <div className="space-y-2">
            <Label>GL Account *</Label>
            <Popover open={glOpen} onOpenChange={setGlOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal rounded-full h-10 px-4"
                  disabled={isLoading || glAccountsLoading}
                >
                  {formData.glAccountId
                    ? (() => {
                        const found = glAccounts.find(a => a.id === formData.glAccountId)
                        return found ? `${found.accountNo} - ${found.accountName}` : "Select GL account..."
                      })()
                    : glAccountsLoading ? "Loading..." : "Select GL account..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search GL accounts..."
                    value={glSearch}
                    onValueChange={setGlSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No GL accounts found.</CommandEmpty>
                    <CommandGroup>
                      {filteredGlAccounts.map((a) => (
                        <CommandItem
                          key={a.id}
                          value={a.id}
                          onSelect={() => {
                            setFormData(prev => ({ ...prev, glAccountId: a.id }))
                            setGlOpen(false)
                            setGlSearch("")
                          }}
                        >
                          <span className="font-mono text-xs mr-2">{a.accountNo}</span>
                          {a.accountName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.glAccountId && <p className="text-sm text-red-500">{errors.glAccountId}</p>}
          </div>

          {/* Bank Code & Branch Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankCode">Bank Code</Label>
              <Input
                id="bankCode"
                value={formData.bankCode || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, bankCode: e.target.value }))}
                placeholder="Optional"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchCode">Branch Code</Label>
              <Input
                id="branchCode"
                value={formData.branchCode || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, branchCode: e.target.value }))}
                placeholder="Optional"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active</Label>
              <p className="text-sm text-gray-500">Bank account is available for use</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive ?? true}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-full h-10 px-6">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading} 
            variant={isEditing ? "gradient-update" : "gradient-create"}
            className="rounded-full h-10 px-6"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Update Account" : "Create Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
