"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { FileText, DollarSign, Plus, Trash2, Building2, AlertCircle, Check, ChevronsUpDown, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { procurementApi, CreateRequisitionRequest, PurchaseRequisition } from "@/lib/api/procurement-api"
import { procurementApiV2 } from "@/lib/api/procurement-api-v2"
import { portfolioCompaniesApi, type PortfolioCompany } from "@/lib/api/portfolio-companies-api"
import { fundsApi, type Fund } from "@/lib/api/funds-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"

interface CreateRequisitionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editMode?: boolean
  requisitionId?: string
  isInvesteeMode?: boolean
}

interface RequisitionItem {
  itemName: string
  description: string
  quantity: number
  unit: string
  specifications?: Record<string, any>
}


export function CreateRequisitionModal({ isOpen, onClose, onSuccess, editMode = false, requisitionId, isInvesteeMode = false }: CreateRequisitionModalProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Get departments from Redux
  const { availableDepartments, loading: departmentsLoading } = useAppSelector((state) => state.performance)
  const { permissions } = useProcurementPermissions()

  const [formData, setFormData] = useState<CreateRequisitionRequest & {
    drawdownRequestAmount?: number
    sourcingCategory?: string
    useOfFundsDocumentUrl?: string
    portfolioCompanyId?: string
    fundId?: string
  }>({
    title: '',
    description: '',
    department: '',
    priority: 'MEDIUM',
    justification: '',
    drawdownRequestAmount: undefined,
    sourcingCategory: '',
    useOfFundsDocumentUrl: '',
    portfolioCompanyId: '',
    fundId: '',
    items: [{
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'units'
    }]
  })

  // Portfolio companies + funds — only loaded when in investee mode
  const [portfolioCompanies, setPortfolioCompanies] = useState<PortfolioCompany[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false)
  const [fundPickerOpen, setFundPickerOpen] = useState(false)
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [fundsLoading, setFundsLoading] = useState(false)

  const selectedCompany = portfolioCompanies.find(c => c.id === formData.portfolioCompanyId)
  const selectedFund = funds.find(f => f.id === formData.fundId)

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen, editMode, requisitionId])

  // Load portfolio companies + funds when entering investee mode
  useEffect(() => {
    if (!isOpen || !isInvesteeMode) return

    let cancelled = false
    setCompaniesLoading(true)
    portfolioCompaniesApi.getAllWithInvestments()
      .then(res => {
        if (cancelled) return
        setPortfolioCompanies(res?.data || [])
      })
      .catch(() => {
        if (!cancelled) setPortfolioCompanies([])
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false)
      })

    setFundsLoading(true)
    fundsApi.getAll({ limit: 100 })
      .then(res => {
        if (cancelled) return
        setFunds(res?.data?.funds || [])
      })
      .catch(() => {
        if (!cancelled) setFunds([])
      })
      .finally(() => {
        if (!cancelled) setFundsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, isInvesteeMode])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)

      // Load departments from Redux
      await dispatch(fetchAvailableDepartments()).unwrap()

      // Load existing requisition data in edit mode
      if (editMode && requisitionId) {
        const reqResponse = await procurementApi.getRequisitionById(requisitionId)
        if (reqResponse.success && reqResponse.data) {
          const req = reqResponse.data
          setFormData({
            title: req.title,
            description: req.description,
            department: typeof req.department === 'string' ? req.department : (req.department?.name || ''),
            priority: req.priority,
            justification: req.justification,
            items: req.items.map(item => ({
              itemName: item.itemName,
              description: item.description || '',
              quantity: Number(item.quantity),
              unit: item.unit,
              specifications: (item.specifications ? (typeof item.specifications === 'string' ? JSON.parse(item.specifications) : item.specifications) : {}) as Record<string, any>
            }))
          })
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoadingData(false)
    }
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

    if (!formData.department) {
      toast.error('Please select a department')
      return
    }

    if (!formData.justification.trim()) {
      toast.error('Please provide justification')
      return
    }

    if (isInvesteeMode) {
      if (!formData.portfolioCompanyId) {
        toast.error('Please select a portfolio company')
        return
      }
      if (!formData.fundId) {
        toast.error('Please link a fund to this drawdown')
        return
      }
      if (!formData.drawdownRequestAmount || formData.drawdownRequestAmount <= 0) {
        toast.error('Please enter a valid drawdown request amount')
        return
      }
      if (!formData.sourcingCategory) {
        toast.error('Please select a sourcing category')
        return
      }
      if (!formData.useOfFundsDocumentUrl?.trim()) {
        toast.error('Please provide a use of funds document URL')
        return
      }
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

    // Permissions intentionally not gated client-side — anyone authenticated
    // can submit a requisition. The backend enforces its own auth/role checks
    // on the create/update endpoints.

    try {
      setLoading(true)
      if (editMode && requisitionId) {
        await procurementApi.updateRequisition(requisitionId, formData)
        toast.success('Purchase requisition updated successfully')
      } else if (isInvesteeMode) {
        await procurementApiV2.createApplicantRequisition({
          title: formData.title,
          description: formData.description,
          department: formData.department,
          priority: formData.priority,
          justification: formData.justification,
          portfolioCompanyId: formData.portfolioCompanyId,
          fundId: formData.fundId,
          useOfFundsDocumentUrl: formData.useOfFundsDocumentUrl || '',
          sourcingCategory: formData.sourcingCategory || '',
          drawdownRequestAmount: formData.drawdownRequestAmount || 0,
          items: formData.items.map(it => ({
            itemName: it.itemName,
            description: it.description,
            quantity: it.quantity,
            unit: it.unit,
            specifications: it.specifications || {},
          })),
        })
        toast.success('Investee drawdown request created successfully')
      } else {
        await procurementApi.createRequisition(formData)
        toast.success('Purchase requisition created successfully')
      }
      onSuccess?.()
      onClose()

      // Reset form
      setFormData({
        title: '',
        description: '',
        department: '',
        priority: 'MEDIUM',
        justification: '',
        drawdownRequestAmount: undefined,
        sourcingCategory: '',
        useOfFundsDocumentUrl: '',
        portfolioCompanyId: '',
        fundId: '',
        items: [{
          itemName: '',
          description: '',
          quantity: 1,
          unit: 'units'
        }]
      })
    } catch (error: any) {
      toast.error(`Failed to ${editMode ? 'update' : 'create'} requisition`, { description: error.message })
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
            {editMode ? 'Edit Purchase Requisition' : isInvesteeMode ? 'Create Investee Drawdown Request' : 'Create Purchase Requisition'}
          </DialogTitle>
          <DialogDescription>
            {editMode ? 'Update the purchase requisition details' : isInvesteeMode ? 'Create a new investee drawdown request for VC approval' : 'Create a new purchase requisition for approval'}
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
                      placeholder="Enter requisition title..."
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

          {/* Department */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Department</h3>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-500" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder={loadingData ? "Loading departments..." : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartments.map((dept) => (
                        <SelectItem key={dept.name} value={dept.name}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {dept.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investee Drawdown Details */}
          {isInvesteeMode && (
            <div className="space-y-4">
              <h3 className="text-base font-normal text-gray-900">Investee Drawdown Details</h3>
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
                      <Label>Portfolio Company *</Label>
                      <Popover open={companyPickerOpen} onOpenChange={setCompanyPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={companyPickerOpen}
                            disabled={companiesLoading}
                            className="w-full justify-between rounded-full h-10 px-6 font-normal"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
                              {selectedCompany
                                ? selectedCompany.name
                                : companiesLoading
                                  ? 'Loading companies...'
                                  : 'Search and select company...'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0">
                          <Command>
                            <CommandInput placeholder="Search company by name or industry..." />
                            <CommandList>
                              <CommandEmpty>
                                {companiesLoading ? 'Loading...' : 'No portfolio company found'}
                              </CommandEmpty>
                              <CommandGroup>
                                {portfolioCompanies.map((company) => (
                                  <CommandItem
                                    key={company.id}
                                    value={`${company.name} ${company.industry} ${company.registrationNumber}`}
                                    onSelect={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        portfolioCompanyId: company.id,
                                        // Auto-link the fund the company is associated with, if any
                                        fundId: company.fund?.id || prev.fundId,
                                      }))
                                      setCompanyPickerOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        formData.portfolioCompanyId === company.id ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{company.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {company.industry}
                                        {company.fund?.name ? ` • ${company.fund.name}` : ''}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Fund *</Label>
                      <Popover open={fundPickerOpen} onOpenChange={setFundPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={fundPickerOpen}
                            disabled={fundsLoading}
                            className="w-full justify-between rounded-full h-10 px-6 font-normal"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Briefcase className="w-4 h-4 text-violet-500 shrink-0" />
                              {selectedFund
                                ? selectedFund.name
                                : fundsLoading
                                  ? 'Loading funds...'
                                  : 'Search and select fund...'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0">
                          <Command>
                            <CommandInput placeholder="Search fund by name..." />
                            <CommandList>
                              <CommandEmpty>
                                {fundsLoading ? 'Loading...' : 'No fund found'}
                              </CommandEmpty>
                              <CommandGroup>
                                {funds.map((fund) => (
                                  <CommandItem
                                    key={fund.id}
                                    value={`${fund.name} ${fund.description || ''}`}
                                    onSelect={() => {
                                      setFormData(prev => ({ ...prev, fundId: fund.id }))
                                      setFundPickerOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        formData.fundId === fund.id ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{fund.name}</span>
                                      {fund.status && (
                                        <span className="text-xs text-gray-500">{fund.status}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="drawdownRequestAmount">Drawdown Request Amount *</Label>
                      <Input
                        id="drawdownRequestAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.drawdownRequestAmount || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, drawdownRequestAmount: parseFloat(e.target.value) || undefined }))}
                        placeholder="Enter amount..."
                        className="rounded-lg"
                        required={isInvesteeMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sourcingCategory">Sourcing Category *</Label>
                      <Select
                        value={formData.sourcingCategory || ''}
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
                      value={formData.useOfFundsDocumentUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, useOfFundsDocumentUrl: e.target.value }))}
                      placeholder="https://example.com/use-of-funds.pdf"
                      className="rounded-lg"
                      required={isInvesteeMode}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                    placeholder="Provide business justification for this requisition..."
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
                className="rounded-full h-9 px-4"
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
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-full h-10 px-6">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            variant={editMode ? "gradient-update" : "gradient-create"}
            className="rounded-full h-10 px-6 shadow-sm"
          >
            {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Requisition' : 'Create Requisition')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
