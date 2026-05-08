"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, CreditCard, AlertTriangle } from "lucide-react"
import { Invoice, AccountingCurrency } from "@/lib/api/accounting-api"

const markAsPaidSchema = z.object({
  paymentMethod: z.enum(['CASH', 'BANK', 'CARD', 'CHEQUE'], {
    required_error: "Payment method is required",
  }),
  paymentCurrencyId: z.string({
    required_error: "Payment currency is required",
  }),
})

type MarkAsPaidFormData = z.infer<typeof markAsPaidSchema>

interface InvoiceMarkPaidFormProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: MarkAsPaidFormData) => Promise<void>
  invoice: Invoice | null
  currencies: AccountingCurrency[]
  isLoading?: boolean
}

export function InvoiceMarkPaidForm({
  isOpen,
  onClose,
  onConfirm,
  invoice,
  currencies,
  isLoading = false
}: InvoiceMarkPaidFormProps) {
  const form = useForm<MarkAsPaidFormData>({
    resolver: zodResolver(markAsPaidSchema),
    defaultValues: {
      paymentMethod: invoice?.paymentMethod as any || 'BANK',
      paymentCurrencyId: invoice?.currencyId || currencies.find(c => c.isDefault)?.id || '',
    },
  })

  const handleSubmit = async (data: MarkAsPaidFormData) => {
    try {
      await onConfirm(data)
      form.reset()
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Card Payment' },
    { value: 'CHEQUE', label: 'Cheque' },
  ]

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return '💵'
      case 'BANK':
        return '🏦'
      case 'CARD':
        return '💳'
      case 'CHEQUE':
        return '📝'
      default:
        return '💰'
    }
  }

  if (!invoice) return null

  return (
    <Dialog open={isOpen} onOpenChange={!isLoading ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <DialogTitle className="text-lg font-semibold">Mark Invoice as Paid</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            Complete the payment details to mark this invoice as paid.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-900">{invoice.invoiceNumber}</p>
              <p className="text-sm text-green-700">{invoice.customer.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-green-600 font-medium">Total Amount:</span>
              <span className="ml-2 font-semibold">{invoice.currency.symbol}{invoice.totalAmount}</span>
            </div>
            <div>
              <span className="text-green-600 font-medium">Currency:</span>
              <span className="ml-2">{invoice.currency.code}</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Payment Method Field */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <div className="flex items-center gap-2">
                            <span>{getPaymentMethodIcon(method.value)}</span>
                            {method.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Currency Field */}
            <FormField
              control={form.control}
              name="paymentCurrencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-100 px-1 rounded">
                              {currency.code}
                            </span>
                            <span>{currency.name}</span>
                            {currency.isDefault && (
                              <span className="text-xs text-blue-600">(Default)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info Note */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                This will mark the invoice as paid and record the payment details.
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
                disabled={isLoading}
                variant="gradient-create"
                className="rounded-full h-10 px-6"
              >
                {isLoading && (
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                Mark as Paid
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
