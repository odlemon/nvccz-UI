"use client"

import { Button } from "@/components/ui/button"
import { FileText, Users, Edit, Play, CheckCircle, DollarSign, UserPlus, Loader2, ThumbsUp, Vote, PenLine, CheckSquare, Search, Shield, Upload, MessageSquare } from "lucide-react"
import type { ExtendedApplication } from '@/lib/api/applications-api'
import { BoardReviewData, VoteSummaryData } from "@/lib/api/board-review-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { APPLICATION_PORTAL_ACTIONS } from "@/lib/config/role-permissions"
import { type InvestmentImplementationData } from "@/lib/api/investment-implementation-api"

interface TimelineStageActionsProps {
  stageId: string
  application: ExtendedApplication
  dueDiligenceData?: any
  dueDiligenceLoading?: boolean
  activityApprovalData?: any
  activityApprovalLoading?: boolean
  boardReviewData?: BoardReviewData | null
  voteSummary?: VoteSummaryData | null
  termSheetData?: any
  termSheetDataLoding?: boolean
  implementationData?: InvestmentImplementationData | null
  implementationLoading?: boolean
  onInitiateDueDiligence?: () => Promise<void>
  onUpdateDueDiligence?: () => Promise<void>
  onCompleteDueDiligence?: () => Promise<void>
  onCreateDueDiligenceTask?: () => void
  onApproveActivity?: () => void
  onInitiateBoardReview?: () => Promise<void>
  onUpdateBoardReview?: () => Promise<void>
  onCompleteBoardReview?: () => Promise<void>
  onVote?: () => void
  onCreateTermSheet?: () => Promise<void>
  onUpdateTermSheet?: () => Promise<void>
  onFinalizeTermSheet?: () => Promise<void>
  onSignAsInvestor?: () => void
  onInitiateFundDisbursement?: () => Promise<void>
  onCreateFundDisbursement?: () => void
  onUpdateChecklist?: () => void
  onAssignAnalyst?: () => void
  onAnalystScreening?: () => void
  onTriggerShortlisting?: () => void
  onUploadRbz?: () => void
  onSetKycVerified?: () => void
  onRefresh: () => Promise<void>
}

