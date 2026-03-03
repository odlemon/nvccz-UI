"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, DollarSign, Eye, PenLine } from "lucide-react"
import { TermSheetSkeleton } from "@/components/ui/skeleton-loader"
import type { TermSheetData } from "@/lib/api/term-sheet-api"
import { SignatureView } from "@/components/application-portal/signature-view"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { APPLICATION_PORTAL_ACTIONS } from "@/lib/config/role-permissions"

interface TermSheetSectionProps {
  data: TermSheetData | null
  loading: boolean
  error: string | null
  currentStage: string
  onRefresh: () => void
  onCreate?: () => void
  onInvestorSign?: () => void
  applicationData?: any
}

export function TermSheetSection({
  data,
  loading,
  error,
  currentStage,
  onRefresh,
  onCreate,
  onInvestorSign,
  applicationData
}: TermSheetSectionProps) {
  const { hasSpecificAction } = useRolePermissions();
  const canCreate = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.CREATE_TERM_SHEET);

  // Debug logging
  console.log('TermSheetSection - data:', data);
  console.log('TermSheetSection - applicationData:', applicationData);

  if (loading) {
    return <TermSheetSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Failed to load term sheet data</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Button onClick={onRefresh} variant="outline" size="sm" className="rounded-full">
          Retry
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">No term sheet data available</p>
        <p className="text-sm text-gray-400 mb-4">
          Term sheet has not been created for this application yet.
        </p>
        <div className="flex gap-2 justify-center">
          {canCreate && currentStage === "UNDER_BOARD_REVIEW" && onCreate && (
            <Button
              onClick={onCreate}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Term Sheet
            </Button>
          )}
          <Button onClick={onRefresh} variant="outline" size="sm" className="rounded-full">
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Term Sheet Overview */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-normal flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            Term Sheet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Title</label>
              <p className="text-sm font-medium">{data.title}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Version</label>
              <p className="text-sm font-medium">{data.version}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <Badge className={`mt-1 ${data.status === 'SIGNED'
                  ? 'bg-green-100 text-green-800'
                  : data.status === 'FINAL'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                {data.status}
              </Badge>
            </div>
            <div>
              <label className="text-sm text-gray-500">Created By</label>
              <p className="text-sm font-medium">
                {data.createdBy ?
                  `${data.createdBy.firstName} ${data.createdBy.lastName}` :
                  'Not assigned'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Terms */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-normal flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            Investment Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Investment Amount</label>
              <p className="text-lg font-normal text-blue-600">${Number(data.investmentAmount).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Equity Percentage</label>
              <p className="text-lg font-normal text-green-600">{data.equityPercentage}%</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Valuation</label>
              <p className="text-lg font-normal text-purple-600">${Number(data.valuation).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Timeline</label>
              <p className="text-sm font-medium">{data.timeline}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Terms */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-normal flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            Key Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Key Terms</h4>
              <p className="text-sm text-gray-600">{data.keyTerms}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Conditions</h4>
              <p className="text-sm text-gray-600">{data.conditions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document */}
      {data.documentUrl && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-500" />
              </div>
              Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{data.documentFileName}</p>
                <p className="text-sm text-gray-500">
                  {data.documentSize ? (data.documentSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}
                </p>
              </div>
              <Button
                onClick={() => data.documentUrl && window.open(data.documentUrl, '_blank')}
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={!data.documentUrl}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signatures Section */}
      {(data.isFinal || data.applicantSignatureUrl || data.investorSignatureUrl) && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <PenLine className="w-5 h-5" />
            Signatures
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SignatureView
              type="applicant"
              signatureUrl={data.applicantSignatureUrl}
              signedAt={data.applicantSignedAt}
              signerName={applicationData?.applicantName || data.application?.applicantName}
            />
            <SignatureView
              type="investor"
              signatureUrl={data.investorSignatureUrl}
              signedAt={data.investorSignedAt}
              signerName={data.createdBy ? `${data.createdBy.firstName} ${data.createdBy.lastName}` : 'Investor'}
            />
          </div>

          {/* Investor Sign Button */}
          {/* {data.applicantSignedAt && !data.investorSignedAt && onInvestorSign && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={onInvestorSign}
                className="rounded-full px-8 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PenLine className="w-4 h-4 mr-2" />
                Sign as Investor
              </Button>
            </div>
          )} */}
        </div>
      )}
    </div>
  )
}
