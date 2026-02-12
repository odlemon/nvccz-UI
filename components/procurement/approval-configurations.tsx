"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  fetchApprovalConfigs,
  updateApprovalConfig as updateApprovalConfigThunk,
  createApprovalConfig as createApprovalConfigThunk
} from "@/lib/store/slices/procurementV2Slice"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { ApprovalConfiguration, CreateApprovalConfigRequest } from "@/lib/api/procurement-api-v2"
import { Settings, CheckCircle, Edit, Plus, Building2, Shield, Trash2, X } from "lucide-react"
import { toast } from "sonner"

interface Department {
  id: string
  name: string
  description: string
  branch: string
}

interface ApprovalStep {
  stepNumber: number
  stepName: string
  stepType: 'USER' | 'ROLE' | 'DEPARTMENT'
  roleCode?: string
  userId?: string
  departmentId?: string
  isRequired: boolean
  approvalOrder: 'SEQUENTIAL' | 'PARALLEL'
}

interface ApprovalStageForm {
  stageType: 'PURCHASE_REQUISITION' | 'PURCHASE_ORDER' | 'INVOICE' | 'GRN'
  steps: ApprovalStep[]
}

export function ApprovalConfigurations() {
  const dispatch = useAppDispatch()
  const { permissions } = useProcurementPermissions()
  const { approvalConfigs, approvalConfigsLoading } = useAppSelector(state => state.procurementV2)
  const { availableDepartments, loading: departmentsLoading } = useAppSelector(state => state.performance)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<ApprovalConfiguration | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    dispatch(fetchAvailableDepartments())
    dispatch(fetchApprovalConfigs())
  }

  const handleConfigure = (department: Department, existingConfig?: ApprovalConfiguration) => {
    setSelectedDepartment(department)
    setSelectedConfig(existingConfig || null)
    setIsConfigModalOpen(true)
  }

  const getDepartmentConfig = (departmentName: string) => {
    return approvalConfigs.find(config => config.department === departmentName)
  }

  if (departmentsLoading || approvalConfigsLoading) {
    return <ApprovalConfigsSkeleton />
  }

  // Convert departments to have required fields
  const departments: Department[] = availableDepartments.map(dept => ({
    id: dept.name, // Use name as ID if no id field
    name: dept.name,
    description: dept.description || '',
    branch: 'main' // Default branch
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Configurations</h1>
          <p className="text-muted-foreground mt-1">
            Configure department-based approval workflows for procurement processes
          </p>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => {
          const config = getDepartmentConfig(department.name)
          const isConfigured = !!config
          
          return (
            <Card key={department.id} className={`hover:shadow-lg transition-shadow ${isConfigured ? 'border-green-200' : 'border-orange-200'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                  </div>
                  {isConfigured ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800">
                      <Settings className="w-3 h-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                </div>
                {department.description && (
                  <CardDescription className="text-sm">{department.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {isConfigured && config ? (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Configuration:</span> {config.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {config.stages.length} approval stage(s) configured
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {config.stages.map((stage, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {stage.stageType.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                    {permissions.canUpdateApprovalConfig && (
                      <Button 
                        variant="outline" 
                        className="w-full mt-2 rounded-full"
                        onClick={() => handleConfigure(department, config)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Configuration
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No approval workflow configured for this department yet.
                    </p>
                    {permissions.canCreateApprovalConfig && (
                      <Button 
                        className="w-full rounded-full"
                        onClick={() => handleConfigure(department)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Configure Approval Flow
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Configuration Modal */}
      {isConfigModalOpen && selectedDepartment && (
        <ConfigurationModal
          open={isConfigModalOpen}
          onOpenChange={setIsConfigModalOpen}
          department={selectedDepartment}
          existingConfig={selectedConfig}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}

function ApprovalConfigsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface ConfigurationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department
  existingConfig: ApprovalConfiguration | null
  onSuccess: () => void
}

function ConfigurationModal({ open, onOpenChange, department, existingConfig, onSuccess }: ConfigurationModalProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: existingConfig?.name || `${department.name} Approval Workflow`,
    description: existingConfig?.description || '',
    department: department.name,
  })
  
  const [stages, setStages] = useState<ApprovalStageForm[]>(() => {
    if (existingConfig && existingConfig.stages.length > 0) {
      // Group existing stages by stageType
      const grouped = existingConfig.stages.reduce((acc, stage) => {
        if (!acc[stage.stageType]) {
          acc[stage.stageType] = []
        }
        acc[stage.stageType].push({
          stepNumber: stage.stepNumber,
          stepName: stage.stepName,
          stepType: stage.stepType,
          roleCode: stage.roleCode,
          userId: stage.userId,
          departmentId: stage.departmentId,
          isRequired: stage.isRequired,
          approvalOrder: stage.approvalOrder
        })
        return acc
      }, {} as Record<string, ApprovalStep[]>)
      
      return Object.entries(grouped).map(([stageType, steps]) => ({
        stageType: stageType as 'PURCHASE_REQUISITION' | 'PURCHASE_ORDER' | 'INVOICE' | 'GRN',
        steps: steps.sort((a, b) => a.stepNumber - b.stepNumber)
      }))
    }
    
    // Default: one stage for Purchase Requisition with one step
    return [{
      stageType: 'PURCHASE_REQUISITION' as const,
      steps: [{
        stepNumber: 1,
        stepName: 'Department Head Approval',
        stepType: 'ROLE' as const,
        roleCode: 'PROC_MGR',
        isRequired: true,
        approvalOrder: 'SEQUENTIAL' as const
      }]
    }]
  })

  const addStage = () => {
    const availableTypes: ('PURCHASE_REQUISITION' | 'PURCHASE_ORDER' | 'INVOICE' | 'GRN')[] = [
      'PURCHASE_REQUISITION',
      'PURCHASE_ORDER',
      'INVOICE',
      'GRN'
    ]
    const usedTypes = stages.map(s => s.stageType)
    const nextType = availableTypes.find(type => !usedTypes.includes(type))
    
    if (nextType) {
      setStages([...stages, {
        stageType: nextType,
        steps: [{
          stepNumber: 1,
          stepName: 'Approval Step 1',
          stepType: 'ROLE',
          roleCode: 'PROC_MGR',
          isRequired: true,
          approvalOrder: 'SEQUENTIAL'
        }]
      }])
    } else {
      toast.error("All approval stage types are already configured")
    }
  }

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index))
  }

  const updateStage = (index: number, field: keyof ApprovalStageForm, value: any) => {
    const newStages = [...stages]
    newStages[index] = { ...newStages[index], [field]: value }
    setStages(newStages)
  }

  const addStep = (stageIndex: number) => {
    const newStages = [...stages]
    const nextStepNumber = newStages[stageIndex].steps.length + 1
    newStages[stageIndex].steps.push({
      stepNumber: nextStepNumber,
      stepName: `Approval Step ${nextStepNumber}`,
      stepType: 'ROLE',
      roleCode: 'PROC_OFF',
      isRequired: true,
      approvalOrder: 'SEQUENTIAL'
    })
    setStages(newStages)
  }

  const removeStep = (stageIndex: number, stepIndex: number) => {
    const newStages = [...stages]
    newStages[stageIndex].steps = newStages[stageIndex].steps.filter((_, i) => i !== stepIndex)
    // Renumber remaining steps
    newStages[stageIndex].steps.forEach((step, i) => {
      step.stepNumber = i + 1
    })
    setStages(newStages)
  }

  const updateStep = (stageIndex: number, stepIndex: number, field: keyof ApprovalStep, value: any) => {
    const newStages = [...stages]
    newStages[stageIndex].steps[stepIndex] = {
      ...newStages[stageIndex].steps[stepIndex],
      [field]: value
    }
    setStages(newStages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (stages.length === 0) {
      toast.error("Please add at least one approval stage")
      return
    }
    
    if (stages.some(stage => stage.steps.length === 0)) {
      toast.error("Each stage must have at least one approval step")
      return
    }
    
    try {
      setLoading(true)
      
      const payload: CreateApprovalConfigRequest = {
        ...formData,
        stages: stages
      }
      
      if (existingConfig) {
        await dispatch(updateApprovalConfigThunk({
          id: existingConfig.id,
          payload
        })).unwrap()
        toast.success("Approval configuration updated successfully")
      } else {
        await dispatch(createApprovalConfigThunk(payload)).unwrap()
        toast.success("Approval configuration created successfully")
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error("Failed to save configuration", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const STAGE_TYPE_LABELS = {
    PURCHASE_REQUISITION: 'Purchase Requisition',
    PURCHASE_ORDER: 'Purchase Order',
    INVOICE: 'Invoice',
    GRN: 'Goods Receipt Note'
  }

  const ROLE_OPTIONS = [
    { value: 'PROC_MGR', label: 'Procurement Manager' },
    { value: 'PROC_OFF', label: 'Procurement Officer' },
    { value: 'BUYER', label: 'Buyer' },
    { value: 'PROC_COORD', label: 'Procurement Coordinator' },
    { value: 'FIN_MGR', label: 'Finance Manager' },
    { value: 'CEO', label: 'CEO' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingConfig ? 'Update' : 'Configure'} Approval Workflow for {department.name}
          </DialogTitle>
          <DialogDescription>
            Set up the approval stages and steps for procurement processes in this department
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={department.name} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Approval Stages</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStage} className="rounded-full">
                <Plus className="w-4 h-4 mr-1" />
                Add Stage
              </Button>
            </div>

            {stages.map((stage, stageIndex) => (
              <Card key={stageIndex} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <Select
                        value={stage.stageType}
                        onValueChange={(value) => updateStage(stageIndex, 'stageType', value)}
                      >
                        <SelectTrigger className="w-[250px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PURCHASE_REQUISITION">Purchase Requisition</SelectItem>
                          <SelectItem value="PURCHASE_ORDER">Purchase Order</SelectItem>
                          <SelectItem value="INVOICE">Invoice</SelectItem>
                          <SelectItem value="GRN">Goods Receipt Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStage(stageIndex)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stage.steps.map((step, stepIndex) => (
                    <Card key={stepIndex} className="bg-muted/50">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">Step {step.stepNumber}</Badge>
                          {stage.steps.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStep(stageIndex, stepIndex)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Step Name</Label>
                            <Input
                              value={step.stepName}
                              onChange={(e) => updateStep(stageIndex, stepIndex, 'stepName', e.target.value)}
                              placeholder="e.g., Manager Approval"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Step Type</Label>
                            <Select
                              value={step.stepType}
                              onValueChange={(value) => updateStep(stageIndex, stepIndex, 'stepType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ROLE">Role-based</SelectItem>
                                <SelectItem value="USER">Specific User</SelectItem>
                                <SelectItem value="DEPARTMENT">Department</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {step.stepType === 'ROLE' && (
                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Select
                                value={step.roleCode || ''}
                                onValueChange={(value) => updateStep(stageIndex, stepIndex, 'roleCode', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLE_OPTIONS.map(role => (
                                    <SelectItem key={role.value} value={role.value}>
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Approval Order</Label>
                            <Select
                              value={step.approvalOrder}
                              onValueChange={(value) => updateStep(stageIndex, stepIndex, 'approvalOrder', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SEQUENTIAL">Sequential</SelectItem>
                                <SelectItem value="PARALLEL">Parallel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2 col-span-2">
                            <input
                              type="checkbox"
                              id={`required-${stageIndex}-${stepIndex}`}
                              checked={step.isRequired}
                              onChange={(e) => updateStep(stageIndex, stepIndex, 'isRequired', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <Label htmlFor={`required-${stageIndex}-${stepIndex}`} className="font-normal">
                              This step is required
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full"
                    onClick={() => addStep(stageIndex)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step to {STAGE_TYPE_LABELS[stage.stageType]}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {stages.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No approval stages configured yet.</p>
                  <p className="text-sm">Click "Add Stage" to create your first approval workflow.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full">
              {loading ? 'Saving...' : existingConfig ? 'Update Configuration' : 'Create Configuration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
