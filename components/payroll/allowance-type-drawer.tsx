"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AllowanceType } from "@/lib/api/payroll-api"
import { Building, CheckCircle, XCircle, Clock, Edit, X } from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

interface AllowanceTypeDrawerProps {
  isOpen: boolean
  onClose: () => void
  allowanceType: AllowanceType | null
  onEdit?: (allowanceType: AllowanceType) => void
}

export function AllowanceTypeDrawer({ isOpen, onClose, allowanceType, onEdit }: AllowanceTypeDrawerProps) {
  if (!allowanceType) return null

  const { hasSpecificAction } = useRolePermissions()
  const canUpdateAllowanceType = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_ALLOWANCE_TYPE)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(allowanceType)
    }
  }

  const getTypeFromName = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('housing') || nameLower.includes('house')) return 'HOUSING'
    if (nameLower.includes('transport') || nameLower.includes('travel')) return 'TRANSPORT'
    if (nameLower.includes('medical') || nameLower.includes('health')) return 'MEDICAL'
    return 'OTHER'
  }

  const getTypeBadge = (name: string) => {
    const type = getTypeFromName(name)
    const typeMap: { [key: string]: { label: string; color: string } } = {
      'HOUSING': { label: 'Housing', color: 'bg-blue-100 text-blue-800' },
      'TRANSPORT': { label: 'Transport', color: 'bg-green-100 text-green-800' },
      'MEDICAL': { label: 'Medical', color: 'bg-red-100 text-red-800' },
      'OTHER': { label: 'Other', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getTaxableBadge = (isTaxable: boolean) => {
    return isTaxable ? (
      <Badge className="bg-green-100 text-green-800 rounded-full">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Taxable
        </div>
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 rounded-full">
        <div className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Non-Taxable
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
              {allowanceType.name}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {onEdit && canUpdateAllowanceType && (
                <Button
                  variant="gradient-update"
                  size="sm"
                  className="rounded-full w-9 h-9 p-0 shadow-sm"
                  onClick={handleEdit}
                  title="Edit Allowance Type"
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
                  <label className="text-sm font-medium text-gray-500">Allowance Name</label>
                  <div className="text-sm text-gray-900 mt-1">{allowanceType.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Code</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono">
                      {allowanceType.code}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <div className="mt-1">
                    {getTypeBadge(allowanceType.name)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <div className="text-sm text-gray-900 mt-1">{allowanceType.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                {allowanceType.isTaxable ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-600" />
                )}
                Tax Configuration
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Taxable Status</label>
                <div className="mt-1">
                  {getTaxableBadge(allowanceType.isTaxable)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tax Impact</label>
                <div className="text-sm text-gray-900 mt-1">
                  {allowanceType.isTaxable 
                    ? "This allowance is included in taxable income calculations and will be subject to PAYE tax."
                    : "This allowance is excluded from taxable income calculations and will not be subject to PAYE tax."
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
                    <Badge variant={allowanceType.isActive ? "default" : "secondary"} className="rounded-full">
                      {allowanceType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {allowanceType.createdBy?.firstName} {allowanceType.createdBy?.lastName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {new Date(allowanceType.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {new Date(allowanceType.updatedAt).toLocaleString()}
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
                <p className="font-medium mb-2">How to use this allowance type:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Assign this allowance to employees in their payroll configuration</li>
                  <li>Set the amount or percentage for each employee</li>
                  <li>The system will automatically calculate tax implications based on the taxable status</li>
                  <li>Use the code "{allowanceType.code}" when referencing this allowance in reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
