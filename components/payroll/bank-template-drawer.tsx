"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BankTemplate } from "@/lib/api/payroll-api"
import { FileText, CheckCircle, XCircle, Clock, Edit, X, GripVertical } from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

interface BankTemplateDrawerProps {
  isOpen: boolean
  onClose: () => void
  bankTemplate: BankTemplate | null
  onEdit?: (bankTemplate: BankTemplate) => void
}

export function BankTemplateDrawer({ isOpen, onClose, bankTemplate, onEdit }: BankTemplateDrawerProps) {
  if (!bankTemplate) return null

  const { hasSpecificAction } = useRolePermissions()
  const canUpdateBankTemplate = hasSpecificAction(PAYROLL_ACTIONS.UPDATE_BANK_TEMPLATE)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(bankTemplate)
    }
  }

  const getDelimiterBadge = (delimiter: string) => {
    const delimiterMap: { [key: string]: { label: string; color: string } } = {
      ',': { label: 'Comma', color: 'bg-blue-100 text-blue-800' },
      ';': { label: 'Semicolon', color: 'bg-green-100 text-green-800' },
      '|': { label: 'Pipe', color: 'bg-purple-100 text-purple-800' },
      '\t': { label: 'Tab', color: 'bg-orange-100 text-orange-800' }
    }
    
    const config = delimiterMap[delimiter] || { label: delimiter, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getDelimiterDisplay = (delimiter: string) => {
    const delimiterMap: { [key: string]: string } = {
      ',': 'Comma (,)',
      ';': 'Semicolon (;)',
      '|': 'Pipe (|)',
      '\t': 'Tab'
    }
    
    return delimiterMap[delimiter] || delimiter
  }

  // Parse columnOrder from JSON string
  const getColumnOrder = () => {
    try {
      if (typeof bankTemplate.columnOrder === 'string') {
        return JSON.parse(bankTemplate.columnOrder)
      }
      return Array.isArray(bankTemplate.columnOrder) ? bankTemplate.columnOrder : []
    } catch (error) {
      console.error('Error parsing columnOrder:', error)
      return []
    }
  }

  const columnOrder = getColumnOrder()

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[25vw] min-w-[600px] max-w-[800px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-normal flex items-center gap-2">
              <FileText className="w-6 h-6" />
              {bankTemplate.name}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {onEdit && canUpdateBankTemplate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full w-9 h-9 p-0 gradient-primary text-white"
                  onClick={handleEdit}
                  title="Edit Bank Template"
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
                <FileText className="w-5 h-5" />
                Basic Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Template Name</label>
                  <div className="text-sm text-gray-900 mt-1">{bankTemplate.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <div className="text-sm text-gray-900 mt-1">{bankTemplate.bankName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* File Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <FileText className="w-5 h-5" />
                File Configuration
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Delimiter</label>
                  <div className="mt-1">
                    {getDelimiterBadge(bankTemplate.delimiter)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Header Row</label>
                  <div className="mt-1">
                    <Badge variant={bankTemplate.hasHeader ? "default" : "secondary"}>
                      {bankTemplate.hasHeader ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">File Format</label>
                <div className="text-sm text-gray-900 mt-1">
                  {bankTemplate.hasHeader 
                    ? `CSV file with header row, using ${getDelimiterDisplay(bankTemplate.delimiter)} as delimiter`
                    : `CSV file without header row, using ${getDelimiterDisplay(bankTemplate.delimiter)} as delimiter`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Column Order */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <GripVertical className="w-5 h-5" />
                Column Order
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Columns ({columnOrder.length})</label>
                <div className="mt-2 space-y-2">
                  {columnOrder.length > 0 ? columnOrder.map((column, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-900">{column}</span>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-500 italic">No columns defined</div>
                  )}
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
                    <Badge variant={bankTemplate.isActive ? "default" : "secondary"} className="rounded-full">
                      {bankTemplate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {bankTemplate.createdBy?.firstName} {bankTemplate.createdBy?.lastName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {new Date(bankTemplate.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {new Date(bankTemplate.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Usage Guidelines
              </h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">How to use this bank template:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This template is configured for {bankTemplate.bankName} bank files</li>
                  <li>Use this template when generating payroll files for {bankTemplate.bankName}</li>
                  <li>The file will use {getDelimiterDisplay(bankTemplate.delimiter)} as the column separator</li>
                  <li>{bankTemplate.hasHeader ? 'Include column headers in the first row' : 'Start directly with data rows'}</li>
                  <li>Columns will be ordered as shown above</li>
                  <li>Ensure all required data is available for each column before generating the file</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sample Output */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-normal flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Sample Output
              </h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Example file structure:</p>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs">
                  {bankTemplate.hasHeader && columnOrder.length > 0 && (
                    <div className="text-gray-500 mb-1">
                      {columnOrder.join(bankTemplate.delimiter)}
                    </div>
                  )}
                  <div className="text-gray-700">
                    John Doe{bankTemplate.delimiter}Standard Bank{bankTemplate.delimiter}12345{bankTemplate.delimiter}1234567890{bankTemplate.delimiter}2500.00{bankTemplate.delimiter}PAY001
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
