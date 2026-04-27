"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { CiDollar } from "react-icons/ci"
import { toast } from "sonner"
import { useAppDispatch } from "@/lib/store"
import { addBudgetItems, fetchBudgetItems, fetchEventById } from "@/lib/store/slices/eventsSlice"
import { type BudgetCategory } from "@/lib/api/events-api"

interface AddBudgetItemDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
}

interface BudgetItemFormData {
  category: BudgetCategory
  itemName: string
  description: string
  estimatedCost: string
  quantity: string
  unit: string
  vendor: string
  vendorContact: string
  notes: string
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

export function AddBudgetItemDialog({ isOpen, onClose, eventId }: AddBudgetItemDialogProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BudgetItemFormData>({
    mode: "onChange",
    defaultValues: {
      category: "VENUE",
      itemName: "",
      description: "",
      estimatedCost: "",
      quantity: "1",
      unit: "",
      vendor: "",
      vendorContact: "",
      notes: ""
    }
  })

  const onSubmit = async (data: BudgetItemFormData) => {
    if (!data.itemName.trim() || !data.estimatedCost) {
      toast.error("Item name and estimated cost are required")
      return
    }

    setLoading(true)
    try {
      await dispatch(
        addBudgetItems({
          eventId,
          budgetItems: [
            {
              ...data,
              estimatedCost: Number(data.estimatedCost),
              quantity: Number(data.quantity)
            }
          ]
        })
      ).unwrap()

      await Promise.all([
        dispatch(fetchBudgetItems(eventId)),
        dispatch(fetchEventById(eventId)),
      ])
      toast.success("Budget item added successfully")
      handleClose()
    } catch (error: any) {
      const description =
        typeof error === "string" ? error : error?.message || "Please try again"
      console.error("Failed to add budget item:", error)
      toast.error("Failed to add budget item", { description })
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
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CiDollar className="w-5 h-5" />
            Add Budget Item
          </DialogTitle>
          <DialogDescription>Add a new line item to the event budget</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Item Details</h3>
            <Card className="border-l-4 border-l-blue-500 shadow-none p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Controller
                    name="itemName"
                    control={control}
                    rules={{ required: "Item name is required" }}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          id="itemName"
                          placeholder="Venue rental, Catering service, etc."
                          className={errors.itemName ? "border-red-500" : ""}
                        />
                        {errors.itemName && (
                          <p className="text-sm text-red-500 mt-1">{errors.itemName.message}</p>
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
                  <Label htmlFor="estimatedCost">Estimated Cost *</Label>
                  <Controller
                    name="estimatedCost"
                    control={control}
                    rules={{ 
                      required: "Estimated cost is required",
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: "Please enter a valid amount"
                      }
                    }}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          id="estimatedCost"
                          type="number"
                          step="0.01"
                          placeholder="5000"
                          className={errors.estimatedCost ? "border-red-500" : ""}
                        />
                        {errors.estimatedCost && (
                          <p className="text-sm text-red-500 mt-1">{errors.estimatedCost.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="quantity"
                        type="number"
                        placeholder="1"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="unit"
                        placeholder="items, hours, days, etc."
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="description"
                        placeholder="Detailed description of the budget item"
                        rows={3}
                      />
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Vendor Information</h3>
            <Card className="border-l-4 border-l-green-500 shadow-none p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor Name</Label>
                  <Controller
                    name="vendor"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="vendor"
                        placeholder="Vendor/Supplier name"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorContact">Vendor Contact</Label>
                  <Controller
                    name="vendorContact"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="vendorContact"
                        placeholder="Email or phone"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="notes"
                        placeholder="Additional notes or comments"
                        rows={2}
                      />
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
                Adding...
              </>
            ) : (
              <>
                <CiDollar className="mr-2 h-4 w-4" />
                Add Item
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
