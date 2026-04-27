"use client"

import { useState, useEffect } from "react"
import { procurementApiV2 } from "@/lib/api/procurement-api-v2"
import { RFQ } from "@/lib/api/procurement-api-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, Package, AlertCircle } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { toast } from "sonner"

export function PublicTendersPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPublicRfqs()
  }, [])

  const loadPublicRfqs = async () => {
    try {
      setLoading(true)
      const response = await procurementApiV2.getPublicRFQs()
      if (response.success && response.data) {
        setRfqs(response.data)
        setError(null)
      } else {
        setError('Failed to load public tenders')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load public tenders')
      toast.error('Failed to load public tenders')
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date())
    return days
  }

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'bg-red-100 text-red-800'
    if (days <= 3) return 'bg-red-100 text-red-800'
    if (days <= 7) return 'bg-amber-100 text-amber-800'
    return 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading public tenders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Tenders</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
              <Button onClick={loadPublicRfqs} className="mt-3" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Public Tenders</h1>
          <p className="text-gray-600 mt-2">Explore and submit quotations for open RFQs</p>
        </div>

        {/* Tenders Grid */}
        {rfqs.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Open Tenders</h3>
              <p className="text-gray-500">Check back later for new RFQ opportunities</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rfqs.map((rfq) => {
              const daysRemaining = getDaysRemaining(rfq.rfqDeadline || '')
              const isExpired = daysRemaining < 0

              return (
                <Card key={rfq.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {rfq.rfqNumber}
                        </Badge>
                        <CardTitle className="text-lg line-clamp-2">{rfq.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {rfq.description || 'No description provided'}
                    </p>

                    {/* Items Count */}
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        {rfq.items?.length || 0} item{rfq.items?.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Deadline Badge */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-gray-500">Closing Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {rfq.rfqDeadline ? format(new Date(rfq.rfqDeadline), 'MMM dd, yyyy') : '-'}
                        </p>
                      </div>
                      {!isExpired && (
                        <Badge className={getUrgencyColor(daysRemaining)}>
                          {daysRemaining === 0
                            ? 'Today'
                            : daysRemaining === 1
                            ? '1 day'
                            : `${daysRemaining} days`}
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
                      )}
                    </div>

                    {/* Vendors Count */}
                    {rfq.vendors && rfq.vendors.length > 0 && (
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        {rfq.vendors.length} vendor{rfq.vendors.length !== 1 ? 's' : ''} invited
                      </div>
                    )}
                  </CardContent>
                  <div className="border-t p-4">
                    <Button
                      asChild
                      disabled={isExpired}
                      className="w-full rounded-full"
                    >
                      <a href={isExpired ? '#' : `/public-tenders/${rfq.rfqNumber}/submit`}>
                        {isExpired ? 'Tender Closed' : 'View & Submit Quotation'}
                      </a>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
