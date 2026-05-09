"use client"

import { useState, useEffect } from "react"
import { procurementApiV2, IntakeItemV2 } from "@/lib/api/procurement-api-v2"
import { accountingApi, Vendor } from "@/lib/api/accounting-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProcurementDrawer } from "./procurement-drawer"
import { Loader2, CheckCircle, AlertCircle, FileText, Zap, Search } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IntakeTimelineView } from "./intake-timeline-view"

export function InvoiceVerificationQueue() {
  const [queue, setQueue] = useState<IntakeItemV2[]>([])
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedIntake, setSelectedIntake] = useState<IntakeItemV2 | null>(null)
  
  // Loading states for actions
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  
  // Bill Creation Modal State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)
  const [billIntakeId, setBillIntakeId] = useState<string | null>(null)
  const [invoiceNumberOverride, setInvoiceNumberOverride] = useState('')
  const [invoiceDateOverride, setInvoiceDateOverride] = useState('')

  // Filters
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {
    loadQueue()
  }, [selectedVendor, selectedStatus])

  const loadVendors = async () => {
    try {
      const res = await accountingApi.getVendors({ isActive: true })
      if (res.success && res.data) {
        setVendors(res.data)
      }
    } catch (e) {
      console.error("Failed to load vendors")
    }
  }

  const loadQueue = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (selectedVendor !== "ALL") filters.vendorId = selectedVendor
      if (selectedStatus !== "ALL") filters.status = selectedStatus

      const response = await procurementApiV2.getSuite06Intakes(filters)
      if (response.success && response.data) {
        setQueue(response.data.items)
      }
    } catch (error) {
      toast.error("Failed to load verification queue")
    } finally {
      setLoading(false)
    }
  }

  const handleExtract = async (id: string) => {
    setActionLoadingId(`extract-${id}`)
    try {
      const response = await procurementApiV2.extractInvoiceData(id)
      if (response.success) {
        toast.success("Extraction complete")
        loadQueue()
      } else {
        toast.error("Extraction failed")
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleVerify = async (id: string) => {
    setActionLoadingId(`verify-${id}`)
    try {
      const response = await procurementApiV2.verifyInvoiceIntake(id)
      if (response.success) {
        toast.success("Invoice verified")
        loadQueue()
        setIsDrawerOpen(false)
      } else {
        toast.error("Verification failed")
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setActionLoadingId(null)
    }
  }

  const initiateCreateBill = (id: string, defaultData: any) => {
    setBillIntakeId(id)
    setInvoiceNumberOverride(defaultData?.invoiceNumber || '')
    setInvoiceDateOverride(defaultData?.invoiceDate ? new Date(defaultData.invoiceDate).toISOString().split('T')[0] : '')
    setIsBillModalOpen(true)
  }

  const handleCreateBill = async () => {
    if (!billIntakeId) return
    setActionLoadingId(`bill-${billIntakeId}`)
    try {
      const payload: any = {}
      if (invoiceNumberOverride) payload.invoiceNumberOverride = invoiceNumberOverride
      if (invoiceDateOverride) payload.invoiceDateOverride = new Date(invoiceDateOverride).toISOString()

      const response = await procurementApiV2.createDraftBillFromIntake(billIntakeId, payload)
      if (response.success) {
        toast.success("Draft bill created")
        loadQueue()
        setIsDrawerOpen(false)
        setIsBillModalOpen(false)
      } else {
        toast.error("Failed to create draft bill")
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setActionLoadingId(null)
      setBillIntakeId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case 'EXTRACTED':
        return <Badge className="bg-blue-100 text-blue-800">Extracted</Badge>
      case 'VERIFIED':
        return <Badge className="bg-purple-100 text-purple-800">Verified</Badge>
      case 'MATCHED':
        return <Badge className="bg-green-100 text-green-800">Matched</Badge>
      case 'DRAFT_BILL':
        return <Badge className="bg-emerald-100 text-emerald-800">Draft Bill</Badge>
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex-1 w-full">
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger>
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Vendors</SelectItem>
              {vendors.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 w-full">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="EXTRACTED">Extracted (Review)</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="MATCHED">Matched</SelectItem>
              <SelectItem value="DRAFT_BILL">Draft Bill</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : queue.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Intakes Found</h3>
            <p className="text-gray-500">Try adjusting your filters or upload a new invoice.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{queue.length} Invoices Found</h3>
              <p className="text-sm text-gray-600">Review, extract, and process AI intakes</p>
            </div>
            <Badge className="bg-amber-100 text-amber-800">{queue.filter(q => q.status === 'EXTRACTED').length} Need Review</Badge>
          </div>

          <div className="space-y-3">
            {queue.map((intake) => (
              <Card 
                key={intake.id} 
                className="cursor-pointer border border-gray-200 shadow-none hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setSelectedIntake(intake)
                  setIsDrawerOpen(true)
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <p className="font-semibold">
                          {intake.extractedPayloadJson?.invoiceNumber || intake.intakeNumber || 'Invoice'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {intake.vendor?.name || 'Unknown Vendor'}
                        </Badge>
                        {getStatusBadge(intake.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold">
                            {intake.extractedPayloadJson?.currencyCode || 'USD'} {intake.extractedPayloadJson?.totalAmount || intake.extractedPayloadJson?.lines?.reduce((sum: number, line: any) => sum + (line.lineTotal || 0), 0) || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Created At</p>
                          <p className="font-semibold">
                            {format(new Date(intake.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Confidence</p>
                          <p className="font-semibold">
                            {intake.overallConfidence
                              ? `${(parseFloat(intake.overallConfidence) * 100).toFixed(0)}%`
                              : '-'}
                          </p>
                        </div>
                      </div>

                      {intake.overallConfidence && parseFloat(intake.overallConfidence) < 0.8 && intake.status === 'EXTRACTED' && (
                        <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            Low confidence extraction. Please review carefully.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {intake.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="gradient-create"
                          className="rounded-full shadow-sm px-4"
                          disabled={actionLoadingId === `extract-${intake.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExtract(intake.id);
                          }}
                        >
                          {actionLoadingId === `extract-${intake.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Zap className="w-4 h-4 mr-1" />
                          )}
                          Extract
                        </Button>
                      )}
                      
                      {intake.status === 'EXTRACTED' && (
                        <Button
                          size="sm"
                          variant="gradient-update"
                          className="rounded-full shadow-sm px-4"
                          disabled={actionLoadingId === `bill-${intake.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateCreateBill(intake.id, intake.extractedPayloadJson);
                          }}
                        >
                          {actionLoadingId === `bill-${intake.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <FileText className="w-4 h-4 mr-1" />
                          )}
                          Create Bill
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail Drawer */}
      <ProcurementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title="Intake Details & Timeline"
        description="Track the lifecycle of this invoice intake"
        size="lg"
      >
        {selectedIntake && (
          <IntakeTimelineView 
             intake={selectedIntake} 
             onExtract={() => handleExtract(selectedIntake.id)}
             onVerify={() => handleVerify(selectedIntake.id)}
             onCreateBill={() => initiateCreateBill(selectedIntake.id, selectedIntake.extractedPayloadJson)}
             isLoading={!!actionLoadingId}
          />
        )}
      </ProcurementDrawer>

      {/* Draft Bill Payload Modal */}
      <Dialog open={isBillModalOpen} onOpenChange={setIsBillModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Draft Bill</DialogTitle>
            <DialogDescription>
              Optionally override the invoice number or date before processing. Leave blank to use extracted data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Invoice Number Override (Optional)</Label>
              <Input 
                value={invoiceNumberOverride}
                onChange={e => setInvoiceNumberOverride(e.target.value)}
                placeholder="e.g. INV-2026-0042"
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice Date Override (Optional)</Label>
              <Input 
                type="date"
                value={invoiceDateOverride}
                onChange={e => setInvoiceDateOverride(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBillModalOpen(false)}>Cancel</Button>
            <Button 
              variant="gradient-create" 
              className="rounded-full px-6"
              onClick={handleCreateBill}
              disabled={!!actionLoadingId}
            >
              {actionLoadingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Process Draft Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
