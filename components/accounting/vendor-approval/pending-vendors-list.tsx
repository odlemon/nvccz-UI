'use client'

import { useState, useEffect } from 'react'
import { Loader2, Eye, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VendorApprovalDrawer } from './vendor-approval-drawer'

export function PendingVendorsList() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    loadPendingVendors()
  }, [])

  const loadPendingVendors = async () => {
    setLoading(true)
    try {
      const response = await procurementApiV2.getPendingVendors()
      if (response.success && response.data) {
        setVendors(Array.isArray(response.data) ? response.data : [])
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No pending vendor approvals</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {vendors.map((vendor) => (
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
