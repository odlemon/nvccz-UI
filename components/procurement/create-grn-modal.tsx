"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, X, Package, CheckCircle, XCircle, FileText, MapPin, Upload, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { procurementApiV2, PurchaseOrder } from "@/lib/api/procurement-api-v2"

interface CreateGRNModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  isInvestee?: boolean
}

interface GRNItem {
  poItemId: string
  itemName: string
  poQuantity: number
  receivedQuantity: number
  unit: string
  status: 'PENDING' | 'RECEIVED' | 'REJECTED'
  rejectionReason?: string
}

export function CreateGRNModal({ isOpen, onClose, onSuccess, isInvestee }: CreateGRNModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const { permissions } = useProcurementPermissions()

  const [formData, setFormData] = useState({
    purchaseOrderId: "",
    receivedDate: new Date().toISOString().split('T')[0],
    notes: "",
    tolerancePercentage: "5",
    attachmentUrl: "",
    geoLocation: "",
  })

  const [items, setItems] = useState<GRNItem[]>([
    {
      poItemId: "",
      itemName: "",
      poQuantity: 0,
      receivedQuantity: 0,
      unit: "",
      status: 'PENDING',
      rejectionReason: ""
    }
  ])

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)

      const response = await procurementApiV2.getPurchaseOrders({
        status: 'SENT'
      })
      if (response.success && response.data) {
        setPurchaseOrders(response.data)
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast.error('Failed to load purchase orders')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: keyof GRNItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const loadPurchaseOrderItems = (poId: string) => {
    const selectedPO = purchaseOrders.find(po => po.id === poId)
    if (selectedPO && selectedPO.items) {
      const poItems: GRNItem[] = selectedPO.items.map((item: any, idx: number) => ({
        poItemId: item.id || `item-${idx}`,
        itemName: item.itemName,
        poQuantity: parseInt(item.quantity) || 0,
        receivedQuantity: 0,
        unit: item.unit || '',
        status: 'PENDING',
        rejectionReason: ""
      }))
      setItems(poItems)
      toast.success("Purchase order items loaded successfully")
    }
  }

  const getQualityStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateOverDelivery = () => {
    const selectedPO = purchaseOrders.find(po => po.id === formData.purchaseOrderId)
    if (!selectedPO) return { hasOverDelivery: false, percentage: 0 }

    const tolerance = parseFloat(formData.tolerancePercentage) || 0
    const totalOrdered = items.reduce((sum, item) => sum + item.poQuantity, 0)
    const totalReceived = items.reduce((sum, item) => sum + item.receivedQuantity, 0)
    const overDeliveryPercentage = totalOrdered > 0 ? ((totalReceived - totalOrdered) / totalOrdered) * 100 : 0

    return {
      hasOverDelivery: overDeliveryPercentage > tolerance,
      percentage: Math.round(overDeliveryPercentage * 100) / 100
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.purchaseOrderId) {
      toast.error("Please select a purchase order")
      return
    }

    if (items.some(item => item.receivedQuantity < 0)) {
      toast.error("Received quantity cannot be negative")
      return
    }

    // Check over-delivery tolerance
    const overDelivery = calculateOverDelivery()
    if (overDelivery.hasOverDelivery) {
      if (!confirm(`Over-delivery detected (${overDelivery.percentage}% above tolerance). Continue?`)) {
        return
      }
    }

    // Check permissions
    if (!permissions.canCreateGRN) {
      toast.error('You do not have permission to create GRNs')
      return
    }

    setLoading(true)
    try {
      const grnData = {
        purchaseOrderId: formData.purchaseOrderId,
        receivedDate: formData.receivedDate,
        items: items.map(item => ({
          poItemId: item.poItemId,
          receivedQuantity: item.receivedQuantity,
          status: item.status,
          rejectionReason: item.rejectionReason
        })),
        notes: formData.notes,
        tolerancePercentage: parseFloat(formData.tolerancePercentage),
        attachmentUrl: formData.attachmentUrl || undefined,
        geoLocation: formData.geoLocation || undefined,
      }

      const response = await procurementApiV2.createGRN(grnData)

      if (response.success) {
        toast.success("Goods Received Note created successfully!")
        onSuccess()
        handleClose()
      } else {
        toast.error(response.message || "Failed to create GRN")
      }
    } catch (error: any) {
      toast.error("Error creating GRN", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      purchaseOrderId: "",
      receivedDate: new Date().toISOString().split('T')[0],
      notes: "",
      tolerancePercentage: "5",
      attachmentUrl: "",
      geoLocation: "",
    })
    setItems([{
      poItemId: "",
      itemName: "",
      poQuantity: 0,
      receivedQuantity: 0,
      unit: "",
      status: 'PENDING',
      rejectionReason: ""
    }])
    onClose()
  }

  const overDeliveryWarning = calculateOverDelivery()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Create Goods Received Note {isInvestee && '(Investee)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receipt Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseOrderId">Purchase Order *</Label>
                <Select
                  value={formData.purchaseOrderId}
                  onValueChange={(value) => {
                    handleInputChange("purchaseOrderId", value)
                    loadPurchaseOrderItems(value)
                  }}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading purchase orders..." : "Select purchase order"} />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {po.poNumber} - {po.vendorName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="receivedDate">Received Date *</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => handleInputChange("receivedDate", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tolerancePercentage">Over-Delivery Tolerance (%)</Label>
                <Input
                  id="tolerancePercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.tolerancePercentage}
                  onChange={(e) => handleInputChange("tolerancePercentage", e.target.value)}
                  placeholder="5"
                />
              </div>

              <div>
                <Label htmlFor="geoLocation">Geo Location (optional)</Label>
                <Input
                  id="geoLocation"
                  value={formData.geoLocation}
                  onChange={(e) => handleInputChange("geoLocation", e.target.value)}
                  placeholder="e.g., lat,lng or warehouse location"
                />
              </div>
            </CardContent>
          </Card>

          {/* Over-Delivery Warning */}
          {overDeliveryWarning.percentage !== 0 && (
            <Card className={overDeliveryWarning.hasOverDelivery ? "border-l-4 border-l-red-500" : "border-l-4 border-l-amber-500"}>
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className={overDeliveryWarning.hasOverDelivery ? "text-red-600 mt-0.5" : "text-amber-600 mt-0.5"} />
                <div>
                  <p className={overDeliveryWarning.hasOverDelivery ? "text-red-900 font-medium" : "text-amber-900 font-medium"}>
                    {overDeliveryWarning.hasOverDelivery ? "Over-Delivery Exceeds Tolerance" : "Warning: Over-Delivery Detected"}
                  </p>
                  <p className={overDeliveryWarning.hasOverDelivery ? "text-red-800 text-sm" : "text-amber-800 text-sm"}>
                    Received quantity is {overDeliveryWarning.percentage}% above ordered quantity (tolerance: {formData.tolerancePercentage}%)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items Quality Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items & Quality Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Select a purchase order to load items</p>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {item.itemName}
                      </h4>
                      <Badge className={getQualityStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Quantity Ordered</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                          <span className="font-medium">{item.poQuantity}</span>
                        </div>
                      </div>

                      <div>
                        <Label>Quantity Received *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.receivedQuantity}
                          onChange={(e) => handleItemChange(index, "receivedQuantity", parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <Label>Unit</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                          <span className="font-medium">{item.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={item.status}
                          onValueChange={(value: 'PENDING' | 'RECEIVED' | 'REJECTED') => handleItemChange(index, "status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending Inspection</SelectItem>
                            <SelectItem value="RECEIVED">Received & Accepted</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {item.status === 'REJECTED' && (
                        <div>
                          <Label>Rejection Reason</Label>
                          <Textarea
                            value={item.rejectionReason || ''}
                            onChange={(e) => handleItemChange(index, "rejectionReason", e.target.value)}
                            placeholder="Reason for rejection..."
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="attachmentUrl">Attachment URL (optional)</Label>
                <Input
                  id="attachmentUrl"
                  type="url"
                  value={formData.attachmentUrl}
                  onChange={(e) => handleInputChange("attachmentUrl", e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">Link to GRN document, photo, or quality report</p>
              </div>

              <div>
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional notes about the goods receipt..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !permissions.canCreateGRN} className="gradient-primary text-white">
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
