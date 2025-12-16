"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  FileText, 
  Users, 
  DollarSign,
  ChevronRight,
  Eye,
  Edit,
  Play,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock4,
  RefreshCw,
  Send,
  X,
  ShoppingCart
} from "lucide-react"
import { CiUser, CiDollar, CiFileOn, CiCalendar } from "react-icons/ci"
import { PurchaseRequisition, procurementApi } from "@/lib/api/procurement-api"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface RequisitionTimelineProps {
  requisitionId: string
  onCreateRFQ?: (requisitionId: string) => void
  onSuccess?: () => void
}

const stages = [
  {
    id: "DRAFT",
    title: "Draft",
    description: "Requisition is being prepared",
    icon: FileText,
    color: "bg-gray-500",
    completedColor: "bg-green-500"
  },
  {
    id: "PENDING_APPROVAL",
    title: "Pending Approval",
    description: "Waiting for management approval",
    icon: Clock,
    color: "bg-amber-500",
    completedColor: "bg-green-500"
  },
  {
    id: "APPROVED",
    title: "Approved",
    description: "Requisition has been approved",
    icon: CheckCircle,
    color: "bg-green-500",
    completedColor: "bg-green-500"
  },
  {
    id: "CONVERTED_TO_PO",
    title: "Converted to Purchase Order",
    description: "Purchase order has been created from this requisition",
    icon: ShoppingCart,
    color: "bg-blue-500",
    completedColor: "bg-green-500"
  },
  {
    id: "DELIVERED",
    title: "Delivered",
    description: "Items have been delivered and received",
    icon: CheckCircle2,
    color: "bg-purple-500",
    completedColor: "bg-green-500"
  }
]

