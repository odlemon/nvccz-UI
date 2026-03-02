"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Save, X, Settings, Users, Building, User } from "lucide-react"
import { toast } from "sonner"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { procurementApi } from "@/lib/api/procurement-api"

interface CreateApprovalConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ApprovalStep {
  stepNumber: number
  stepName: string
  stepType: 'USER' | 'ROLE' | 'DEPARTMENT'
  userId?: string
  roleId?: string
  departmentId?: string
  isRequired: boolean
  canDelegate: boolean
  approvalOrder: number
}

interface ApprovalStage {
  stageType: 'PURCHASE_REQUISITION' | 'PURCHASE_ORDER' | 'INVOICE' | 'GRN'
  steps: ApprovalStep[]
}

export function CreateApprovalConfigModal({ isOpen, onClose, onSuccess }: CreateApprovalConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const { permissions } = useProcurementPermissions()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: false
  })

  const [stages, setStages] = useState<ApprovalStage[]>([
    {
      stageType: 'PURCHASE_REQUISITION',
      steps: [
        {
          stepNumber: 1,
          stepName: "Department Head Approval",
          stepType: 'ROLE',
          roleId: "",
          isRequired: true,
          canDelegate: false,
          approvalOrder: 1
        }
      ]
    }
  ])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addStage = () => {
    const newStage: ApprovalStage = {
      stageType: 'PURCHASE_REQUISITION',
      steps: [
        {
          stepNumber: 1,
          stepName: "",
          stepType: 'USER',
          isRequired: true,
          canDelegate: false,
          approvalOrder: 1
        }
      ]
    }
    setStages([...stages, newStage])
  }

  const removeStage = (stageIndex: number) => {
    if (stages.length > 1) {
      setStages(stages.filter((_, i) => i !== stageIndex))
    }
  }

  const updateStage = (stageIndex: number, field: keyof ApprovalStage, value: any) => {
    const updatedStages = [...stages]
    updatedStages[stageIndex] = { ...updatedStages[stageIndex], [field]: value }
    setStages(updatedStages)
  }

  const addStep = (stageIndex: number) => {
    const updatedStages = [...stages]
    const newStep: ApprovalStep = {
      stepNumber: updatedStages[stageIndex].steps.length + 1,
      stepName: "",
      stepType: 'USER',
      isRequired: true,
      canDelegate: false,
      approvalOrder: updatedStages[stageIndex].steps.length + 1
    }
    updatedStages[stageIndex].steps.push(newStep)
    setStages(updatedStages)
  }

  const removeStep = (stageIndex: number, stepIndex: number) => {
    const updatedStages = [...stages]
    if (updatedStages[stageIndex].steps.length > 1) {
      updatedStages[stageIndex].steps = updatedStages[stageIndex].steps.filter((_, i) => i !== stepIndex)
      // Renumber steps
      updatedStages[stageIndex].steps.forEach((step, i) => {
        step.stepNumber = i + 1
        step.approvalOrder = i + 1
      })
      setStages(updatedStages)
    }
  }

  const updateStep = (stageIndex: number, stepIndex: number, field: keyof ApprovalStep, value: any) => {
    const updatedStages = [...stages]
    updatedStages[stageIndex].steps[stepIndex] = {
      ...updatedStages[stageIndex].steps[stepIndex],
      [field]: value
    }
    setStages(updatedStages)
  }

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'USER': return <User className="w-4 h-4" />
      case 'ROLE': return <Users className="w-4 h-4" />
      case 'DEPARTMENT': return <Building className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getStepTypeColor = (stepType: string) => {
    switch (stepType) {
      case 'USER': return 'bg-blue-100 text-blue-800'
      case 'ROLE': return 'bg-green-100 text-green-800'
      case 'DEPARTMENT': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || stages.some(stage => stage.steps.some(step => !step.stepName))) {
      toast.error("Please fill in all required fields")
      return
    }

    // Check permissions
    if (!permissions.canManageApprovalConfigs) {
      toast.error('You do not have permission to manage approval configurations')
      return
    }

    setLoading(true)
    try {
      const configData = {
        ...formData,
        stages: stages
      }

      const response = await procurementApi.createApprovalConfig(configData)

      if (response.success) {
        toast.success("Approval configuration created successfully!")
        onSuccess()
        handleClose()
      } else {
        toast.error("Failed to create approval configuration")
      }
    } catch (error: any) {
      toast.error("Error creating approval configuration", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      isActive: false
    })
    setStages([
      {
        stageType: 'PURCHASE_REQUISITION',
        steps: [
          {
            stepNumber: 1,
            stepName: "Department Head Approval",
            stepType: 'ROLE',
            roleId: "",
            isRequired: true,
            canDelegate: false,
            approvalOrder: 1
          }
        ]
      }
    ])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Create Approval Configuration
          </DialogTitle>
          <DialogDescription>
            Configure approval workflows and steps for procurement processes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Configuration Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Standard Procurement Approval"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe when this approval configuration should be used"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked as boolean)}
                />
                <Label htmlFor="isActive">Set as active configuration</Label>
              </div>
            </CardContent>
          </Card>

          {/* Approval Stages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Approval Stages</CardTitle>
              <Button type="button" onClick={addStage} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Stage
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {stages.map((stage, stageIndex) => (
                <div key={stageIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Stage {stageIndex + 1}</h4>
                    {stages.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeStage(stageIndex)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>Stage Type</Label>
                    <Select
                      value={stage.stageType}
                      onValueChange={(value: 'PURCHASE_REQUISITION' | 'PURCHASE_ORDER' | 'INVOICE' | 'GRN') =>
                        updateStage(stageIndex, 'stageType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PURCHASE_REQUISITION">Purchase Requisition</SelectItem>
                        <SelectItem value="PURCHASE_ORDER">Purchase Order</SelectItem>
                        <SelectItem value="INVOICE">Invoice</SelectItem>
                        <SelectItem value="GRN">Goods Received Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Approval Steps */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Approval Steps</h5>
                      <Button
                        type="button"
                        onClick={() => addStep(stageIndex)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Step
                      </Button>
                    </div>

                    {stage.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Step {step.stepNumber}</Badge>
                            <Badge className={getStepTypeColor(step.stepType)}>
                              {getStepTypeIcon(step.stepType)}
                              {step.stepType}
                            </Badge>
                          </div>
                          {stage.steps.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeStep(stageIndex, stepIndex)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Step Name *</Label>
                            <Input
                              value={step.stepName}
                              onChange={(e) => updateStep(stageIndex, stepIndex, 'stepName', e.target.value)}
                              placeholder="e.g., Manager Approval"
                            />
                          </div>

                          <div>
                            <Label>Step Type</Label>
                            <Select
                              value={step.stepType}
                              onValueChange={(value: 'USER' | 'ROLE' | 'DEPARTMENT') =>
                                updateStep(stageIndex, stepIndex, 'stepType', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">Specific User</SelectItem>
                                <SelectItem value="ROLE">Role-based</SelectItem>
                                <SelectItem value="DEPARTMENT">Department-based</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {step.stepType === 'USER' && (
                            <div>
                              <Label>Select User</Label>
                              <Select
                                value={step.userId || ""}
                                onValueChange={(value) => updateStep(stageIndex, stepIndex, 'userId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user-1">John Smith (Manager)</SelectItem>
                                  <SelectItem value="user-2">Sarah Johnson (Director)</SelectItem>
                                  <SelectItem value="user-3">Mike Wilson (CFO)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {step.stepType === 'ROLE' && (
                            <div>
                              <Label>Select Role</Label>
                              <Select
                                value={step.roleId || ""}
                                onValueChange={(value) => updateStep(stageIndex, stepIndex, 'roleId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="role-1">Department Manager</SelectItem>
                                  <SelectItem value="role-2">Finance Director</SelectItem>
                                  <SelectItem value="role-3">CEO</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {step.stepType === 'DEPARTMENT' && (
                            <div>
                              <Label>Select Department</Label>
                              <Select
                                value={step.departmentId || ""}
                                onValueChange={(value) => updateStep(stageIndex, stepIndex, 'departmentId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="dept-1">Finance</SelectItem>
                                  <SelectItem value="dept-2">Operations</SelectItem>
                                  <SelectItem value="dept-3">IT</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${stageIndex}-${stepIndex}`}
                              checked={step.isRequired}
                              onCheckedChange={(checked) => updateStep(stageIndex, stepIndex, 'isRequired', checked)}
                            />
                            <Label htmlFor={`required-${stageIndex}-${stepIndex}`}>Required Step</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`delegate-${stageIndex}-${stepIndex}`}
                              checked={step.canDelegate}
                              onCheckedChange={(checked) => updateStep(stageIndex, stepIndex, 'canDelegate', checked)}
                            />
                            <Label htmlFor={`delegate-${stageIndex}-${stepIndex}`}>Can Delegate</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !permissions.canManageApprovalConfigs} className="gradient-primary text-white">
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
