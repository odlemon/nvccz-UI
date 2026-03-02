"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, DollarSign, Loader2, ChevronDown, ChevronUp, Plus, CheckSquare } from "lucide-react"
import { FundDisbursementSkeleton } from "@/components/ui/skeleton-loader"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FundDisbursementData } from "@/lib/api/fund-disbursement-api"
import type { ExtendedApplication } from '@/lib/api/applications-api'
import {
  type InvestmentImplementationData,
  type DisbursementSummaryData
} from "@/lib/api/investment-implementation-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { APPLICATION_PORTAL_ACTIONS } from "@/lib/config/role-permissions"

interface FundDisbursementSectionProps {
  application: ExtendedApplication
  data: FundDisbursementData | null
  loading: boolean
  error: string | null
  implementationData: InvestmentImplementationData | null
  disbursementSummaryData: DisbursementSummaryData | null
  approvingDisbursementId: string | null
  disbursingFundId: string | null
  transactionReference: string
  onSetApprovingId: (id: string | null) => void
  onSetDisbursingId: (id: string | null) => void
  onSetTransactionReference: (ref: string) => void
  onApproveDisbursement: (id: string) => Promise<void>
  onDisburseFund: () => Promise<void>
  onRefresh: () => Promise<void>
  onCreateMilestone?: () => void
  onUpdateChecklist?: () => void
}

