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
import { Plus, Save, X, Package, CheckCircle, XCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { procurementApi, PurchaseOrder } from "@/lib/api/procurement-api"

interface CreateGRNModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface GRNItem {
  purchaseOrderItemId: string
  itemName: string
  quantityOrdered: number
  quantityReceived: number
  quantityAccepted: number
  quantityRejected: number
  qualityStatus: 'PASSED' | 'FAILED' | 'PENDING'
  qualityNotes: string
}

export function CreateGRNModal({ isOpen, onClose, onSuccess }: CreateGRNModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const { permissions } = useProcurementPermissions()

  const [formData, setFormData] = useState({
    purchaseOrderId: "",
    receivedBy: "",
    receivedDate: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const [items, setItems] = useState<GRNItem[]>([
    {
      purchaseOrderItemId: "",
      itemName: "",
      quantityOrdered: 0,
      quantityReceived: 0,
      quantityAccepted: 0,
      quantityRejected: 0,
      qualityStatus: 'PENDING',
      qualityNotes: ""
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

      // Load purchase orders (sent/acknowledged ones that can receive goods)
      const poResponse = await procurementApi.getPurchaseOrders()
      if (poResponse.success && poResponse.data) {
        setPurchaseOrders(poResponse.data.filter(po =>
          po.status === 'SENT' || po.status === 'ACKNOWLEDGED' || po.status === 'PARTIALLY_RECEIVED'
        ))
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

    // Auto-calculate accepted/rejected quantities
    if (field === 'quantityReceived' || field === 'quantityRejected') {
      const received = field === 'quantityReceived' ? value as number : updatedItems[index].quantityReceived
      const rejected = field === 'quantityRejected' ? value as number : updatedItems[index].quantityRejected
      updatedItems[index].quantityAccepted = Math.max(0, received - rejected)
    }

    setItems(updatedItems)
  }

  const loadPurchaseOrderItems = (poId: string) => {
    // Mock loading PO items
    if (poId) {
      const mockItems: GRNItem[] = [
        {
          purchaseOrderItemId: "poi-1",
          itemName: "Office Chairs",
          quantityOrdered: 10,
          quantityReceived: 10,
          quantityAccepted: 9,
          quantityRejected: 1,
          qualityStatus: 'PENDING',
          qualityNotes: ""
        },
        {
          purchaseOrderItemId: "poi-2",
          itemName: "Desk Lamps",
          quantityOrdered: 5,
          quantityReceived: 5,
          quantityAccepted: 5,
          quantityRejected: 0,
          qualityStatus: 'PENDING',
          qualityNotes: ""
        }
      ]
      setItems(mockItems)
      toast.success("Purchase order items loaded successfully")
    }
  }

  const getQualityStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQualityStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED': return <CheckCircle className="w-4 h-4" />
      case 'FAILED': return <XCircle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.purchaseOrderId || !formData.receivedBy) {
      toast.error("Please fill in all required fields")
      return
    }

    if (items.some(item => item.quantityReceived <= 0)) {
      toast.error("All items must have a received quantity greater than 0")
      return
    }

    // Check permissions
    if (!permissions.canCreateGRN) {
      toast.error('You do not have permission to create GRNs')
      return
    }

    setLoading(true)
    try {
      const grnData = {
        ...formData,
        items: items.filter(item => item.itemName.trim() !== ""),
        status: "PENDING_APPROVAL"
      }

      const response = await procurementApi.createGRN(grnData)

      if (response.success) {
        toast.success("Goods Received Note created successfully!")
        onSuccess()
        handleClose()
      } else {
        toast.error("Failed to create GRN")
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
      receivedBy: "",
      receivedDate: new Date().toISOString().split('T')[0],
      notes: ""
    })
    setItems([{
      purchaseOrderItemId: "",
      itemName: "",
      quantityOrdered: 0,
      quantityReceived: 0,
      quantityAccepted: 0,
      quantityRejected: 0,
      qualityStatus: 'PENDING',
      qualityNotes: ""
    }])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Create Goods Received Note
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
                          {po.purchaseOrderNumber} - {po.vendor?.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="receivedBy">Received By *</Label>
                <Input
                  id="receivedBy"
                  value={formData.receivedBy}
                  onChange={(e) => handleInputChange("receivedBy", e.target.value)}
                  placeholder="Enter receiver name"
                  required
                />
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
            </CardContent>
          </Card>

          {/* Items Quality Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items & Quality Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {item.itemName || `Item ${index + 1}`}
                    </h4>
                    <Badge className={getQualityStatusColor(item.qualityStatus)}>
                      {getQualityStatusIcon(item.qualityStatus)}
                      {item.qualityStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Quantity Ordered</Label>
                      <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                        <span className="font-medium">{item.quantityOrdered}</span>
                      </div>
                    </div>

                    <div>
                      <Label>Quantity Received *</Label>
                      <Input
                        type="number"
                        min="0"
                        max={item.quantityOrdered}
                        value={item.quantityReceived}
                        onChange={(e) => handleItemChange(index, "quantityReceived", parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Quantity Rejected</Label>
                      <Input
                        type="number"
                        min="0"
                        max={item.quantityReceived}
                        value={item.quantityRejected}
                        onChange={(e) => handleItemChange(index, "quantityRejected", parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Quantity Accepted</Label>
                      <div className="flex items-center h-10 px-3 border rounded-md bg-green-50">
                        <span className="font-medium text-green-700">{item.quantityAccepted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Quality Status</Label>
                      <Select
                        value={item.qualityStatus}
                        onValueChange={(value: 'PASSED' | 'FAILED' | 'PENDING') => handleItemChange(index, "qualityStatus", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending Inspection</SelectItem>
                          <SelectItem value="PASSED">Quality Passed</SelectItem>
                          <SelectItem value="FAILED">Quality Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quality Notes</Label>
                      <Textarea
                        value={item.qualityNotes}
                        onChange={(e) => handleItemChange(index, "qualityNotes", e.target.value)}
                        placeholder="Quality inspection notes..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Receipt Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {items.reduce((sum, item) => sum + item.quantityReceived, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Received</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {items.reduce((sum, item) => sum + item.quantityAccepted, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Accepted</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {items.reduce((sum, item) => sum + item.quantityRejected, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Rejected</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional notes about the goods receipt..."
                  rows={4}
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
