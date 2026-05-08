"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { AlertTriangle } from "lucide-react"
import { Invoice } from "@/lib/api/accounting-api"

const voidInvoiceSchema = z.object({
  reason: z.string().min(1, "Reason is required").min(5, "Reason must be at least 5 characters"),
})

type VoidInvoiceFormData = z.infer<typeof voidInvoiceSchema>

interface InvoiceVoidFormProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: VoidInvoiceFormData) => Promise<void>
  invoice: Invoice | null
  isLoading?: boolean
}

export function InvoiceVoidForm({
  isOpen,
  onClose,
  onConfirm,
  invoice,
  isLoading = false
}: InvoiceVoidFormProps) {
  const form = useForm<VoidInvoiceFormData>({
    resolver: zodResolver(voidInvoiceSchema),
    defaultValues: {
      reason: '',
    },
  })

  const handleSubmit = async (data: VoidInvoiceFormData) => {
    try {
      await onConfirm(data)
      form.reset()
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  if (!invoice) return null

  return (
    <Dialog open={isOpen} onOpenChange={!isLoading ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <DialogTitle className="text-lg font-semibold">Void Invoice</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            Provide a reason for voiding this invoice. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-red-900">{invoice.invoiceNumber}</p>
              <p className="text-sm text-red-700">{invoice.customer.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-red-600 font-medium">Amount:</span>
              <span className="ml-2 font-semibold">{invoice.currency.symbol}{invoice.totalAmount}</span>
            </div>
            <div>
              <span className="text-red-600 font-medium">Status:</span>
              <span className="ml-2">{invoice.status}</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Reason Field */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Voiding</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the reason for voiding this invoice..."
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning Note */}
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Warning: This action cannot be undone
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Voiding will cancel this invoice permanently and it cannot be recovered.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-full h-10 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient-danger"
                disabled={isLoading}
                className="rounded-full h-10 px-6 shadow-sm"
              >
                {isLoading && (
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                Void Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