export function FundDisbursementSection({
  application,
  data,
  loading,
  error,
  implementationData,
  disbursementSummaryData,
  approvingDisbursementId,
  disbursingFundId,
  transactionReference,
  onSetApprovingId,
  onSetDisbursingId,
  onSetTransactionReference,
  onApproveDisbursement,
  onDisburseFund,
  onRefresh,
  onCreateMilestone,
  onUpdateChecklist
}: FundDisbursementSectionProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isDisbursing, setIsDisbursing] = useState(false)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true)

  const { hasSpecificAction } = useRolePermissions()
  const canCreateMilestone = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.CREATE_MILESTONE)
  const canUpdateChecklist = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST)
  const canApproveDisbursement = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.APPROVE_DISBURSEMENT)
  const canDisburseFund = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.DISBURSE_FUND)

  const handleApprove = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!approvingDisbursementId || isApproving) return

    setIsApproving(true)
    try {
      await onApproveDisbursement(approvingDisbursementId)
      // Success - dialog will close via onSetApprovingId in parent
    } catch (error) {
      // Error is handled in parent, just reset loading state
      setIsApproving(false)
    }
  }

  const handleDisburse = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isDisbursing) return

    setIsDisbursing(true)
    try {
      await onDisburseFund()
      // Success - dialog will close via onSetDisbursingId in parent
    } catch (error) {
      // Error is handled in parent, just reset loading state
      setIsDisbursing(false)
    }
  }

  if (loading) {
    return <FundDisbursementSkeleton />
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Error loading disbursement details: {error}
      </div>
    )
  }

  const disbursements = implementationData?.fundDisbursements || []
  const investmentImpl = application.investmentImplementation
  const disbursementMode = implementationData?.disbursementMode

  if (disbursements.length === 0 && !data && !investmentImpl) {
    return null
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800'
  }

  const statusIcons: Record<string, JSX.Element> = {
    PENDING: <CheckCircle className="w-4 h-4 text-amber-500" />,
    APPROVED: <CheckCircle className="w-4 h-4 text-blue-500" />,
    PROCESSING: <CheckCircle className="w-4 h-4 text-purple-500 animate-spin" />,
    COMPLETED: <CheckCircle className="w-4 h-4 text-green-500" />,
    FAILED: <CheckCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <>
      {/* Collapsible Implementation Details */}
      {investmentImpl && (
        <Card className="mb-4">
          <CardHeader className="cursor-pointer" onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Investment Implementation Details</CardTitle>
              {isDetailsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          {isDetailsExpanded && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Disbursement Mode</p>
                  <Badge className={disbursementMode === 'MILESTONE_BASED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {disbursementMode === 'MILESTONE_BASED' ? 'Milestone Based' : 'One Time'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Committed Amount</p>
                  <p className="text-lg font-semibold">${implementationData?.totalCommittedAmount?.toLocaleString() || '0'}</p>
                </div>
              </div>

              {implementationData && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Implementation Plan</p>
                    <p className="text-sm text-gray-900 mt-1">{implementationData.implementationPlan || 'No plan specified'}</p>
                  </div>

                  {/* Checklist for MILESTONE_BASED mode */}
                  {disbursementMode === 'MILESTONE_BASED' && implementationData.checklist && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-800">Implementation Checklist</h4>
                        {canUpdateChecklist && onUpdateChecklist && (
                          <Button size="sm" variant="outline" onClick={onUpdateChecklist}>
                            <CheckSquare className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`w-4 h-4 ${implementationData.checklist.finalDueDiligence ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">Final Due Diligence</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`w-4 h-4 ${implementationData.checklist.contractsSigned ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">Contracts Signed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`w-4 h-4 ${implementationData.checklist.fundsDisbursed ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">Funds Disbursed</span>
                        </div>
                        {implementationData.checklist.notes && (
                          <p className="text-xs text-gray-600 mt-2">Notes: {implementationData.checklist.notes}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Disbursement Summary */}
              {disbursementSummaryData && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Disbursement Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600">Total Committed</p>
                      <p className="text-lg font-semibold text-blue-900">${disbursementSummaryData.totalCommittedAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-600">Total Disbursed</p>
                      <p className="text-lg font-semibold text-green-900">${disbursementSummaryData.totalDisbursedAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-xs text-amber-600">Remaining</p>
                      <p className="text-lg font-semibold text-amber-900">${disbursementSummaryData.remainingCommittedAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Progress</span>
                      <span className="text-xs text-gray-600">
                        {Math.round((disbursementSummaryData.totalDisbursedAmount / disbursementSummaryData.totalCommittedAmount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(disbursementSummaryData.totalDisbursedAmount / disbursementSummaryData.totalCommittedAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Milestone Management for MILESTONE_BASED mode */}
      {disbursementMode === 'MILESTONE_BASED' && implementationData && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">Milestones</h4>
            {canCreateMilestone && onCreateMilestone && (
              <Button size="sm" onClick={onCreateMilestone} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full">
                <Plus className="w-4 h-4 mr-1" />
                Add Milestone
              </Button>
            )}
          </div>

          {implementationData.milestones && implementationData.milestones.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {implementationData.milestones.map((milestone, index) => {
                const milestoneStatusColors: Record<string, string> = {
                  PENDING: 'bg-amber-100 text-amber-800',
                  IN_PROGRESS: 'bg-blue-100 text-blue-800',
                  COMPLETED: 'bg-green-100 text-green-800',
                  CANCELLED: 'bg-gray-100 text-gray-800',
                  OVERDUE: 'bg-red-100 text-red-800'
                }

                return (
                  <AccordionItem key={milestone.id} value={`milestone-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Badge className={milestoneStatusColors[milestone.status] || 'bg-gray-100 text-gray-800'}>
                            {milestone.status}
                          </Badge>
                          <span className="font-medium">{milestone.title}</span>
                        </div>
                        <span className="text-sm font-semibold">${milestone.amount.toLocaleString()}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Description</p>
                          <p className="text-sm text-gray-900">{milestone.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Due Date</p>
                            <p className="text-sm text-gray-900">{new Date(milestone.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Amount</p>
                            <p className="text-sm font-semibold">${milestone.amount.toLocaleString()}</p>
                          </div>
                        </div>
                        {milestone.deliverables && (
                          <div>
                            <p className="text-xs text-gray-600">Deliverables</p>
                            <p className="text-sm text-gray-900">{milestone.deliverables}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            <p className="text-sm text-gray-500 italic">No milestones created yet</p>
          )}
        </div>
      )}

      {/* Disbursements List */}
      <div className="mt-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Disbursements</h4>
        {disbursements.length > 0 ? (
          disbursements.map((disbursement: any) => (
            <div key={disbursement.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {statusIcons[disbursement.status] || <CheckCircle className="w-4 h-4 text-gray-500" />}
                  <Badge className={statusColors[disbursement.status] || 'bg-gray-100 text-gray-800'}>
                    {disbursement.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ${parseFloat(disbursement.amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {disbursement.disbursementType}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Disbursement Date:</span>
                  <span className="text-gray-900">
                    {new Date(disbursement.disbursementDate).toLocaleDateString()}
                  </span>
                </div>

                {disbursement.transactionReference && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {disbursement.transactionReference}
                    </span>
                  </div>
                )}

                {disbursement.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">Notes:</p>
                    <p className="text-xs text-gray-700 mt-1">{disbursement.notes}</p>
                  </div>
                )}

                {disbursement.approvedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Approved:</span>
                    <span className="text-gray-900">
                      {new Date(disbursement.approvedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {disbursement.disbursedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Disbursed:</span>
                    <span className="text-gray-900">
                      {new Date(disbursement.disbursedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons based on status */}
              <div className="mt-3 flex gap-2">
                {canApproveDisbursement && disbursement.status === 'PENDING' && (
                  <Button
                    size="sm"
                    onClick={() => onSetApprovingId(disbursement.id)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                )}

                {canDisburseFund && disbursement.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={() => onSetDisbursingId(disbursement.id)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Mark as Disbursed
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No disbursements created yet</p>
        )}
      </div>

      {/* Approve Disbursement Confirmation Dialog */}
      <AlertDialog
        open={!!approvingDisbursementId}
        onOpenChange={(open) => {
          // Only allow closing when not processing
          if (!open && !isApproving) {
            onSetApprovingId(null)
            setIsApproving(false)
          }
        }}
      >
        <AlertDialogContent onEscapeKeyDown={(e) => isApproving && e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Disbursement?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this disbursement? This action will mark the disbursement as approved and ready for processing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Disbursement
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disburse Fund Dialog */}
      <AlertDialog
        open={!!disbursingFundId}
        onOpenChange={(open) => {
          // Only allow closing when not processing
          if (!open && !isDisbursing) {
            onSetDisbursingId(null)
            onSetTransactionReference('')
            setIsDisbursing(false)
          }
        }}
      >
        <AlertDialogContent onEscapeKeyDown={(e) => isDisbursing && e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Disbursed</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the transaction reference to mark this disbursement as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-reference">Transaction Reference</Label>
              <Input
                id="transaction-reference"
                placeholder="e.g., BANK_TXN_123456789"
                value={transactionReference}
                onChange={(e) => onSetTransactionReference(e.target.value)}
                className="w-full"
                disabled={isDisbursing}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDisbursing}
              onClick={() => {
                if (!isDisbursing) {
                  onSetDisbursingId(null)
                  onSetTransactionReference('')
                }
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleDisburse}
              disabled={!transactionReference.trim() || isDisbursing}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isDisbursing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Mark as Disbursed
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
