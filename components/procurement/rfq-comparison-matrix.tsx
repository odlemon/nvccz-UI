'use client'

import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { getComparisonMatrix, awardRFQ } from '@/lib/store/slices/procurementV2Slice'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, TrendingDown, AlertCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ComparisonMatrixDrawerProps {
  rfqId: string
  isOpen: boolean
  onClose: () => void
}

export function RFQComparisonMatrix({ rfqId, isOpen, onClose }: ComparisonMatrixDrawerProps) {
  const dispatch = useAppDispatch()
  const { comparisonMatrix } = useAppSelector((state) => state.procurementV2)
  const [loading, setLoading] = useState(false)
  const [awardingVendorId, setAwardingVendorId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && rfqId) {
      setLoading(true)
      dispatch(getComparisonMatrix(rfqId)).finally(() => setLoading(false))
    }
  }, [isOpen, rfqId, dispatch])

  const handleAward = async (quotationId: string, vendorName: string) => {
    setAwardingVendorId(quotationId)
    try {
      await dispatch(awardRFQ({ rfqId, quotationId })).unwrap()
      toast.success(`RFQ awarded to ${vendorName}`)
      onClose()
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to award RFQ'
      toast.error('Award failed', { description })
    } finally {
      setAwardingVendorId(null)
    }
  }

  const getCheapestForRow = (itemIndex: number) => {
    if (!comparisonMatrix?.vendors) return null
    let cheapest = null
    let minPrice = Infinity

    comparisonMatrix.vendors.forEach((vendor) => {
      const price = parseFloat(vendor.itemPrices?.[itemIndex] || '0')
      if (price > 0 && price < minPrice) {
        minPrice = price
        cheapest = vendor.id
      }
    })
    return cheapest
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>RFQ Comparison Matrix</DialogTitle>
          <DialogDescription>Compare all vendor quotations side-by-side (prices normalized to {comparisonMatrix?.vendors?.[0]?.currencyCode || 'USD'})</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !comparisonMatrix ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            No comparison data available
          </div>
        ) : comparisonMatrix.sealed ? (
          <div className="space-y-4 py-6">
            <Card className="border-l-4 border-l-amber-500 bg-amber-50">
              <CardContent className="pt-6 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900">Bids Are Sealed</h3>
                  <p className="text-sm text-amber-800 mt-1">{comparisonMatrix.message || 'All vendor bids are sealed until the RFQ closing time.'}</p>
                  {comparisonMatrix.closingAt && (
                    <p className="text-sm text-amber-700 mt-2">
                      Closes: <span className="font-medium">{format(new Date(comparisonMatrix.closingAt), 'PPp')}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Participating Vendors</h3>
              <div className="space-y-2">
                {comparisonMatrix.vendors?.map((vendor) => (
                  <div key={vendor.quotationId} className="p-3 bg-white border rounded flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{vendor.vendorName}</p>
                      <p className="text-sm text-gray-600">{vendor.vendorEmail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Matrix Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[250px]">Item</th>
                    {comparisonMatrix.vendors.map((vendor) => (
                      <th key={vendor.id} className="px-4 py-3 text-center font-semibold text-gray-900 min-w-[200px]">
                        <div className="text-sm font-medium">{vendor.vendorName}</div>
                        <div className="text-xs text-gray-600 font-normal">{vendor.vendorEmail}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonMatrix.items.map((item, itemIndex) => {
                    const cheapestVendor = getCheapestForRow(itemIndex)
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.itemName}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity} {item.unit}</p>
                          </div>
                        </td>
                        {comparisonMatrix.vendors.map((vendor) => {
                          const price = parseFloat(vendor.itemPrices?.[itemIndex] || '0')
                          const isCheapest = vendor.id === cheapestVendor && price > 0
                          return (
                            <td
                              key={`${vendor.id}-${itemIndex}`}
                              className={`px-4 py-3 text-center ${
                                isCheapest ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                              }`}
                            >
                              <p className={`font-semibold ${isCheapest ? 'text-green-600' : 'text-gray-900'}`}>
                                {price > 0 ? `${vendor.currencyCode} ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                              </p>
                              {isCheapest && (
                                <div className="flex items-center justify-center gap-1 text-xs text-green-600 mt-1">
                                  <TrendingDown size={14} />
                                  Best price
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-3">Total Quote</td>
                    {comparisonMatrix.vendors.map((vendor) => (
                      <td key={`total-${vendor.id}`} className="px-4 py-3 text-center text-gray-900">
                        {vendor.currencyCode} {parseFloat(vendor.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Award Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Award RFQ</h3>
              <p className="text-sm text-gray-600 mb-4">Select a vendor to award this RFQ to them</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {comparisonMatrix.vendors.map((vendor) => (
                  <Button
                    key={vendor.id}
                    onClick={() => handleAward(vendor.quotationId, vendor.vendorName)}
                    disabled={!!awardingVendorId}
                    variant="outline"
                    className="justify-between h-auto p-3 hover:bg-blue-100"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{vendor.vendorName}</p>
                      <p className="text-xs text-gray-600">{vendor.currencyCode} {parseFloat(vendor.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    {awardingVendorId === vendor.quotationId && <Loader2 className="w-4 h-4 animate-spin" />}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
