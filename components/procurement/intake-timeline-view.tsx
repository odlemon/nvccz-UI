"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Circle, 
  FileText, 
  Zap,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck
} from "lucide-react"
import { IntakeItemV2 } from "@/lib/api/procurement-api-v2"

interface IntakeTimelineViewProps {
  intake: IntakeItemV2
  onExtract: () => void
  onVerify: () => void
  onCreateBill: () => void
  isLoading: boolean
}

const stages = [
  {
    id: "DRAFT",
    title: "Draft (Uploaded)",
    description: "Invoice document has been uploaded.",
    icon: FileText,
    color: "bg-gray-500",
    completedColor: "bg-blue-500"
  },
  {
    id: "EXTRACTED",
    title: "Extracted",
    description: "AI has extracted data from the invoice.",
    icon: Zap,
    color: "bg-blue-500",
    completedColor: "bg-green-500"
  },
  {
    id: "MATCHED",
    title: "Processed",
    description: "Matched against PO/GRN or converted to a Draft Bill.",
    icon: CheckCircle2,
    color: "bg-emerald-500",
    completedColor: "bg-emerald-500"
  }
]

export function IntakeTimelineView({
  intake,
  onExtract,
  onVerify,
  onCreateBill,
  isLoading
}: IntakeTimelineViewProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)

  useEffect(() => {
    let stageIndex = 0
    if (intake.status === 'ERROR') {
      stageIndex = 1 // Error usually happens during extraction
    } else {
      if (intake.status === 'DRAFT') stageIndex = 0
      if (intake.status === 'EXTRACTED') stageIndex = 1
      if (intake.status === 'VERIFIED') stageIndex = 2
      if (intake.status === 'MATCHED' || intake.status === 'DRAFT_BILL') stageIndex = 2
    }
    setCurrentStageIndex(stageIndex)
  }, [intake.status])

  const getStageStatus = (index: number) => {
    if (intake.status === 'ERROR' && index === 1) return 'error'
    if (index < currentStageIndex) return "completed"
    if (index === currentStageIndex) return "current"
    return "upcoming"
  }

  const renderActionButtons = () => {
    return (
      <div className="flex gap-2 justify-end mb-6">
        {intake.status === 'DRAFT' && (
          <Button 
            variant="gradient-info"
            className="rounded-full shadow-sm px-6"
            onClick={onExtract}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Extract Data
          </Button>
        )}
        
        {intake.status === 'EXTRACTED' && (
          <Button 
            variant="gradient-update"
            className="rounded-full shadow-sm px-6"
            onClick={onCreateBill}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
            Create Draft Bill
          </Button>
        )}

        {intake.status === 'VERIFIED' && (
          <Button 
            variant="gradient-update"
            className="rounded-full shadow-sm px-6"
            onClick={onCreateBill}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
            Create Draft Bill
          </Button>
        )}
      </div>
    )
  }

  const renderIntakeDetails = () => {
    const data = intake.extractedPayloadJson
    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Intake Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Intake Number</label>
                <p className="text-sm font-medium">{intake.intakeNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Vendor</label>
                <p className="text-sm font-medium">{intake.vendor?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div>
                  <Badge variant="outline">{intake.status}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Confidence</label>
                <p className="text-sm font-medium">
                  {intake.overallConfidence ? `${(parseFloat(intake.overallConfidence) * 100).toFixed(0)}%` : 'N/A'}
                </p>
              </div>
              {data && (
                <>
                  <div>
                    <label className="text-sm text-gray-500">Invoice Number</label>
                    <p className="text-sm font-medium">{data.invoiceNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Total Amount</label>
                    <p className="text-sm font-medium">{data.currencyCode || 'USD'} {data.totalAmount || '0.00'}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {data?.lines && data.lines.length > 0 && (
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-green-500" />
                Extracted Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.lines.map((item: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium">{item.description || item.itemName}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.quantity} {item.unit || 'units'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Unit Price: ${parseFloat(item.unitPrice || '0').toFixed(2)}</span>
                      <span className="font-medium">Total: ${(parseFloat(item.lineTotal || item.totalPrice || '0')).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-4">
      {renderActionButtons()}

      <div className="relative mb-8">
        {stages.map((stage, index) => {
          const status = getStageStatus(index)
          const isCompleted = status === 'completed'
          const isCurrent = status === 'current'
          const isError = status === 'error'

          return (
            <div key={stage.id} className="flex mb-8 last:mb-0 relative">
              {/* Vertical line connecting nodes */}
              {index < stages.length - 1 && (
                <div 
                  className={`absolute left-[19px] top-10 bottom-[-32px] w-[2px] ${
                    isCompleted ? stage.completedColor : 'bg-gray-200'
                  }`} 
                />
              )}
              
              <div className="mr-4 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? stage.completedColor : 
                  isCurrent ? stage.color : 
                  isError ? 'bg-red-500' : 'bg-gray-100'
                } ${isCurrent || isCompleted || isError ? 'text-white shadow-md' : 'text-gray-400'}`}>
                  {isError ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <stage.icon className="w-5 h-5" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 pt-2">
                <h3 className={`text-base font-semibold ${
                  isError ? 'text-red-600' :
                  isCurrent ? 'text-gray-900' : 
                  isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {isError && stage.id === 'EXTRACTED' ? 'Extraction Failed' : stage.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {stage.description}
                </p>
                {isError && (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200 text-sm text-red-700">
                    There was an error processing this stage. Please try again or check the document.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <hr className="my-8" />
      
      {renderIntakeDetails()}
    </div>
  )
}
