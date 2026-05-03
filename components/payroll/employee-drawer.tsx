"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Employee, SalaryStructure, salaryStructuresApi, leaveBalancesApi, type LeaveBalance } from "@/lib/api/payroll-api"
import { CopyText } from "@/components/ui/copy-text"
import { SalaryStructureForm } from "./salary-structure-form"
import { LeaveBalanceForm, type LeaveBalanceFormData } from "./leave-balance-form"
import { RichDataTable } from "./rich-data-table"
import { toast } from "sonner"
import { 
  User, 
  Building2, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Edit, 
  X,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  UserX
} from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions"
import { TerminateEmployeeDialog } from "./terminate-employee-dialog"

interface EmployeeDrawerProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
  onEdit: (employee: Employee) => void
  onTerminated?: () => void
}

type TabType = "overview" | "banking" | "salary" | "salary-structures" | "leave-balances"

const tabs = [
  {
    id: "overview" as TabType,
    label: "Overview",
    icon: User
  },
  {
    id: "banking" as TabType,
    label: "Banking",
    icon: Building2
  },
  {
    id: "salary" as TabType,
    label: "Salary",
    icon: DollarSign
  },
  {
    id: "salary-structures" as TabType,
    label: "Salary Structures",
    icon: CreditCard
  },
  {
    id: "leave-balances" as TabType,
    label: "Leave Balances",
    icon: Calendar
  }
]

