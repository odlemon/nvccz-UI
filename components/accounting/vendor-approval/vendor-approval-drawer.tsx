'use client'

import { useState, useEffect } from 'react'
import { Loader2, Download, Plus, Edit2, Trash2, CheckCircle2, XCircle, FileText, Building2, DollarSign, Calendar, X } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface VendorApprovalDrawerProps {
  vendor: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprovalChange?: () => void
}

interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  branchCode: string
  swiftCode: string
  currencyCode: string
  isPrimary: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface KYCDocument {
  id: string
  documentType: string
  fileName: string
  fileSize: number
  mimeType: string
  isVerified: boolean
  verifiedAt: string | null
  createdAt: string
}

export function VendorApprovalDrawer({ vendor, open, onOpenChange, onApprovalChange }: VendorApprovalDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null)
  const [showBankDialog, setShowBankDialog] = useState(false)
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchCode: '',
    swiftCode: '',
    currencyCode: 'USD'
  })
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState('CR14')

  const docTypes = ['CR14', 'BANK_LETTER', 'CERTIFICATE_OF_INCORPORATION', 'ITF263', 'OTHER']

  useEffect(() => {
    if (open && vendor) {
      loadVendorData()
    }
  }, [open, vendor])

  const loadVendorData = async () => {
    setLoading(true)
    try {
      const [banksRes, docsRes] = await Promise.all([
        procurementApiV2.getVendorBanks(vendor.id),
        procurementApiV2.getVendorKYCDocs(vendor.id)
      ])

      if (banksRes.success && banksRes.data) {
        setBanks(Array.isArray(banksRes.data) ? banksRes.data : [])
      }
      if (docsRes.success && docsRes.data) {
        setDocuments(Array.isArray(docsRes.data) ? docsRes.data : [])
      }
    } catch (error: any) {
      toast.error('Failed to load vendor data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      const response = await procurementApiV2.approveVendorRegistration(vendor.id)
      if (response.success) {
        toast.success('Vendor approved successfully')
        onOpenChange(false)
        onApprovalChange?.()
      } else {
        throw new Error(response.message || 'Failed to approve vendor')
      }
    } catch (error: any) {
      toast.error('Approval failed', { description: error.message })
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setRejecting(true)
    try {
      const response = await procurementApiV2.blacklistVendor(vendor.id, { reason: rejectionReason })
      if (response.success) {
        toast.success('Vendor rejected')
        setShowRejectDialog(false)
        onOpenChange(false)
        onApprovalChange?.()
      } else {
        throw new Error(response.message || 'Failed to reject vendor')
      }
    } catch (error: any) {
      toast.error('Rejection failed', { description: error.message })
    } finally {
      setRejecting(false)
    }
  }

  const handleAddBank = async () => {
    if (!bankForm.bankName || !bankForm.accountName || !bankForm.accountNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = editingBank
        ? await procurementApiV2.updateVendorBank(vendor.id, editingBank.id, bankForm)
        : await procurementApiV2.addVendorBank(vendor.id, bankForm)

      if (response.success) {
        toast.success(editingBank ? 'Bank updated' : 'Bank added')
        setShowBankDialog(false)
        setEditingBank(null)
        setBankForm({ bankName: '', accountName: '', accountNumber: '', branchCode: '', swiftCode: '', currencyCode: 'USD' })
        loadVendorData()
      }
    } catch (error: any) {
      toast.error('Failed to save bank', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleEditBank = (bank: BankAccount) => {
    setEditingBank(bank)
    setBankForm({
      bankName: bank.bankName,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      branchCode: bank.branchCode,
      swiftCode: bank.swiftCode,
      currencyCode: bank.currencyCode
    })
    setShowBankDialog(true)
  }

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', selectedDocType)

      const response = await fetch(`/api/accounting/vendors/${vendor.id}/kyc-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Document uploaded')
        loadVendorData()
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error: any) {
      toast.error('Upload failed', { description: error.message })
    } finally {
      setUploadingDoc(false)
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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[95vw] sm:max-w-[1200px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between w-full">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span>{vendor?.name}</span>
                  <SheetDescription className="mt-0">
                    Vendor Registration Review
                  </SheetDescription>
                </div>
              </SheetTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  variant="gradient-create"
                  className="gap-2 rounded-full h-10 px-6 shadow-sm"
                  size="sm"
                >
                  {approving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejecting}
                  variant="gradient-danger"
                  className="gap-2 rounded-full h-10 px-6 shadow-sm"
                  size="sm"
                >
                  {rejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <XCircle className="w-4 h-4" />
                  Decline
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Vendor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      <p className="font-medium">{vendor.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{vendor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium">{vendor.contactPerson || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className="mt-1 bg-yellow-100 text-yellow-800">{vendor.registrationStatus}</Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Tax Compliance</p>
                      <Badge className={vendor.taxComplianceStatus === 'PENDING' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                        {vendor.taxComplianceStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Banks and Documents */}
              <Tabs defaultValue="banks" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="banks">Bank Accounts ({banks.length})</TabsTrigger>
                  <TabsTrigger value="documents">KYC Documents ({documents.length})</TabsTrigger>
                </TabsList>

                {/* Banks Tab */}
                <TabsContent value="banks" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Bank Accounts</h3>
                    <Button
                      onClick={() => {
                        setEditingBank(null)
                        setBankForm({ bankName: '', accountName: '', accountNumber: '', branchCode: '', swiftCode: '', currencyCode: 'USD' })
                        setShowBankDialog(true)
                      }}
                      size="sm"
                      variant="gradient-create"
                      className="gap-2 rounded-full h-9 px-4 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Bank
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {banks.map((bank) => (
                      <Card key={bank.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{bank.bankName}</p>
                                {bank.isPrimary && <Badge className="bg-green-100 text-green-800">Primary</Badge>}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{bank.accountName}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditBank(bank)}
                                size="sm"
                                variant="outline"
                                className="gap-1"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Account Number</p>
                              <p className="font-mono">{bank.accountNumber}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">SWIFT Code</p>
                              <p>{bank.swiftCode}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Branch Code</p>
                              <p>{bank.branchCode}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Currency</p>
                              <p>{bank.currencyCode}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">KYC Documents</h3>
                    <label className="cursor-pointer">
                      <Button size="sm" variant="gradient-info" className="gap-2 rounded-full h-9 px-4 shadow-sm" asChild>
                        <span>
                          <Plus className="w-4 h-4" />
                          Upload
                        </span>
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleUploadDoc}
                        disabled={uploadingDoc}
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="font-semibold">{doc.documentType.replace(/_/g, ' ')}</p>
                                  <p className="text-sm text-gray-600">{doc.fileName}</p>
                                </div>
                              </div>
                              {doc.isVerified && (
                                <div className="flex items-center gap-1 mt-2 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-sm">Verified</span>
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleDownloadDoc(doc.id, doc.fileName)}
                              size="sm"
                              variant="outline"
                              className="gap-1"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Bank Dialog */}
      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBank ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bank Name</Label>
              <Input
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                placeholder="e.g., CBZ"
              />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input
                value={bankForm.accountName}
                onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                placeholder="e.g., Company Name"
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                placeholder="e.g., 1234567890"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Branch Code</Label>
                <Input
                  value={bankForm.branchCode}
                  onChange={(e) => setBankForm({ ...bankForm, branchCode: e.target.value })}
                />
              </div>
              <div>
                <Label>SWIFT Code</Label>
                <Input
                  value={bankForm.swiftCode}
                  onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBankDialog(false)} className="rounded-full h-10 px-6">Cancel</Button>
            <Button onClick={handleAddBank} disabled={loading} variant="gradient-create" className="rounded-full h-10 px-6 shadow-sm">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingBank ? 'Update' : 'Add'} Bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Vendor Application</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this vendor's application.
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
            <AlertDialogCancel disabled={rejecting} className="rounded-full h-10 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejecting || !rejectionReason.trim()}
              className="rounded-full h-10 px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              {rejecting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reject Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
