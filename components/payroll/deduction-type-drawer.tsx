"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeductionType } from "@/lib/api/payroll-api"
import { Building, CheckCircle, XCircle, Clock, Edit, X } from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

interface DeductionTypeDrawerProps {
  isOpen: boolean
  onClose: () => void
  deductionType: DeductionType | null
  onEdit?: (deductionType: DeductionType) => void
}

export function DeductionTypeDrawer({ isOpen, onClose, deductionType, onEdit }: DeductionTypeDrawerProps) {
  if (!deductionType) return null

  const { hasSpecificAction } = useRolePermissions()
  const canUpdateDeductionType = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_DEDUCTION_TYPE)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(deductionType)
    }
  }

  const getTypeFromName = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('loan') || nameLower.includes('borrow')) return 'LOAN'
    if (nameLower.includes('pension') || nameLower.includes('retirement')) return 'PENSION'
    if (nameLower.includes('advance') || nameLower.includes('prepaid')) return 'ADVANCE'
    return 'OTHER'
  }

  const getTypeBadge = (name: string) => {
    const type = getTypeFromName(name)
    const typeMap: { [key: string]: { label: string; color: string } } = {
      'LOAN': { label: 'Loan', color: 'bg-orange-100 text-orange-800' },
      'PENSION': { label: 'Pension', color: 'bg-blue-100 text-blue-800' },
      'ADVANCE': { label: 'Advance', color: 'bg-purple-100 text-purple-800' },
      'OTHER': { label: 'Other', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getStatutoryBadge = (isStatutory: boolean) => {
    return isStatutory ? (
      <Badge className="bg-blue-100 text-blue-800 rounded-full">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Statutory
        </div>
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 rounded-full">
        <div className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Non-Statutory
        </div>
      </Badge>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[25vw] min-w-[600px] max-w-[800px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-normal flex items-center gap-2">
              <Building className="w-6 h-6" />
              {deductionType.name}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {onEdit && canUpdateDeductionType && (
                <Button
                  variant="gradient-update"
                  size="sm"
                  className="rounded-full w-9 h-9 p-0 shadow-sm"
                  onClick={handleEdit}
                  title="Edit Deduction Type"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full w-9 h-9 p-0 hover:bg-gray-100"
                onClick={onClose}
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <Building className="w-5 h-5" />
                Basic Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Deduction Name</label>
                  <div className="text-sm text-gray-900 mt-1">{deductionType.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Code</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono">
                      {deductionType.code}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <div className="mt-1">
                    {getTypeBadge(deductionType.name)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <div className="text-sm text-gray-900 mt-1">{deductionType.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                {deductionType.isStatutory ? (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-600" />
                )}
                Statutory Configuration
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Statutory Status</label>
                <div className="mt-1">
                  {getStatutoryBadge(deductionType.isStatutory)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Legal Requirements</label>
                <div className="text-sm text-gray-900 mt-1">
                  {deductionType.isStatutory 
                    ? "This deduction is legally required and must be applied to all eligible employees according to labor laws and regulations."
                    : "This deduction is optional and can be applied based on employee agreements or company policies."
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Status Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={deductionType.isActive ? "default" : "secondary"} className="rounded-full">
                      {deductionType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {deductionType.createdBy?.firstName} {deductionType.createdBy?.lastName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {new Date(deductionType.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {new Date(deductionType.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <Building className="w-5 h-5" />
                Usage Guidelines
              </h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">How to use this deduction type:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Assign this deduction to employees in their payroll configuration</li>
                  <li>Set the amount or percentage for each employee</li>
                  <li>Statutory deductions are automatically applied based on legal requirements</li>
                  <li>Use the code "{deductionType.code}" when referencing this deduction in reports</li>
                  <li>{deductionType.isStatutory ? 'This deduction is mandatory for eligible employees' : 'This deduction is optional and requires employee consent'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