export function RequisitionTimeline({
  requisitionId,
  onCreateRFQ,
  onSuccess
}: RequisitionTimelineProps) {
  const [requisition, setRequisition] = useState<PurchaseRequisition | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    if (requisitionId) {
      fetchRequisition()
    }
  }, [requisitionId])

  useEffect(() => {
    if (requisition) {
      const stageIndex = stages.findIndex(stage => stage.id === requisition.status)
      setCurrentStageIndex(stageIndex >= 0 ? stageIndex : 0)
    }
  }, [requisition?.status])

  const fetchRequisition = async () => {
    try {
      setLoading(true)
      const response = await procurementApi.getRequisitionById(requisitionId)
      if (response.success && response.data) {
        setRequisition(response.data)
      } else {
        toast.error('Failed to load requisition')
      }
    } catch (error: any) {
      toast.error('Error loading requisition', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getStageStatus = (index: number) => {
    if (!requisition) return "upcoming"
    
    if (requisition.status === "REJECTED" || requisition.status === "CANCELLED") {
      return index === 0 ? "completed" : "cancelled"
    }
    
    if (index < currentStageIndex) return "completed"
    if (index === currentStageIndex) return "current"
    return "upcoming"
  }

  const handleSubmitForApproval = async () => {
    if (!requisition) return
    
    try {
      setSubmitting(true)
      const response = await procurementApi.submitRequisition(requisition.id)
      if (response.success && response.data) {
        setRequisition(response.data)
        toast.success('Requisition submitted for approval successfully')
        setShowSubmitDialog(false) // Only close on success
        onSuccess?.() // Notify parent to refresh data
      } else {
        toast.error('Failed to submit requisition for approval')
        // Don't close dialog on error - user can see the error and try again
      }
    } catch (error: any) {
      toast.error('Error submitting requisition', { description: error.message })
      // Don't close dialog on error - user can see the error and try again
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!requisition) return
    
    try {
      setApproving(true)
      const response = await procurementApi.approveRequisition(requisition.id)
      if (response.success && response.data) {
        setRequisition(response.data)
        toast.success('Requisition approved successfully')
        setShowApproveDialog(false) // Only close on success
        onSuccess?.() // Notify parent to refresh data
      } else {
        toast.error('Failed to approve requisition')
        // Don't close dialog on error - user can see the error and try again
      }
    } catch (error: any) {
      toast.error('Error approving requisition', { description: error.message })
      // Don't close dialog on error - user can see the error and try again
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!requisition) return
    
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }
    
    try {
      const response = await procurementApi.rejectRequisition(requisition.id, rejectionReason)
      if (response.success && response.data) {
        setRequisition(response.data)
        toast.success('Requisition rejected')
        setShowRejectForm(false)
        setRejectionReason("")
        onSuccess?.() // Notify parent to refresh data
      } else {
        toast.error('Failed to reject requisition')
      }
    } catch (error: any) {
      toast.error('Error rejecting requisition', { description: error.message })
    }
  }

  const getStageActions = (stageId: string) => {
    if (!requisition || requisition.status !== stageId) {
      return null
    }

    switch (stageId) {
      case "DRAFT":
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSubmitDialog(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          </div>
        )
      case "PENDING_APPROVAL":
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setShowApproveDialog(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => setShowRejectForm(true)}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 rounded-full"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
            
            {showRejectForm && (
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-normal text-red-600">Reject Requisition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Rejection Reason</label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      rows={3}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReject}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectForm(false)
                        setRejectionReason("")
                      }}
                      variant="outline"
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      case "APPROVED":
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => onCreateRFQ?.(requisition.id)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Create RFQ
            </Button>
          </div>
        )
      case "CONVERTED_TO_PO":
        return (
          <div className="space-y-4">
            {requisition.purchaseOrders && requisition.purchaseOrders.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="purchase-orders">
                  <AccordionTrigger className="text-left hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-blue-500" />
                      </div>
                      <span>Created Purchase Orders ({requisition.purchaseOrders.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-4">
                      {requisition.purchaseOrders.map((po: any, index: number) => (
                        <Card key={po.id} className="border-blue-200 bg-blue-50">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-xs text-gray-500">PO Number</label>
                                <p className="text-sm font-medium text-blue-700">{po.poNumber}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Vendor</label>
                                <p className="text-sm">{po.vendor?.name || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Status</label>
                                <Badge className={`ml-1 ${
                                  po.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                                  po.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                                  po.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {po.status}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Total Amount</label>
                                <p className="text-sm font-medium">${Number(po.totalAmount || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Order Date</label>
                                <p className="text-sm">{new Date(po.orderDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Expected Delivery</label>
                                <p className="text-sm">
                                  {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                            {po.shippingAddress && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <label className="text-xs text-gray-500">Shipping Address</label>
                                <p className="text-sm">{po.shippingAddress}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            <div className="text-center py-2">
              <p className="text-sm text-green-600 font-medium">✓ Successfully converted to purchase order(s)</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderRequisitionData = () => {
    if (!requisition) return null
    
    return (
      <div className="space-y-4">
        {/* Basic Information */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <CiFileOn className="w-5 h-5 text-blue-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Requisition Number</label>
                <p className="text-base font-medium">{requisition.requisitionNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Priority</label>
                <Badge className={`ml-2 ${
                  requisition.priority === 'HIGH' || requisition.priority === 'URGENT' 
                    ? 'bg-red-100 text-red-800'
                    : requisition.priority === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {requisition.priority}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-base">{requisition.description}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-500">Justification</label>
                <p className="text-base">{requisition.justification}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requestor Information */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <CiUser className="w-5 h-5 text-green-500" />
              Requestor Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="text-base font-medium">
                  {requisition.requestedBy.firstName} {requisition.requestedBy.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-base">{requisition.requestedBy.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Department</label>
                <p className="text-base">{requisition.department?.name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Summary */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Items Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-500">Total Items</label>
                <p className="text-xl font-normal text-purple-600">
                  {requisition.items?.length || 0} items
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Currency</label>
                <p className="text-base">{requisition.currency?.name || 'USD'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Requisition Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requisition.items?.map((item, index) => (
                <div key={item.id || index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Item Name</label>
                      <p className="text-sm font-medium">{item.itemName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Quantity</label>
                      <p className="text-sm">{item.quantity} {item.unit}</p>
                    </div>
                    {item.description && (
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">Description</label>
                        <p className="text-sm">{item.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTimelineSkeleton = () => {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Timeline Header Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-7 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>

        {/* Timeline Steps Skeleton */}
        <div className="relative">
          {[1, 2, 3, 4, 5].map((index) => (
            <motion.div 
              key={index} 
              className="relative flex items-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              {/* Timeline Line */}
              {index < 5 && (
                <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
              )}

              {/* Timeline Icon Skeleton */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-white shadow-lg">
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>

              {/* Stage Content Skeleton */}
              <div className="ml-6 flex-1 pb-8">
                <Card className="border-gray-200 bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Accordion Skeleton for first item */}
                      {index === 1 && (
                        <div className="w-full">
                          <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 transition-colors duration-200">
                            <Skeleton className="w-6 h-6 rounded-full" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="w-4 h-4 ml-auto" />
                          </div>
                          
                          {/* Expanded Accordion Content Skeleton */}
                          <div className="mt-4 space-y-4">
                            {/* Basic Information Card Skeleton */}
                            <Card className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                  <Skeleton className="w-5 h-5" />
                                  <Skeleton className="h-4 w-32" />
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Skeleton className="h-3 w-24 mb-1" />
                                    <Skeleton className="h-4 w-40" />
                                  </div>
                                  <div>
                                    <Skeleton className="h-3 w-16 mb-1" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Skeleton className="h-3 w-20 mb-1" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-3/4" />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Skeleton className="h-3 w-24 mb-1" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-2/3" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Requestor Information Card Skeleton */}
                            <Card className="border-l-4 border-l-green-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                  <Skeleton className="w-5 h-5" />
                                  <Skeleton className="h-4 w-36" />
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Skeleton className="h-3 w-12 mb-1" />
                                    <Skeleton className="h-4 w-32" />
                                  </div>
                                  <div>
                                    <Skeleton className="h-3 w-12 mb-1" />
                                    <Skeleton className="h-4 w-48" />
                                  </div>
                                  <div>
                                    <Skeleton className="h-3 w-20 mb-1" />
                                    <Skeleton className="h-4 w-24" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Financial Information Card Skeleton */}
                            <Card className="border-l-4 border-l-purple-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                  <Skeleton className="w-5 h-5" />
                                  <Skeleton className="h-4 w-36" />
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Skeleton className="h-3 w-20 mb-1" />
                                    <Skeleton className="h-6 w-24" />
                                  </div>
                                  <div>
                                    <Skeleton className="h-3 w-16 mb-1" />
                                    <Skeleton className="h-4 w-20" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Items Card Skeleton */}
                            <Card className="border-l-4 border-l-amber-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                  <Skeleton className="w-5 h-5" />
                                  <Skeleton className="h-4 w-32" />
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {[1, 2].map((itemIndex) => (
                                    <div key={itemIndex} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                          <Skeleton className="h-3 w-16 mb-1" />
                                          <Skeleton className="h-4 w-20" />
                                        </div>
                                        <div>
                                          <Skeleton className="h-3 w-16 mb-1" />
                                          <Skeleton className="h-4 w-16" />
                                        </div>
                                        <div>
                                          <Skeleton className="h-3 w-16 mb-1" />
                                          <Skeleton className="h-4 w-20" />
                                        </div>
                                        <div>
                                          <Skeleton className="h-3 w-12 mb-1" />
                                          <Skeleton className="h-4 w-24" />
                                        </div>
                                        <div className="md:col-span-4">
                                          <Skeleton className="h-3 w-20 mb-1" />
                                          <Skeleton className="h-4 w-full" />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons Skeleton */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex gap-2">
                          <Skeleton className="h-10 w-40 rounded-full" />
                          {index === 2 && <Skeleton className="h-10 w-24 rounded-full" />}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return renderTimelineSkeleton()
  }

  if (!requisition) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load requisition data</p>
        <Button onClick={fetchRequisition} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Timeline Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-normal text-gray-900 mb-2">Requisition Timeline</h2>
          <p className="text-sm text-gray-600">Track the progress of this purchase requisition</p>
        </div>

        {/* Timeline Steps */}
        <div className="relative">
          {stages.map((stage, index) => {
            const status = getStageStatus(index)
            const isCompleted = status === "completed"
            const isCurrent = status === "current"
            const isUpcoming = status === "upcoming"
            const isCancelled = status === "cancelled"
            const Icon = stage.icon

            return (
              <div key={stage.id} className="relative flex items-start">
                {/* Timeline Line */}
                {index < stages.length - 1 && (
                  <div className={`absolute left-6 top-12 w-0.5 h-full ${
                    isCancelled ? 'bg-red-200' : 'bg-gray-200'
                  }`} />
                )}

                {/* Timeline Icon */}
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-white shadow-lg">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : isCurrent ? (
                    <div className={`w-6 h-6 rounded-full ${stage.color} flex items-center justify-center`}>
                      <stage.icon className="w-4 h-4 text-white" />
                    </div>
                  ) : isCancelled ? (
                    <X className="w-6 h-6 text-red-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Stage Content */}
                <div className="ml-6 flex-1 pb-8">
                  <Card className={`transition-all duration-300 ${
                    isCurrent 
                      ? 'border-2 border-blue-500 shadow-lg bg-white' 
                      : isCompleted 
                      ? 'border-green-200 bg-white' 
                      : isCancelled
                      ? 'border-red-200 bg-red-50'
                      : isUpcoming
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 bg-white'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className={`text-base font-normal ${
                            isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : isCancelled ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {stage.title}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Current
                            </Badge>
                          )}
                          {isCancelled && (
                            <Badge className="bg-red-100 text-red-800">
                              Cancelled
                            </Badge>
                          )}
                          {isUpcoming && (
                            <Badge variant="secondary">
                              Upcoming
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {/* Requisition Data Accordion - Only for Draft stage */}
                        {stage.id === "DRAFT" && !isUpcoming && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="requisition-data">
                              <AccordionTrigger className="text-left hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                                    <CiFileOn className="w-4 h-4 text-blue-500" />
                                  </div>
                                  <span>Requisition Details</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                {renderRequisitionData()}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}

                        {/* User Information */}
                        {stage.id === "PENDING_APPROVAL" && requisition && (
                          <div className="mb-4">
                            <Card className="border-amber-200 bg-amber-50">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-amber-800">Requested by</p>
                                    <p className="text-sm text-amber-700">
                                      {requisition.requestedBy.firstName} {requisition.requestedBy.lastName}
                                    </p>
                                    <p className="text-xs text-amber-600">{requisition.requestedBy.email}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        {stage.id === "APPROVED" && requisition?.approvedBy && (
                          <div className="mb-4">
                            <Card className="border-green-200 bg-green-50">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-green-800">Approved by</p>
                                    <p className="text-sm text-green-700">
                                      {requisition.approvedBy.firstName} {requisition.approvedBy.lastName}
                                    </p>
                                    <p className="text-xs text-green-600">{requisition.approvedBy.email}</p>
                                    {requisition.approvedAt && (
                                      <p className="text-xs text-green-600 mt-1">
                                        on {new Date(requisition.approvedAt).toLocaleDateString()} at {new Date(requisition.approvedAt).toLocaleTimeString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        {/* Stage Actions */}
                        <div className="pt-4 border-t border-gray-200">
                          {!isUpcoming && !isCancelled && getStageActions(stage.id)}
                          {isUpcoming && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500 italic">This stage is not yet available</p>
                            </div>
                          )}
                          {isCancelled && (
                            <div className="text-center py-4">
                              <p className="text-sm text-red-500 italic">Process was cancelled</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Requisition for Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit requisition <strong>{requisition?.requisitionNumber}</strong> for approval? 
              Once submitted, you will not be able to make changes until it's processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Approval'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve requisition <strong>{requisition?.requisitionNumber}</strong>? 
              This will allow the creation of purchase orders based on this requisition.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve Requisition'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
