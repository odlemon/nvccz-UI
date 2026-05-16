'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { getComparisonMatrix, awardRFQ } from '@/lib/store/slices/procurementV2Slice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, TrendingDown, AlertCircle, Lock, Trophy, Star, BarChart2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface RFQComparisonMatrixProps {
  rfqId: string
  /** When true, fetch and display immediately on mount (tab usage). */
  autoLoad?: boolean
}

const getInitials = (name?: string) => {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

const fmtMoney = (amount: number | string | null | undefined, code = 'USD') => {
  const n = typeof amount === 'number' ? amount : parseFloat((amount as string) || '0')
  return `${code} ${Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`
}

const fmtScore = (n: number | null | undefined) => {
  if (n == null) return '-'
  return Number(n).toFixed(1)
}

export function RFQComparisonMatrix({ rfqId, autoLoad = true }: RFQComparisonMatrixProps) {
  const dispatch = useAppDispatch()
  const { comparisonMatrix } = useAppSelector((state) => state.procurementV2)
  const [loading, setLoading] = useState(false)
  const [awardingQuotationId, setAwardingQuotationId] = useState<string | null>(null)

  useEffect(() => {
    if (autoLoad && rfqId) {
      setLoading(true)
      dispatch(getComparisonMatrix(rfqId)).finally(() => setLoading(false))
    }
  }, [autoLoad, rfqId, dispatch])

  const rows = comparisonMatrix?.rows ?? []
  const highlights = comparisonMatrix?.highlights
  const rfqMeta = comparisonMatrix?.rfq

  // Unique items across all quotations (so we can render a per-item matrix).
  const matrixItems = useMemo(() => {
    const map = new Map<string, { itemName: string; unit?: string }>()
    for (const row of rows) {
      for (const it of row.quotation.items || []) {
        const key = it.itemName?.trim().toLowerCase()
        if (!key) continue
        if (!map.has(key)) {
          map.set(key, { itemName: it.itemName, unit: it.unit })
        }
      }
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }))
  }, [rows])

  // For each item key, find the cheapest vendor by unit price.
  const cheapestByItem = useMemo(() => {
    const result: Record<string, string | null> = {}
    for (const item of matrixItems) {
      let cheapestQid: string | null = null
      let min = Infinity
      for (const row of rows) {
        const match = row.quotation.items.find(
          (it) => it.itemName?.trim().toLowerCase() === item.key
        )
        if (!match) continue
        const up = typeof match.unitPrice === 'number' ? match.unitPrice : parseFloat(String(match.unitPrice || '0'))
        if (up > 0 && up < min) {
          min = up
          cheapestQid = row.quotation.id
        }
      }
      result[item.key] = cheapestQid
    }
    return result
  }, [rows, matrixItems])

  const handleAward = async (quotationId: string, vendorName: string) => {
    setAwardingQuotationId(quotationId)
    try {
      await dispatch(awardRFQ({ rfqId, quotationId })).unwrap()
      toast.success(`RFQ awarded to ${vendorName}`)
      // Refresh so the awarded badge appears.
      dispatch(getComparisonMatrix(rfqId))
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to award RFQ'
      toast.error('Award failed', { description })
    } finally {
      setAwardingQuotationId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-3 text-sm text-gray-500">Loading comparison matrix...</span>
      </div>
    )
  }

  if (!comparisonMatrix) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        No comparison data available
      </div>
    )
  }

  // Sealed-bid state (kept for backwards compat with older response shape).
  if (comparisonMatrix.sealed) {
    return (
      <div className="space-y-4 py-2">
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Bids Are Sealed</h3>
              <p className="text-sm text-amber-800 mt-1">
                {comparisonMatrix.message || 'All vendor bids are sealed until the RFQ closing time.'}
              </p>
              {comparisonMatrix.closingAt && (
                <p className="text-sm text-amber-700 mt-2">
                  Closes:{' '}
                  <span className="font-medium">{format(new Date(comparisonMatrix.closingAt), 'PPp')}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart2 className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-700">No quotations to compare yet</p>
        <p className="text-xs text-gray-500 mt-1">Vendor submissions will appear here for side-by-side comparison.</p>
      </div>
    )
  }

  const reportingCode =
    rows[0]?.comparison?.reportingCurrencyCode ||
    rows[0]?.quotation?.currencyCode ||
    'USD'

  const awardedQuotationId = rfqMeta?.awardedQuotationId

  return (
    <div className="space-y-6">
      {/* Highlights */}
      {highlights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {highlights.lowestNormalizedCost && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Lowest Cost</p>
                </div>
                <p className="font-semibold text-gray-900 truncate">{highlights.lowestNormalizedCost.vendorName}</p>
                <p className="text-sm text-gray-600">
                  {fmtMoney(highlights.lowestNormalizedCost.normalizedTotalReporting, highlights.lowestNormalizedCost.reportingCurrencyCode || highlights.lowestNormalizedCost.currencyCode)}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{highlights.lowestNormalizedCost.quotationNumber}</p>
              </CardContent>
            </Card>
          )}
          {highlights.highestCompositeScore && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Best Composite Score</p>
                </div>
                <p className="font-semibold text-gray-900 truncate">{highlights.highestCompositeScore.vendorName}</p>
                <p className="text-sm text-gray-600">
                  Score: <span className="font-semibold">{fmtScore(highlights.highestCompositeScore.compositeScore)}</span>
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{highlights.highestCompositeScore.quotationNumber}</p>
              </CardContent>
            </Card>
          )}
          {highlights.highestVendorRating ? (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Top Rated Vendor</p>
                </div>
                <p className="font-semibold text-gray-900 truncate">{highlights.highestVendorRating.vendorName}</p>
                <p className="text-sm text-gray-600">
                  Rating: <span className="font-semibold">{fmtScore(highlights.highestVendorRating.vendorRating)}</span>
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{highlights.highestVendorRating.quotationNumber}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-gray-50/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Top Rated Vendor</p>
                </div>
                <p className="text-sm text-gray-500">No vendor ratings available yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Weights / FX context */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <Badge variant="outline" className="font-normal">
          {rows.length} quotation{rows.length === 1 ? '' : 's'} compared
        </Badge>
        {(rfqMeta?.priceWeight != null && rfqMeta?.technicalWeight != null) && (
          <Badge variant="outline" className="font-normal">
            Weights — Price {(rfqMeta.priceWeight * 100).toFixed(0)}% / Technical {(rfqMeta.technicalWeight * 100).toFixed(0)}%
          </Badge>
        )}
        <Badge variant="outline" className="font-normal">
          Normalized to {reportingCode}
        </Badge>
      </div>

      {/* Scoring summary table */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Vendor Scoring</h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">Vendor</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">Totals</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">Scores</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700">Status</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const q = row.quotation
                  const c = row.comparison
                  const isAwarded = awardedQuotationId === q.id
                  const isRejected = q.status === 'REJECTED'
                  return (
                    <tr key={q.id} className={`border-b last:border-b-0 ${isAwarded ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-blue-600 text-white text-[10px] font-semibold">
                              {getInitials(q.companyName || q.vendorName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-xs leading-tight">{q.companyName || q.vendorName}</p>
                            <p className="text-[10px] text-gray-500 font-mono truncate">{q.quotationNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="space-y-0.5">
                          <p className="text-gray-700">{fmtMoney(q.totalAmount, q.currencyCode)}</p>
                          <p className="text-gray-900 font-medium">
                            {fmtMoney(c.normalizedTotalReporting, c.reportingCurrencyCode || q.currencyCode)}
                          </p>
                          {c.fxRateUsed && c.fxRateUsed !== 1 && (
                            <p className="text-[10px] text-gray-500">FX × {c.fxRateUsed}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="space-y-0.5">
                          <p className="text-gray-600">
                            <span className="text-gray-400">Price</span> {fmtScore(c.priceScore)}
                          </p>
                          <p className="text-gray-600">
                            <span className="text-gray-400">Tech</span> {fmtScore(c.technicalScore)}
                          </p>
                          <p className="font-semibold text-blue-700">
                            <span className="text-gray-400 font-normal">Comp</span> {fmtScore(c.compositeScore)}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {isAwarded ? (
                          <Badge className="bg-emerald-100 text-emerald-800 gap-1 text-[10px] px-1.5 py-0.5">
                            <Trophy className="w-3 h-3" /> Awarded
                          </Badge>
                        ) : isRejected ? (
                          <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5">Rejected</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5">{q.status.replace('_', ' ')}</Badge>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {!awardedQuotationId && !isRejected && (
                          <Button
                            size="sm"
                            variant="gradient-create"
                            className="rounded-full h-7 px-3 text-[11px] shadow-sm"
                            onClick={() => handleAward(q.id, q.companyName || q.vendorName)}
                            disabled={!!awardingQuotationId}
                          >
                            {awardingQuotationId === q.id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Award
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Per-item price matrix */}
      {matrixItems.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Per-Item Unit Pricing</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[220px]">Item</th>
                    {rows.map((row) => (
                      <th key={row.quotation.id} className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[160px]">
                        <div className="text-xs font-medium truncate">{row.quotation.companyName || row.quotation.vendorName}</div>
                        <div className="text-[10px] text-gray-500 font-normal font-mono">{row.quotation.quotationNumber}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixItems.map((item) => {
                    const cheapest = cheapestByItem[item.key]
                    return (
                      <tr key={item.key} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.itemName}</p>
                          {item.unit && <p className="text-xs text-gray-500">per {item.unit}</p>}
                        </td>
                        {rows.map((row) => {
                          const it = row.quotation.items.find(
                            (i) => i.itemName?.trim().toLowerCase() === item.key
                          )
                          const up = it ? (typeof it.unitPrice === 'number' ? it.unitPrice : parseFloat(String(it.unitPrice || '0'))) : null
                          const qty = it ? (typeof it.quantity === 'number' ? it.quantity : parseFloat(String(it.quantity || '0'))) : null
                          const isCheapest = !!up && up > 0 && cheapest === row.quotation.id
                          return (
                            <td
                              key={`${item.key}-${row.quotation.id}`}
                              className={`px-4 py-3 text-center ${isCheapest ? 'bg-emerald-50' : ''}`}
                            >
                              {up && up > 0 ? (
                                <>
                                  <p className={`font-semibold ${isCheapest ? 'text-emerald-700' : 'text-gray-900'}`}>
                                    {fmtMoney(up, row.quotation.currencyCode)}
                                  </p>
                                  {qty != null && qty > 0 && (
                                    <p className="text-[10px] text-gray-500">× {qty} = {fmtMoney(up * qty, row.quotation.currencyCode)}</p>
                                  )}
                                  {isCheapest && (
                                    <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-700 mt-0.5">
                                      <TrendingDown className="w-3 h-3" /> Best
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-3">Quote Total</td>
                    {rows.map((row) => (
                      <td key={`total-${row.quotation.id}`} className="px-4 py-3 text-center">
                        {fmtMoney(row.quotation.totalAmount, row.quotation.currencyCode)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
