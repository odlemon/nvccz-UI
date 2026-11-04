"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { CiUser } from "react-icons/ci"
import { toast } from "sonner"
import { useAppDispatch } from "@/lib/store"
import { addEventGuests, fetchEventGuests } from "@/lib/store/slices/eventsSlice"

interface AddGuestDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
}

interface GuestFormData {
  name: string
  salutation: string
  email: string
  phone: string
  company: string
  title: string
  dietaryRequirements: string
  accessibilityNeeds: string
  emergencyContact: string
  emergencyPhone: string
}

export function AddGuestDialog({ isOpen, onClose, eventId }: AddGuestDialogProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<GuestFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      salutation: "",
      email: "",
      phone: "",
      company: "",
      title: "",
      dietaryRequirements: "",
      accessibilityNeeds: "",
      emergencyContact: "",
      emergencyPhone: ""
    }
  })

  const onSubmit = async (data: GuestFormData) => {
    if (!data.name.trim() || !data.email.trim()) {
      toast.error("Name and email are required")
      return
    }

    setLoading(true)
    try {
      const result = await dispatch(addEventGuests({
        eventId,
        guests: [data]
      })).unwrap()

      if ((result?.skippedExisting ?? 0) > 0) {
        toast.error("This email is already on the guest list", {
          description: `${data.email.trim()} has already been added to this event.`,
        })
        return
      }

      await dispatch(fetchEventGuests({ eventId }))
      const failed = result?.announcementDelivery?.filter((item: any) => item.status === "FAILED") ?? []
      if (failed.length) {
        toast.warning("Guest added, but the announcement could not be sent", {
          description: failed[0].error || "Check the email configuration and retry the announcement.",
        })
      } else {
        toast.success("Guest added; Save the Date announcement is sending")
      }
      handleClose()
    } catch (error: any) {
      console.error("Failed to add guest:", error)
      const message = String(error?.message || "")
      toast.error(
        /already|duplicate/i.test(message) ? "This email is already on the guest list" : "Failed to add guest",
        { description: /already|duplicate/i.test(message) ? `${data.email.trim()} has already been added to this event.` : message || "Please try again" }
      )
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
            <CiUser className="w-5 h-5" />
            Add Guest
          </DialogTitle>
          <DialogDescription>Add a new guest to this event</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Basic Information</h3>
            <Card className="border-l-4 border-l-[#00843d] shadow-none p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: "Name is required" }}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          id="name"
                          placeholder="John Doe"
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Controller
                    name="email"
                    control={control}
                    rules={{ 
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    }}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="phone"
                        placeholder="+263 123 456 789"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salutation">Honorific for invitation *</Label>
                  <Controller
                    name="salutation"
                    control={control}
                    rules={{ required: "Choose Mr or Mrs for the invitation" }}
                    render={({ field }) => (
                      <div>
                      <select {...field} id="salutation" className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:border-[#00843d]">
                        <option value="">Choose Mr or Mrs</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                      </select>
                      {errors.salutation && <p className="mt-1 text-sm text-red-500">{errors.salutation.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Controller
                    name="company"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="company"
                        placeholder="Company Name"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="title">Title/Position</Label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="title"
                        placeholder="CEO, Director, etc."
                      />
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Special Requirements */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Special Requirements</h3>
            <Card className="border-l-4 border-l-green-500 shadow-none p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
                  <Controller
                    name="dietaryRequirements"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="dietaryRequirements"
                        placeholder="Vegetarian, allergies, etc."
                        rows={3}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessibilityNeeds">Accessibility Needs</Label>
                  <Controller
                    name="accessibilityNeeds"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="accessibilityNeeds"
                        placeholder="Wheelchair access, sign language, etc."
                        rows={3}
                      />
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Emergency Contact</h3>
            <Card className="border-l-4 border-l-amber-500 shadow-none p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Controller
                    name="emergencyContact"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="emergencyContact"
                        placeholder="Jane Doe"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <Controller
                    name="emergencyPhone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="emergencyPhone"
                        placeholder="+263 123 456 789"
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
            className="bg-[#00843d] hover:bg-[#006d32] text-white rounded-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <CiUser className="mr-2 h-4 w-4" />
                Add Guest
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
