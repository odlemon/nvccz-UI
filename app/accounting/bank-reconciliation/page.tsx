"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { AccountingLayout } from "@/components/layout/accounting-layout"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  Search,
  Filter,
  ChevronDown,
  CalendarIcon,
  Loader2,
  Upload as UploadIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchBankReconciliations, fetchBankReconciliationSummary, fetchBankReconciliationAuditTrail, uploadBankReconciliationFile } from "@/lib/store/slices/accountingSlice"
import { ProcurementDataTable, Column } from "@/components/procurement/procurement-data-table"
import { BankReconciliationViewDrawer } from "@/components/accounting/bank-reconciliation-view-drawer"
import { BankReconciliationUploadModal } from "@/components/accounting/bank-reconciliation-upload-modal"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

function BankReconciliationPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions: acctPerms } = useAccountingPermissions()
  const {
    bankReconciliations,
    bankReconciliationLoading,
    bankReconciliationSummary,
    bankReconciliationAuditTrail,
    bankReconciliationAuditTrailLoading,
    bankReconciliationUploadLoading
  } = useSelector((state: RootState) => state.accounting)

  const [activeTab, setActiveTab] = useState<'records'|'audit'>('records')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [selectedReconciliation, setSelectedReconciliation] = useState<any | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchBankReconciliations())
    dispatch(fetchBankReconciliationSummary())
  }, [dispatch])

  useEffect(() => {
    if (activeTab === 'audit' && bankReconciliations.length > 0) {
      dispatch(fetchBankReconciliationAuditTrail(bankReconciliations[0].id))
    }
  }, [activeTab, bankReconciliations, dispatch])

  const mainTabs = [
    { id: "records", label: "Reconciliation Records", icon: Download, gradient: "from-blue-400 to-blue-600" },
    { id: "audit", label: "Audit Trail", icon: Clock, gradient: "from-green-400 to-green-600" }
  ]

  const stats = {
    total: bankReconciliationSummary?.totalReconciliations ?? 0,
    completed: bankReconciliationSummary?.completedReconciliations ?? 0,
    pending: bankReconciliationSummary?.pendingReconciliations ?? 0,
    failed: bankReconciliationSummary?.failedReconciliations ?? 0,
    matched: bankReconciliationSummary?.matchedTransactions ?? 0,
    unmatched: bankReconciliationSummary?.unmatchedTransactions ?? 0,
    accuracy: bankReconciliationSummary?.averageAccuracy ?? 0
  }

  // Updated upload handler: keep modal open during upload, close only on success, show error on failure
  const handleUpload = async () => {
    if (!uploadFile) return
    try {
      await dispatch(uploadBankReconciliationFile(uploadFile)).unwrap()
      toast.success("Bank statement uploaded successfully")
      setUploadModalOpen(false)
      setUploadFile(null)
      // Optionally refresh data
      dispatch(fetchBankReconciliations())
      dispatch(fetchBankReconciliationSummary())
    } catch (err: any) {
      // Show error and keep modal open
      const msg =
        err?.message ||
        err?.error ||
        err?.response?.data?.message ||
        "Failed to upload file"
      toast.error(msg)
      // Do NOT close modal or clear file on error
      return
    }
  }

  // DataTable columns for reconciliation records
  const columns: Column<any>[] = [
    {
      key: 'bankName',
      label: 'Bank Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate max-w-[180px]" title={value}>{value}</span>
        </div>
      )
    },
    // {
    //   key: 'createdBy',
    //   label: 'Created By',
    //   sortable: false,
    //   render: (_v, row) => (
    //     <div className="flex items-center gap-2">
    //       <Avatar className="h-8 w-8">
    //         <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
    //           {row.createdBy.firstName.charAt(0)}{row.createdBy.lastName.charAt(0)}
    //         </AvatarFallback>
    //       </Avatar>
    //       <span className="truncate">{row.createdBy.firstName} {row.createdBy.lastName}</span>
    //     </div>
    //   )
    // },
    {
      key: 'accountNumber',
      label: 'Account Number',
      sortable: true,
      render: (value) => <Badge>{value}</Badge>
    },
    {
      key: 'isReconciled',
      label: 'Is Reconciled',
      sortable: true,
      render: (value) => <Badge>{value ?'Yes':'No'}</Badge>
    },
    {
      key: 'pendingTransactions',
      label: 'Pending Transactions',
      sortable: true,
      render: (value) => <span>{value}</span>
    },
    {
      key: 'matchedTransactions',
      label: 'Matched Transaction',
      sortable: true,
      render: (value) => <span>{value}</span>
    },
    {
      key: 'discrepancies',
      label: 'Discrepancies',
      sortable: true,
      render: (value) => <span>{value}</span>
    },
    {
      key: 'unreconciledEntries',
      label: 'Unreconciled Entries',
      sortable: true,
          render: (value,row) => <span>{row.unreconciledEntries?.length}</span>

    }
    
  ]

  const handleView = (row: any) => {
    setSelectedReconciliation(row)
    setIsDrawerOpen(true)
  }

  return (
    <AccountingLayout>
      <div className="space-y-6 p-6">
        {/* Top-level tabs */}
        <div className="flex items-center overflow-x-auto border-b px-6">
          <div className="flex space-x-1 min-w-max">
            {mainTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'records'|'audit')}
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 text-lg font-medium rounded-t-lg border-b-2 transition-all duration-200",
                    isActive ? "text-blue-600 border-blue-600" : "text-gray-600 border-transparent hover:text-gray-900"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200", tab.gradient)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Header with Upload Button */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-normal">Bank Reconciliation</h1>
            <p className="text-muted-foreground">Manage bank statement uploads, matches, and audit trail</p>
          </div>
          <div className="flex gap-3">
            {acctPerms.canUploadBankStatement && (
            <Button onClick={() => setUploadModalOpen(true)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full px-6">
              <Plus className="w-4 h-4 mr-2" /> Upload Statement
            </Button>
            )}
          </div>
        </div>

        {/* Upload Modal as overlay modal */}
        <BankReconciliationUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
          uploadFile={uploadFile}
          setUploadFile={setUploadFile}
          loading={bankReconciliationUploadLoading}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6">
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xl font-semibold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xl font-semibold">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xl font-semibold">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xl font-semibold">{stats.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data / Content for active tab */}
        {activeTab === 'records' && (
          <ProcurementDataTable
            data={bankReconciliations}
            columns={columns}
            title="Reconciliation Records"
            loading={bankReconciliationLoading}
            onView={handleView}
            showSearch={false}
            showFilters={false}
            emptyMessage="No reconciliation records found."
          />
        )}

        {/* {activeTab === 'audit' && (
          <div className="px-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="text-lg font-semibold mb-2">Audit Trail</h2>
              {bankReconciliationAuditTrailLoading ? (
                <div>Loading...</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2">Action</th>
                      <th className="text-left py-2">User</th>
                      <th className="text-left py-2">Timestamp</th>
                      <th className="text-left py-2">Matched</th>
                      <th className="text-left py-2">Unmatched</th>
                      <th className="text-left py-2">Total Txns</th>
                      <th className="text-left py-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankReconciliationAuditTrail.map(audit => (
                      <tr key={audit.id} className="border-b">
                        <td className="py-2">{audit.action}</td>
                        <td className="py-2">
                          {audit.createdBy
                            ? `${audit.createdBy.firstName ?? ""} ${audit.createdBy.lastName ?? ""}`
                            : <span className="text-gray-400 italic">Unknown</span>
                          }
                        </td>
                        <td className="py-2">
                          {audit.createdAt && !isNaN(Date.parse(audit.createdAt))
                            ? format(new Date(audit.createdAt), 'MMM dd, yyyy HH:mm')
                            : <span className="text-gray-400 italic">Invalid date</span>
                        </td>
                        <td className="py-2">
                          {audit.details?.matchedCount ?? "—"}
                        </td>
                        <td className="py-2">
                          {audit.details?.unmatchedCount ?? "—"}
                        </td>
                        <td className="py-2">
                          {audit.details?.totalTransactions ?? "—"}
                        </td>
                        <td className="py-2">
                          {audit.details?.confidenceThreshold != null ? `${audit.details.confidenceThreshold}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )} */}

        {/* Drawer for viewing reconciliation record */}
        <BankReconciliationViewDrawer
          isOpen={isDrawerOpen}
          onClose={() => { setIsDrawerOpen(false); setSelectedReconciliation(null) }}
          reconciliation={selectedReconciliation}
        />
      </div>
    </AccountingLayout>
  )
}

// Wrap the component with permission guard
export default function BankReconciliationPageWrapper() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="bank-reconciliation">
      <BankReconciliationPage />
    </ModuleGuard>
  )
}
