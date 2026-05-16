"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, Trash2, Save, X, Upload, Zap, Building, FileText, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { procurementApi, PurchaseOrder } from "@/lib/api/procurement-api"
import { accountingApi, Vendor } from "@/lib/api/accounting-api"

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InvoiceItem {
  itemName: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

export function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const { permissions } = useProcurementPermissions()

  const [formData, setFormData] = useState({
    purchaseOrderId: "",
    vendorId: "",
    invoiceDate: "",
    dueDate: "",
    documentPath: "",
    notes: ""
  })

  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date())
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())

  const [items, setItems] = useState<InvoiceItem[]>([
    { itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, totalPrice: 0 }
  ])

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)

      // Load vendors
      const vendorsResponse = await accountingApi.getVendors()
      if (vendorsResponse.success && vendorsResponse.data) {
        setVendors(vendorsResponse.data.filter((v: Vendor) => v.isActive))
      }

      // Load purchase orders (draft, sent, or acknowledged)
      const poResponse = await procurementApi.getPurchaseOrders()
      if (poResponse.success && poResponse.data) {
        setPurchaseOrders(poResponse.data.filter(po => ['DRAFT', 'SENT', 'ACKNOWLEDGED'].includes(po.status)))
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      toast.success("Invoice document uploaded successfully")
    }
  }

  const handleOCRProcessing = async () => {
    if (!uploadedFile) {
      toast.error("Please upload an invoice document first")
      return
    }

    toast.info("Processing OCR... This may take a few moments")

    // Simulate OCR processing
    setTimeout(() => {
      // Mock OCR data extraction
      setFormData(prev => ({
        ...prev,
        invoiceDate: new Date().toISOString().split('T')[0],
        vendorId: "vendor-1"
      }))

      setItems([
        { itemName: "Office Supplies", description: "Stationery items", quantity: 10, unit: "pcs", unitPrice: 25.50, totalPrice: 255.00 },
        { itemName: "Printer Paper", description: "A4 white paper", quantity: 5, unit: "boxes", unitPrice: 45.00, totalPrice: 225.00 }
      ])

      toast.success("OCR processing completed! Invoice data extracted successfully")
    }, 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.vendorId || items.some(item => !item.itemName || item.quantity <= 0)) {
      toast.error("Please fill in all required fields")
      return
    }

    // Check permissions
    if (!permissions.canCreateInvoice) {
      toast.error('You do not have permission to create invoices')
      return
    }

    setLoading(true)
    try {
      const invoiceData = {
        ...formData,
        items: items.filter(item => item.itemName.trim() !== ""),
        totalAmount: calculateTotal().toString(),
        currencyId: "USD",
        status: "RECEIVED",
        matchingStatus: "PENDING"
      }

      const response = await procurementApi.createInvoice(invoiceData)

      if (response.success) {
        toast.success("Invoice created successfully!")
        onSuccess()
        handleClose()
      } else {
        toast.error("Failed to create invoice")
      }
    } catch (error: any) {
      toast.error("Error creating invoice", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      purchaseOrderId: "",
      vendorId: "",
      invoiceDate: "",
      dueDate: "",
      documentPath: "",
      notes: ""
    })
    setItems([{ itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, totalPrice: 0 }])
    setUploadedFile(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Create Invoice
          </DialogTitle>
          <DialogDescription>
            Upload and process vendor invoices with OCR or enter details manually
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Upload & OCR */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Document Upload & OCR Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="document">Upload Invoice Document</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleOCRProcessing}
                    disabled={!uploadedFile}
                    variant="outline"
                    className="flex items-center gap-2 rounded-full h-10 px-6"
                  >
                    <Zap className="w-4 h-4" />
                    Process OCR
                  </Button>
                </div>
                {uploadedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {uploadedFile.name} uploaded successfully
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseOrderId">Purchase Order (Optional)</Label>
                <Select
                  value={formData.purchaseOrderId}
                  onValueChange={(value) => handleInputChange("purchaseOrderId", value)}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading purchase orders..." : "Select purchase order (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {po.poNumber} - {po.vendor?.name}
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
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <DatePicker
                  value={invoiceDate}
                  onChange={(date) => {
                    setInvoiceDate(date)
                    setFormData(prev => ({
                      ...prev,
                      invoiceDate: date ? date.toISOString().split('T')[0] : ""
                    }))
                  }}
                  placeholder="Select invoice date"
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <DatePicker
                  value={dueDate}
                  onChange={(date) => {
                    setDueDate(date)
                    setFormData(prev => ({
                      ...prev,
                      dueDate: date ? date.toISOString().split('T')[0] : ""
                    }))
                  }}
                  placeholder="Select due date"
                  allowFutureDates={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Invoice Items</CardTitle>
               <Button type="button" onClick={addItem} variant="outline" size="sm" className="rounded-full h-9 px-4">
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
                  placeholder="Any additional notes or comments"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="rounded-full h-10 px-6">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !permissions.canCreateInvoice} variant="gradient-create" className="rounded-full h-10 px-6 shadow-sm">
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
