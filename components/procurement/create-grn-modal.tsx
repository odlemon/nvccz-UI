"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, X, Package, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { procurementApiV2, PurchaseOrder } from "@/lib/api/procurement-api-v2"

type QualityStatus = 'PASSED' | 'FAILED' | 'PARTIAL'

interface CreateGRNModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  isInvestee?: boolean
  initialPurchaseOrderId?: string
}

interface GRNItem {
  purchaseOrderItemId: string
  itemName: string
  poQuantity: number
  unit: string
  quantityReceived: number
  quantityAccepted: number
  quantityRejected: number
  qualityStatus: QualityStatus
}

const emptyForm = () => ({
  purchaseOrderId: "",
  receivedDate: new Date().toISOString().split('T')[0],
  tolerancePercentage: "5",
})

const deriveQualityStatus = (received: number, accepted: number, rejected: number): QualityStatus => {
  if (received <= 0) return 'PASSED'
  if (rejected === 0 && accepted >= received) return 'PASSED'
  if (accepted === 0 && rejected >= received) return 'FAILED'
  return 'PARTIAL'
}

export function CreateGRNModal({ isOpen, onClose, onSuccess, isInvestee, initialPurchaseOrderId }: CreateGRNModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const { permissions } = useProcurementPermissions()

  const [formData, setFormData] = useState(emptyForm())
  const [items, setItems] = useState<GRNItem[]>([])

  useEffect(() => {
    if (!isOpen) return
    loadInitialData()
    if (initialPurchaseOrderId) {
      setFormData(prev => ({ ...prev, purchaseOrderId: initialPurchaseOrderId }))
    }
  }, [isOpen, initialPurchaseOrderId])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const response = await procurementApiV2.getPurchaseOrders({ status: 'SENT' })
      if (response.success && response.data) {
        setPurchaseOrders(response.data)
        if (initialPurchaseOrderId) {
          const po = response.data.find(p => p.id === initialPurchaseOrderId)
          if (po) hydrateItemsFromPO(po, true)
        }
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error)
      toast.error('Failed to load purchase orders')
    } finally {
      setLoadingData(false)
    }
  }

  const hydrateItemsFromPO = (po: PurchaseOrder, prefill: boolean) => {
    if (!po?.items) return
    const next: GRNItem[] = po.items.map((item: any, idx: number) => {
      const ordered = parseInt(item.quantity) || 0
      const received = prefill ? ordered : 0
      const accepted = prefill ? ordered : 0
      return {
        purchaseOrderItemId: item.id || `item-${idx}`,
        itemName: item.itemName,
        poQuantity: ordered,
        unit: item.unit || '',
        quantityReceived: received,
        quantityAccepted: accepted,
        quantityRejected: 0,
        qualityStatus: deriveQualityStatus(received, accepted, 0),
      }
    })
    setItems(next)
  }

  const handleInputChange = (field: keyof ReturnType<typeof emptyForm>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateItem = (index: number, patch: Partial<GRNItem>) => {
    setItems(prev => {
      const next = [...prev]
      const merged = { ...next[index], ...patch }
      // If received/accepted/rejected changed and qualityStatus wasn't manually overridden in this patch,
      // recompute it so the badge stays in sync with the numbers.
      if (!('qualityStatus' in patch)) {
        merged.qualityStatus = deriveQualityStatus(
          merged.quantityReceived,
          merged.quantityAccepted,
          merged.quantityRejected,
        )
      }
      next[index] = merged
      return next
    })
  }

  const handlePOSelect = (poId: string) => {
    handleInputChange('purchaseOrderId', poId)
    const selectedPO = purchaseOrders.find(po => po.id === poId)
    if (selectedPO) hydrateItemsFromPO(selectedPO, false)
  }

  const calculateOverDelivery = () => {
    const tolerance = parseFloat(formData.tolerancePercentage) || 0
    const totalOrdered = items.reduce((sum, item) => sum + item.poQuantity, 0)
    const totalReceived = items.reduce((sum, item) => sum + item.quantityReceived, 0)
    const overDeliveryPercentage =
      totalOrdered > 0 ? ((totalReceived - totalOrdered) / totalOrdered) * 100 : 0
    return {
      hasOverDelivery: overDeliveryPercentage > tolerance,
      percentage: Math.round(overDeliveryPercentage * 100) / 100,
    }
  }

  const submitGRN = async () => {
    setLoading(true)
    try {
      const payload = {
        purchaseOrderId: formData.purchaseOrderId,
        receivedDate: new Date(formData.receivedDate).toISOString(),
        items: items.map(item => ({
          purchaseOrderItemId: item.purchaseOrderItemId,
          quantityReceived: item.quantityReceived,
          quantityAccepted: item.quantityAccepted,
          quantityRejected: item.quantityRejected,
          qualityStatus: item.qualityStatus,
        })),
      }

      const response = isInvestee
        ? await procurementApiV2.createApplicantGRN(payload)
        : await procurementApiV2.createGRN(payload)

      if (response.success) {
        toast.success('Goods Received Note created successfully')
        onSuccess()
        handleClose()
      } else {
        toast.error(response.message || 'Failed to create GRN')
      }
    } catch (error: any) {
      toast.error('Error creating GRN', { description: error?.message })
    } finally {
      setLoading(false)
    }
  }

  const validate = (): string | null => {
    if (!formData.purchaseOrderId) return 'Please select a purchase order'
    if (items.length === 0) return 'No items to receive'
    for (const item of items) {
      if (item.quantityReceived < 0 || item.quantityAccepted < 0 || item.quantityRejected < 0) {
        return 'Quantities cannot be negative'
      }
      if (item.quantityAccepted + item.quantityRejected > item.quantityReceived) {
        return `${item.itemName}: accepted + rejected cannot exceed received`
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (!permissions.canCreateGRN) {
      toast.error('You do not have permission to create GRNs')
      return
    }

    const overDelivery = calculateOverDelivery()
    if (overDelivery.hasOverDelivery) {
      toast.warning(
        `Over-delivery detected (${overDelivery.percentage}% above tolerance)`,
        {
          description: 'Continue submitting this GRN?',
          duration: 10000,
          action: {
            label: 'Continue',
            onClick: () => {
              void submitGRN()
            },
          },
          cancel: { label: 'Cancel', onClick: () => {} },
        }
      )
      return
    }

    await submitGRN()
  }

  const handleClose = () => {
    setFormData(emptyForm())
    setItems([])
    onClose()
  }

  const overDeliveryWarning = calculateOverDelivery()

  const qualityStatusColor = (status: QualityStatus) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'PARTIAL': return 'bg-amber-100 text-amber-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[75vw] !max-w-[75vw] sm:!max-w-[75vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Create Goods Received Note {isInvestee && '(Investee)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Receipt Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receipt Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="purchaseOrderId">Purchase Order *</Label>
                <Select
                  value={formData.purchaseOrderId}
                  onValueChange={handlePOSelect}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? 'Loading purchase orders...' : 'Select purchase order'} />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map(po => (
                      <SelectItem key={po.id} value={po.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {po.poNumber}
                            {(po.vendor?.name || po.vendorName) && (
                              <span className="text-gray-500"> — {po.vendor?.name || po.vendorName}</span>
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receivedDate">Received Date *</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => handleInputChange('receivedDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tolerancePercentage">Over-Delivery Tolerance (%)</Label>
                <Input
                  id="tolerancePercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.tolerancePercentage}
                  onChange={(e) => handleInputChange('tolerancePercentage', e.target.value)}
                  placeholder="5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Over-Delivery Warning (passive banner — actual confirm on submit uses a toast) */}
          {overDeliveryWarning.percentage !== 0 && (
            <Card className={overDeliveryWarning.hasOverDelivery ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-500'}>
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className={overDeliveryWarning.hasOverDelivery ? 'text-red-600 mt-0.5' : 'text-amber-600 mt-0.5'} />
                <div>
                  <p className={overDeliveryWarning.hasOverDelivery ? 'text-red-900 font-medium' : 'text-amber-900 font-medium'}>
                    {overDeliveryWarning.hasOverDelivery ? 'Over-Delivery Exceeds Tolerance' : 'Over-Delivery Detected'}
                  </p>
                  <p className={overDeliveryWarning.hasOverDelivery ? 'text-red-800 text-sm' : 'text-amber-800 text-sm'}>
                    Received quantity is {overDeliveryWarning.percentage}% above ordered quantity (tolerance: {formData.tolerancePercentage}%)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items & Quality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items & Quality Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Select a purchase order to load items</p>
              ) : (
                items.map((item, index) => {
                  const sumMismatch = item.quantityAccepted + item.quantityRejected !== item.quantityReceived
                  return (
                    <div
                      key={item.purchaseOrderItemId || index}
                      className="border rounded-xl bg-gray-50/40 overflow-hidden"
                    >
                      {/* Item header */}
                      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-white border-b">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.itemName}</p>
                            <p className="text-xs text-gray-500">
                              Ordered: <span className="font-medium text-gray-700">{item.poQuantity}</span>
                              {item.unit && <span className="ml-1">{item.unit}</span>}
                            </p>
                          </div>
                        </div>
                        <Badge className={qualityStatusColor(item.qualityStatus)}>{item.qualityStatus}</Badge>
                      </div>

                      {/* Quantities row */}
                      <div className="px-5 py-4 space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Quantities
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">Ordered</Label>
                              <div className="flex items-center h-10 px-3 border rounded-md bg-gray-100 text-gray-700">
                                <span className="font-medium">{item.poQuantity}</span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">Received *</Label>
                              <Input
                                type="number"
                                min="0"
                                value={item.quantityReceived}
                                onChange={(e) => {
                                  const received = parseInt(e.target.value) || 0
                                  updateItem(index, {
                                    quantityReceived: received,
                                    quantityAccepted: received,
                                    quantityRejected: 0,
                                  })
                                }}
                                className="bg-white"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">Accepted</Label>
                              <Input
                                type="number"
                                min="0"
                                max={item.quantityReceived}
                                value={item.quantityAccepted}
                                onChange={(e) => {
                                  const accepted = parseInt(e.target.value) || 0
                                  const rejected = Math.max(0, item.quantityReceived - accepted)
                                  updateItem(index, { quantityAccepted: accepted, quantityRejected: rejected })
                                }}
                                className="bg-white"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">Rejected</Label>
                              <Input
                                type="number"
                                min="0"
                                max={item.quantityReceived}
                                value={item.quantityRejected}
                                onChange={(e) => {
                                  const rejected = parseInt(e.target.value) || 0
                                  const accepted = Math.max(0, item.quantityReceived - rejected)
                                  updateItem(index, { quantityRejected: rejected, quantityAccepted: accepted })
                                }}
                                className="bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quality Status row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">Quality Status</Label>
                            <Select
                              value={item.qualityStatus}
                              onValueChange={(value: QualityStatus) =>
                                updateItem(index, { qualityStatus: value })
                              }
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PASSED">Passed</SelectItem>
                                <SelectItem value="PARTIAL">Partial</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-[11px] text-gray-500">
                              Auto-derived from quantities — override if needed.
                            </p>
                          </div>
                        </div>

                        {sumMismatch && (
                          <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700">
                              Accepted + Rejected ({item.quantityAccepted + item.quantityRejected}) does not match Received ({item.quantityReceived})
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="rounded-full h-10 px-6">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !permissions.canCreateGRN} variant="gradient-create" className="rounded-full h-10 px-6 shadow-sm">
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create GRN
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
