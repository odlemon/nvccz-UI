"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  FileText, 
  Truck,
  ShoppingCart,
  Eye,
  Edit,
  CheckCircle2
} from "lucide-react"
import { PurchaseOrder } from "@/lib/api/procurement-api"

interface PurchaseOrderTimelineProps {
  purchaseOrder?: PurchaseOrder | null
  onUpdateStatus?: (id: string, status: string) => void
  refreshTrigger?: number
}

const stages = [
  {
    id: "CREATED",
    title: "Created",
    description: "Purchase order has been created",
    icon: FileText,
    color: "bg-blue-500",
    completedColor: "bg-green-500"
  },
  {
    id: "SENT_TO_VENDOR",
    title: "Sent to Vendor",
    description: "Purchase order has been sent to the vendor",
    icon: ShoppingCart,
    color: "bg-amber-500",
    completedColor: "bg-green-500"
  },
  {
    id: "ACKNOWLEDGED",
    title: "Acknowledged",
    description: "Vendor has acknowledged the purchase order",
    icon: CheckCircle,
    color: "bg-purple-500",
    completedColor: "bg-green-500"
  },
  {
    id: "SHIPPED",
    title: "Shipped",
    description: "Items have been shipped by the vendor",
    icon: Truck,
    color: "bg-indigo-500",
    completedColor: "bg-green-500"
  },
  {
    id: "DELIVERED",
    title: "Delivered",
    description: "Items have been received",
    icon: CheckCircle2,
    color: "bg-green-500",
    completedColor: "bg-green-500"
  }
]

export function PurchaseOrderTimeline({
  purchaseOrder,
  onUpdateStatus,
  refreshTrigger
}: PurchaseOrderTimelineProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)

  useEffect(() => {
    if (purchaseOrder?.status) {
      const stageIndex = stages.findIndex(stage => stage.id === purchaseOrder.status)
      setCurrentStageIndex(stageIndex >= 0 ? stageIndex : 0)
    }
  }, [purchaseOrder?.status])

  const getStageStatus = (index: number) => {
    if (!purchaseOrder?.status) return "upcoming"
    
    if (purchaseOrder.status === "CANCELLED") {
      return index === 0 ? "completed" : "cancelled"
    }
    
    if (index < currentStageIndex) return "completed"
    if (index === currentStageIndex) return "current"
    return "upcoming"
  }

  const getStageActions = (stageId: string) => {
    if (!purchaseOrder) return null
    // Only show actions for the current stage
    if (purchaseOrder.status !== stageId) {
      return null
    }

    const nextStage = stages[currentStageIndex + 1]
    if (!nextStage) return null

    return (
      <div className="flex gap-2">
        <Button
          onClick={() => onUpdateStatus?.(purchaseOrder.id, nextStage.id)}
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
                <p className="text-sm font-medium">{purchaseOrder.purchaseOrderNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Vendor</label>
                <p className="text-sm font-medium">{purchaseOrder.vendor?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Total Amount</label>
                <p className="text-sm font-medium">${parseFloat(purchaseOrder.totalAmount).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date Created</label>
                <p className="text-sm font-medium">
                  {new Date(purchaseOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-500">Notes</label>
                <p className="text-sm font-medium">{'No notes provided'}</p>
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
              {purchaseOrder.items?.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium">{item.itemName}</p>
                    <Badge variant="outline" className="text-xs">
                      {item.quantity} {item.unit}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Unit Price: ${parseFloat(item.unitPrice.toString()).toFixed(2)}</span>
                    <span className="font-medium">Total: ${(parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString())).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-normal text-gray-900 mb-2">Purchase Order Timeline</h2>
        <p className="text-sm text-gray-600">Track the progress of this purchase order</p>
      </div>

      <div className="relative">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex
          const isCurrent = index === currentStageIndex
          const isUpcoming = index > currentStageIndex

          return (
            <div key={stage.id} className="flex mb-8 relative">
              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200" />
              )}

              {/* Stage Icon */}
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

              {/* Stage Content */}
              <div className="ml-6 flex-1 pb-8">
                <Card className={`transition-all duration-300 ${
                  isCurrent 
                    ? 'border-2 border-blue-500 shadow-lg bg-white' 
                    : isCompleted 
                    ? 'border-green-200 bg-white' 
                    : isUpcoming
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 bg-white'
                }`}>
                  <CardContent className="p-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className={`text-base font-medium ${
                            isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {stage.title}
                          </h3>
                          <p className="text-sm text-gray-500">{stage.description}</p>
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
                        </div>
                      </div>

                      {/* Stage Details */}
                      {isCurrent && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="details" className="border-none">
                            <AccordionTrigger className="py-2 text-sm text-blue-600 hover:text-blue-800 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                <span>View Purchase Order Details</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderPurchaseOrderDetails()}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {/* Stage Actions */}
                      {isCurrent && (
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
    </div>
  )
}