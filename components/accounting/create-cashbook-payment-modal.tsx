"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Banknote, CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { accountingApi } from "@/lib/api/accounting-api"
import { useDispatch, useSelector } from "react-redux"
import { fetchCustomers, fetchVendors, fetchChartOfAccounts } from "@/lib/store/slices/accountingSlice"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"

export function CreateCashbookPaymentModal({ isOpen, onClose, bank, onSuccess }) {
  const dispatch = useDispatch<AppDispatch>()
  const customers = useSelector((state: RootState) => state.accounting.customers)
  const customersLoading = useSelector((state: RootState) => state.accounting.customersLoading)
  const vendors = useSelector((state: RootState) => state.accounting.vendors)
  const vendorsLoading = useSelector((state: RootState) => state.accounting.vendorsLoading)
  const chartOfAccounts = useSelector((state: RootState) => state.accounting.chartOfAccounts)
  const chartOfAccountsLoading = useSelector((state: RootState) => state.accounting.chartOfAccountsLoading)

  const [loading, setLoading] = useState(false)
  const [transactionDate, setTransactionDate] = useState<Date>(new Date())
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    reference: "",
    counterpartyType: "VENDOR",
    customerId: "",
    vendorId: "",
    glAccountId: "",
  })
  const [customerOpen, setCustomerOpen] = useState(false)
  const [vendorOpen, setVendorOpen] = useState(false)
  const [glOpen, setGlOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [vendorSearch, setVendorSearch] = useState("")
  const [glSearch, setGlSearch] = useState("")

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCustomers())
      dispatch(fetchVendors())
      dispatch(fetchChartOfAccounts())
    }
  }, [isOpen, dispatch])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const isTyping =
        !!active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)

      if (isTyping) return

      // Esc -> close modal
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  const filteredCustomers = useMemo(() => {
    return customers?.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())) || []
  }, [customers, customerSearch])

  const filteredVendors = useMemo(() => {
    return vendors?.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase())) || []
  }, [vendors, vendorSearch])

  const filteredChartOfAccounts = useMemo(() => {
    return chartOfAccounts?.filter(a => a.accountName.toLowerCase().includes(glSearch.toLowerCase())) || []
  }, [chartOfAccounts, glSearch])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!formData.amount || !formData.description || !formData.reference) {
      toast.error("Please fill in all required fields")
      return
    }
    try {
      setLoading(true)
      const payload = {
        bankId: bank.id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        reference: formData.reference,
        counterpartyType: formData.counterpartyType,
        customerId: formData.customerId || undefined,
        vendorId: formData.vendorId || undefined,
        glAccountId: formData.glAccountId || undefined,
        transactionDate: format(transactionDate, "yyyy-MM-dd"),
      }
      const res = await accountingApi.createCashbookPayment(payload)
      if (res.success) {
        toast.success("Payment created")
        setFormData({
          amount: "",
          description: "",
          reference: "",
          counterpartyType: "VENDOR",
          customerId: "",
          vendorId: "",
          glAccountId: "",
        })
        setTransactionDate(new Date())
        setCustomerOpen(false)
        setVendorOpen(false)
        setGlOpen(false)
        onSuccess()
      } else {
        toast.error("Failed to create payment")
      }
    } catch {
      toast.error("Failed to create payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            New Cashbook Payment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              required
              className="rounded-full"
            />
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
              className="rounded-2xl"
            />
          </div>
          <div>
            <Label>Reference *</Label>
            <Input
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              required
              className="rounded-full"
            />
          </div>
          <div>
            <Label>Counterparty Type</Label>
            <Select
              value={formData.counterpartyType}
              onValueChange={v => setFormData({ ...formData, counterpartyType: v, customerId: "", vendorId: "", glAccountId: "" })}
            >
              <SelectTrigger className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="GL">GL Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.counterpartyType === "CUSTOMER" && (
            <div>
              <Label>Customer</Label>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="w-full justify-between rounded-full"
                  >
                    {formData.customerId
                      ? customers?.find(c => c.id === formData.customerId)?.name
                      : "Select customer..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search customers..." className="h-9" onValueChange={setCustomerSearch} />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {customersLoading ? (
                          <CommandItem disabled>Loading customers...</CommandItem>
                        ) : (
                          filteredCustomers.map(c => (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              onSelect={(currentValue) => {
                                setFormData(prev => ({ ...prev, customerId: currentValue === formData.customerId ? "" : currentValue }))
                                setCustomerOpen(false)
                              }}
                            >
                              {c.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  formData.customerId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {(formData.counterpartyType === "VENDOR") && (
            <div>
              <Label>Vendor</Label>
              <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={vendorOpen}
                    className="w-full justify-between rounded-full"
                  >
                    {formData.vendorId
                      ? vendors?.find(v => v.id === formData.vendorId)?.name
                      : `Select vendor...`}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search vendors..." className="h-9" onValueChange={setVendorSearch} />
                    <CommandList>
                      <CommandEmpty>No vendors found.</CommandEmpty>
                      <CommandGroup>
                        {vendorsLoading ? (
                          <CommandItem disabled>Loading vendors...</CommandItem>
                        ) : (
                          filteredVendors.map(v => (
                            <CommandItem
                              key={v.id}
                              value={v.id}
                              onSelect={(currentValue) => {
                                setFormData(prev => ({ ...prev, vendorId: currentValue === formData.vendorId ? "" : currentValue }))
                                setVendorOpen(false)
                              }}
                            >
                              {v.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  formData.vendorId === v.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {formData.counterpartyType === "GL" && (
            <div>
              <Label>GL Account</Label>
              <Popover open={glOpen} onOpenChange={setGlOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={glOpen}
                    className="w-full justify-between rounded-full"
                  >
                    {formData.glAccountId
                      ? chartOfAccounts?.find(a => a.id === formData.glAccountId)?.accountName
                      : "Select GL account..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search GL accounts..." className="h-9" onValueChange={setGlSearch} />
                    <CommandList>
                      <CommandEmpty>No GL accounts found.</CommandEmpty>
                      <CommandGroup>
                        {chartOfAccountsLoading ? (
                          <CommandItem disabled>Loading GL accounts...</CommandItem>
                        ) : (
                          filteredChartOfAccounts.map(a => (
                            <CommandItem
                              key={a.id}
                              value={a.id}
                              onSelect={(currentValue) => {
                                setFormData(prev => ({ ...prev, glAccountId: currentValue === formData.glAccountId ? "" : currentValue }))
                                setGlOpen(false)
                              }}
                            >
                              {a.accountName}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  formData.glAccountId === a.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div>
            <Label>Transaction Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-full",
                    !transactionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transactionDate ? format(transactionDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <Calendar
                  mode="single"
                  selected={transactionDate}
                  onSelect={date => date && setTransactionDate(date)}
                  initialFocus
                  className="rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant="gradient-create" className="rounded-full">
              {loading ? "Creating..." : "Create Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
