"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PayrollRun, EmployeePayroll, payrollRunsApi } from "@/lib/api/payroll-api"
import { CopyText } from "@/components/ui/copy-text"
import { RichDataTable } from "./rich-data-table"
import { BankFileDialog } from "./bank-file-dialog"
import { toast } from "sonner"
import { 
  Play, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText,
  Edit,
  X,
  Download
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"

interface PayrollRunDrawerProps {
  isOpen: boolean
  onClose: () => void
  payrollRun: PayrollRun | null
  onEdit: (payrollRun: PayrollRun) => void
  onProcess: (payrollRun: PayrollRun) => void
}

type TabType = "overview" | "summary" | "employees"

const tabs = [
  {
    id: "overview" as TabType,
    label: "Overview",
    icon: Play
  },
  {
    id: "summary" as TabType,
    label: "Summary",
    icon: DollarSign
  },
  {
    id: "employees" as TabType,
    label: "Employees",
    icon: Users
  }
]

export function PayrollRunDrawer({ isOpen, onClose, payrollRun, onEdit, onProcess }: PayrollRunDrawerProps) {
  const { hasSpecificAction } = useRolePermissions()
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [detailedRun, setDetailedRun] = useState<PayrollRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [isBankFileDialogOpen, setIsBankFileDialogOpen] = useState(false)
  const [isProcessOpen, setIsProcessOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Permission checks
  const canUpdateRun = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_PAYROLL_RUN)
  const canProcessRun = hasSpecificAction('payroll', PAYROLL_ACTIONS.PROCESS_PAYROLL_RUN)
  const canGenerateBankFile = hasSpecificAction('payroll', PAYROLL_ACTIONS.GENERATE_BANK_FILE)

  // Load detailed payroll run data
  const loadDetailedRun = useCallback(async () => {
    if (!payrollRun) return
    
    try {
      setLoading(true)
      const response = await payrollRunsApi.getById(payrollRun.id)
      if (response.success && response.data) {
        setDetailedRun(response.data)
      } else {
        toast.error('Failed to load payroll run details')
      }
    } catch (error) {
      console.error('Error loading payroll run details:', error)
      toast.error('Failed to load payroll run details')
    } finally {
      setLoading(false)
    }
  }, [payrollRun])

  useEffect(() => {
    if (payrollRun) {
      loadDetailedRun()
    }
  }, [payrollRun, loadDetailedRun])

  if (!payrollRun) return null

  const handleEdit = () => {
    onEdit(payrollRun)
    onClose()
  }

  const handleProcess = () => {
    setIsProcessOpen(true)
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>
      case 'PROCESSING':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Processing</Badge>
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Format currency amount
  const formatCurrency = (amount: string, currency?: { symbol: string } | null) => {
    const symbol = currency?.symbol || '$'
    const value = parseFloat(amount) || 0
    return `${symbol}${value.toLocaleString()}`
  }

  // Employee payroll columns
  const employeeColumns = [
    {
      key: "employee" as keyof EmployeePayroll,
      label: "Employee",
      sortable: true,
      render: (value: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {value.user.firstName} {value.user.lastName}
          </div>
          <div className="text-sm text-gray-500">{value.employeeNumber}</div>
        </div>
      ),
    },
    {
      key: "basicSalary" as keyof EmployeePayroll,
      label: "Basic Salary",
      sortable: true,
      render: (value: string, row: EmployeePayroll) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(value, payrollRun.currency)}
        </span>
      ),
    },
    {
      key: "totalAllowances" as keyof EmployeePayroll,
      label: "Allowances",
      sortable: true,
      render: (value: string, row: EmployeePayroll) => (
        <span className="text-sm text-green-600">
          {formatCurrency(value, payrollRun.currency)}
        </span>
      ),
    },
    {
      key: "totalDeductions" as keyof EmployeePayroll,
      label: "Deductions",
      sortable: true,
      render: (value: string, row: EmployeePayroll) => (
        <span className="text-sm text-red-600">
          {formatCurrency(value, payrollRun.currency)}
        </span>
      ),
    },
    {
      key: "grossPay" as keyof EmployeePayroll,
      label: "Gross Pay",
      sortable: true,
      render: (value: string, row: EmployeePayroll) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(value, payrollRun.currency)}
        </span>
      ),
    },
    {
      key: "netPay" as keyof EmployeePayroll,
      label: "Net Pay",
      sortable: true,
      render: (value: string, row: EmployeePayroll) => (
        <span className="font-bold text-green-600">
          {formatCurrency(value, payrollRun.currency)}
        </span>
      ),
    }
  ]

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[35vw] min-w-[800px] max-w-[1200px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-normal flex items-center gap-2">
              <Play className="w-6 h-6" />
              Payroll Run Details
            </SheetTitle>
            <div className="flex items-center gap-2">
              {payrollRun.status === 'DRAFT' && canUpdateRun && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Payroll Run Header */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {payrollRun.name}
              </h2>
              <p className="text-gray-600">{payrollRun.payPeriod}</p>
              <div className="flex items-center gap-2">
                {getStatusBadge(payrollRun.status)}
                <Badge variant="outline">
                  {payrollRun._count?.employeePayrolls || 0} Employees
                </Badge>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600"
                      layoutId="activeTab"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payroll Run Name</label>
                      <p className="text-sm text-gray-900">{payrollRun.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Pay Period</label>
                      <p className="text-sm text-gray-900">{payrollRun.payPeriod}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">{getStatusBadge(payrollRun.status)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-sm text-gray-900">
                        {new Date(payrollRun.startDate).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-sm text-gray-900">
                        {new Date(payrollRun.endDate).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created By</label>
                      <p className="text-sm text-gray-900">
                        {payrollRun.createdBy.firstName} {payrollRun.createdBy.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  {payrollRun.status === 'DRAFT' && canProcessRun && (
                    <Button
                      onClick={handleProcess}
                      className="gradient-primary text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Process Payroll
                    </Button>
                  )}
                  {payrollRun.status === 'COMPLETED' && canGenerateBankFile && (
                    <Button
                      onClick={() => setIsBankFileDialogOpen(true)}
                      className="gradient-primary text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Generate Bank File
                    </Button>
                  )}
                  {payrollRun.status === 'DRAFT' && canUpdateRun && (
                    <Button
                      variant="outline"
                      onClick={handleEdit}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Run
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="space-y-6">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Summary
                </h3>
                
                {/* Main Financial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary rounded-xl">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">Total Gross Pay</p>
                          <p className="text-5xl font-normal text-white mt-2">
                            {formatCurrency(payrollRun.totalGrossPay, payrollRun.currency)}
                          </p>
                          <p className="text-sm font-medium text-white/80 mt-1">
                            Before deductions
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white rounded-xl">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Total Deductions</p>
                          <p className="text-5xl font-normal mt-2">
                            {formatCurrency(payrollRun.totalDeductions, payrollRun.currency)}
                          </p>
                          <p className="text-sm font-medium text-gray-600 mt-1">
                            Taxes & other deductions
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary rounded-xl">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">Total Net Pay</p>
                          <p className="text-5xl font-normal text-white mt-2">
                            {formatCurrency(payrollRun.totalNetPay, payrollRun.currency)}
                          </p>
                          <p className="text-sm font-medium text-white/80 mt-1">
                            Amount to be paid
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white rounded-xl">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Employees</p>
                          <p className="text-2xl font-normal">
                            {payrollRun._count?.employeePayrolls || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary rounded-xl">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Payslips</p>
                          <p className="text-2xl font-normal text-white">
                            {payrollRun._count?.payslips || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white rounded-xl">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Pay Period</p>
                          <p className="text-lg font-normal">
                            {payrollRun.payPeriod}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary rounded-xl">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Status</p>
                          <div className="mt-1">{getStatusBadge(payrollRun.status)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee Breakdown */}
                {detailedRun?.employeePayrolls && detailedRun.employeePayrolls.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Employee Breakdown</h4>
                    <div className="space-y-3">
                      {detailedRun.employeePayrolls.map((employeePayroll) => (
                        <div key={employeePayroll.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {employeePayroll.employee.user.firstName[0]}{employeePayroll.employee.user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {employeePayroll.employee.user.firstName} {employeePayroll.employee.user.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{employeePayroll.employee.employeeNumber}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-normal text-gray-900">
                              {formatCurrency(employeePayroll.netPay, payrollRun.currency)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Gross: {formatCurrency(employeePayroll.grossPay, payrollRun.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Employees Tab */}
            {activeTab === "employees" && (
              <div className="space-y-4">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Employee Payrolls
                </h3>

                {detailedRun?.employeePayrolls && detailedRun.employeePayrolls.length > 0 ? (
                  <RichDataTable
                    data={detailedRun.employeePayrolls}
                    columns={employeeColumns}
                    loading={loading}
                    searchPlaceholder="Search employees..."
                    title=""
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No employee payrolls found</p>
                    <p className="text-sm">Process the payroll run to generate employee payrolls</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
      
      {/* Bank File Generation Dialog */}
      {payrollRun && (
        <BankFileDialog
          isOpen={isBankFileDialogOpen}
          onClose={() => setIsBankFileDialogOpen(false)}
          payrollRunId={payrollRun.id}
          payrollRunName={payrollRun.name}
        />
      )}

      {/* Process Confirmation Dialog */}
      <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-normal flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600" />
              Process Payroll Run
            </DialogTitle>
            <DialogDescription>
              {payrollRun ? (
                <>This will calculate all employee payrolls for "{payrollRun.name}" and update totals. You can only process runs in Draft status.</>
              ) : (
                <>This will calculate all employee payrolls and update totals. You can only process runs in Draft status.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProcessOpen(false)}
              disabled={isProcessing}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="gradient-primary text-white rounded-full"
              disabled={isProcessing}
              onClick={async () => {
                if (!payrollRun) return
                try {
                  setIsProcessing(true)
                  await onProcess(payrollRun)
                  setIsProcessOpen(false)
                  onClose()
                } finally {
                  setIsProcessing(false)
                }
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
