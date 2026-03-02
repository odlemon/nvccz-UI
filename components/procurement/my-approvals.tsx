"use client"

import { useEffect, useState, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { ProcurementDataTable, Column } from "./procurement-data-table"
import { ProcurementDrawer } from "./procurement-drawer"
import { DigitalSignature } from "./digital-signature"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProcurementPermissions } from "@/lib/hooks/useProcurementPermissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  setApprovalRequests,
  addApprovalRequest,
  updateApprovalRequest,
  removeApprovalRequest,
  setApprovalRequestsLoading,
  setApprovalRequestsError
} from "@/lib/store/slices/procurementSlice"
import { procurementApi, ApprovalRequest } from "@/lib/api/procurement-api"
import { CiCircleCheck, CiCalendar, CiUser, CiFileOn } from "react-icons/ci"
import { CheckCircle, Clock, AlertCircle, User, FileText, Pen } from "lucide-react"
import { toast } from "sonner"
import { ApprovalDialog } from "./approval-dialog"

export function MyApprovals() {
  const dispatch = useAppDispatch()
  const { permissions } = useProcurementPermissions()
  const { approvalRequests, approvalRequestsLoading } = useAppSelector(state => state.procurement)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<ApprovalRequest | null>(null)
  const [showSignature, setShowSignature] = useState(false)
  const [processingApproval, setProcessingApproval] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    loadApprovalRequests()
  }, [])

  const loadApprovalRequests = async () => {
    try {
      dispatch(setApprovalRequestsLoading(true))
      const response = await procurementApi.getMyApprovalRequests()
      if (response.success && response.data) {
        dispatch(setApprovalRequests(response.data))
      } else {
        dispatch(setApprovalRequestsError('Failed to load approval requests'))
        toast.error("Failed to load approval requests")
      }
    } catch (error: any) {
      dispatch(setApprovalRequestsError(error.message))
      toast.error("Error loading approval requests", { description: error.message })
    } finally {
      dispatch(setApprovalRequestsLoading(false))
    }
  }

  const handleView = (request: ApprovalRequest) => {
    setViewingRequest(request)
    setIsDrawerOpen(true)
  }

  const handleApprove = (request: ApprovalRequest) => {
    setViewingRequest(request)
    setIsApprovalDialogOpen(true)
  }

  const handleReject = (request: ApprovalRequest) => {
    setViewingRequest(request)
    setIsRejectDialogOpen(true)
  }

  const handleConfirmApproval = async () => {
    if (!viewingRequest) return
    setShowSignature(true)
    setIsApprovalDialogOpen(false)
  }

  const handleConfirmReject = async () => {
    if (!viewingRequest) return
    try {
      setProcessingApproval(true)
      // TODO: Implement reject API call
      toast.success("Request rejected successfully")
      await loadApprovalRequests()
      setIsRejectDialogOpen(false)
      setIsDrawerOpen(false)
    } catch (error: any) {
      toast.error("Failed to reject request", { description: error.message })
    } finally {
      setProcessingApproval(false)
    }
  }

  const handleSignatureCapture = async (signatureData: string, comments?: string) => {
    if (!viewingRequest) return

    try {
      setProcessingApproval(true)
      // Find the current approval step for this user
      const currentApproval = viewingRequest.approvals.find(
        approval => approval.status === 'PENDING'
      )

      if (!currentApproval) {
        toast.error("No pending approval found")
        return
      }

      const response = await procurementApi.processApproval(
        viewingRequest.id,
        currentApproval.id,
        {
          status: 'APPROVED',
          comments,
          signatureData
        }
      )

      if (response.success) {
        toast.success("Approval processed successfully")
        setShowSignature(false)
        setIsDrawerOpen(false)
        await loadApprovalRequests()
      }
    } catch (error: any) {
      toast.error("Failed to process approval", { description: error.message })
    } finally {
      setProcessingApproval(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED': return <AlertCircle className="w-4 h-4" />
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStageTypeIcon = (stageType: string) => {
    switch (stageType) {
      case 'PURCHASE_REQUISITION': return <CiFileOn className="w-4 h-4" />
      case 'PURCHASE_ORDER': return <FileText className="w-4 h-4" />
      case 'INVOICE': return <CiFileOn className="w-4 h-4" />
      case 'GRN': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const columns: Column<ApprovalRequest>[] = [
    {
      key: 'stageType',
      label: 'Type',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {getStageTypeIcon(value)}
          <div>
            <p className="font-medium text-sm">{value.replace('_', ' ')}</p>
            <p className="text-xs text-gray-500">ID: {row.entityId.slice(-8)}</p>
          </div>
        </div>
      )
    },
    {
      key: 'requestedBy',
      label: 'Requested By',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <CiUser className="w-4 h-4 text-gray-600" />
          <div>
            <p className="font-medium text-sm">{value.firstName} {value.lastName}</p>
            <p className="text-xs text-gray-500">{value.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge className={getStatusColor(value)}>
          <div className="flex items-center gap-1">
            {getStatusIcon(value)}
            {value}
          </div>
        </Badge>
      )
    },
    {
      key: 'currentStep',
      label: 'Progress',
      render: (value, row) => (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Step {value} of {row.totalSteps}</span>
            <span className="text-gray-500">{Math.round((value / row.totalSteps) * 100)}%</span>
          </div>
          <Progress value={(value / row.totalSteps) * 100} className="h-2" />
        </div>
      )
    },
    {
      key: 'approvals',
      label: 'My Action',
      render: (approvals, row) => {
        const myApproval = approvals.find((approval: any) => approval.status === 'PENDING')
        if (!myApproval) {
          const completedApproval = approvals.find((approval: any) => approval.status !== 'PENDING')
          if (completedApproval) {
            return (
              <Badge className={getStatusColor(completedApproval.status)}>
                {completedApproval.status}
              </Badge>
            )
          }
          return <span className="text-gray-500 text-sm">No action required</span>
        }

        return permissions.canApproveRequest ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleApprove(row)
              }}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <Pen className="w-3 h-3 mr-1" />
              Sign & Approve
            </Button>
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No permission</span>
        )
      }
    }
  ]

  const filterOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ]

  const filteredBulkActions = useMemo(() => {
    return [
      {
        label: 'Bulk Approve',
        value: 'approve',
        icon: <CheckCircle className="w-4 h-4 mr-1" />,
        show: permissions.canApproveRequest
      }
    ].filter(action => action.show)
  }, [permissions])

  const handleBulkAction = (selectedRequests: ApprovalRequest[], action: string) => {
    switch (action) {
      case 'approve':
        toast.info(`Bulk approval for ${selectedRequests.length} requests coming soon`)
        break
      default:
        toast.info(`Bulk action: ${action}`)
    }
  }

  const handleExport = (data: ApprovalRequest[]) => {
    toast.success(`Exporting ${data.length} approval requests`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">My Approvals</h1>
          <p className="text-muted-foreground">Review and approve pending procurement requests</p>
        </div>
      </div>

      {/* Data Table */}
      <ProcurementDataTable
        data={approvalRequests}
        columns={columns}
        title="Pending Approval Requests"
        searchPlaceholder="Search approval requests..."
        filterOptions={filterOptions}
        onView={handleView}
        onBulkAction={handleBulkAction}
        bulkActions={filteredBulkActions}
        loading={approvalRequestsLoading}
        onExport={handleExport}
        emptyMessage="No approval requests found. All caught up!"
      />

      {/* View Drawer */}
      <ProcurementDrawer
        open={isDrawerOpen && !showSignature}
        onOpenChange={setIsDrawerOpen}
        title={`Approval Request: ${viewingRequest?.stageType.replace('_', ' ') || ''}`}
        description="Review request details and provide approval"
        size="xl"
      >
        {viewingRequest && (
          <div className="space-y-6">
            {/* Request Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CiCircleCheck className="w-5 h-5" />
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Request Type</label>
                    <p className="text-lg font-semibold">{viewingRequest.stageType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(viewingRequest.status)}>
                        {getStatusIcon(viewingRequest.status)}
                        {viewingRequest.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Requested By</label>
                    <p className="font-medium">
                      {viewingRequest.requestedBy.firstName} {viewingRequest.requestedBy.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{viewingRequest.requestedBy.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Progress</label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Step {viewingRequest.currentStep} of {viewingRequest.totalSteps}</span>
                        <span className="text-gray-500">
                          {Math.round((viewingRequest.currentStep / viewingRequest.totalSteps) * 100)}%
                        </span>
                      </div>
                      <Progress value={(viewingRequest.currentStep / viewingRequest.totalSteps) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {viewingRequest.approvals.map((approval, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${approval.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                          approval.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                          {approval.status === 'APPROVED' ? <CheckCircle className="w-4 h-4" /> :
                            approval.status === 'REJECTED' ? <AlertCircle className="w-4 h-4" /> :
                              <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{approval.stage.stepName}</p>
                          <p className="text-xs text-gray-600">
                            {approval.approver.firstName} {approval.approver.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(approval.status)}>
                          {approval.status}
                        </Badge>
                        {approval.approvedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(approval.approvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Close
              </Button>
              {viewingRequest.status === 'PENDING' && (
                <>
                  {permissions.canRejectRequest && (
                    <Button
                      variant="outline"
                      onClick={() => handleReject(viewingRequest)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={processingApproval}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  )}
                  {permissions.canApproveRequest && (
                    <Button
                      onClick={() => handleApprove(viewingRequest)}
                      className="gradient-primary text-white"
                      disabled={processingApproval}
                    >
                      <Pen className="w-4 h-4 mr-2" />
                      Sign & Approve
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </ProcurementDrawer>

      {/* Approval Dialog */}
      <ApprovalDialog
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
        title="Confirm Approval"
        description={`Are you sure you want to approve this ${viewingRequest?.stageType.toLowerCase().replace('_', ' ')}? This action will require your digital signature.`}
        onConfirm={handleConfirmApproval}
        loading={processingApproval}
      />

      {/* Reject Dialog */}
      <ApprovalDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        title="Confirm Rejection"
        description={`Are you sure you want to reject this ${viewingRequest?.stageType.toLowerCase().replace('_', ' ')}? This action cannot be undone.`}
        onConfirm={handleConfirmReject}
        loading={processingApproval}
      />

      {/* Digital Signature Modal */}
      {showSignature && viewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <DigitalSignature
              title={`Approve ${viewingRequest.stageType.replace('_', ' ')}`}
              description={`Please provide your digital signature to approve this ${viewingRequest.stageType.replace('_', ' ').toLowerCase()}`}
              onSignatureCapture={handleSignatureCapture}
              onCancel={() => setShowSignature(false)}
              loading={processingApproval}
              required={true}
              showComments={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
