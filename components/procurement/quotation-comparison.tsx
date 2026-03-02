// ============================================================================
// QUOTATION COMPARISON MODAL
// Side-by-side comparison of vendor quotations for an RFQ
// ============================================================================

'use client'

import React, { useEffect } from 'react'
// import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchQuotationsByRfq,
  acceptQuotation,
  rejectQuotation,
} from '@/lib/store/slices/procurementV2Slice'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, XCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import type { Quotation } from '@/lib/api/procurement-api-v2'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { useProcurementPermissions } from '@/lib/hooks/useProcurementPermissions'

interface QuotationComparisonModalProps {
  rfqNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotationComparisonModal({
  rfqNumber,
  open,
  onOpenChange,
}: QuotationComparisonModalProps) {
  const dispatch = useAppDispatch()
  const quotations = useAppSelector((state) =>
    state.procurementV2.quotations.filter((q) => q.rfqNumber === rfqNumber)
  )
  const { permissions } = useProcurementPermissions()

  useEffect(() => {
    if (open && rfqNumber) {
      dispatch(fetchQuotationsByRfq(rfqNumber))
    }
  }, [dispatch, open, rfqNumber])

  if (quotations.length === 0) {
    return null
  }

  // Calculate statistics
  const totalAmounts = quotations.map((q) => Number(q.totalAmount))
  const minAmount = Math.min(...totalAmounts)
  const maxAmount = Math.max(...totalAmounts)
  const avgAmount = totalAmounts.reduce((a, b) => a + b, 0) / totalAmounts.length

  // Get all unique items across quotations
  const allItemNames = new Set<string>()
  quotations.forEach((q) => {
    q.items.forEach((item) => allItemNames.add(item.itemName))
  })
  const sortedItemNames = Array.from(allItemNames).sort()

  const handleAccept = async (quotationId: string) => {
    if (!permissions.canAcceptQuotation) return
    try {
      await dispatch(acceptQuotation(quotationId)).unwrap()
    } catch (error) {
      console.error('Failed to accept quotation:', error)
    }
  }

  const handleReject = async (quotationId: string) => {
    if (!permissions.canRejectQuotation) return
    try {
      await dispatch(rejectQuotation({
        id: quotationId,
        rejectionReason: 'Not selected',
        reviewNotes: 'Price not competitive'
      })).unwrap()
    } catch (error) {
      console.error('Failed to reject quotation:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Quotation Comparison</DialogTitle>
          <DialogDescription>
            Compare {quotations.length} quotations for RFQ {rfqNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Statistics Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span>Lowest Quote</span>
                </div>
                <p className="text-2xl font-bold text-green-600">${minAmount.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Average Quote</span>
                </div>
                <p className="text-2xl font-bold">${avgAmount.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <span>Highest Quote</span>
                </div>
                <p className="text-2xl font-bold text-red-600">${maxAmount.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Vendor Overview Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Vendor Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotations.map((quotation) => (
                <Card
                  key={quotation.id}
                  className={`${Number(quotation.totalAmount) === minAmount
                      ? 'border-green-500 border-2'
                      : ''
                    }`}
                >
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{quotation.companyName}</h4>
                        <p className="text-xs text-muted-foreground">{quotation.vendorEmail}</p>
                      </div>
                      {Number(quotation.totalAmount) === minAmount && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-500">
                          Best Price
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="font-bold">${Number(quotation.totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid Until:</span>
                        <span>{quotation.validUntil}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <QuotationStatusBadge status={quotation.status} />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Delivery Terms</p>
                      <p className="text-xs line-clamp-2">{quotation.deliveryTerms}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Payment Terms</p>
                      <p className="text-xs line-clamp-2">{quotation.paymentTerms}</p>
                    </div>

                    {quotation.status === 'SUBMITTED' && (
                      <div className="flex gap-2 pt-2">
                        {permissions.canAcceptQuotation && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleAccept(quotationId)}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Accept
                          </Button>
                        )}
                        {permissions.canRejectQuotation && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleReject(quotationId)}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Item-by-Item Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Item-by-Item Price Comparison</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Item Name</TableHead>
                    {quotations.map((quotation) => (
                      <TableHead key={quotation.id} className="text-center">
                        <div className="font-semibold">{quotation.companyName}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          ${Number(quotation.totalAmount).toFixed(2)} total
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItemNames.map((itemName) => {
                    // Find prices for this item across all quotations
                    const itemPrices = quotations.map((q) => {
                      const item = q.items.find((i) => i.itemName === itemName)
                      return item
                        ? {
                          unitPrice: Number(item.unitPrice),
                          totalPrice: Number(item.totalPrice),
                          quantity: item.quantity,
                          unit: item.unit,
                        }
                        : null
                    })

                    const validPrices = itemPrices
                      .filter((p) => p !== null)
                      .map((p) => p!.unitPrice)
                    const minUnitPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0

                    return (
                      <TableRow key={itemName}>
                        <TableCell className="font-medium">{itemName}</TableCell>
                        {itemPrices.map((itemData, index) => {
                          if (!itemData) {
                            return (
                              <TableCell key={index} className="text-center text-muted-foreground">
                                -
                              </TableCell>
                            )
                          }

                          const isLowest = itemData.unitPrice === minUnitPrice

                          return (
                            <TableCell
                              key={index}
                              className={`text-center ${isLowest ? 'bg-green-50 font-semibold text-green-700' : ''
                                }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                  <span>${itemData.unitPrice.toFixed(2)}</span>
                                  {isLowest && <TrendingDown className="h-3 w-3" />}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {itemData.quantity} {itemData.unit}
                                </div>
                                <div className="text-xs font-medium">
                                  Total: ${itemData.totalPrice.toFixed(2)}
                                </div>
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}

                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>TOTAL</TableCell>
                    {quotations.map((quotation) => {
                      const isLowest = Number(quotation.totalAmount) === minAmount
                      return (
                        <TableCell
                          key={quotation.id}
                          className={`text-center text-lg ${isLowest ? 'bg-green-100 text-green-700' : ''
                            }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>${Number(quotation.totalAmount).toFixed(2)}</span>
                            {isLowest && <TrendingDown className="h-4 w-4" />}
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Savings Comparison */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Cost Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Price Range:</span>
                <span className="ml-2 font-medium">
                  ${minAmount.toFixed(2)} - ${maxAmount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Potential Savings:</span>
                <span className="ml-2 font-medium text-green-600">
                  ${(maxAmount - minAmount).toFixed(2)} ({(((maxAmount - minAmount) / maxAmount) * 100).toFixed(1)}%)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Vendors:</span>
                <span className="ml-2 font-medium">{quotations.length} quotations</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QuotationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    SUBMITTED: { className: 'bg-blue-100 text-blue-800', label: 'Submitted' },
    UNDER_REVIEW: { className: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
    ACCEPTED: { className: 'bg-green-100 text-green-800', label: 'Accepted' },
    REJECTED: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
  }

  const { className, label } = config[status] || config.SUBMITTED

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
