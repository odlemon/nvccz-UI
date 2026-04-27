"use client"

import { useState } from "react"
import { useAppDispatch } from "@/lib/store"
import {
  createApplicantRequisition,
  fetchApplicantDrawdown
} from "@/lib/store/slices/procurementV2Slice"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, DollarSign, Plus, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface RequisitionItem {
  itemName: string
  description: string
  quantity: number
  unit: string
}

interface CreateApplicantRequisitionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateApplicantRequisitionModal({
  isOpen,
  onClose,
  onSuccess
}: CreateApplicantRequisitionModalProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    justification: '',
    drawdownRequestAmount: '',
    sourcingCategory: '',
    useOfFundsDocumentUrl: '',
    department: 'Finance',
    items: [{ itemName: '', description: '', quantity: 1, unit: 'units' }]
  })

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', description: '', quantity: 1, unit: 'units' }]
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

  const updateItem = (index: number, field: keyof RequisitionItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description')
      return
    }

    if (!formData.justification.trim()) {
      toast.error('Please provide justification')
      return
    }

    const drawdownAmount = parseFloat(formData.drawdownRequestAmount)
    if (!formData.drawdownRequestAmount || drawdownAmount <= 0) {
      toast.error('Please enter a valid drawdown request amount')
      return
    }

    if (!formData.sourcingCategory) {
      toast.error('Please select a sourcing category')
      return
    }

    if (!formData.useOfFundsDocumentUrl.trim()) {
      toast.error('Please provide a use of funds document URL')
      return
    }

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

    try {
      setLoading(true)
      await dispatch(createApplicantRequisition({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        justification: formData.justification,
        drawdownRequestAmount: drawdownAmount,
        sourcingCategory: formData.sourcingCategory,
        useOfFundsDocumentUrl: formData.useOfFundsDocumentUrl,
        department: formData.department,
        items: formData.items
      })).unwrap()

      toast.success('Drawdown request created successfully')

      // Refresh data
      await dispatch(fetchApplicantDrawdown()).unwrap()

      onSuccess?.()
      onClose()

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        justification: '',
        drawdownRequestAmount: '',
        sourcingCategory: '',
        useOfFundsDocumentUrl: '',
        department: 'Finance',
        items: [{ itemName: '', description: '', quantity: 1, unit: 'units' }]
      })
    } catch (error: any) {
      toast.error('Failed to create drawdown request', { description: error.message })
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
            Create Drawdown Request
          </DialogTitle>
          <DialogDescription>
            Submit a new drawdown request for VC approval
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Basic Information</h3>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Requisition Details
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
                      placeholder="Enter request title..."
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
              </CardContent>
            </Card>
          </div>

          {/* Drawdown Details */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Drawdown Details</h3>
            <Card className="border-l-4 border-l-violet-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-violet-500" />
                  Drawdown Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="drawdownRequestAmount">Drawdown Request Amount *</Label>
                    <Input
                      id="drawdownRequestAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.drawdownRequestAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, drawdownRequestAmount: e.target.value }))}
                      placeholder="Enter amount..."
                      className="rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourcingCategory">Sourcing Category *</Label>
                    <Select
                      value={formData.sourcingCategory}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sourcingCategory: value }))}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT_SERVICES">IT Services</SelectItem>
                        <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                        <SelectItem value="SERVICES">Services</SelectItem>
                        <SelectItem value="GOODS">Goods</SelectItem>
                        <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                        <SelectItem value="CONSULTING">Consulting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="useOfFundsDocumentUrl">Use of Funds Document URL *</Label>
                  <Input
                    id="useOfFundsDocumentUrl"
                    type="url"
                    value={formData.useOfFundsDocumentUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, useOfFundsDocumentUrl: e.target.value }))}
                    placeholder="https://example.com/use-of-funds.pdf"
                    className="rounded-lg"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Justification */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Justification</h3>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-500" />
                  Business Justification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="justification">Justification *</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification}
                    onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                    placeholder="Provide business justification for this drawdown..."
                    rows={4}
                    className="rounded-lg"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-normal text-gray-900">Requisition Items</h3>
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
            disabled={loading}
            className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 rounded-full text-white"
          >
            {loading ? 'Creating...' : 'Create Drawdown Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
