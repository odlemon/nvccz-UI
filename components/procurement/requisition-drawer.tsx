// ============================================================================
// REQUISITION DRAWER
// View requisition details with timeline and actions
// ============================================================================

'use client'

import React, { useState } from 'react'
import { useAppDispatch } from '@/lib/store/hooks'
import {
  submitRequisition,
  approveRequisition,
  rejectRequisition,
} from '@/lib/store/slices/procurementV2Slice'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { UserAvatarWithName } from '@/components/procurement/user-avatar'
import { CopyText } from '@/components/procurement/copy-helper'
import { format } from 'date-fns'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package, 
  FileText,
  Send,
  Calendar,
  Building2,
  AlertTriangle
} from 'lucide-react'
import type { PurchaseRequisition } from '@/lib/api/types/procurement.types'

interface RequisitionDrawerProps {
  requisition: PurchaseRequisition
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequisitionDrawer({ requisition, open, onOpenChange }: RequisitionDrawerProps) {
  const dispatch = useAppDispatch()
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = requisition.status === 'DRAFT'
  const canApprove = requisition.status === 'PENDING_APPROVAL'
  const isApproved = requisition.status === 'APPROVED'
  const isRejected = requisition.status === 'REJECTED'

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await dispatch(submitRequisition(requisition.id)).unwrap()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to submit requisition:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await dispatch(approveRequisition(requisition.id)).unwrap()
      setShowApproveDialog(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to approve requisition:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return
    
    setIsSubmitting(true)
    try {
      await dispatch(rejectRequisition({ id: requisition.id, rejectionReason: rejectionReason })).unwrap()
      setShowRejectDialog(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to reject requisition:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = requisition.items.reduce(
    (sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)),
    0
  )

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Requisition
            </SheetTitle>
            <SheetDescription>
              View requisition details and approval status
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{requisition.title}</h3>
                  <CopyText text={requisition.requisitionNumber} label="Requisition #" />
                </div>
                <StatusBadge status={requisition.status} />
              </div>

              {requisition.description && (
                <p className="text-sm text-muted-foreground">{requisition.description}</p>
              )}
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Department</span>
                </div>
                <p className="text-sm font-medium">{requisition.department}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Priority</span>
                </div>
                <PriorityBadge priority={requisition.priority} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(requisition.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Total Items</span>
                </div>
                <p className="text-sm font-medium">{requisition.items.length} items</p>
              </div>
            </div>

            <Separator />

            {/* Requested By */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Requested By</Label>
              <UserAvatarWithName user={requisition.requestedBy} size="md" />
            </div>

            {/* Approved By (if approved) */}
            {requisition.approvedBy && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    {isApproved ? 'Approved By' : 'Reviewed By'}
                  </Label>
                  <UserAvatarWithName user={requisition.approvedBy} size="md" />
                  {requisition.approvedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(requisition.approvedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Rejection Reason */}
            {isRejected && requisition.rejectionReason && (
              <>
                <Separator />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-red-800 mb-1 block">
                    Rejection Reason
                  </Label>
                  <p className="text-sm text-red-700">{requisition.rejectionReason}</p>
                </div>
              </>
            )}

            {/* Justification */}
            {requisition.justification && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Justification</Label>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{requisition.justification}</p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Items List */}
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">Items Requested</Label>
              <div className="space-y-3">
                {requisition.items.map((item, index) => (
                  <div key={item.id || index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.itemName}</h4>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Quantity: <span className="font-medium text-foreground">{item.quantity} {item.unit}</span>
                      </span>
                      {Number(item.unitPrice) > 0 && (
                        <span className="text-muted-foreground">
                          Unit Price: <span className="font-medium text-foreground">${Number(item.unitPrice).toFixed(2)}</span>
                        </span>
                      )}
                    </div>
                    {Number(item.totalPrice) > 0 && (
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          Total: ${Number(item.totalPrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalAmount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Estimated Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <Separator />
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">Timeline</Label>
              <div className="space-y-4">
                {/* Created */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    {(canSubmit || canApprove || isApproved || isRejected) && (
                      <div className="h-full w-0.5 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">Requisition Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(requisition.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {requisition.requestedBy.firstName} {requisition.requestedBy.lastName}
                    </p>
                  </div>
                </div>

                {/* Submitted */}
                {!canSubmit && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Send className="h-4 w-4 text-yellow-600" />
                      </div>
                      {(canApprove || isApproved || isRejected) && (
                        <div className="h-full w-0.5 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">Submitted for Approval</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(requisition.updatedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved */}
                {isApproved && requisition.approvedAt && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Approved</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(requisition.approvedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {requisition.approvedBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by {requisition.approvedBy.firstName} {requisition.approvedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejected */}
                {isRejected && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Rejected</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(requisition.updatedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending */}
                {canApprove && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pending Approval</p>
                      <p className="text-xs text-muted-foreground">
                        Waiting for department head approval
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex gap-2">
              {canSubmit && (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Approval
                </Button>
              )}

              {canApprove && (
                <>
                  <Button
                    onClick={() => setShowApproveDialog(true)}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isSubmitting}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}

              {isApproved && (
                <Button className="flex-1" variant="outline">
                  Create RFQ
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this requisition? This will allow the procurement
              team to proceed with creating an RFQ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this requisition. This will be sent to the
              requester.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    DRAFT: { className: 'bg-gray-100 text-gray-800', label: 'Draft' },
    PENDING_APPROVAL: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
    APPROVED: { className: 'bg-green-100 text-green-800', label: 'Approved' },
    REJECTED: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
    CONVERTED_TO_PO: { className: 'bg-blue-100 text-blue-800', label: 'Converted to PO' },
  }

  const { className, label } = config[status] || config.DRAFT

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { className: string; label: string }> = {
    LOW: { className: 'bg-blue-100 text-blue-800', label: 'Low' },
    MEDIUM: { className: 'bg-gray-100 text-gray-800', label: 'Medium' },
    HIGH: { className: 'bg-orange-100 text-orange-800', label: 'High' },
    URGENT: { className: 'bg-red-100 text-red-800', label: 'Urgent' },
  }

  const { className, label } = config[priority] || config.MEDIUM

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