export function EmployeeDrawer({ isOpen, onClose, employee, onEdit, onTerminated }: EmployeeDrawerProps) {
  const { hasSpecificAction } = useRolePermissions()
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null)
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<LeaveBalance | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTerminateOpen, setIsTerminateOpen] = useState(false)

  // Permission checks
  const canUpdateEmployee = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_EMPLOYEE)

  const loadSalaryStructures = useCallback(async () => {
    if (!employee) return
    
    try {
      setLoading(true)
      const response = await salaryStructuresApi.getByEmployee(employee.id)
      if (response.success && response.data) {
        setSalaryStructures(response.data)
      } else {
        toast.error('Failed to load salary structures')
      }
    } catch (error) {
      console.error('Error loading salary structures:', error)
      toast.error('Failed to load salary structures')
    } finally {
      setLoading(false)
    }
  }, [employee])

  const loadLeaveBalances = useCallback(async () => {
    if (!employee) return
    try {
      setLoading(true)
      const res = await leaveBalancesApi.getByEmployee(employee.id)
      if (res.success && res.data) {
        setLeaveBalances(res.data)
      } else {
        toast.error('Failed to load leave balances')
      }
    } catch (e) {
      console.error('Error loading leave balances:', e)
      toast.error('Failed to load leave balances')
    } finally {
      setLoading(false)
    }
  }, [employee])

  // Load salary structures when employee changes
  useEffect(() => {
    if (employee) {
      loadSalaryStructures()
      loadLeaveBalances()
    }
  }, [employee, loadSalaryStructures, loadLeaveBalances])

  if (!employee) return null

  const handleEdit = () => {
    onEdit(employee)
    onClose()
  }

  const handleCreateStructure = () => {
    setEditingStructure(null)
    setIsFormOpen(true)
  }

  const handleCreateLeave = () => {
    setEditingLeave(null)
    setIsLeaveFormOpen(true)
  }

  const handleEditStructure = (structure: SalaryStructure) => {
    setEditingStructure(structure)
    setIsFormOpen(true)
  }

  const handleEditLeave = (lb: LeaveBalance) => {
    setEditingLeave(lb)
    setIsLeaveFormOpen(true)
  }

  const handleDeleteStructure = async (structure: SalaryStructure) => {
    if (window.confirm(`Are you sure you want to delete this salary structure?`)) {
      try {
        await salaryStructuresApi.delete(structure.id)
        toast.success('Salary structure deleted successfully')
        loadSalaryStructures()
      } catch (error) {
        console.error('Error deleting salary structure:', error)
        toast.error('Failed to delete salary structure')
      }
    }
  }

  const handleLeaveSubmit = async (data: LeaveBalanceFormData) => {
    try {
      if (editingLeave) {
        await leaveBalancesApi.update(editingLeave.id, {
          leaveType: data.leaveType,
          balance: data.balance,
          currencyId: data.currencyId,
        })
        toast.success('Leave balance updated successfully')
      } else {
        await leaveBalancesApi.create(data)
        toast.success('Leave balance created successfully')
      }
      setIsLeaveFormOpen(false)
      setEditingLeave(null)
      loadLeaveBalances()
    } catch (e) {
      console.error('Error saving leave balance:', e)
      toast.error(editingLeave ? 'Failed to update leave balance' : 'Failed to create leave balance')
      throw e
    }
  }

  const handleLeaveClose = () => {
    setIsLeaveFormOpen(false)
    setEditingLeave(null)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingStructure) {
        await salaryStructuresApi.update(editingStructure.id, data)
        toast.success('Salary structure updated successfully')
      } else {
        await salaryStructuresApi.create(data)
        toast.success('Salary structure created successfully')
      }
      setIsFormOpen(false)
      setEditingStructure(null)
      loadSalaryStructures()
    } catch (error) {
      console.error('Error saving salary structure:', error)
      toast.error(editingStructure ? 'Failed to update salary structure' : 'Failed to create salary structure')
      throw error // Re-throw to let the form handle loading state
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingStructure(null)
  }

  // Generate random gradient background for initials
  const getInitialsGradient = (name: string) => {
    const gradients = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-green-500 to-green-600", 
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-red-500 to-red-600",
      "bg-gradient-to-br from-yellow-500 to-yellow-600",
      "bg-gradient-to-br from-teal-500 to-teal-600",
      "bg-gradient-to-br from-orange-500 to-orange-600",
      "bg-gradient-to-br from-cyan-500 to-cyan-600"
    ]
    
    // Use name to consistently generate same gradient for same person
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return gradients[Math.abs(hash) % gradients.length]
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[35vw] min-w-[800px] max-w-[1200px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-normal flex items-center gap-2">
              <User className="w-6 h-6" />
              Employee Details
            </SheetTitle>
            <div className="flex items-center gap-2">
              {employee.isActive && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsTerminateOpen(true)}
                  className="rounded-full h-10 w-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Terminate employee"
                >
                  <UserX className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleEdit}
                className="rounded-full h-10 w-10"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="rounded-full h-10 w-10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Employee Header */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium ${getInitialsGradient(`${employee.user.firstName} ${employee.user.lastName}`)}`}>
                  {getInitials(employee.user.firstName, employee.user.lastName)}
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {employee.user.firstName} {employee.user.lastName}
                  </h2>
                  <p className="text-gray-600">{employee.user.email}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={employee.isActive ? "default" : "secondary"}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {employee.employeeNumber}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  
                  {/* Active tab underline */}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"
                      layoutId="activeTab"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">Email</p>
                      <CopyText 
                        text={employee.user.email}
                        successMessage="Email copied to clipboard!"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">Employee Number</p>
                      <CopyText 
                        text={employee.employeeNumber}
                        successMessage="Employee number copied to clipboard!"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-normal text-gray-900">Status</p>
                      <div className="flex items-center gap-2">
                        {employee.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {employee.isActive ? 'Active Employee' : 'Inactive Employee'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-normal text-gray-900">Created</p>
                      <p className="text-sm text-gray-600">{formatDateTime(employee.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-normal text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600">{formatDateTime(employee.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Banking Tab */}
            {activeTab === "banking" && (
              <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5" />
                  Bank Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-normal text-gray-500">Bank Name</label>
                      <p className="text-sm text-gray-900 mt-1">{employee.bankName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-normal text-gray-500">Branch Code</label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{employee.branchCode}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Account Number</label>
                    <div className="mt-1">
                      <CopyText 
                        text={employee.accountNumber}
                        successMessage="Account number copied to clipboard!"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-normal text-gray-900">Banking Setup</p>
                      <p className="text-sm text-gray-600">
                        {employee.bankName} - Branch {employee.branchCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-normal text-gray-900">Account Details</p>
                      <p className="text-sm text-gray-600 font-mono">{employee.accountNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Salary Tab */}
            {activeTab === "salary" && (
              <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5" />
                  Salary Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-normal text-gray-500">Basic Salary</label>
                      <p className="text-lg font-normal text-gray-900 mt-1">
                        {employee.currency.symbol}{parseFloat(employee.basicSalary).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-normal text-gray-500">Currency</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {employee.currency.name} ({employee.currency.code})
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5" />
                  Currency Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-normal text-gray-900">Currency Symbol</p>
                      <p className="text-sm text-gray-600">{employee.currency.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-normal text-gray-900">Currency Name</p>
                      <p className="text-sm text-gray-600">{employee.currency.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-normal text-gray-900">Currency Status</p>
                      <p className="text-sm text-gray-600">
                        {employee.currency.isActive ? 'Active' : 'Inactive'}
                        {employee.currency.isDefault && ' (Default)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Salary Structures Tab */}
            {activeTab === "salary-structures" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Salary Structures
                  </h3>
                  <Button
                    onClick={handleCreateStructure}
                    className="rounded-full gradient-primary text-white font-normal"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Create Structure
                  </Button>
                </div>

                <RichDataTable
                  data={salaryStructures}
                  columns={[
                    {
                      key: "allowanceType" as keyof SalaryStructure,
                      label: "Allowance Type",
                      sortable: true,
                      render: (value: any) => (
                        <div>
                          <div className="font-medium text-gray-900">{value.name}</div>
                          <div className="text-sm text-gray-500">{value.description}</div>
                        </div>
                      ),
                    },
                    {
                      key: "amount" as keyof SalaryStructure,
                      label: "Amount",
                      sortable: true,
                      render: (value: string, row: SalaryStructure) => (
                        <span className="text-sm text-gray-900">
                          {row.currency?.symbol || '$'}{parseFloat(value).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "effectiveDate" as keyof SalaryStructure,
                      label: "Effective Date",
                      sortable: true,
                      render: (value: string) => (
                        <span className="text-sm text-gray-600">
                          {new Date(value).toLocaleDateString()}
                        </span>
                      ),
                    },
                    {
                      key: "endDate" as keyof SalaryStructure,
                      label: "End Date",
                      sortable: true,
                      render: (value: string | null) => (
                        <span className="text-sm text-gray-600">
                          {value ? new Date(value).toLocaleDateString() : 'N/A'}
                        </span>
                      ),
                    },
                    {
                      key: "isActive" as keyof SalaryStructure,
                      label: "Status",
                      sortable: true,
                      render: (value: boolean) => (
                        <Badge variant={value ? "default" : "secondary"}>
                          {value ? "Active" : "Inactive"}
                        </Badge>
                      ),
                    }
                  ]}
                  loading={loading}
                  searchPlaceholder="Search salary structures..."
                  title=""
                  onEdit={handleEditStructure}
                  onDelete={handleDeleteStructure}
                />
              </div>
            )}

            {/* Leave Balances Tab */}
            {activeTab === "leave-balances" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Leave Balances
                  </h3>
                  <Button onClick={handleCreateLeave} className="rounded-full gradient-primary text-white font-normal">
                    <Calendar className="w-4 h-4 mr-2" />
                    Set Leave Balance
                  </Button>
                </div>

                <RichDataTable
                  data={leaveBalances}
                  columns={[
                    { key: 'leaveType' as keyof LeaveBalance, label: 'Leave Type', sortable: true },
                    { key: 'balance' as keyof LeaveBalance, label: 'Balance', sortable: true, render: (v: string) => <span className="text-sm text-gray-900">{parseFloat(v).toLocaleString()}</span> },
                    { key: 'currency' as keyof LeaveBalance, label: 'Currency', sortable: false, render: (v: any) => <span className="text-sm text-gray-900">{v?.code}</span> },
                    { key: 'updatedAt' as keyof LeaveBalance, label: 'Updated', sortable: true, render: (v: string) => <span className="text-sm text-gray-600">{new Date(v).toLocaleDateString()}</span> },
                  ]}
                  loading={loading}
                  searchPlaceholder="Search leave balances..."
                  title=""
                  onEdit={handleEditLeave}
                />
              </div>
            )}
          </div>

          {/* Salary Structure Form Modal */}
          <SalaryStructureForm
            isOpen={isFormOpen}
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
            editingStructure={editingStructure}
            employeeId={employee.id}
            loading={loading}
          />

        {/* Leave Balance Form Modal */}
        <LeaveBalanceForm
          isOpen={isLeaveFormOpen}
          onClose={handleLeaveClose}
          onSubmit={handleLeaveSubmit}
          editing={editingLeave}
          employeeId={employee.id}
        />

        {/* Terminate Employee Dialog */}
        <TerminateEmployeeDialog
          isOpen={isTerminateOpen}
          onClose={() => setIsTerminateOpen(false)}
          employee={employee}
          onTerminated={() => {
            onClose()
            onTerminated?.()
          }}
        />
        </div>
      </SheetContent>
    </Sheet>
  )
}
