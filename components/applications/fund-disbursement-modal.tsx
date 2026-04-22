"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Building2, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { investmentImplementationApi, InvestmentImplementationCreateRequest } from "@/lib/api/investment-implementation-api"
import { fundsApi, Fund } from "@/lib/api/funds-api"

interface FundDisbursementModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  portfolioCompanyId: string
  onSuccess?: () => void
}

type DisbursementPeriodForm = {
  label: string
  dueDate: string
  amount?: number
}

export function FundDisbursementModal({ 
  isOpen, 
  onClose, 
  applicationId, 
  portfolioCompanyId, 
  onSuccess 
}: FundDisbursementModalProps) {
  const [loading, setLoading] = useState(false)
  const [funds, setFunds] = useState<Fund[]>([])
  const [loadingFunds, setLoadingFunds] = useState(false)
  const [formData, setFormData] = useState<InvestmentImplementationCreateRequest>({
    portfolioCompanyId: portfolioCompanyId,
    applicationId: applicationId,
    fundId: '',
    implementationPlan: '',
    notes: '',
    disbursementMode: 'MILESTONE_BASED',
    totalCommittedAmount: 0
  })
  const [disbursementPeriods, setDisbursementPeriods] = useState<DisbursementPeriodForm[]>([
    { label: 'Tranche 1', dueDate: '', amount: 0 },
  ])

  const [existingData, setExistingData] = useState<any>(null)
  const [hasExistingData, setHasExistingData] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadFunds()
      loadExistingData()
      // Update form data with current props
      setFormData(prev => ({
        ...prev,
        portfolioCompanyId: portfolioCompanyId,
        applicationId: applicationId
      }))
    }
  }, [isOpen, applicationId, portfolioCompanyId])

  const loadFunds = async () => {
    try {
      setLoadingFunds(true)
      const response = await fundsApi.getAll({ status: 'OPEN' })
      if (response.success) {
        setFunds(response.data.funds)
      }
    } catch (error: any) {
      console.error('Error loading funds:', error)
      toast.error('Failed to load funds')
    } finally {
      setLoadingFunds(false)
    }
  }

  const loadExistingData = async () => {
    try {
      const response = await investmentImplementationApi.getByApplicationId(applicationId)
      if (response.success) {
        setExistingData(response.data)
        setHasExistingData(true)
        setFormData({
          portfolioCompanyId: response.data.portfolioCompanyId,
          applicationId: response.data.applicationId,
          fundId: response.data.fundId,
          implementationPlan: response.data.implementationPlan,
          notes: response.data.notes || '',
          disbursementMode: response.data.disbursementMode || 'MILESTONE_BASED',
          totalCommittedAmount: response.data.totalCommittedAmount || 0
        })
        const existingPeriods = Array.isArray((response.data as any).disbursementPeriods)
          ? (response.data as any).disbursementPeriods
          : []
        setDisbursementPeriods(
          existingPeriods.length > 0
            ? existingPeriods.map((period: any) => ({
                label: period.label || '',
                dueDate: period.dueDate ? String(period.dueDate).split('T')[0] : '',
                amount: typeof period.amount === 'number' ? period.amount : undefined,
              }))
            : [{ label: 'Tranche 1', dueDate: '', amount: response.data.totalCommittedAmount || 0 }],
        )
      }
    } catch (error: any) {
      // If it's a 404 or similar "not found" error, it means no implementation exists yet
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setHasExistingData(false)
        setExistingData(null)
        // Reset form to default values for new implementation
        setFormData({
          portfolioCompanyId: portfolioCompanyId,
          applicationId: applicationId,
          fundId: '',
          implementationPlan: 'Phase 1: Final due diligence and contract signing\nPhase 2: Initial fund disbursement\nPhase 3: Milestone-based disbursements',
          notes: '',
          disbursementMode: 'MILESTONE_BASED',
          totalCommittedAmount: 0
        })
        setDisbursementPeriods([{ label: 'Tranche 1', dueDate: '', amount: 0 }])
      } else {
        console.error('Error loading existing data:', error)
      }
    }
  }

  const updatePeriod = (index: number, key: keyof DisbursementPeriodForm, value: string | number | undefined) => {
    setDisbursementPeriods((prev) => prev.map((period, i) => (i === index ? { ...period, [key]: value } : period)))
  }

  const addPeriod = () => {
    setDisbursementPeriods((prev) => [...prev, { label: `Tranche ${prev.length + 1}`, dueDate: '', amount: undefined }])
  }

  const removePeriod = (index: number) => {
    setDisbursementPeriods((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const handleSubmit = async () => {
    if (!formData.fundId) {
      toast.error('Please select a fund')
      return
    }

    if (!formData.implementationPlan.trim()) {
      toast.error('Please provide an implementation plan')
      return
    }

    if (formData.disbursementMode === 'MILESTONE_BASED' && (!formData.totalCommittedAmount || formData.totalCommittedAmount <= 0)) {
      toast.error('Please provide a valid committed amount')
      return
    }

    if (formData.disbursementMode === 'MILESTONE_BASED') {
      if (!disbursementPeriods.length) {
        toast.error('Add at least one disbursement period')
        return
      }

      const hasInvalidPeriod = disbursementPeriods.some((period) => !period.label.trim() || !period.dueDate)
      if (hasInvalidPeriod) {
        toast.error('Each disbursement period requires a label and due date')
        return
      }
    }

    const payload: InvestmentImplementationCreateRequest = {
      portfolioCompanyId: formData.portfolioCompanyId,
      applicationId: formData.applicationId,
      fundId: formData.fundId,
      implementationPlan: formData.implementationPlan,
      notes: formData.notes,
      disbursementMode: formData.disbursementMode,
      ...(formData.disbursementMode === 'MILESTONE_BASED' ? { totalCommittedAmount: formData.totalCommittedAmount } : {}),
      ...(formData.disbursementMode === 'MILESTONE_BASED'
        ? {
            disbursementPeriods: disbursementPeriods.map((period) => ({
              label: period.label.trim(),
              dueDate: period.dueDate,
              ...(period.amount && period.amount > 0 ? { amount: period.amount } : {}),
            })),
          }
        : {}),
    }

    try {
      setLoading(true)
      if (hasExistingData) {
        // Update existing implementation
        await investmentImplementationApi.update(applicationId, payload)
        toast.success('Investment implementation updated successfully')
      } else {
        // Create new implementation
        await investmentImplementationApi.initiate(payload)
        toast.success('Investment implementation initiated successfully')
      }
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(`Failed to ${hasExistingData ? 'update' : 'initiate'} investment implementation`, { 
        description: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    if (existingData?.status === 'COMPLETED') return 'text-green-600'
    if (existingData?.status === 'IN_PROGRESS') return 'text-blue-600'
    if (existingData?.status === 'INITIATED') return 'text-amber-600'
    return 'text-gray-600'
  }

  const getStatusIcon = () => {
    if (existingData?.status === 'COMPLETED') return <CheckCircle className="w-5 h-5" />
    if (existingData?.status === 'IN_PROGRESS') return <AlertCircle className="w-5 h-5" />
    return <AlertCircle className="w-5 h-5" />
  }

  const getStatusText = () => {
    if (existingData?.status) return existingData.status.replace('_', ' ')
    return 'New'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <DollarSign className="w-5 h-5" />
            {hasExistingData ? 'Update Fund Disbursement' : 'Initiate Fund Disbursement'}
          </DialogTitle>
          <p className="text-gray-600">
            {hasExistingData ? 'Update investment implementation details' : 'Initiate fund disbursement and investment implementation'}
          </p>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Status Header */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Implementation Status</h3>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  {getStatusIcon()}
                  <span className={getStatusColor()}>Status: {getStatusText()}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Fund Selection */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Fund Selection</h3>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-500" />
                  Select Fund
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="fundId">Available Funds</Label>
                  <Select 
                    value={formData.fundId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, fundId: value }))}
                    disabled={loadingFunds}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder={loadingFunds ? "Loading funds..." : "Select a fund"} />
                    </SelectTrigger>
                    <SelectContent>
                      {funds.map((fund) => (
                        <SelectItem key={fund.id} value={fund.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{fund.name}</span>
                            <span className="text-sm text-gray-500">
                              Available: ${Number(fund.remainingAmount).toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disbursement Details */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Disbursement Details</h3>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  Disbursement Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCommittedAmount">Total Committed Amount ($) *</Label>
                  <Input
                    id="totalCommittedAmount"
                    type="number"
                    value={formData.totalCommittedAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalCommittedAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="rounded-lg"
                    required={formData.disbursementMode === 'MILESTONE_BASED'}
                    disabled={formData.disbursementMode === 'ONE_TIME'}
                  />
                  {formData.disbursementMode === 'ONE_TIME' && (
                    <p className="text-xs text-gray-500">For one-time mode, committed amount is optional and can be derived later.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disbursementMode">Disbursement Mode *</Label>
                  <Select 
                    value={formData.disbursementMode} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, disbursementMode: value }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select disbursement mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MILESTONE_BASED">
                        <div className="flex flex-col">
                          <span className="font-medium">Milestone Based</span>
                          <span className="text-sm text-gray-500">Funds released upon milestone completion</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ONE_TIME">
                        <div className="flex flex-col">
                          <span className="font-medium">One Time</span>
                          <span className="text-sm text-gray-500">Full amount disbursed at once</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {formData.disbursementMode === 'MILESTONE_BASED' && (
            <div className="space-y-4">
              <h3 className="text-base font-normal text-gray-900">Disbursement Periods</h3>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="pt-6 space-y-4">
                  {disbursementPeriods.map((period, index) => (
                    <div key={`${period.label}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border rounded-lg p-3">
                      <div className="space-y-1">
                        <Label>Label *</Label>
                        <Input
                          value={period.label}
                          onChange={(e) => updatePeriod(index, 'label', e.target.value)}
                          placeholder={`Tranche ${index + 1}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Due Date *</Label>
                        <Input
                          type="date"
                          value={period.dueDate}
                          onChange={(e) => updatePeriod(index, 'dueDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Amount (optional)</Label>
                        <Input
                          type="number"
                          value={period.amount ?? ''}
                          onChange={(e) => updatePeriod(index, 'amount', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removePeriod(index)}
                        disabled={disbursementPeriods.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addPeriod} className="rounded-full">
                    Add Period
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Implementation Plan */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Implementation Plan</h3>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Investment Implementation Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="implementationPlan">Implementation Plan</Label>
                  <Textarea
                    id="implementationPlan"
                    value={formData.implementationPlan}
                    onChange={(e) => setFormData(prev => ({ ...prev, implementationPlan: e.target.value }))}
                    placeholder="Enter detailed implementation plan..."
                    rows={6}
                    className="rounded-lg"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Additional Information</h3>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter any additional notes or comments..."
                    rows={4}
                    className="rounded-lg"
                  />
                </div>
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
            disabled={loading || loadingFunds} 
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full"
          >
            {loading ? 'Processing...' : `${hasExistingData ? 'Update' : 'Initiate'} Fund Disbursement`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
