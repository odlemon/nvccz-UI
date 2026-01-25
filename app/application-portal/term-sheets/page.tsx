"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTermSheets, signTermSheet } from "@/lib/store/slices/applicationPortalSlice"
import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CiFileOn, CiCircleCheck, CiDollar } from "react-icons/ci"
import { FileText, Eye, CheckCircle, X, User, Building2, Calendar, TrendingUp, PenLine } from "lucide-react"
import { toast } from "sonner"
import { TermSheetsSkeleton } from "@/components/term-sheets/term-sheets-skeleton"
import { SignTermSheetModal } from "@/components/applications/SignTermSheetModal"
// import { SignatureView } from "@/components/term-sheets/signature-view"
// import TermSheetPDF from "@/components/term-sheets/term-sheet-pdf"
import { pdf } from "@react-pdf/renderer"
// import { saveAs } from "file-saver"
import { SignatureView } from "@/components/application-portal/signature-view"
import TermSheetPDF from "@/components/application-portal/signature-pdf"
// import saveAs from "file-saver"

interface TermSheet {
  id: string
  applicationId: string
  title: string
  version?: string
  status: string
  investmentAmount: number
  equityPercentage: number
  valuation: number
  keyTerms?: string
  conditions?: string
  timeline?: string
  documentUrl?: string
  documentFileName?: string
  documentSize?: number
  isDraft: boolean
  isFinal: boolean
  isSigned: boolean
  signedAt: string | null
  createdAt: string
  updatedAt: string
  application: {
    id: string
    businessName: string
    applicantName: string
    applicantEmail: string
    currentStage: string
    requestedAmount?: string
  }
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  applicantSignature?: {
    signatureUrl: string
    signatureFileName: string
    signedAt: string
    signedBy: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  } | null
  investorSignature?: {
    signatureUrl: string
    signatureFileName: string
    signedAt: string
    signedBy: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  } | null
}

