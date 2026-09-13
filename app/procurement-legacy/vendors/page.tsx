'use client'

import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchPendingVendors,
  approveVendorRegistration,
  blacklistVendor,
  unblacklistVendor,
} from '@/lib/store/slices/procurementV2Slice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle, Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'

export default function VendorManagementPage() {
  const dispatch = useAppDispatch()
  const { pendingVendors, pendingVendorsLoading } = useAppSelector((state) => state.procurementV2)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [actionType, setActionType] = useState<'approve' | 'blacklist' | 'view'>('view')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [kycDocs, setKycDocs] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchPendingVendors())
  }, [dispatch])

  const handleOpenDialog = async (vendor: any, type: 'approve' | 'blacklist' | 'view') => {
    setSelectedVendor(vendor)
    setActionType(type)
    setReason('')

    if (type === 'view') {
      setDocsLoading(true)
      try {
        const response = await procurementApiV2.getVendorKYCDocs(vendor.id)
        if (response.success && response.data) {
          setKycDocs(response.data)
        }
      } catch (error) {
        console.error('Failed to load KYC documents:', error)
        toast.error('Failed to load KYC documents')
      } finally {
        setDocsLoading(false)
      }
    }

    setActionDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedVendor) return
    setLoading(true)
    try {
      await dispatch(approveVendorRegistration(selectedVendor.id)).unwrap()
      toast.success(`${selectedVendor.companyName} approved successfully`)
      setActionDialogOpen(false)
      dispatch(fetchPendingVendors())
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to approve vendor'
      toast.error('Approval failed', { description })
    } finally {
      setLoading(false)
    }
  }

  const handleBlacklist = async () => {
    if (!selectedVendor || !reason.trim()) {
      toast.error('Please provide a reason for blacklisting')
      return
    }
    setLoading(true)
    try {
      await dispatch(blacklistVendor({ id: selectedVendor.id, reason })).unwrap()
      toast.success(`${selectedVendor.companyName} blacklisted successfully`)
      setActionDialogOpen(false)
      dispatch(fetchPendingVendors())
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to blacklist vendor'
      toast.error('Blacklist failed', { description })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadDoc = async (docId: string, fileName: string) => {
    try {
      const blob = await procurementApiV2.downloadStaffKYCDoc(docId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Failed to download document')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
        <p className="text-gray-600 mt-2">Review and manage vendor registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{pendingVendors.length}</p>
              <p className="text-gray-600 text-sm mt-2">Pending Vendors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-600">0</p>
              <p className="text-gray-600 text-sm mt-2">Approved This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-red-600">0</p>
              <p className="text-gray-600 text-sm mt-2">Blacklisted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Vendor Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingVendorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : pendingVendors.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No pending vendor registrations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVendors.map((vendor) => (
                <div key={vendor.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{vendor.companyName}</h3>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending Review
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-3">
                        <div>
                          <p className="font-medium text-gray-900">Contact: {vendor.contactPerson}</p>
                          <p>{vendor.email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Phone</p>
                          <p>{vendor.phoneNumber}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Industry</p>
                          <p>{vendor.industry}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Submitted</p>
                          <p>{new Date(vendor.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-col">
                      <Button
                        onClick={() => handleOpenDialog(vendor, 'view')}
                        variant="outline"
                        className="gap-2"
                      >
                        <Eye size={16} />
                        View KYC
                      </Button>
                      <Button
                        onClick={() => handleOpenDialog(vendor, 'approve')}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleOpenDialog(vendor, 'blacklist')}
                        variant="destructive"
                        className="gap-2"
                      >
                        <AlertCircle size={16} />
                        Blacklist
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && `Approve Vendor: ${selectedVendor?.companyName}`}
              {actionType === 'blacklist' && `Blacklist Vendor: ${selectedVendor?.companyName}`}
              {actionType === 'view' && `KYC Documents: ${selectedVendor?.companyName}`}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Approve this vendor to allow them to bid on RFQs'}
              {actionType === 'blacklist' && 'Blacklist this vendor to prevent them from bidding'}
              {actionType === 'view' && 'Review submitted KYC documents'}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'view' ? (
            <div className="space-y-4 py-4">
              {docsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : kycDocs.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No KYC documents found</p>
              ) : (
                <div className="space-y-3">
                  {kycDocs.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{doc.documentType.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-600">{doc.fileName}</p>
                        <Badge
                          className={`mt-2 ${
                            doc.verificationStatus === 'VERIFIED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {doc.verificationStatus}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleDownloadDoc(doc.id, doc.fileName)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Download size={16} />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                {actionType === 'blacklist' && (
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Blacklisting *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Provide a detailed reason for blacklisting this vendor..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                {actionType === 'approve' && (
                  <Button
                    onClick={handleApprove}
                    disabled={loading}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Approval
                  </Button>
                )}
                {actionType === 'blacklist' && (
                  <Button
                    onClick={handleBlacklist}
                    disabled={loading || !reason.trim()}
                    className="gap-2 bg-red-600 hover:bg-red-700"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Blacklist
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
