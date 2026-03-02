"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, Trash2, Save, X, Building, FileText, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { procurementApi, PurchaseRequisition } from "@/lib/api/procurement-api"
import { accountingApi, Vendor } from "@/lib/api/accounting-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"

interface CreatePurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preSelectedRequisitionId?: string
}

interface POItem {
  itemName: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

export function CreatePurchaseOrderModal({ isOpen, onClose, onSuccess, preSelectedRequisitionId }: CreatePurchaseOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([])
  const { availableDepartments, loading: perfomanceLoading, error } = useAppSelector((state) => state.performance)
  const { permissions } = useProcurementPermissions()

  const [formData, setFormData] = useState({
    requisitionId: "",
    vendorId: "",
    priority: "MEDIUM",
    expectedDeliveryDate: "",
    shippingAddress: "",
    paymentTerms: "",
    deliveryTerms: "",
    notes: ""
  })




  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(new Date())

  const [items, setItems] = useState<POItem[]>([
    { itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, totalPrice: 0 }
  ])

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  useEffect(() => {
    if (preSelectedRequisitionId) {
      setFormData(prev => ({ ...prev, requisitionId: preSelectedRequisitionId }))
    }
  }, [preSelectedRequisitionId])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)

      // Load vendors
      const vendorsResponse = await accountingApi.vendors.getAll()
      if (vendorsResponse.success && vendorsResponse.data) {
        setVendors(vendorsResponse.data.filter(v => v.isActive))
      }

      // Load requisitions (approved ones)
      const requisitionsResponse = await procurementApi.getRequisitions()
      if (requisitionsResponse.success && requisitionsResponse.data) {
        setRequisitions(requisitionsResponse.data.filter(r => r.status === 'APPROVED'))
      }

      // If there's a pre-selected requisition, load its data
      if (preSelectedRequisitionId) {
        await loadRequisitionData(preSelectedRequisitionId)
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoadingData(false)
    }
  }

  const loadRequisitionData = async (requisitionId: string) => {
    try {
      const response = await procurementApi.getRequisitionById(requisitionId)
      if (response.success && response.data) {
        const requisition = response.data

        // Update form data with requisition details
        setFormData(prev => ({
          ...prev,
          priority: requisition.priority,
          notes: `Created from requisition: ${requisition.requisitionNumber}`
        }))

        // Populate items from requisition
        const requisitionItems: POItem[] = requisition.items.map(item => ({
          itemName: item.itemName,
          description: item.description || '',
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice || 0)
        }))

        if (requisitionItems.length > 0) {
          setItems(requisitionItems)
        }
      }
    } catch (error) {
      console.error('Error loading requisition data:', error)
      toast.error('Failed to load requisition data')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    setItems([{ itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, totalPrice: 0 }])
    setFormData({
      requisitionId: "",
      vendorId: "",
      priority: "MEDIUM",
      expectedDeliveryDate: "",
      shippingAddress: "",
      paymentTerms: "",
      deliveryTerms: "",
      notes: ""
    })
    setDeliveryDate(new Date())
    onClose()
  }

  const handleItemChange = (index: number, field: keyof POItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate total price for this item
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice
    }

    setItems(updatedItems)
  }

  const addItem = () => {
    setItems([...items, { itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, totalPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.vendorId || items.some(item => !item.itemName || item.quantity <= 0)) {
      toast.error("Please fill in all required fields")
      return
    }

    // Check permissions
    if (!permissions.canCreatePurchaseOrder) {
      toast.error('You do not have permission to create purchase orders')
      return
    }

    setLoading(true)
    try {
      const purchaseOrderData = {
        ...formData,
        items: items.filter(item => item.itemName.trim() !== ""),
        totalAmount: calculateTotal().toString(),
        currencyId: "USD", // Default currency
        status: "DRAFT"
      }

      const response = await procurementApi.createPurchaseOrder(purchaseOrderData)

      if (response.success) {
        toast.success("Purchase Order created successfully!")
        onSuccess()
        handleClose()
      } else {
        toast.error("Failed to create purchase order")
      }
    } catch (error: any) {
      toast.error("Error creating purchase order", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Create Purchase Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requisitionId">Requisition ID (Optional)</Label>
                <Select
                  value={formData.requisitionId}
                  onValueChange={(value) => handleInputChange("requisitionId", value)}
                  disabled={loadingData || !!preSelectedRequisitionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading requisitions..." : "Select requisition (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {requisitions.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {req.requisitionNumber} - {req.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vendorId">Vendor *</Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => handleInputChange("vendorId", value)}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading vendors..." : "Select vendor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {vendor.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                <DatePicker
                  value={deliveryDate}
                  onChange={(date) => {
                    setDeliveryDate(date)
                    setFormData(prev => ({
                      ...prev,
                      expectedDeliveryDate: date ? date.toISOString().split('T')[0] : ""
                    }))
                  }}
                  placeholder="Select delivery date"
                  allowFutureDates={true}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Textarea
                  id="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={(e) => handleInputChange("shippingAddress", e.target.value)}
                  placeholder="Enter complete shipping address"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                  placeholder="e.g., Net 30 days"
                />
              </div>

              <div>
                <Label htmlFor="deliveryTerms">Delivery Terms</Label>
                <Input
                  id="deliveryTerms"
                  value={formData.deliveryTerms}
                  onChange={(e) => handleInputChange("deliveryTerms", e.target.value)}
                  placeholder="e.g., FOB Destination"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Order Items</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="lg:col-span-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                        placeholder="Enter item name"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Item description"
                      />
                    </div>

                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <Label>Unit</Label>
                      <Select value={item.unit} onValueChange={(value) => handleItemChange(index, "unit", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="lbs">Pounds</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="units">Units</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Unit Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Total Price</Label>
                      <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                        <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">${calculateTotal().toFixed(2)}</p>
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional notes or special instructions"
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
            <Button type="submit" disabled={loading || !permissions.canCreatePurchaseOrder} className="gradient-primary text-white">
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Purchase Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