export default function TermSheetsPage() {
  const dispatch = useAppDispatch()
  const { termSheets, termSheetsLoading, termSheetsPagination } = useAppSelector((state) => state.applicationPortal)
  const [signingTermSheet, setSigningTermSheet] = useState<string | null>(null)
  const [selectedTermSheet, setSelectedTermSheet] = useState<TermSheet | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showSignDialog, setShowSignDialog] = useState(false)
  const [termSheetToSign, setTermSheetToSign] = useState<TermSheet | null>(null)
  const [signError, setSignError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
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

  useEffect(() => {
    dispatch(fetchTermSheets({ page: 1, limit: 10 }))
  }, [dispatch])

  const handleViewDetails = (termSheet: TermSheet) => {
    setSelectedTermSheet(termSheet)
    setShowDrawer(true)
  }

  const handleSignTermSheetClick = (termSheet: TermSheet) => {
    setTermSheetToSign(termSheet)
    setShowSignDialog(true)
  }

  // const handleDownloadSignedPdf = async (termSheet: TermSheet) => {
  //   if (!termSheet.isSigned) return

  //   setDownloadingPdf(termSheet.id)
  //   try {
  //     const blob = await pdf(<TermSheetPDF data={termSheet} />).toBlob()
  //     saveAs(blob, `${termSheet.application.businessName}-term-sheet-signed.pdf`)
  //   } catch (error) {
  //     console.error("Error generating PDF:", error)
  //   } finally {
  //     setDownloadingPdf(null)
  //   }
  // }


  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SIGNED":
        return "bg-green-100 text-green-800"
      case "FINAL":
        return "bg-blue-100 text-blue-800"
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (termSheetsLoading) {
    return (
      <ApplicationPortalLayout>
        <TermSheetsSkeleton />
      </ApplicationPortalLayout>
    )
  }

  return (
    <ApplicationPortalLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Term Sheets</h1>
            <p className="text-muted-foreground">Review and manage your investment term sheets</p>
          </div>
          <Badge variant="outline">{termSheetsPagination.total} Total</Badge>
        </div>

        {/* Term Sheets List */}
        {termSheets.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Term Sheets</h3>
                <p className="text-muted-foreground">
                  Term sheets will appear here once they are created for your application.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {termSheets.map((termSheet:any) => (
              <Card key={termSheet.id} className="card-shadow hover:card-shadow-hover transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                        <FileText size={20} className="text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{termSheet.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">Version {termSheet.version || '1.0'}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(termSheet.status)}>{termSheet.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Financial Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CiDollar className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-blue-600 font-medium">Investment Amount</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          ${Number(termSheet.investmentAmount).toLocaleString()}
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CiCircleCheck className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Equity</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{termSheet.equityPercentage}%</p>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CiFileOn className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-purple-600 font-medium">Valuation</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                          ${Number(termSheet.valuation).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Application Info */}
                    {termSheet.application && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Company</p>
                            <p className="font-medium">{termSheet.application.businessName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Stage</p>
                            <Badge variant="outline">{termSheet.application.currentStage.replaceAll("_", " ")}</Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleViewDetails(termSheet)}
                        className="rounded-full h-10 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      {termSheet?.applicantSignature?.signatureUrl && PDFComponents && (

                        <PDFComponents.PDFDownloadLink
                          document={<PDFComponents.TermSheetPDF data={termSheet} />}
                          fileName={`${termSheet?.application?.businessName.replace(/\s+/g, "-")}-TermSheet-${new Date()
                            .toISOString()
                            .split("T")[0]}.pdf`}
                        >
                          {({ loading: pdfLoading }: any) => (
                            <Button className="flex items-center gap-2 px-6 h-10 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800" variant="outline" disabled={pdfLoading}>
                              <CiFileOn className={`w-4 h-4 mr-2 ${pdfLoading ? "animate-spin" : ""}`} />
                              {pdfLoading ? "Generating..." : "Export PDF"}
                            </Button>
                          )}
                        </PDFComponents.PDFDownloadLink>
                      )}
                      {!termSheet.applicantSignature && !termSheet.isSigned && (
                        <Button
                          onClick={() => handleSignTermSheetClick(termSheet)}
                          disabled={signingTermSheet === termSheet.id}
                          className="rounded-full h-10 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {signingTermSheet === termSheet.id ? "Signing..." : "Sign Term Sheet"}
                        </Button>
                      )}
                      {termSheet.applicantSignature && (
                        <div className="flex items-center gap-2 px-6 h-10 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Signed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Term Sheet Details Drawer */}
      {showDrawer && selectedTermSheet && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowDrawer(false)}>
          <div
            className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTermSheet.title}</h2>
                  <p className="text-sm text-muted-foreground">Version {selectedTermSheet.version || '1.0'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedTermSheet.applicantSignature && selectedTermSheet.isFinal && (
                    <Button
                      onClick={() => {
                        setShowDrawer(false)
                        handleSignTermSheetClick(selectedTermSheet)
                      }}
                      disabled={signingTermSheet === selectedTermSheet.id}
                      className="rounded-full h-10 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {signingTermSheet === selectedTermSheet.id ? "Signing..." : "Sign Term Sheet"}
                    </Button>
                  )}
                  {selectedTermSheet.applicantSignature && (
                    <Button
                      disabled
                      className="rounded-full h-10 bg-gradient-to-r from-green-100 to-green-200 text-green-800 cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Signed
                    </Button>
                  )}
                  {/* Custom Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDrawer(false)}
                    className="rounded-full h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(selectedTermSheet.status)}>{selectedTermSheet.status}</Badge>
                {selectedTermSheet.applicantSignature && (
                  <Badge className="bg-green-100 text-green-800 ml-2">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Applicant Signed
                  </Badge>
                )}
                {selectedTermSheet.investorSignature && (
                  <Badge className="bg-blue-100 text-blue-800 ml-2">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Investor Signed
                  </Badge>
                )}
              </div>

              {/* Investment Details */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Investment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Investment Amount</label>
                      <p className="text-lg font-bold text-blue-600">
                        ${Number(selectedTermSheet.investmentAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Equity Percentage</label>
                      <p className="text-lg font-bold text-green-600">{selectedTermSheet.equityPercentage}%</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-muted-foreground">Valuation</label>
                      <p className="text-lg font-bold text-purple-600">
                        ${Number(selectedTermSheet.valuation).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Information */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-green-500" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Business Name</label>
                    <p className="font-medium">{selectedTermSheet.application.businessName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Applicant Name</label>
                    <p className="font-medium">{selectedTermSheet.application.applicantName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Applicant Email</label>
                    <p className="font-medium">{selectedTermSheet.application.applicantEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Current Stage</label>
                    <Badge variant="outline">{selectedTermSheet.application.currentStage.replaceAll("_", " ")}</Badge>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Requested Amount</label>
                    <p className="font-medium">
                      ${Number(selectedTermSheet.application.requestedAmount).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Terms & Conditions */}
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    Terms & Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground font-medium">Key Terms</label>
                    <p className="mt-1 text-sm">{selectedTermSheet.keyTerms}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground font-medium">Conditions</label>
                    <p className="mt-1 text-sm">{selectedTermSheet.conditions}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground font-medium">Timeline</label>
                    <p className="mt-1 text-sm">{selectedTermSheet.timeline}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Document Information */}
              {selectedTermSheet.documentUrl && (
                <Card className="border-l-4 border-l-indigo-500">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{selectedTermSheet.documentFileName}</p>
                        {selectedTermSheet.documentSize && (
                          <p className="text-sm text-muted-foreground">
                            {(selectedTermSheet.documentSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedTermSheet.documentUrl, "_blank")}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Created By */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-500" />
                    Created By
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Name</label>
                      <p className="font-medium">
                        {selectedTermSheet.createdBy.firstName} {selectedTermSheet.createdBy.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{selectedTermSheet.createdBy.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card className="border-l-4 border-l-gray-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Created At</label>
                    <p className="font-medium">{new Date(selectedTermSheet.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Last Updated</label>
                    <p className="font-medium">{new Date(selectedTermSheet.updatedAt).toLocaleString()}</p>
                  </div>
                  {selectedTermSheet.signedAt && (
                    <div>
                      <label className="text-sm text-muted-foreground">Signed At</label>
                      <p className="font-medium text-green-600">
                        {new Date(selectedTermSheet.signedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Signatures Section */}
              {(selectedTermSheet.applicantSignature || selectedTermSheet.investorSignature) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <PenLine className="w-5 h-5" />
                    Signatures
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SignatureView
                      type="applicant"
                      signatureUrl={selectedTermSheet.applicantSignature?.signatureUrl}
                      signedAt={selectedTermSheet.applicantSignature?.signedAt}
                      signerName={
                        selectedTermSheet.applicantSignature?.signedBy
                          ? `${selectedTermSheet.applicantSignature.signedBy.firstName} ${selectedTermSheet.applicantSignature.signedBy.lastName}`
                          : selectedTermSheet.application.applicantName
                      }
                    />
                    <SignatureView
                      type="investor"
                      signatureUrl={selectedTermSheet.investorSignature?.signatureUrl}
                      signedAt={selectedTermSheet.investorSignature?.signedAt}
                      signerName={
                        selectedTermSheet.investorSignature?.signedBy
                          ? `${selectedTermSheet.investorSignature.signedBy.firstName} ${selectedTermSheet.investorSignature.signedBy.lastName}`
                          : `${selectedTermSheet.createdBy.firstName} ${selectedTermSheet.createdBy.lastName}`
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign Term Sheet Modal */}
      {termSheetToSign && (
        <SignTermSheetModal
          open={showSignDialog}
          onOpenChange={setShowSignDialog}
          loading={signing}
          onSubmit={async (signature) => {
            setSigning(true)
            setSignError(null)
            try {
              await dispatch(signTermSheet({ termSheetId: termSheetToSign.applicationId, signature })).unwrap()
              toast.success("Term sheet signed successfully")
              dispatch(fetchTermSheets())
            } catch (err: any) {
              setSignError(err || "Failed to sign term sheet")
              toast.error(err || "Failed to sign term sheet")
            }
            setSigning(false)
          }}
        />
      )}
    </ApplicationPortalLayout>
  )
}
