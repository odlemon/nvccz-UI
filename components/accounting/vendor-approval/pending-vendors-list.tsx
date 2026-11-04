'use client'

import { useState, useEffect } from 'react'
import { Loader2, Eye, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { AccountingExportControls } from '@/components/accounting/accounting-export-controls'
import { VendorApprovalDrawer } from './vendor-approval-drawer'

export function PendingVendorsList({ enhanced = false }: { enhanced?: boolean }) {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadPendingVendors()
  }, [])

  const loadPendingVendors = async () => {
    setLoading(true)
    try {
      const response = await procurementApiV2.getPendingVendors()
      if (response.success && response.data) {
        setVendors(Array.isArray(response.data) ? response.data : [])
        setCurrentPage(1)
      } else {
        throw new Error(response.message || 'Failed to load vendors')
      }
    } catch (error: any) {
      toast.error('Failed to load pending vendors', { description: error.message })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDrawer = (vendor: any) => {
    setSelectedVendor(vendor)
    setDrawerOpen(true)
  }

  const handleApprovalChange = () => {
    loadPendingVendors()
  }

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(vendors.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const visibleVendors = enhanced ? vendors.slice((page - 1) * pageSize, page * pageSize) : vendors
  const exportControls = enhanced ? <AccountingExportControls label="pending vendors" spec={{ title: "Pending Vendor Approvals", filename: "pending-vendor-approvals", columns: ["Name", "Contact Person", "Email", "Tax Compliance", "Submitted"], rows: vendors.map(vendor => [vendor.name || "", vendor.contactPerson || "", vendor.email || "", vendor.taxComplianceStatus || "", vendor.createdAt?.slice(0, 10) || ""]) }} /> : null

  if (loading) {
    if (enhanced) return <div className="space-y-4 py-4" aria-label="Loading pending vendors">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="p-6 space-y-3"><Skeleton className="h-5 w-56" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>)}</div>
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12">
        {enhanced && <div className="flex justify-end mb-4">{exportControls}</div>}
        <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No pending vendor approvals</p>
      </div>
    )
  }

  return (
    <>
      {enhanced && <div className="flex justify-end">{exportControls}</div>}
      <div className="space-y-4">
        {visibleVendors.map((vendor) => (
          <Card key={vendor.id} className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-3">
                    <div>
                      <p className="text-gray-500">Contact Person</p>
                      <p className="font-medium text-gray-900">{vendor.contactPerson || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{vendor.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tax Compliance</p>
                      <Badge className={vendor.taxComplianceStatus === 'PENDING' ? 'bg-orange-100 text-orange-800 mt-1' : 'bg-green-100 text-green-800 mt-1'}>
                        {vendor.taxComplianceStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Submitted</p>
                      <p className="font-medium text-gray-900">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <Button
                  onClick={() => handleOpenDrawer(vendor)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {enhanced && totalPages > 1 && <div className="flex items-center justify-between mt-5"><span className="text-sm text-gray-600">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, vendors.length)} of {vendors.length}</span><Pagination><PaginationContent><PaginationItem><PaginationPrevious onClick={() => setCurrentPage(Math.max(1, page - 1))} className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const n = Math.max(1, Math.min(totalPages - 4, page - 2)) + i; return <PaginationItem key={n}><PaginationLink onClick={() => setCurrentPage(n)} isActive={page === n} className="cursor-pointer">{n}</PaginationLink></PaginationItem> })}<PaginationItem><PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, page + 1))} className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem></PaginationContent></Pagination></div>}

      {selectedVendor && (
        <VendorApprovalDrawer
          vendor={selectedVendor}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onApprovalChange={handleApprovalChange}
        />
      )}
    </>
  )
}
