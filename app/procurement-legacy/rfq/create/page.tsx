// ============================================================================
// CREATE RFQ PAGE
// Multi-step form for creating RFQs from approved requisitions
// ============================================================================

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchRequisitions } from '@/lib/store/slices/procurementV2Slice'
import { accountingApi, type Vendor } from '@/lib/api/accounting-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Package,
  Users,
  Calendar,
  AlertCircle,
  Search,
} from 'lucide-react'
import { CopyBadge } from '@/components/procurement/copy-helper'
import { toast } from 'sonner'
import { procurementApiV2, type CreateRFQRequest } from '@/lib/api/procurement-api-v2'

export default function CreateRFQPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { requisitions, requisitionsLoading } = useAppSelector(state => state.procurementV2)
  
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [requisitionSearch, setRequisitionSearch] = useState('')
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [selectedRequisitionId, setSelectedRequisitionId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedVendorEmails, setSelectedVendorEmails] = useState<string[]>([])
  const [requirements, setRequirements] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Fetch approved requisitions
      await dispatch(fetchRequisitions({ status: 'APPROVED', limit: 100, offset: 0 })).unwrap()
      
      // Fetch all vendors from accounting
      setVendorsLoading(true)
      const vendorResponse = await accountingApi.getVendors()
      if (vendorResponse.success && vendorResponse.data) {
        setVendors(vendorResponse.data)
      }
    } catch (error: any) {
      toast.error('Error loading data', { description: error.message })
    } finally {
      setVendorsLoading(false)
    }
  }

  const selectedRequisition = requisitions.find((r) => r.id === selectedRequisitionId)
  
  // Filter requisitions based on search
  const filteredRequisitions = requisitions.filter(req => 
    req.requisitionNumber.toLowerCase().includes(requisitionSearch.toLowerCase()) ||
    req.title.toLowerCase().includes(requisitionSearch.toLowerCase())
  )
  
  // Auto-populate title and description when requisition is selected
  useEffect(() => {
    if (selectedRequisition) {
      setTitle(`RFQ for ${selectedRequisition.title}`)
      setDescription(selectedRequisition.description || '')
    }
  }, [selectedRequisition])

  const toggleVendor = (vendorEmail: string) => {
    setSelectedVendorEmails((prev) =>
      prev.includes(vendorEmail) ? prev.filter((email) => email !== vendorEmail) : [...prev, vendorEmail]
    )
  }

  const isStep1Valid = () => {
    return selectedRequisitionId !== '' && title.trim() !== '' && deadline !== ''
  }

  const isStep2Valid = () => {
    return selectedVendorEmails.length >= 3
  }

  const handleSubmit = async () => {
    if (!isStep1Valid() || !isStep2Valid() || !selectedRequisition) return

    setIsSubmitting(true)
    try {
      const rfqData: CreateRFQRequest = {
        requisitionId: selectedRequisitionId,
        title,
        description,
        rfqDeadline: deadline,
        specialRequirements: requirements || undefined,
        deliveryAddress: undefined,
        vendorIds: selectedVendorEmails, // Using vendor emails as IDs
        items: selectedRequisition.items.map(item => ({
          itemName: item.itemName,
          description: item.description || '',
          quantity: Number(item.quantity),
          unit: item.unit,
          specifications: item.specifications || {}
        }))
      }

      const response = await procurementApiV2.createRFQ(rfqData)
      
      if (response.success && response.data) {
        toast.success('RFQ created successfully!')
        router.push(`/procurement/rfq/${response.data.rfqNumber}`)
      } else {
        toast.error('Failed to create RFQ')
      }
    } catch (error: any) {
      toast.error('Error creating RFQ', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const approvedRequisitions = requisitions.filter((r: any) => r.status === 'APPROVED')

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Request for Quotation</h1>
          <p className="text-muted-foreground mt-1">
            {step === 1 && 'Select requisition and set RFQ details'}
            {step === 2 && 'Select vendors to receive the RFQ'}
            {step === 3 && 'Review and submit'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        <div className={`h-2 w-24 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`h-2 w-24 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`h-2 w-24 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
      </div>

      {/* Step 1: Basic Details */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Requisition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {requisitionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading requisitions...</p>
                </div>
              ) : approvedRequisitions.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No approved requisitions available. Please approve a requisition first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search requisitions by number or title..."
                      value={requisitionSearch}
                      onChange={(e) => setRequisitionSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Requisition selector */}
                  <div className="space-y-2">
                    <Label>
                      Requisition <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedRequisitionId} onValueChange={setSelectedRequisitionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a requisition" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredRequisitions.map((req) => (
                          <SelectItem key={req.id} value={req.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{req.requisitionNumber}</span>
                              <span className="text-sm text-muted-foreground">{req.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {selectedRequisition && (
                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedRequisition.title}</h4>
                      <CopyBadge text={selectedRequisition.requisitionNumber} className="mt-2" />
                    </div>

                    {selectedRequisition.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedRequisition.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Department:</span>
                        <span className="ml-2 font-medium">{selectedRequisition.department}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Items:</span>
                        <span className="ml-2 font-medium">{selectedRequisition.items.length}</span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Requested By</Label>
                      <div className="text-sm">
                        {selectedRequisition.requestedBy.firstName} {selectedRequisition.requestedBy.lastName}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs text-muted-foreground mb-3 block">Items</Label>
                      <div className="space-y-2">
                        {selectedRequisition.items.map((item, index) => (
                          <div key={item.id || index} className="flex items-center justify-between text-sm border rounded p-2">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{item.itemName}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                RFQ Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  RFQ Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., RFQ for Office Supplies"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about this RFQ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">
                  Response Deadline <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Vendors must submit their quotations before this date and time
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Special Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Any specific requirements or conditions..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Select Vendors */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Vendors
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select at least 3 vendors to receive this RFQ
            </p>
          </CardHeader>
          <CardContent>
            {vendorsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading vendors...</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No vendors available. Please add vendors first.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {vendors.map((vendor) => (
                  <Card
                    key={vendor.id}
                    className={`cursor-pointer transition-colors ${
                      selectedVendorEmails.includes(vendor.email) ? 'border-primary border-2' : ''
                    }`}
                    onClick={() => toggleVendor(vendor.email)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedVendorEmails.includes(vendor.email)}
                          onCheckedChange={() => toggleVendor(vendor.email)}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{vendor.companyName}</h4>
                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                            <p>{vendor.contactPerson}</p>
                            <p>{vendor.email}</p>
                            {vendor.phone && <p>{vendor.phone}</p>}
                            {vendor.address && <p className="line-clamp-1">{vendor.address}</p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Selected:</span> {selectedVendorEmails.length} vendor(s)
                {selectedVendorEmails.length < 3 && (
                  <span className="text-destructive ml-2">(Minimum 3 required)</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                RFQ Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Title</Label>
                <p className="font-semibold">{title}</p>
              </div>

              {description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="text-sm">{description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Requisition</Label>
                  {selectedRequisition && (
                    <CopyBadge text={selectedRequisition.requisitionNumber} />
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Deadline</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(deadline).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {requirements && (
                <div>
                  <Label className="text-sm text-muted-foreground">Requirements</Label>
                  <p className="text-sm">{requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedRequisition && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items ({selectedRequisition.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedRequisition.items.map((item, index) => (
                    <Card key={item.id || index}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.itemName}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {item.quantity} {item.unit}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Selected Vendors ({selectedVendorEmails.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vendors
                  .filter((v) => selectedVendorEmails.includes(v.email))
                  .map((vendor) => (
                    <Card key={vendor.id}>
                      <CardContent className="py-3">
                        <h4 className="font-medium">{vendor.companyName}</h4>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>

          {step < 3 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !isStep1Valid() : !isStep2Valid()}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {step === 3 && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create RFQ
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