export function TimelineStageActions({
  stageId,
  application,
  dueDiligenceData,
  dueDiligenceLoading,
  activityApprovalData,
  activityApprovalLoading,
  boardReviewData,
  termSheetData,
  termSheetDataLoding,
  voteSummary,
  implementationData,
  implementationLoading,
  onInitiateDueDiligence,
  onUpdateDueDiligence,
  onCompleteDueDiligence,
  onCreateDueDiligenceTask,
  onApproveActivity,
  onInitiateBoardReview,
  onUpdateBoardReview,
  onCompleteBoardReview,
  onVote,
  onCreateTermSheet,
  onUpdateTermSheet,
  onFinalizeTermSheet,
  onSignAsInvestor,
  onInitiateFundDisbursement,
  onCreateFundDisbursement,
  onUpdateChecklist,
  onAssignAnalyst,
  onAnalystScreening,
  onTriggerShortlisting,
  onUploadRbz,
  onSetKycVerified,
  onRefresh
}: TimelineStageActionsProps) {
  // Permission checks for application-portal specific actions
  const { hasSpecificAction } = useRolePermissions()

  const canInitiateDueDiligence = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.INITIATE_DUE_DILIGENCE)
  const canCreateDDTask = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.CREATE_DD_TASK)
  const canUpdateDueDiligence = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.UPDATE_DUE_DILIGENCE)
  const canCompleteDueDiligence = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.COMPLETE_DUE_DILIGENCE)
  const canApproveActivity = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.APPROVE_DD_ACTIVITY)

  const canInitiateBoardReview = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.INITIATE_BOARD_REVIEW)
  const canUpdateBoardReview = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.UPDATE_BOARD_REVIEW)
  const canCompleteBoardReview = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.COMPLETE_BOARD_REVIEW)
  const canVote = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.CAST_VOTE)

  const canCreateTermSheet = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.CREATE_TERM_SHEET)
  const canUpdateTermSheet = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.UPDATE_TERM_SHEET)
  const canFinalizeTermSheet = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET)

  const canInitiateFundDisbursement = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.INITIATE_FUND_DISBURSEMENT)
  const canCreateDisbursement = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.CREATE_DISBURSEMENT)
  const canApproveDisbursement = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.APPROVE_DISBURSEMENT)
  const canUpdateChecklist = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST)

  // Special handling for BOARD_APPROVED - show TERM_SHEET actions
  if (application.currentStage === "BOARD_APPROVED" && stageId === "TERM_SHEET") {
    return (
      <div className="flex gap-2">
        {canCreateTermSheet ? (
          <Button
            onClick={onCreateTermSheet}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Term Sheet
          </Button>
        ) : (
          <p className="text-sm text-gray-500 italic">You don't have permission to create term sheets</p>
        )}
      </div>
    )
  }

  // Special handling for DUE_DILIGENCE_COMPLETED - show UNDER_BOARD_REVIEW actions
  if (application.currentStage === "DUE_DILIGENCE_COMPLETED" && stageId === "UNDER_BOARD_REVIEW") {
    return (
      <div className="flex gap-2">
        {canInitiateBoardReview ? (
          <Button
            onClick={onInitiateBoardReview}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full"
          >
            <Users className="w-4 h-4 mr-2" />
            Initiate Board Review
          </Button>
        ) : (
          <p className="text-sm text-gray-500 italic">You don't have permission to initiate board reviews</p>
        )}
      </div>
    )
  }

  // Only show actions for the current stage group
  const isCurrentStageGroup = () => {
    // Handle grouped stage IDs
    switch (stageId) {
      case "APPLICATION_SUBMISSION":
        return ["SHORTLISTED", "SCREENING_PENDING"].includes(application.currentStage)
      case "SCREENING_GROUP":
        return ["SCREENING_PENDING", "SCREENING"].includes(application.currentStage)
      case "COMPLIANCE_GROUP":
        return ["SCREENING", "ACTIVE_DD"].includes(application.currentStage)
      case "DUE_DILIGENCE_GROUP":
        return ["ACTIVE_DD", "UNDER_DUE_DILIGENCE", "DUE_DILIGENCE_COMPLETED"].includes(application.currentStage)
      case "TERM_SHEET_GROUP":
        return ["TERM_SHEET_NEGOTIATION", "TERM_SHEET", "TERM_SHEET_SIGNED"].includes(application.currentStage)
      case "BOARD_GROUP":
        return ["UNDER_BOARD_REVIEW", "BOARD_APPROVED", "BOARD_CONDITIONAL", "BOARD_REJECTED"].includes(application.currentStage)
      case "INVESTMENT_GROUP":
        return ["INVESTMENT_IMPLEMENTATION", "DISBURSED", "FUNDED"].includes(application.currentStage)
      case "REJECTION_PATH":
        return ["REJECTED", "BELOW_THRESHOLD", "REJECTED_SCREENING", "AUTO_REJECTED"].includes(application.currentStage)
      default:
        return application.currentStage === stageId
    }
  }

  if (!isCurrentStageGroup()) {
    return null
  }

  // return <h3>{stageId}</h3>

  switch (stageId) {
    case "APPLICATION_SUBMISSION":
      return (
        <div className="flex gap-2 flex-wrap">
          {application.currentStage === 'SCREENING_PENDING' && onTriggerShortlisting && (
            <Button
              onClick={onTriggerShortlisting}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Trigger Shortlisting
            </Button>
          )}
          {application.currentStage === 'SHORTLISTED' && canInitiateDueDiligence && (
            <Button
              onClick={onInitiateDueDiligence}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Initiate Due Diligence
            </Button>
          )}
          {application.currentStage === 'SHORTLISTED' && !canInitiateDueDiligence && (
            <p className="text-sm text-gray-500 italic py-2">You don&apos;t have permission to initiate due diligence</p>
          )}
        </div>
      )

    case "SCREENING_GROUP":
      return (
        <div className="flex gap-2 flex-wrap">
          {application.currentStage === 'SCREENING_PENDING' && onAssignAnalyst && (
            <Button
              onClick={onAssignAnalyst}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Lead Analyst
            </Button>
          )}
          {application.currentStage === 'SCREENING' && onAnalystScreening && (
            <Button
              onClick={onAnalystScreening}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Submit Screening Score
            </Button>
          )}
          {application.currentStage === 'SCREENING' && canInitiateDueDiligence && onInitiateDueDiligence && (
            <Button
              onClick={onInitiateDueDiligence}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Initiate Due Diligence
            </Button>
          )}
        </div>
      )

    case "COMPLIANCE_GROUP":
      return (
        <div className="flex gap-2 flex-wrap">
          {onUploadRbz && (
            <Button
              onClick={onUploadRbz}
              variant="outline"
              className="border-rose-500 text-rose-600 hover:bg-rose-50 rounded-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload RBZ Document
            </Button>
          )}
          {onSetKycVerified && (
            <Button
              onClick={onSetKycVerified}
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              Verify KYC
            </Button>
          )}
        </div>
      )

    case "DUE_DILIGENCE_GROUP":
      // If stage is ACTIVE_DD and no DD review yet, show initiate
      if (application.currentStage === 'ACTIVE_DD' && !dueDiligenceData && canInitiateDueDiligence) {
        return (
          <div className="flex gap-2">
            <Button
              onClick={onInitiateDueDiligence}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Initiate Due Diligence
            </Button>
          </div>
        )
      }

      // Show loading state while fetching due diligence data
      if (dueDiligenceLoading || activityApprovalLoading) {
        return (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading due diligence data...</span>
            </div>
          </div>
        )
      }

      // Check if we should show task button instead of update/complete buttons
      const shouldShowTaskButton =
        dueDiligenceData?.status === "IN_PROGRESS"
      // &&
      // (!dueDiligenceData?.tasks || dueDiligenceData.tasks.length === 0)

      // Check if we have any tasks with activity logs
      const hasActivityLogs = dueDiligenceData?.tasks?.some((task: any) =>
        task.activityLogs && task.activityLogs.length > 0
      )

      // Check if we have any approved activities
      const hasApprovedActivity =
        activityApprovalData?.approvalStatus === "APPROVED"

      // Check if we have pending activity to approve
      const hasPendingActivity =
        activityApprovalData?.approvalStatus === "PENDING"

      // Show Create Task button if due diligence status is IN_PROGRESS, regardless of tasks/activity logs
      const showCreateTaskButton = dueDiligenceData?.status === "IN_PROGRESS";
      const createTaskButton = showCreateTaskButton && canCreateDDTask ? (
        <Button
          onClick={onCreateDueDiligenceTask}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create DueDiligence Task
        </Button>
      ) : showCreateTaskButton ? (
        <p className="text-sm text-gray-500 italic py-2">You don't have permission to create tasks</p>
      ) : null;

      // If activity is pending approval, show Approve Activity button
      // Approve Activity button now handled in due-diligence-section.tsx activity logs

      // If no activity logs exist, show Create Task button and waiting message
      // if (!hasActivityLogs) {
      //   return (
      //     <div className="flex gap-2 items-center">
      //       {createTaskButton}
      //       <p className="text-sm text-gray-500 italic py-2">Awaiting assigned user log activity</p>
      //     </div>
      //   )
      // }

      // If we have activity logs, show Create Task button and Update/Complete buttons
      if (hasActivityLogs) {
        return (
          <div className="flex gap-2">
            {createTaskButton}
            {canUpdateDueDiligence && (
              <>
                <Button
                  onClick={onUpdateDueDiligence}
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50 rounded-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Due Diligence
                </Button>
                {canCompleteDueDiligence && (
                  <Button
                    onClick={onCompleteDueDiligence}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Due Diligence
                  </Button>
                )}
              </>
            )}
            {!canUpdateDueDiligence && (
              <p className="text-sm text-gray-500 italic py-2">You don't have permission to update due diligence</p>
            )}
          </div>
        )
      }

      return (
        <div className="flex gap-2 items-center">
          {createTaskButton}
          {/* <p className="text-sm text-gray-500 italic py-2">Awaiting assigned user log activity</p> */}
        </div>
      );

    case "BOARD_GROUP":
      if (dueDiligenceLoading) { // Using dueDiligenceLoading as a proxy for boardReviewLoading
        return (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading board review data...</span>
            </div>
          </div>
        )
      }

      // If no board review data, show Initiate button
      if (!boardReviewData) {
        return (
          <div className="flex gap-2">
            {canInitiateBoardReview ? (
              <Button
                onClick={onInitiateBoardReview}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Create Board Review
              </Button>
            ) : (
              <p className="text-sm text-gray-500 italic py-2">You don't have permission to create board reviews</p>
            )}
          </div>
        )
      }

      const isVotingComplete = voteSummary?.isVotingComplete === true
      const canVote = voteSummary?.boardStatus === 'IN_PROGRESS' && !voteSummary.userVote

      // If board review exists, show other actions
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {!isVotingComplete && canVote && (
              <Button
                onClick={onVote}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
              >
                <Vote className="w-4 h-4 mr-2" />
                Cast Your Vote
              </Button>
            )}

            {canUpdateBoardReview && (
              <Button
                onClick={onUpdateBoardReview}
                variant="outline"
                className="border-purple-500 text-purple-600 hover:bg-purple-50 rounded-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Board Review
              </Button>
            )}

            {isVotingComplete && canCompleteBoardReview && (
              <Button
                onClick={onCompleteBoardReview}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Board Review
              </Button>
            )}
          </div>

          {voteSummary?.boardStatus === 'IN_PROGRESS' && !isVotingComplete && !canVote && (
            <div className="flex justify-center">
              <p className="text-sm text-gray-500 italic py-2">Voting in progress... You have already voted.</p>
            </div>
          )}
          
          {isVotingComplete && !canCompleteBoardReview && (
            <div className="flex justify-center">
              <p className="text-sm text-green-600 italic py-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Voting completed. Awaiting board review completion.
              </p>
            </div>
          )}
        </div>
      )

    case "TERM_SHEET_GROUP":
      if (termSheetDataLoding) {
        return (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading term sheet data...</span>
            </div>
          </div>
        );
      }

      // If no term sheet data, show Create button
      if (!termSheetData) {
        return (
          <div className="flex gap-2">
            {canCreateTermSheet ? (
              <Button
                onClick={onCreateTermSheet}
                variant="outline"
                className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Term Sheet
              </Button>
            ) : (
              <p className="text-sm text-gray-500 italic py-2">You don't have permission to create term sheets</p>
            )}
          </div>
        );
      }

      // If term sheet data exists, show Update and Finalize buttons
      if (termSheetData) {
        const bothPartiesSigned = Boolean(termSheetData.applicantSignedAt && termSheetData.investorSignedAt)
        const isFinalized = Boolean(termSheetData.isFinal || termSheetData.status === 'FINAL' || termSheetData.status === 'SIGNED')
        const canInvestorSign = isFinalized && Boolean(termSheetData.applicantSignedAt) && !termSheetData.investorSignedAt

        return (
          <div className="flex gap-2">
            {canUpdateTermSheet && !bothPartiesSigned && (
              <Button
                onClick={onUpdateTermSheet}
                variant="outline"
                className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Term Sheet
              </Button>
            )}
            {canFinalizeTermSheet && !isFinalized && (
              <Button
                onClick={onFinalizeTermSheet}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalize Term Sheet
              </Button>
            )}
            {canInvestorSign && onSignAsInvestor && (
              <Button
                onClick={onSignAsInvestor}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
              >
                <PenLine className="w-4 h-4 mr-2" />
                Sign as Investor
              </Button>
            )}
            {!isFinalized && !bothPartiesSigned && (
              <p className="text-sm text-amber-600 italic py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Finalize the term sheet before sign-off
              </p>
            )}
            {isFinalized && !bothPartiesSigned && !canInvestorSign && (
              <p className="text-sm text-amber-600 italic py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Waiting for applicant sign-off before investor signing
              </p>
            )}
            {!canUpdateTermSheet && !canFinalizeTermSheet && !canInvestorSign && (
              <p className="text-sm text-gray-500 italic py-2">You don't have permission to manage term sheets</p>
            )}
          </div>
        );
      }

      return null;
    // return (
    //   <div className="flex gap-2">

    //     {canUpdateTermSheet && (
    //       <>
    //         <Button
    //           onClick={onUpdateTermSheet}
    //           variant="outline"
    //           className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-full"
    //         >
    //           <Edit className="w-4 h-4 mr-2" />
    //           Update Term Sheet
    //         </Button>
    //         {canFinalizeTermSheet && (
    //           <Button
    //             onClick={onFinalizeTermSheet}
    //             className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
    //           >
    //             <CheckCircle className="w-4 h-4 mr-2" />
    //             Finalize Term Sheet
    //           </Button>
    //         )}
    //       </>
    //     )}
    //     {!canCreateTermSheet && !canUpdateTermSheet && (
    //       <p className="text-sm text-gray-500 italic py-2">You don't have permission to manage term sheets</p>
    //     )}
    //   </div>
    // )

    case "INVESTMENT_GROUP":
      const hasDisbursements = application.disbursements && application.disbursements.length > 0
      const investmentImpl = application.investmentImplementation
      const disbursementMode = implementationData?.disbursementMode
      const hasMilestones = implementationData?.milestones && implementationData.milestones.length > 0

      // Show loading state while fetching implementation data
      if (implementationLoading && investmentImpl) {
        return (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading investment details...</span>
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-4">
          {!implementationData ? (
            // No investment implementation - show Initiate button
            <div className="flex gap-2">
              {canInitiateFundDisbursement ? (
                <Button
                  onClick={onInitiateFundDisbursement}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Initiate Fund Disbursement
                </Button>
              ) : (
                <p className="text-sm text-gray-500 italic py-2">You don't have permission to initiate fund disbursement</p>
              )}
            </div>
          ) : disbursementMode === 'MILESTONE_BASED' && hasMilestones ? (
            // MILESTONE_BASED mode with milestones - show checklist and create disbursement buttons
            <div className="flex flex-wrap gap-2">
              {canUpdateChecklist && onUpdateChecklist && (
                <Button
                  onClick={onUpdateChecklist}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50 rounded-full"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Update Checklist
                </Button>
              )}
              {canCreateDisbursement && onCreateFundDisbursement && (
                <Button
                  onClick={async () => {
                    await onCreateFundDisbursement()
                    await onRefresh()
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Disbursement
                </Button>
              )}
              {!canUpdateChecklist && !canCreateDisbursement && (
                <p className="text-sm text-gray-500 italic py-2">Milestones created. Manage disbursements below.</p>
              )}
            </div>
          ) : disbursementMode === 'MILESTONE_BASED' && !hasMilestones ? (
            // MILESTONE_BASED mode without milestones - prompt to create milestones
            <div className="flex gap-2">
              <p className="text-sm text-amber-600 italic py-2">
                Please create milestones below before creating disbursements.
              </p>
            </div>
          ) : disbursementMode === 'ONE_TIME' && !hasDisbursements ? (
            // ONE_TIME mode - show Create Disbursement if none exist
            <div className="flex gap-2">
              {canCreateDisbursement ? (
                <Button
                  onClick={async () => {
                    if (onCreateFundDisbursement) {
                      await onCreateFundDisbursement()
                      await onRefresh()
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Fund Disbursement
                </Button>
              ) : (
                <p className="text-sm text-gray-500 italic py-2">You don't have permission to create disbursements</p>
              )}
            </div>
          ) : (
            // Disbursements exist - management handled in fund-disbursement-section
            null
          )}
        </div>
      )

    default:
      return null
  }
}
