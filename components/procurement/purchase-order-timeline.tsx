"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  CheckCircle,
  Circle,
  FileText,
  ShoppingCart,
  Eye,
  CheckCircle2,
  Loader2,
  XCircle,
  Receipt,
  Wallet,
} from "lucide-react"
import { procurementApiV2 } from "@/lib/api/procurement-api-v2"
import type { PurchaseOrder } from "@/lib/api/procurement-api"

interface PurchaseOrderTimelineProps {
  poId: string
  onUpdateStatus?: (id: string, status: string) => void
  refreshTrigger?: number
}

// "Shipped" intentionally removed — it isn't tracked by the backend.
// Stages cover the full PO lifecycle: DRAFT → SENT → ACKNOWLEDGED → (PARTIALLY_)RECEIVED → BILLED → PAID.
// CANCELLED is handled outside the stage list via a dedicated banner.
const stages = [
  {
    id: "CREATED",
    title: "Created",
    description: "Purchase order has been created",
    icon: FileText,
    color: "bg-blue-500",
    completedColor: "bg-green-500",
  },
  {
    id: "SENT_TO_VENDOR",
    title: "Sent to Vendor",
    description: "Purchase order has been sent to the vendor",
    icon: ShoppingCart,
    color: "bg-amber-500",
    completedColor: "bg-green-500",
  },
  {
    id: "ACKNOWLEDGED",
    title: "Acknowledged",
    description: "Vendor has acknowledged the purchase order",
    icon: CheckCircle,
    color: "bg-purple-500",
    completedColor: "bg-green-500",
  },
  {
    id: "DELIVERED",
    title: "Delivered",
    description: "Goods have been received from the vendor",
    icon: CheckCircle2,
    color: "bg-green-500",
    completedColor: "bg-green-500",
  },
  {
    id: "BILLED",
    title: "Billed",
    description: "Vendor invoice has been raised against this PO",
    icon: Receipt,
    color: "bg-indigo-500",
    completedColor: "bg-green-500",
  },
  {
    id: "PAID",
    title: "Paid",
    description: "Vendor invoice has been paid in full",
    icon: Wallet,
    color: "bg-emerald-500",
    completedColor: "bg-green-500",
  },
] as const

// Map the backend PO status to the timeline stage index.
// PARTIALLY_RECEIVED shares the Delivered stage but is surfaced via the status badge above.
const statusToStageIndex = (status?: string): number => {
  switch (status) {
    case 'DRAFT':
      return 0
    case 'SENT':
      return 1
    case 'ACKNOWLEDGED':
      return 2
    case 'PARTIALLY_RECEIVED':
    case 'RECEIVED':
      return 3
    case 'BILLED':
      return 4
    case 'PAID':
      return 5
    default:
      return 0
  }
}

export function PurchaseOrderTimeline({ poId, onUpdateStatus, refreshTrigger }: PurchaseOrderTimelineProps) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchPO = async () => {
      if (!poId) return
      setLoading(true)
      try {
        const response = await procurementApiV2.getPurchaseOrderById(poId)
        if (cancelled) return
        if (response.success && response.data) {
          setPurchaseOrder(response.data as any)
        }
      } catch (_e) {
        // silent — drawer handles toast
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPO()
    return () => {
      cancelled = true
    }
  }, [poId, refreshTrigger])

  const isCancelled = purchaseOrder?.status === 'CANCELLED'
  const currentStageIndex = statusToStageIndex(purchaseOrder?.status)

  const getStageActions = (stageId: string) => {
    if (!purchaseOrder || isCancelled) return null
    if (statusToStageIndex(purchaseOrder.status) !== stages.findIndex((s) => s.id === stageId)) return null

    const nextStage = stages[currentStageIndex + 1]
    if (!nextStage) return null
    if (!onUpdateStatus) return null

    return (
      <div className="flex gap-2">
        <Button
          onClick={() => onUpdateStatus(purchaseOrder.id, nextStage.id)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
        >
          <nextStage.icon className="w-4 h-4 mr-2" />
          Mark as {nextStage.title}
        </Button>
      </div>
    )
  }

  const renderPurchaseOrderDetails = () => {
    if (!purchaseOrder) return null
    const currency = purchaseOrder.currency?.code || 'USD'
    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              Purchase Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">PO Number</label>
                <p className="text-sm font-medium">{purchaseOrder.poNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Vendor</label>
                <p className="text-sm font-medium">{purchaseOrder.vendor?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Total Amount</label>
                <p className="text-sm font-medium">
                  {currency} {parseFloat(purchaseOrder.totalAmount || '0').toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date Created</label>
                <p className="text-sm font-medium">
                  {new Date(purchaseOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchaseOrder.items?.map((item, index) => {
                const qty = parseFloat(String(item.quantity ?? '0'))
                const unitPrice = parseFloat(String(item.unitPrice ?? '0'))
                return (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium">{item.itemName}</p>
                      <Badge variant="outline" className="text-xs">
                        {qty} {item.unit}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Unit Price: {currency} {unitPrice.toFixed(2)}</span>
                      <span className="font-medium">
                        Total: {currency} {(qty * unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading && !purchaseOrder) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading timeline...</span>
      </div>
    )
  }

  if (!purchaseOrder) {
    return (
      <div className="text-center py-10 text-sm text-gray-500">
        Timeline unavailable.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-normal text-gray-900 mb-2">Purchase Order Timeline</h2>
        <p className="text-sm text-gray-600">
          Current status:{' '}
          <Badge className={isCancelled ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
            {purchaseOrder.status.replace('_', ' ')}
          </Badge>
        </p>
      </div>

      {isCancelled ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-base font-medium text-red-700">Cancelled</h3>
              <p className="text-sm text-red-600">
                This purchase order has been cancelled and its workflow has ended.
              </p>
              {purchaseOrder.rejectionReason && (
                <p className="text-sm text-red-700 mt-2">
                  <span className="font-medium">Reason: </span>
                  {purchaseOrder.rejectionReason}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex
            const isCurrent = index === currentStageIndex
            const isUpcoming = index > currentStageIndex

            return (
              <div key={stage.id} className="flex mb-8 relative">
                {index < stages.length - 1 && (
                  <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200" />
                )}

                <div className="relative z-10">
                  {isCompleted ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stage.completedColor}`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stage.color}`}>
                      <stage.icon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div className="ml-6 flex-1 pb-8">
                  <Card
                    className={`transition-all duration-300 ${
                      isCurrent
                        ? 'border-2 border-blue-500 shadow-lg bg-white'
                        : isCompleted
                        ? 'border-green-200 bg-white'
                        : isUpcoming
                        ? 'border-gray-200 bg-gray-50 opacity-60'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3
                              className={`text-base font-medium ${
                                isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {stage.title}
                            </h3>
                            <p className="text-sm text-gray-500">{stage.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isCompleted && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
                            {isCurrent && <Badge className="bg-blue-100 text-blue-800">Current</Badge>}
                          </div>
                        </div>

                        {isCurrent && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="details" className="border-none">
                              <AccordionTrigger className="py-2 text-sm text-blue-600 hover:text-blue-800 hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <Eye className="w-4 h-4" />
                                  <span>View Purchase Order Details</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>{renderPurchaseOrderDetails()}</AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}

                        {isCurrent && onUpdateStatus && (
                          <div className="pt-4 border-t border-gray-200 mt-4">
                            {getStageActions(stage.id)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
