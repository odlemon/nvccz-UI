"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { CiReceipt } from "react-icons/ci"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { addExpense, fetchExpenses } from "@/lib/store/slices/eventsSlice"
import { type BudgetCategory, type PaymentMethod } from "@/lib/api/events-api"
import { accountingApi, type Vendor } from "@/lib/api/accounting-api"

interface AddExpenseDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
}

interface ExpenseFormData {
  description: string
  amount: string
  category: BudgetCategory
  vendorId: string
  budgetItemId: string
  paymentMethod: PaymentMethod
  paymentDate: string
  isTaxable: boolean
  isReimbursable: boolean
  receiptNumber: string
}

const BUDGET_CATEGORIES: BudgetCategory[] = [
  "VENUE",
  "CATERING",
  "DECORATIONS",
  "ENTERTAINMENT",
  "TRANSPORT",
  "MARKETING",
  "TECHNOLOGY",
  "STAFFING",
  "SECURITY",
  "OTHER"
]

const PAYMENT_METHODS: PaymentMethod[] = ["BANK", "CASH", "CARD", "OTHER"]

export function AddExpenseDialog({ isOpen, onClose, eventId }: AddExpenseDialogProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const { currentEventBudgetItems } = useAppSelector((state) => state.events)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ExpenseFormData>({
    mode: "onChange",
    defaultValues: {
      description: "",
      amount: "",
      category: "CATERING",
      vendorId: "",
      budgetItemId: "NONE",
      paymentMethod: "BANK",
      paymentDate: new Date().toISOString().split("T")[0],
      isTaxable: true,
      isReimbursable: false,
      receiptNumber: ""
    }
  })

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const loadVendors = async () => {
      setVendorsLoading(true)
      try {
        const res = await accountingApi.getVendors({ isActive: true, limit: 200 })
        if (!cancelled && res.success && res.data) {
          setVendors(res.data)
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error("Failed to load vendors", {
            description: err?.message || "Try reopening the dialog",
          })
        }
      } finally {
        if (!cancelled) setVendorsLoading(false)
      }
    }
    loadVendors()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  const onSubmit = async (data: ExpenseFormData) => {
    if (!data.description.trim() || !data.amount) {
      toast.error("Description and amount are required")
      return
    }
    if (!data.vendorId) {
      toast.error("Vendor is required", {
        description: "A vendor must be selected so the journal entry can be posted",
      })
      return
    }

    const selectedVendor = vendors.find((v) => v.id === data.vendorId)

    setLoading(true)
    try {
      await dispatch(
        addExpense({
          eventId,
          data: {
            description: data.description,
            amount: Number(data.amount),
            category: data.category,
            vendorId: data.vendorId,
            vendor: selectedVendor?.name,
            paymentMethod: data.paymentMethod,
            paymentDate: new Date(data.paymentDate).toISOString(),
            isTaxable: data.isTaxable,
            isReimbursable: data.isReimbursable,
            receiptNumber: data.receiptNumber || undefined,
            budgetItemId: data.budgetItemId === "NONE" ? undefined : data.budgetItemId,
          },
        })
      ).unwrap()

      await dispatch(fetchExpenses(eventId))
      toast.success("Expense recorded successfully")
      handleClose()
    } catch (error: any) {
      // rejectWithValue passes a string; thrown Errors come through as objects
      const description =
        typeof error === "string"
          ? error
          : error?.message || "Please try again"
      console.error("Failed to record expense:", error)
      toast.error("Failed to record expense", { description })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CiReceipt className="w-5 h-5" />
            Record Expense
          </DialogTitle>
          <DialogDescription>Add a new expense for this event</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Expense Details</h3>
            <Card className="border-l-4 border-l-blue-500 shadow-none p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Controller
                    name="description"
                    control={control}
                    rules={{ required: "Description is required" }}
                    render={({ field }) => (
                      <div>
                        <Textarea
                          {...field}
                          id="description"
                          placeholder="Catering services for lunch"
                          rows={2}
                          className={errors.description ? "border-red-500" : ""}
                        />
                        {errors.description && (
                          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Controller
                    name="amount"
                    control={control}
                    rules={{ 
                      required: "Amount is required",
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: "Please enter a valid amount"
                      }
                    }}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="5000"
                          className={errors.amount ? "border-red-500" : ""}
                        />
                        {errors.amount && (
                          <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorId">Vendor *</Label>
                  <Controller
                    name="vendorId"
                    control={control}
                    rules={{ required: "Vendor is required" }}
                    render={({ field }) => (
                      <div>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={vendorsLoading}
                        >
                          <SelectTrigger className={errors.vendorId ? "border-red-500" : ""}>
                            <SelectValue
                              placeholder={vendorsLoading ? "Loading vendors..." : "Select vendor"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.length === 0 && !vendorsLoading ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                No vendors found. Add one in Accounting → Vendors.
                              </div>
                            ) : (
                              vendors.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {errors.vendorId && (
                          <p className="text-sm text-red-500 mt-1">{errors.vendorId.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetItemId">Link to Budget Item</Label>
                  <Controller
                    name="budgetItemId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget item (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">None</SelectItem>
                          {currentEventBudgetItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.itemName} (${Number(item.estimatedCost).toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Payment Information</h3>
            <Card className="border-l-4 border-l-green-500 shadow-none p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Controller
                    name="paymentMethod"
                    control={control}
                    rules={{ required: "Payment method is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.paymentMethod ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Controller
                    name="paymentDate"
                    control={control}
                    rules={{ required: "Payment date is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="paymentDate"
                        type="date"
                        className={errors.paymentDate ? "border-red-500" : ""}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Controller
                    name="receiptNumber"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="receiptNumber"
                        placeholder="REC-001"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 col-span-2 flex items-center gap-6">
                  <Controller
                    name="isTaxable"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Taxable (VAT applicable)</span>
                      </label>
                    )}
                  />

                  <Controller
                    name="isReimbursable"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Reimbursable</span>
                      </label>
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>
        </form>

        <DialogFooter className="pt-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <CiReceipt className="mr-2 h-4 w-4" />
                Record Expense
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
