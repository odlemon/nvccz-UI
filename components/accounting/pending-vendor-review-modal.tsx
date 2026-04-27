"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Download, ShieldCheck, FileText } from "lucide-react"
import { toast } from "sonner"
import { procurementApiV2, KYCDocument } from "@/lib/api/procurement-api-v2"

interface PendingVendorRegistration {
  id: string
  companyName?: string
  name?: string
  email?: string
  contactPerson?: string
  phoneNumber?: string
  industry?: string
  createdAt?: string
  registrationStatus?: string
  status?: string
}

interface PendingVendorReviewModalProps {
  isOpen: boolean
  onClose: () => void
  vendor: PendingVendorRegistration | null
  onApprove: (vendorId: string) => Promise<boolean>
}

const REQUIRED_DOCUMENTS = [
  "CR14",
  "BANK_LETTER",
  "CERTIFICATE_OF_INCORPORATION",
  "ITF263",
] as const

export function PendingVendorReviewModal({ isOpen, onClose, vendor, onApprove }: PendingVendorReviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [confirmedReview, setConfirmedReview] = useState(false)

  useEffect(() => {
    const loadDocuments = async () => {
      if (!isOpen || !vendor?.id) return

      setLoading(true)
      setConfirmedReview(false)

      try {
        const response = await procurementApiV2.getVendorKYCDocs(vendor.id)
        setDocuments(response.data || [])
      } catch (error: any) {
        toast.error("Failed to load KYC documents", {
          description: error?.message || "Please try again",
        })
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [isOpen, vendor?.id])

  const uploadedDocumentTypes = useMemo(() => {
    return new Set(documents.map((doc) => doc.documentType))
  }, [documents])

  const missingRequiredDocuments = useMemo(() => {
    return REQUIRED_DOCUMENTS.filter((code) => !uploadedDocumentTypes.has(code))
  }, [uploadedDocumentTypes])

  const canApprove = missingRequiredDocuments.length === 0 && confirmedReview && !approving

  const downloadDocument = async (documentId: string, fallbackName?: string) => {
    try {
      const blob = await procurementApiV2.downloadStaffKYCDoc(documentId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fallbackName || `kyc-${documentId}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      toast.error("Failed to download document", {
        description: error?.message || "Please try again",
      })
    }
  }

  const handleApprove = async () => {
    if (!vendor?.id || !canApprove) return

    setApproving(true)
    const success = await onApprove(vendor.id)
    setApproving(false)

    if (success) {
      onClose()
    }
  }

  if (!vendor) return null

  const vendorName = vendor.companyName || vendor.name || "Unnamed vendor"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Review Pending Registration</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Vendor Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Company:</span> {vendorName}</div>
              <div><span className="text-gray-500">Contact:</span> {vendor.contactPerson || "-"}</div>
              <div><span className="text-gray-500">Email:</span> {vendor.email || "-"}</div>
              <div><span className="text-gray-500">Phone:</span> {vendor.phoneNumber || "-"}</div>
              <div><span className="text-gray-500">Industry:</span> {vendor.industry || "-"}</div>
              <div><span className="text-gray-500">Submitted:</span> {vendor.createdAt ? new Date(vendor.createdAt).toLocaleString() : "-"}</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">KYC Documents</h3>

            {loading ? (
              <div className="py-6 flex items-center justify-center text-gray-600 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading KYC documents...
              </div>
            ) : (
              <>
                {missingRequiredDocuments.length > 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Missing required documents: {missingRequiredDocuments.join(", ")}
                  </div>
                ) : (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    All required documents are present.
                  </div>
                )}

                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <div className="text-sm text-gray-500">No KYC documents uploaded yet.</div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">{doc.fileName || doc.documentType}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            {doc.documentType}
                            <Badge variant="outline" className="text-xs">{doc.verificationStatus}</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => downloadDocument(doc.id, doc.fileName)} className="gap-2">
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm-kyc-review"
                checked={confirmedReview}
                onCheckedChange={(checked) => setConfirmedReview(checked === true)}
                disabled={loading || missingRequiredDocuments.length > 0}
              />
              <label htmlFor="confirm-kyc-review" className="text-sm text-gray-700 cursor-pointer">
                I have reviewed the submission and confirmed KYC documentation is complete and acceptable.
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleApprove} disabled={!canApprove} className="gap-2">
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {approving ? "Approving..." : "Approve Registration"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
