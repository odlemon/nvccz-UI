"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaxRule } from "@/lib/api/payroll-api"
import { CiDollar, CiCalendar, CiPercent, CiUser } from "react-icons/ci"
import { Minus, Shield, Info, Building, Clock, Edit, X } from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

interface TaxRuleDrawerProps {
  isOpen: boolean
  onClose: () => void
  taxRule: TaxRule | null
  onEdit?: (taxRule: TaxRule) => void
}

const TAX_TYPE_INFO = {
  PAYE: {
    title: "PAYE Tax",
    description: "Pay As You Earn income tax",
    icon: <CiDollar className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-800"
  },
  NSSA: {
    title: "NSSA Contribution",
    description: "National Social Security Authority contribution",
    icon: <CiPercent className="w-5 h-5" />,
    color: "bg-green-100 text-green-800"
  },
  AIDS_LEVY: {
    title: "AIDS Levy",
    description: "Health levy for AIDS prevention",
    icon: <Minus className="w-5 h-5" />,
    color: "bg-red-100 text-red-800"
  }
}

export function TaxRuleDrawer({ isOpen, onClose, taxRule, onEdit }: TaxRuleDrawerProps) {
  if (!taxRule) return null

  const { hasSpecificAction } = useRolePermissions()
  const canUpdateTaxRule = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_TAX_RULE)
  const taxInfo = TAX_TYPE_INFO[taxRule.type as keyof typeof TAX_TYPE_INFO]

  const handleEdit = () => {
    if (onEdit) {
      onEdit(taxRule)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent  className="w-[25vw] min-w-[600px] max-w-[800px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-normal flex items-center gap-2">
              {taxInfo.icon}
              {taxRule.name}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {onEdit && canUpdateTaxRule && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full w-9 h-9 p-0 gradient-primary text-white"
                  onClick={handleEdit}
                  title="Edit Tax Rule"
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
                <Shield className="w-5 h-5" />
                Basic Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Rule Name</label>
                  <div className="text-sm text-gray-900 mt-1">{taxRule.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <div className="mt-1">
                    <Badge className={`${taxInfo.color} rounded-full`}>
                      <div className="flex items-center gap-1">
                        {taxInfo.icon}
                        {taxInfo.title}
                      </div>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Rate</label>
                  <div className="text-sm text-gray-900 mt-1">{taxRule.rate}%</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={taxRule.isActive ? "default" : "secondary"} className="rounded-full">
                      {taxRule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <CiDollar className="w-5 h-5" />
                Financial Configuration
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Threshold Amount</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {taxRule.threshold ? `$${parseFloat(taxRule.threshold).toLocaleString()}` : 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ceiling Amount</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {taxRule.ceiling ? `$${parseFloat(taxRule.ceiling).toLocaleString()}` : 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dates and Currency */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <CiCalendar className="w-5 h-5" />
                Dates & Currency
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Effective Date</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {new Date(taxRule.effectiveDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {taxRule.endDate ? new Date(taxRule.endDate).toLocaleDateString() : 'No end date'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Currency</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {taxRule.currency?.code} - {taxRule.currency?.name}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Currency Symbol</label>
                  <div className="text-sm text-gray-900 mt-1">{taxRule.currency?.symbol}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <Info className="w-5 h-5" />
                Audit Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <div className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                    <CiUser className="w-4 h-4" />
                    {taxRule.createdBy?.firstName} {taxRule.createdBy?.lastName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <div className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(taxRule.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(taxRule.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="text-sm text-gray-900 mt-1">{taxRule.createdBy?.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Type Description */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <Building className="w-5 h-5" />
                About {taxInfo.title}
              </h3>
            </div>
            <div>
              <p className="text-sm text-gray-600">{taxInfo.description}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
