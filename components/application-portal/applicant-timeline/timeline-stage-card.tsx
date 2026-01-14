"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle, FileText, Eye, Users, DollarSign } from "lucide-react"
import { ApplicationDataSection } from "./sections/application-data-section"
import { DueDiligenceSection } from "./sections/due-diligence-section"
import { BoardReviewSection } from "./sections/board-review-section"
import { TermSheetSection } from "./sections/term-sheet-section"
import { InvestmentSection } from "./sections/investment-section"
import type { ApplicationData } from "./timeline-types"
import { Button } from "@/components/ui/button"
import { TermSheet } from "@/lib/api/application-portal-api"
import { useEffect, useState } from "react"

interface TimelineStageCardProps {
  stage: {
    id: string
    statusCodes: string[]
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
  index: number
  totalStages: number
  application: ApplicationData
  isCompleted: boolean
  isCurrent: boolean
  isUpcoming: boolean
  onPreviewDocument: (index: number) => void
  onSignTermsheet: (termSheet: TermSheet) => void
}

export function TimelineStageCard({
  stage,
  index,
  totalStages,
  application,
  isCompleted,
  isCurrent,
  isUpcoming,
  onPreviewDocument,
  onSignTermsheet
}: TimelineStageCardProps) {
  const StageIcon = stage.icon
  const handleSignTermSheetClick = (termSheet: TermSheet) => {
    onSignTermsheet(termSheet)
    // setShowSignDialog(true)
  }

  const [PDFComponents, setPDFComponents] = useState<any>(null)
  
    useEffect(() => {
      // setIsClient(true)
      // Dynamically import PDF components only on client
      import("@react-pdf/renderer").then((pdfModule) => {
        import("@/components/application-portal/signature-pdf").then((pdfComponent) => {
          setPDFComponents({
            PDFDownloadLink: pdfModule.PDFDownloadLink,
            TermSheetPDF: pdfComponent.default,
          })
        })
      })
    }, [])
  // Determine which section to show based on stage
  const renderStageContent = () => {
    if (isUpcoming) return null

    switch (stage.id) {
      case "APPLICATION_SUBMISSION":
        return (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="application-data" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 hover:bg-blue-50 transition-colors rounded-lg px-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  View Application Details
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ApplicationDataSection application={application} onPreviewDocument={onPreviewDocument} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )

      case "DUE_DILIGENCE_GROUP":
        return (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="due-diligence-data" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 hover:bg-amber-50 transition-colors rounded-lg px-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-amber-500" />
                  </div>
                  View Due Diligence Review
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <DueDiligenceSection application={application} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )

      case "BOARD_GROUP":
        return (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="board-review-data" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 hover:bg-purple-50 transition-colors rounded-lg px-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  View Board Review
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <BoardReviewSection application={application} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )

      case "TERM_SHEET_GROUP":
        return (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="term-sheet-data" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 hover:bg-indigo-50 transition-colors rounded-lg px-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </div>
                  View Term Sheet
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TermSheetSection application={application} />

                {!application?.termSheet?.applicantSignedAt && !application?.termSheet?.isSigned && (
                  <Button
                    onClick={() => handleSignTermSheetClick(application.termSheet)}

                    className="rounded-full mt-3 h-10 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {'Sign Term Sheet'}
                  </Button>
                )}
                

                {application?.termSheet?.applicantSignedAt && (
                  <div className="flex items-center gap-2 px-6 h-10 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Signed</span>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )

      case "INVESTMENT_GROUP":
        const isDisbursed = ["DISBURSED", "FUND_DISBURSED", "FUNDED"].includes(application.currentStage)
        return (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="investment-data" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 hover:bg-emerald-50 transition-colors rounded-lg px-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  {isDisbursed ? "View Disbursement Details" : "View Investment Implementation"}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <InvestmentSection application={application} isDisbursed={isDisbursed} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative flex items-start">
      {/* Timeline Line */}
      {index < totalStages - 1 && (
        <div className={`absolute left-6 top-12 w-0.5 h-full ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
      )}

      {/* Timeline Icon */}
      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-white shadow-lg">
        {isCompleted ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : isCurrent ? (
          <div className={`w-6 h-6 rounded-full ${stage.color} flex items-center justify-center`}>
            <StageIcon className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-300" />
        )}
      </div>

      {/* Stage Content */}
      <div className="ml-6 flex-1 pb-8">
        <Card
          className={`transition-all duration-300 ${isCurrent
            ? "border-2 border-blue-500 shadow-lg"
            : isCompleted
              ? "border-green-200"
              : "border-gray-200 opacity-60"
            }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4
                  className={`font-medium ${isCurrent ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-600"}`}
                >
                  {stage.title}
                </h4>
                <p className="text-sm text-gray-500">{stage.description}</p>
              </div>
              <div>
                {isCompleted && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
                {isCurrent && <Badge className="bg-blue-100 text-blue-800">Current</Badge>}
                {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
              </div>
            </div>

            {/* Stage Details */}
            {renderStageContent()}
          </CardContent>
        </Card>
      </div>
    </div>


  )
}
