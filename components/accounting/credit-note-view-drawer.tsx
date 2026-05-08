"use client"

import { useState } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Send, 
  CheckCircle,
  Edit2, 
  Trash2,
  FileText,
  User,
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { CreditNote } from "@/lib/api/accounting-api"
import { accountingApi } from "@/lib/api/accounting-api"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
import { useCreditNotes } from "@/lib/hooks/use-credit-notes"

interface CreditNoteViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  creditNote: CreditNote | null
  onRefresh: () => void
}

export function CreditNoteViewDrawer({ isOpen, onClose, creditNote, onRefresh }: CreditNoteViewDrawerProps) {
  const { handleSendCreditNote, handleApplyCreditNote } = useCreditNotes()
  
  const [sendingCreditNote, setSendingCreditNote] = useState(false)
  const [applyingCreditNote, setApplyingCreditNote] = useState(false)
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false)
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = useState(false)

  if (!creditNote) return null

  const handleSendCreditNoteAction = async () => {
    try {
      setSendingCreditNote(true)
      await handleSendCreditNote(creditNote)
      setIsSendConfirmOpen(false)
      onRefresh()
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setSendingCreditNote(false)
    }
  }

  const handleApplyCreditNoteAction = async () => {
    try {
      setApplyingCreditNote(true)
      await handleApplyCreditNote(creditNote, {
        invoiceId: creditNote.invoiceId,
        amount: parseFloat(creditNote.remainingAmount)
      })
      setIsApplyConfirmOpen(false)
      onRefresh()
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setApplyingCreditNote(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-green-100 text-green-800'
      case 'SENT':
        return 'bg-purple-100 text-purple-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'VOID':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: string) => {
    return `${creditNote.currency.symbol}${parseFloat(amount).toFixed(2)}`
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-red-600" />
                Credit Note {creditNote.creditNoteNumber}
              </div>
              <Badge className={getStatusColor(creditNote.status)}>
                {creditNote.status}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-3">
            {creditNote.status === 'DRAFT' && (
              <Button
                onClick={() => setIsSendConfirmOpen(true)}
                variant="gradient"
                className="rounded-full"
                size="sm"
                disabled={sendingCreditNote}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingCreditNote ? 'Sending...' : 'Send to Customer'}
              </Button>
            )}
            {(creditNote.status === 'SENT' && parseFloat(creditNote.remainingAmount) > 0) && (
              <Button
                onClick={() => setIsApplyConfirmOpen(true)}
                variant="gradient-create"
                className="rounded-full"
                size="sm"
                disabled={applyingCreditNote}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {applyingCreditNote ? 'Applying...' : 'Apply Credit'}
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-6">
            {/* Credit Note Details */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Credit Note Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-gray-900">Credit Note Number</h4>
                    <p className="font-mono text-red-600 font-medium">{creditNote.creditNoteNumber}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-900">Status</h4>
                    <Badge className={getStatusColor(creditNote.status)}>
                      {creditNote.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-gray-900">Reason</h4>
                    <p>{creditNote.reason}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-900">Created Date</h4>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{format(new Date(creditNote.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{creditNote.customer.name}</h3>
                    <p className="text-gray-600">{creditNote.customer.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Original Invoice */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Original Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-mono text-blue-600 font-medium">
                      {creditNote.originalInvoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Invoice Total:</span>
                    <span className="font-bold text-green-600">
                      {creditNote.currency.symbol}{creditNote.originalInvoice.totalAmount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credit Note Amounts */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Credit Note Amounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Credit Amount:</span>
                    <span className="text-xl font-bold text-red-600">
                      -{formatCurrency(creditNote.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">VAT Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(creditNote.vatAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-gray-900 font-semibold">Total Credit:</span>
                    <span className="text-2xl font-bold text-red-600">
                      -{formatCurrency(creditNote.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Applied Amount:</span>
                    <span className="font-semibold text-purple-600">
                      {formatCurrency(creditNote.appliedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Remaining Amount:</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(creditNote.remainingAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Created By */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Audit Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created By:</span>
                    <span>{creditNote.createdBy.firstName} {creditNote.createdBy.lastName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created Date:</span>
                    <span>{format(new Date(creditNote.createdAt), 'PPP p')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Updated:</span>
                    <span>{format(new Date(creditNote.updatedAt), 'PPP p')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Send Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isSendConfirmOpen}
        onClose={() => {
          if (!sendingCreditNote) {
            setIsSendConfirmOpen(false)
          }
        }}
        onConfirm={handleSendCreditNoteAction}
        title="Send Credit Note"
        description={`Are you sure you want to send credit note ${creditNote.creditNoteNumber} to ${creditNote.customer.name}? This will change the status to SENT.`}
        confirmText={sendingCreditNote ? "Sending..." : "Send Credit Note"}
        cancelText="Cancel"
        variant="default"
        loading={sendingCreditNote}
      />

      {/* Apply Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isApplyConfirmOpen}
        onClose={() => {
          if (!applyingCreditNote) {
            setIsApplyConfirmOpen(false)
          }
        }}
        onConfirm={handleApplyCreditNoteAction}
        title="Apply Credit Note"
        description={`Are you sure you want to apply the full remaining amount of ${formatCurrency(creditNote.remainingAmount)} to the original invoice? This action cannot be undone.`}
        confirmText={applyingCreditNote ? "Applying..." : "Apply Credit"}
        cancelText="Cancel"
        variant="default"
        loading={applyingCreditNote}
      />
    </>
  )
}
