"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, DollarSign, Plus, Trash2, Building2, Calendar, Users } from "lucide-react"
import { toast } from "sonner"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { procurementApiV2, CreateRFQRequest } from "@/lib/api/procurement-api-v2"
import { accountingApi, Vendor } from "@/lib/api/accounting-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchRequisitions } from "@/lib/store/slices/procurementV2Slice"

interface CreateRFQModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  preSelectedRequisitionId?: string
}

interface RFQItem {
  itemName: string
  description: string
  quantity: number
  unit: string
  specifications?: Record<string, any>
}

export function CreateRFQModal({ isOpen, onClose, onSuccess, preSelectedRequisitionId }: CreateRFQModalProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  const { requisitions } = useAppSelector((state) => state.procurementV2)
  const { permissions } = useProcurementPermissions()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])

  const [formData, setFormData] = useState<CreateRFQRequest>({
    requisitionId: '',
    title: '',
    description: '',
    vendorIds: [],
    priority: 'MEDIUM',
    expectedDeliveryDate: '',
    deliveryAddress: '',
    rfqDeadline: '',
    specialRequirements: '',
    items: [{
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'units'
    }]
  })

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  // Auto-select requisition if pre-selected
  useEffect(() => {
    if (preSelectedRequisitionId && requisitions.length > 0) {
      handleRequisitionChange(preSelectedRequisitionId)
    }
  }, [preSelectedRequisitionId, requisitions])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)

      // Load approved requisitions and vendors
      await Promise.all([
        dispatch(fetchRequisitions({ status: 'APPROVED', limit: 100, offset: 0 })).unwrap(),
        loadVendors()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoadingData(false)
    }
  }

  const loadVendors = async () => {
    try {
      const response = await accountingApi.getVendors()
      if (response.success && response.data) {
        setVendors(response.data)
      }
    } catch (error) {
      console.error('Error loading vendors:', error)
    }
  }

  const handleRequisitionChange = (reqId: string) => {
    const selectedReq = requisitions.find(r => r.id === reqId)
    if (selectedReq) {
      setFormData(prev => ({
        ...prev,
        requisitionId: reqId,
        title: selectedReq.title,
        description: selectedReq.description,
        items: selectedReq.items.map(item => ({
          itemName: item.itemName,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          specifications: item.specifications as Record<string, any> || {}
        }))
      }))
    }
  }

  const toggleVendor = (vendorId: string) => {
    setSelectedVendorIds(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId)
      } else {
        return [...prev, vendorId]
      }
    })
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemName: '',
        description: '',
        quantity: 1,
        unit: 'units'
      }]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const updateItem = (index: number, field: keyof RFQItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.requisitionId) {
      toast.error('Please select a requisition')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (selectedVendorIds.length === 0) {
      toast.error('Please select at least one vendor')
      return
    }

    if (!formData.rfqDeadline) {
      toast.error('Please set RFQ deadline')
      return
    }

    // Validate items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i]
      if (!item.itemName.trim()) {
        toast.error(`Please enter item name for item ${i + 1}`)
        return
      }
      if (item.quantity <= 0) {
        toast.error(`Please enter valid quantity for item ${i + 1}`)
        return
      }
    }

    // Check permissions
    if (!permissions.canCreateRFQ) {
      toast.error('You do not have permission to create RFQs')
      return
    }

    try {
      setLoading(true)
      const requestData: CreateRFQRequest = {
        ...formData,
        vendorIds: selectedVendorIds
      }

      await procurementApiV2.createRFQ(requestData)
      toast.success('RFQ created successfully')
      onSuccess?.()
      onClose()

      // Reset form
      setFormData({
        requisitionId: '',
        title: '',
        description: '',
        vendorIds: [],
        priority: 'MEDIUM',
        expectedDeliveryDate: '',
        deliveryAddress: '',
        rfqDeadline: '',
        specialRequirements: '',
        items: [{
          itemName: '',
          description: '',
          quantity: 1,
          unit: 'units'
        }]
      })
      setSelectedVendorIds([])
    } catch (error: any) {
      toast.error('Failed to create RFQ', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <FileText className="w-5 h-5" />
            Create Request for Quotation
          </DialogTitle>
          <p className="text-gray-600">
            Send RFQ to vendors based on approved requisition
          </p>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Requisition Selection */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Select Requisition</h3>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Approved Requisitions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requisition">Requisition *</Label>
                  <Select
                    value={formData.requisitionId}
                    onValueChange={handleRequisitionChange}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder={loadingData ? "Loading requisitions..." : "Select requisition"} />
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
              </CardContent>
            </Card>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">RFQ Details</h3>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter RFQ title..."
                      className="rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') =>
                        setFormData(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter detailed description..."
                    rows={3}
                    className="rounded-lg"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rfqDeadline">RFQ Deadline *</Label>
                    <Input
                      id="rfqDeadline"
                      type="date"
                      value={formData.rfqDeadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, rfqDeadline: e.target.value }))}
                      className="rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                    <Input
                      id="expectedDeliveryDate"
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="Enter delivery address..."
                    rows={2}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialRequirements">Special Requirements</Label>
                  <Textarea
                    id="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                    placeholder="Any special requirements..."
                    rows={2}
                    className="rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Selection */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Select Vendors</h3>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Vendors ({selectedVendorIds.length} selected)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      onClick={() => toggleVendor(vendor.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedVendorIds.includes(vendor.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{vendor.companyName}</p>
                          <p className="text-sm text-gray-600">{vendor.email}</p>
                          {vendor.phoneNumber && (
                            <p className="text-xs text-gray-500">{vendor.phoneNumber}</p>
                          )}
                        </div>
                        {selectedVendorIds.includes(vendor.id) && (
                          <Badge className="bg-purple-500">Selected</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-normal text-gray-900">RFQ Items</h3>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Items & Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeItem(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Item Name *</Label>
                        <Input
                          value={item.itemName}
                          onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                          placeholder="Enter item name..."
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(index, 'unit', value)}
                        >
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="units">Units</SelectItem>
                            <SelectItem value="pieces">Pieces</SelectItem>
                            <SelectItem value="boxes">Boxes</SelectItem>
                            <SelectItem value="reams">Reams</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="liters">Liters</SelectItem>
                            <SelectItem value="meters">Meters</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Enter item description..."
                        rows={2}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </form>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !permissions.canCreateRFQ}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full"
          >
            {loading ? 'Creating...' : 'Create RFQ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
