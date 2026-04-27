"use client"

import { useState } from "react"
import { useAppDispatch } from "@/lib/store"
import {
  submitApplicantRequisition,
  cancelApplicantRequisition,
  fetchApplicantDrawdown
} from "@/lib/store/slices/procurementV2Slice"
import { PurchaseRequisition } from "@/lib/api/procurement-api-v2"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RequisitionTimeline } from "@/components/procurement/requisition-timeline"
import { toast } from "sonner"
import { CiFileOn, CiDollar } from "react-icons/ci"
import { X, Send, Trash2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApplicantRequisitionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition: PurchaseRequisition
  onSuccess?: () => void
}

export function ApplicantRequisitionDrawer({
  open,
  onOpenChange,
  requisition,
  onSuccess
}: ApplicantRequisitionDrawerProps) {
  const dispatch = useAppDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleSubmit = async () => {
    if (requisition.status !== 'DRAFT') {
      toast.error('Only DRAFT requisitions can be submitted')
      return
    }

    try {
      setIsSubmitting(true)
      await dispatch(submitApplicantRequisition(requisition.id)).unwrap()
      toast.success('Requisition submitted for VC review')
      await dispatch(fetchApplicantDrawdown()).unwrap()
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Failed to submit requisition', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (requisition.status !== 'DRAFT' && requisition.status !== 'PENDING_VC_EXECUTIVE_REVIEW') {
      toast.error('Cannot cancel requisition at current status')
      return
    }

    if (!confirm('Are you sure you want to cancel this requisition?')) {
      return
    }

    try {
      setIsCancelling(true)
      await dispatch(cancelApplicantRequisition(requisition.id)).unwrap()
      toast.success('Requisition cancelled')
      await dispatch(fetchApplicantDrawdown()).unwrap()
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Failed to cancel requisition', { description: error.message })
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800'
      case 'PENDING_VC_EXECUTIVE_REVIEW': return 'bg-violet-100 text-violet-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'CONVERTED_TO_PO': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const useOfFundsUrl = (requisition as any).useOfFundsDocumentUrl

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-2xl flex items-center gap-2">
                <CiFileOn className="w-6 h-6" />
                {requisition.requisitionNumber}
              </SheetTitle>
              <SheetDescription className="text-base font-medium text-gray-900">
                {requisition.title}
              </SheetDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badge */}
          <div>
            <Badge className={getStatusColor(requisition.status)}>
              {requisition.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Requisition Details */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <CiFileOn className="w-5 h-5 text-blue-500" />
                Requisition Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-900 font-medium">{requisition.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="text-gray-900 font-medium">{requisition.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className="text-gray-900 font-medium">{requisition.priority}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Justification</p>
                <p className="text-gray-900 font-medium">{requisition.justification}</p>
              </div>
            </CardContent>
          </Card>

          {/* Drawdown Details */}
          {(requisition as any).drawdownRequestAmount && (
            <Card className="border-l-4 border-l-violet-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <CiDollar className="w-5 h-5 text-violet-500" />
                  Drawdown Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Drawdown Request Amount</p>
                  <p className="text-gray-900 font-medium text-lg">
                    ${(requisition as any).drawdownRequestAmount?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sourcing Category</p>
                  <p className="text-gray-900 font-medium">{(requisition as any).sourcingCategory}</p>
                </div>
                {useOfFundsUrl && (
                  <div>
                    <p className="text-sm text-gray-600">Use of Funds Document</p>
                    <a
                      href={useOfFundsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mt-1"
                    >
                      View Document
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Items */}
          {requisition.items && requisition.items.length > 0 && (
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <CiFileOn className="w-5 h-5 text-amber-500" />
                  Requisition Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requisition.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{item.itemName}</p>
                        <Badge variant="secondary">
                          {item.quantity} {item.unit}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-base font-medium mb-4">Approval Timeline</h3>
            <RequisitionTimeline
              requisitionId={requisition.id}
              onCreateRFQ={() => {}}
              onSuccess={onSuccess}
            />
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            {requisition.status === 'DRAFT' && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit for VC Review'}
              </Button>
            )}

            {(requisition.status === 'DRAFT' || requisition.status === 'PENDING_VC_EXECUTIVE_REVIEW') && (
              <Button
                onClick={handleCancel}
                disabled={isCancelling}
                variant="outline"
                className="flex-1 rounded-full text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isCancelling ? 'Cancelling...' : 'Cancel Request'}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
