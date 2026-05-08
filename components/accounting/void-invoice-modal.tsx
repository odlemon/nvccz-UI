"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Invoice, VoidInvoiceRequest } from "@/lib/api/accounting-api"

interface VoidInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: VoidInvoiceRequest) => void
  invoice: Invoice | null
  isLoading: boolean
}

export function VoidInvoiceModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  invoice,
  isLoading 
}: VoidInvoiceModalProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  if (!invoice) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      setError("Please provide a reason for voiding this invoice")
      return
    }
    
    setError("")
    onConfirm({ reason: reason.trim() })
  }

  const handleReasonChange = (value: string) => {
    setReason(value)
    if (error) setError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>Void Invoice</span>
              <p className="text-sm text-gray-500 font-normal">
                {invoice.invoiceNumber} - {invoice.currency.symbol}{invoice.totalAmount}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Warning</h4>
                <p className="text-sm text-red-700 mt-1">
                  Voiding this invoice will permanently mark it as cancelled. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Voiding *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder="Please provide a reason for voiding this invoice..."
                disabled={isLoading}
                rows={4}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-full px-6 h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                variant="gradient-danger"
                className="rounded-full px-6 h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Voiding...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Void Invoice
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}