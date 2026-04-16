"use client"

import { useState, useEffect } from "react"
import { DueDiligenceModal } from "./due-diligence-modal"
import { FinalizeTermSheetConfirmationDialog } from "./finalize-term-sheet-confirmation-dialog"
import { BoardReviewModal } from "./board-review-modal"
import { TermSheetModal } from "./term-sheet-modal"
import { FundDisbursementModal } from "./fund-disbursement-modal"
import { CreateFundDisbursementModal } from "./create-fund-disbursement-modal"
import { DueDiligenceConfirmationDialog } from "./due-diligence-confirmation-dialog"
import { CompleteDueDiligenceConfirmationDialog } from "./complete-due-diligence-confirmation-dialog"
import { BoardReviewConfirmationDialog } from "./board-review-confirmation-dialog"
import { CompleteBoardReviewConfirmationDialog } from "./complete-board-review-confirmation-dialog"
import { TermSheetConfirmationDialog } from "./term-sheet-confirmation-dialog"
import { SignTermSheetModal } from "./SignTermSheetModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  CheckCircle,
  Circle,
  FileText,
  Users,
  DollarSign,
  Eye,
  Edit,
  Play,
  X,
  UserPlus,
  Search,
  Shield,
  MessageSquare,
} from "lucide-react"
import { CiFileOn } from "react-icons/ci"
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchDueDiligenceByApplication,
  fetchBoardReviewByApplication,
  fetchTermSheetByApplication,
  fetchFundDisbursementByApplication,
  fetchVoteSummaryByApplication,
  getActivityForApproval,
  fetchLatestApplicationById,
  investorSignTermSheet,
  fetchInvestmentImplementationByApp,
  fetchDisbursementSummaryByApp
} from '@/lib/store/slices/applicationSlice'
import { fundDisbursementApi } from '@/lib/api/fund-disbursement-api'
import { FundDisbursementForm } from "./fund-disbursement-form"
import { FundDisbursementConfirmationDialog } from "./fund-disbursement-confirmation-dialog"
import { ApplicationDataSection } from "./timeline/application-data-section"
import { DueDiligenceSection } from "./timeline/due-diligence-section"
import { BoardReviewSection } from "./timeline/board-review-section"
import { TermSheetSection } from "./timeline/term-sheet-section"
import { FundDisbursementSection } from "./timeline/fund-disbursement-section"
import { TimelineStageActions } from "./timeline/timeline-stage-actions"
import { applicationsApi, type ExtendedApplication } from '@/lib/api/applications-api'
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DueDiligenceTaskModal } from "./due-diligence-task-modal"
import { ActivityApprovalModal } from "./activity-approval-modal"
import { BoardVoteModal } from "./board-voting-modal"
import { MilestoneModal } from "./milestone-modal"
import { ChecklistModal } from "./checklist-modal"
import { AssignAnalystModal } from "./assign-analyst-modal"
import { AnalystScreeningModal } from "./analyst-screening-modal"
import { TimelineSkeleton } from "@/components/ui/skeleton-loader"
// import { BoardVoteModal } from "./board-vote-modal"

interface ApplicationTimelineProps {
  application: ExtendedApplication
  onInitiateDueDiligence?: () => void
  onUpdateDueDiligence?: () => void
  onCompleteDueDiligence?: () => void
  onInitiateBoardReview?: () => void
  onUpdateBoardReview?: () => void
  onCompleteBoardReview?: () => void
  onCreateTermSheet?: () => void
  onUpdateTermSheet?: () => void
  onFinalizeTermSheet?: () => void
  onInvestorSignTermSheet?: () => void
  onInitiateFundDisbursement?: () => void
  onCreateFundDisbursement?: () => void
  refreshTrigger?: number
  onRefresh?: () => void
  onClose?: () => void
}

const stages = [
  {
    id: "APPLICATION_SUBMISSION",
    statusCodes: ["SHORTLISTED", "SCREENING_PENDING"],
    title: "Application Submission",
    description: "Applicant submits form; documents linked; status visible to applicant.",
    icon: FileText,
    color: "bg-blue-500",
    completedColor: "bg-green-500"
  },
  {
    id: "SCREENING_GROUP",
    statusCodes: ["SCREENING_PENDING", "SCREENING"],
    title: "Screening & Analyst Review",
    description: "Assign lead analyst; analyst screening score determines if application advances to due diligence.",
    icon: Search,
    color: "bg-cyan-500",
    completedColor: "bg-green-500"
  },
  {
    id: "COMPLIANCE_GROUP",
    statusCodes: ["SCREENING", "ACTIVE_DD"],
    title: "Compliance & KYC",
    description: "Upload RBZ Exchange Control document and verify KYC before disbursement can proceed.",
    icon: Shield,
    color: "bg-rose-500",
    completedColor: "bg-green-500"
  },
  {
    id: "DUE_DILIGENCE_GROUP",
    statusCodes: ["ACTIVE_DD", "UNDER_DUE_DILIGENCE", "DUE_DILIGENCE_COMPLETED"],
    title: "Due Diligence",
    description: "Due diligence review in progress by Investments team; completed when finished.",
    icon: Eye,
    color: "bg-amber-500",
    completedColor: "bg-green-500"
  },
  {
    id: "BOARD_GROUP",
    statusCodes: ["UNDER_BOARD_REVIEW", "BOARD_APPROVED", "BOARD_CONDITIONAL", "BOARD_REJECTED"],
    title: "Board Review & IC Decision",
    description: "Investment Memorandum submitted; IC members cast votes; quorum determines outcome.",
    icon: Users,
    color: "bg-purple-500",
    completedColor: "bg-green-500"
  },
  {
    id: "TERM_SHEET_GROUP",
    statusCodes: ["TERM_SHEET_NEGOTIATION", "TERM_SHEET", "TERM_SHEET_SIGNED"],
    title: "Term Sheet",
    description: "Negotiating the term sheet before finalizing the deal; term sheet generated, finalized, and signed by applicant.",
    icon: FileText,
    color: "bg-indigo-500",
    completedColor: "bg-green-500"
  },
  {
    id: "INVESTMENT_GROUP",
    statusCodes: ["INVESTMENT_IMPLEMENTATION", "DISBURSED", "FUNDED"],
    title: "Investment Implementation & Disbursement",
    description: "Implementation plan started; CFO approves tranches with bank selection; all disbursements completed.",
    icon: DollarSign,
    color: "bg-emerald-500",
    completedColor: "bg-green-500"
  },
  {
    id: "REJECTION_PATH",
    statusCodes: ["REJECTED", "BELOW_THRESHOLD", "REJECTED_SCREENING", "AUTO_REJECTED"],
    title: "Rejection Path",
    description: "Application may move here from any stage if criteria are not met.",
    icon: X,
    color: "bg-red-500",
    completedColor: "bg-red-500"
  }
]




export function ApplicationTimeline({
  application,
  onInitiateDueDiligence,
  onUpdateDueDiligence,
  onCompleteDueDiligence,
  onInitiateBoardReview,
  onUpdateBoardReview,
  onCompleteBoardReview,
  onCreateTermSheet,
  onUpdateTermSheet,
  onFinalizeTermSheet,
  onInvestorSignTermSheet,
  onInitiateFundDisbursement,
  onCreateFundDisbursement,
  refreshTrigger,
  onRefresh,
  onClose
}: ApplicationTimelineProps) {
  const [dueDiligenceModalOpen, setDueDiligenceModalOpen] = useState(false);
  const [dueDiligenceConfirmationOpen, setDueDiligenceConfirmationOpen] = useState(false);
  const dispatch = useAppDispatch()

  //define dispatch
  // const dispatch = useAppDispatch();
  // Helper to check if a stage is completed

  // Helper to check if a stage is completed
  const isStageCompleted = (stageId: string) => {
    const cs = latestApplication?.currentStage
    if (!cs) return false

    // Define stage order for progression checks
    const stageOrder = [
      'SHORTLISTED', 'SCREENING_PENDING', 'SCREENING',
      'ACTIVE_DD', 'UNDER_DUE_DILIGENCE', 'DUE_DILIGENCE_COMPLETED',
      'UNDER_BOARD_REVIEW', 'BOARD_APPROVED', 'BOARD_CONDITIONAL', 'BOARD_REJECTED',
      'TERM_SHEET_NEGOTIATION', 'TERM_SHEET', 'TERM_SHEET_SIGNED',
      'INVESTMENT_IMPLEMENTATION', 'DISBURSED', 'FUNDED'
    ]
    const currentIdx = stageOrder.indexOf(cs)

    switch (stageId) {
      case "APPLICATION_SUBMISSION":
        return cs !== 'SHORTLISTED' && cs !== 'SCREENING_PENDING'
      case "SCREENING_GROUP":
        return currentIdx > stageOrder.indexOf('SCREENING') ||
          ['REJECTED_SCREENING', 'AUTO_REJECTED'].includes(cs)
      case "COMPLIANCE_GROUP":
        // Compliance can happen alongside screening/DD; check if past ACTIVE_DD
        return currentIdx > stageOrder.indexOf('ACTIVE_DD')
      case "DUE_DILIGENCE_GROUP":
        return (latestApplication as any)?.dueDiligenceReview?.status === 'COMPLETED' ||
          currentIdx > stageOrder.indexOf('DUE_DILIGENCE_COMPLETED')
      case "BOARD_GROUP":
        return (latestApplication as any)?.boardReview?.status === 'COMPLETED' ||
          ['BOARD_APPROVED', 'BOARD_CONDITIONAL', 'BOARD_REJECTED', 'TERM_SHEET_NEGOTIATION', 'TERM_SHEET', 'TERM_SHEET_SIGNED', 'INVESTMENT_IMPLEMENTATION', 'DISBURSED', 'FUNDED'].includes(cs)
      case "TERM_SHEET_GROUP":
        return (latestApplication as any)?.termSheet?.status === 'SIGNED' ||
          ['INVESTMENT_IMPLEMENTATION', 'DISBURSED', 'FUNDED'].includes(cs)
      case "INVESTMENT_GROUP":
        return cs !== 'INVESTMENT_IMPLEMENTATION' &&
          (!!(latestApplication as any)?.investmentImplementation || ['DISBURSED', 'FUNDED'].includes(cs))
      case "REJECTION_PATH":
        return ['REJECTED', 'BELOW_THRESHOLD', 'REJECTED_SCREENING', 'AUTO_REJECTED'].includes(cs)
      default:
        return false
    }
  };

  // Helper to get stage status
  const getStageStatus = (stageIndex: number) => {
    const stage = stages[stageIndex];
    if (isStageCompleted(stage.id)) {
      return "completed";
    }
    if (latestApplication?.currentStage && stage.statusCodes.includes(latestApplication.currentStage)) {
      return "current";
    }
    return "upcoming";
  };
  const [completeDueDiligenceConfirmationOpen, setCompleteDueDiligenceConfirmationOpen] = useState(false);
  const [boardReviewModalOpen, setBoardReviewModalOpen] = useState(false);
  const [boardReviewConfirmationOpen, setBoardReviewConfirmationOpen] = useState(false);
  const [completeBoardReviewConfirmationOpen, setCompleteBoardReviewConfirmationOpen] = useState(false);
  const [termSheetModalOpen, setTermSheetModalOpen] = useState(false);
  const [initiateFundDisbursementModalOpen, setInitiateFundDisbursementModalOpen] = useState(false);
  const [createFundDisbursementModalOpen, setCreateFundDisbursementModalOpen] = useState(false);
  const [termSheetConfirmationOpen, setTermSheetConfirmationOpen] = useState(false);
  const [finalizeTermSheetConfirmationOpen, setFinalizeTermSheetConfirmationOpen] = useState(false);
  const [investorSignModalOpen, setInvestorSignModalOpen] = useState(false);
  const [signingAsInvestor, setSigningAsInvestor] = useState(false);

  // Refresh logic for selected application
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const refreshSelectedApplication = async () => {
    dispatch(fetchLatestApplicationById(application.id));
    dispatch(fetchDueDiligenceByApplication(application.id));
    dispatch(fetchBoardReviewByApplication(application.id));
    dispatch(fetchTermSheetByApplication(application.id));
    dispatch(fetchFundDisbursementByApplication(application.id));
    dispatch(fetchVoteSummaryByApplication(application.id));

    // Fetch investment implementation data if available
    if (application?.investmentImplementation?.portfolioCompanyId) {
      dispatch(fetchInvestmentImplementationByApp({
        applicationId: application.id,
        portfolioCompanyId: application?.investmentImplementation?.portfolioCompanyId
      }));
      dispatch(fetchDisbursementSummaryByApp({
        applicationId: application.id,
        implementationId: application?.investmentImplementation?.id
      }));
    }

    setLocalRefreshTrigger(prev => prev + 1);
  };

  // Timeline action handlers (async to match expected prop types)
  const handleInitiateDueDiligence = async () => { setDueDiligenceConfirmationOpen(true); };
  const handleUpdateDueDiligence = async () => { setDueDiligenceModalOpen(true); };
  const handleCompleteDueDiligence = async () => { setCompleteDueDiligenceConfirmationOpen(true); };
  const handleInitiateBoardReview = async () => { setBoardReviewConfirmationOpen(true); };
  const handleUpdateBoardReview = async () => { setBoardReviewModalOpen(true); };
  const handleCompleteBoardReview = async () => { setCompleteBoardReviewConfirmationOpen(true); };
  const handleCreateTermSheet = async () => { setTermSheetModalOpen(true); };
  const handleUpdateTermSheet = async () => { setTermSheetModalOpen(true); };
  const handleFinalizeTermSheet = async () => { setFinalizeTermSheetConfirmationOpen(true); };
  const handleInvestorSignTermSheet = async () => { setInvestorSignModalOpen(true); };

  // ── New flow action handlers ──
  const handleAssignAnalyst = async () => {
    setShowAssignAnalystModal(true)
  }

  const handleAnalystScreening = async () => {
    setShowScreeningScoreModal(true)
  }

  const handleTriggerShortlisting = async () => {
    try {
      await applicationsApi.triggerShortlisting(application.id)
      toast.success('Shortlisting triggered')
      await refreshSelectedApplication()
    } catch (e: any) {
      toast.error('Failed to trigger shortlisting', { description: e?.message })
    }
  }

  const handleUploadRbz = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setRbzFileToUpload(file)
      setRbzConfirmOpen(true)
    }
    input.click()
  }

  const handleConfirmRbzUpload = async () => {
    if (!rbzFileToUpload) {
      toast.error('No RBZ document selected')
      return
    }

    setRbzUploading(true)
    try {
      await applicationsApi.uploadRbzDocument(application.id, rbzFileToUpload)
      toast.success('RBZ Exchange Control document uploaded')
      setRbzConfirmOpen(false)
      setRbzFileToUpload(null)
      await refreshSelectedApplication()
    } catch (err: any) {
      toast.error('Failed to upload RBZ document', { description: err?.message })
    } finally {
      setRbzUploading(false)
    }
  }

  const handleSetKycVerified = async () => {
    try {
      await applicationsApi.setStatutoryCompliance(application.id, true)
      toast.success('KYC verified successfully')
      await refreshSelectedApplication()
    } catch (e: any) {
      toast.error('Failed to verify KYC', { description: e?.message })
    }
  }

  // Fetch required data once when drawer opens
  useEffect(() => {
    dispatch(fetchLatestApplicationById(application.id))
    dispatch(fetchDueDiligenceByApplication(application.id))
    dispatch(fetchBoardReviewByApplication(application.id))
    dispatch(fetchTermSheetByApplication(application.id))
    dispatch(fetchFundDisbursementByApplication(application.id))
    dispatch(fetchVoteSummaryByApplication(application.id))

    // Fetch investment implementation data if available
    if (application.investmentImplementation?.portfolioCompanyId && application.investmentImplementation?.id) {
      dispatch(fetchInvestmentImplementationByApp({
        applicationId: application.id,
        portfolioCompanyId: application.investmentImplementation.portfolioCompanyId
      }))
      dispatch(fetchDisbursementSummaryByApp({
        applicationId: application.id,
        implementationId: application.investmentImplementation.id
      }))
    }
  }, [dispatch, application.id, application.investmentImplementation?.portfolioCompanyId, application.investmentImplementation?.id])

  const handleInitiateFundDisbursement = async () => { setInitiateFundDisbursementModalOpen(true); };
  const handleUpdateFundDisbursement = async () => { setInitiateFundDisbursementModalOpen(true); };
  const handleCreateFundDisbursement = async () => { setCreateFundDisbursementModalOpen(true); };

  // Approve disbursement handler
  const handleApproveDisbursement = async (disbursementId: string) => {
    try {
      await fundDisbursementApi.approveDisbursement(disbursementId);
      toast.success('Disbursement approved successfully');

      // Refresh data
      await refreshSelectedApplication();

      // Close the approving dialog
      setApprovingDisbursementId(null);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to approve disbursement';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Disburse fund handler
  const handleDisburseFund = async () => {
    if (!disbursingFundId || !transactionReference.trim()) {
      toast.error('Transaction reference is required');
      return;
    }

    try {
      await fundDisbursementApi.disburseFund(disbursingFundId, transactionReference);
      toast.success('Disbursement marked as completed successfully');

      // Refresh data
      await refreshSelectedApplication();

      // Close the disbursing dialog and reset form
      setDisbursingFundId(null);
      setTransactionReference('');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to mark disbursement as completed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Fund disbursement state
  const [approvingDisbursementId, setApprovingDisbursementId] = useState<string | null>(null);
  const [disbursingFundId, setDisbursingFundId] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState<string>('');

  const { latestApplication, latestApplicationLoading, } = useAppSelector((s) => s.application)
  const dueDiligenceByApp = useAppSelector((s) => s.application.dueDiligenceByApp || {});
  const termSheetByApp = useAppSelector((s) => s.application.termSheetByApp || {});
  // Data selectors for board review, term sheet, due diligence, fund disbursement
  const boardReviewData = (latestApplication as any)?.boardReview || null;
  const boardReviewLoading = useAppSelector((s) => s.application.boardReviewLoadingByApp?.[application.id] || false);
  // Prioritize latestApplication.termSheet as it has signature data, fallback to termSheetByApp
  const termSheetData = (latestApplication as any)?.termSheet || termSheetByApp[application.id] || null;
  const termSheetLoading = useAppSelector((s) => s.application.termSheetLoadingByApp?.[application.id] || false);
  const dueDiligenceLoading = useAppSelector((s) => s.application.dueDiligenceLoadingByApp?.[application.id] || false);
  const fundDisbursementData = useAppSelector((s) => s.application.fundDisbursementByApp[application.id] || null);
  const fundDisbursementLoading = useAppSelector((s) => s.application.fundDisbursementLoadingByApp?.[application.id] || false);
  const voteSummaryLoading = useAppSelector((s) => s.application.voteSummaryLoadingByApp?.[application.id] || false);
  const implementationData = useAppSelector((s) => s.application.investmentImplementationByApp[application.id] || null);
  const implementationLoading = useAppSelector((s) => s.application.investmentImplementationLoadingByApp?.[application.id] || false);
  const disbursementSummaryData = useAppSelector((s) => s.application.disbursementSummaryByApp[application.id] || null);
  const disbursementSummaryLoading = useAppSelector((s) => s.application.disbursementSummaryLoadingByApp?.[application.id] || false);

  // Activity approval data
  const [activityApprovalData, setActivityApprovalData] = useState<any>(null);
  const [activityApprovalLoading, setActivityApprovalLoading] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0)

  // Use latestApplication for all subcomponent payloads
  const dueDiligenceData = dueDiligenceByApp[application.id] || (latestApplication as any)?.dueDiligenceReview || null;
  const voteSummary = useAppSelector((s) => s.application.voteSummaryByApp[application.id] || null);

  // UI state hooks
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showActivityApprovalModal, setShowActivityApprovalModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showFundDisbursementForm, setShowFundDisbursementForm] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingDisbursement, setPendingDisbursement] = useState<any>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showAssignAnalystModal, setShowAssignAnalystModal] = useState(false);
  const [showScreeningScoreModal, setShowScreeningScoreModal] = useState(false);
  const [rbzFileToUpload, setRbzFileToUpload] = useState<File | null>(null);
  const [rbzConfirmOpen, setRbzConfirmOpen] = useState(false);
  const [rbzUploading, setRbzUploading] = useState(false);

  const handleCreateTask = () => {
    setShowTaskModal(true)
  }

  const handleTaskSuccess = async () => {
    setShowTaskModal(false)
    await refreshSelectedApplication();
  }

  const handleApproveActivity = () => {
    if (selectedActivityId) {
      setShowActivityApprovalModal(true)
    }
  }

  const handleActivityApprovalSuccess = async () => {
    setShowActivityApprovalModal(false)
    await refreshSelectedApplication();
  }

  const handleVoteSuccess = async () => {
    setShowVoteModal(false)
    await refreshSelectedApplication();
    dispatch(fetchVoteSummaryByApplication(application.id));
  }

  const handleMilestoneSuccess = async () => {
    setShowMilestoneModal(false)
    await refreshSelectedApplication();
  }

  const handleChecklistSuccess = async () => {
    setShowChecklistModal(false)
    await refreshSelectedApplication();
  }

  if (latestApplicationLoading) {
    return (<TimelineSkeleton />)
  }

  return (
    <div className="space-y-6" key={application.id}>
      {/* Timeline Header with Close Button */}
      <div className="relative text-center mb-8">
        <h2 className="text-xl font-normal text-gray-900 mb-2">Application Timeline</h2>
        <p className="text-sm text-gray-600">Track the progress of this investment application</p>

        {/* Close Button */}

        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          className="absolute -top-2 right-0 rounded-full h-10 w-10 bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700 shadow-md hover:shadow-lg transition-all"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5" />
        </Button>

      </div>

      {/* Modals */}
      <DueDiligenceModal
        isOpen={dueDiligenceModalOpen}
        onClose={() => setDueDiligenceModalOpen(false)}
        applicationId={application.id}
        onSuccess={async () => {
          setDueDiligenceModalOpen(false);
          await refreshSelectedApplication();
        }}
      />

      <BoardReviewModal
        isOpen={boardReviewModalOpen}
        onClose={() => setBoardReviewModalOpen(false)}
        applicationId={application.id}
        onSuccess={async () => {
          setBoardReviewModalOpen(false);
          await refreshSelectedApplication();
        }}
      />

      <TermSheetModal
        isOpen={termSheetModalOpen}
        onClose={() => setTermSheetModalOpen(false)}
        applicationId={application.id}
        onSuccess={async () => {
          setTermSheetModalOpen(false);
          await refreshSelectedApplication();
        }}
      />

      {application.portfolioCompanyId && (
        <FundDisbursementModal
          isOpen={initiateFundDisbursementModalOpen}
          onClose={() => setInitiateFundDisbursementModalOpen(false)}
          applicationId={application.id}
          portfolioCompanyId={application.portfolioCompanyId}
          onSuccess={async () => {
            setInitiateFundDisbursementModalOpen(false);
            await refreshSelectedApplication();
          }}
        />
      )}

      {application.investmentImplementation && (
        <CreateFundDisbursementModal
          isOpen={createFundDisbursementModalOpen}
          onClose={() => setCreateFundDisbursementModalOpen(false)}
          investmentImplementationId={application.investmentImplementation?.id}
          companyName={application.businessName}
          onSuccess={async () => {
            setCreateFundDisbursementModalOpen(false);
            await refreshSelectedApplication();
          }}
        />
      )}

      <DueDiligenceConfirmationDialog
        isOpen={dueDiligenceConfirmationOpen}
        onClose={() => setDueDiligenceConfirmationOpen(false)}
        applicationId={application.id}
        applicationName={application.businessName}
        onSuccess={async () => {
          setDueDiligenceConfirmationOpen(false);
          await refreshSelectedApplication();
        }}
      />

      <CompleteDueDiligenceConfirmationDialog
        isOpen={completeDueDiligenceConfirmationOpen}
        onClose={() => setCompleteDueDiligenceConfirmationOpen(false)}
        applicationId={application.id}
        applicationName={application.businessName}
        onSuccess={async () => {
          setCompleteDueDiligenceConfirmationOpen(false);
          await refreshSelectedApplication();
        }}
      />

      <BoardReviewConfirmationDialog
        isOpen={boardReviewConfirmationOpen}
        onClose={() => setBoardReviewConfirmationOpen(false)}
        applicationId={application.id}
        applicationName={application.businessName}
        onSuccess={async () => {
          setBoardReviewConfirmationOpen(false);
          await refreshSelectedApplication();
        }}
      />

      <CompleteBoardReviewConfirmationDialog
        isOpen={completeBoardReviewConfirmationOpen}
        onClose={() => setCompleteBoardReviewConfirmationOpen(false)}
        applicationId={application.id}
        applicationName={application.businessName}
        onSuccess={async () => {
          setCompleteBoardReviewConfirmationOpen(false);
          await refreshSelectedApplication();
        }}
      />

      <TermSheetConfirmationDialog
        isOpen={termSheetConfirmationOpen}
        onClose={() => setTermSheetConfirmationOpen(false)}
        applicationId={application.id}
        applicationName={application.businessName}
        onSuccess={async () => {
          setTermSheetConfirmationOpen(false);
          await refreshSelectedApplication();
        }}
      />

      <FinalizeTermSheetConfirmationDialog
        isOpen={finalizeTermSheetConfirmationOpen}
        onClose={() => setFinalizeTermSheetConfirmationOpen(false)}
        applicationId={application.id}
        applicationName={application.businessName}
        onSuccess={async () => {
          setFinalizeTermSheetConfirmationOpen(false);
          await refreshSelectedApplication();
        }}
      />

      {/* Investor Sign Term Sheet Modal */}
      <SignTermSheetModal
        open={investorSignModalOpen}
        onOpenChange={setInvestorSignModalOpen}
        loading={signingAsInvestor}
        onSubmit={async (signature) => {
          setSigningAsInvestor(true)
          try {
            await dispatch(investorSignTermSheet({ applicationId: application.id, signature })).unwrap()
            toast.success('Term sheet signed successfully as investor')
            setInvestorSignModalOpen(false)
            await refreshSelectedApplication()
          } catch (err: any) {
            const errorMessage = err?.message || err?.data?.message || (typeof err === 'string' ? err : 'Failed to sign term sheet')
            toast.error(errorMessage)
          }
          setSigningAsInvestor(false)
        }}
      />

      {/* Timeline Steps */}
      <div className="relative">
        {/* Modals and Dialogs */}
        {showFundDisbursementForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Initiate Fund Disbursement</h3>
                  <button
                    onClick={() => setShowFundDisbursementForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                <FundDisbursementForm
                  applicationId={application.id}
                  portfolioCompanyId={application.portfolioCompanyId || ''}
                  fundId={application.fundId || ''}
                  onCancel={() => setShowFundDisbursementForm(false)}
                  onSubmit={handleCreateFundDisbursement}
                />
              </div>
            </div>
          </div>
        )}

        <FundDisbursementConfirmationDialog
          open={showConfirmationDialog}
          onOpenChange={setShowConfirmationDialog}
          onConfirm={handleCreateFundDisbursement}
          disbursementData={{
            amount: pendingDisbursement?.amount || 0,
            disbursementDate: pendingDisbursement?.disbursementDate || new Date(),
            paymentMethod: pendingDisbursement?.paymentMethod || '',
            referenceNumber: pendingDisbursement?.referenceNumber || ''
          }}
          loading={false}
        />

        <DueDiligenceTaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          applicationId={application.id}
          onSuccess={handleTaskSuccess}
        />

        <ActivityApprovalModal
          isOpen={showActivityApprovalModal}
          onClose={() => setShowActivityApprovalModal(false)}
          activityId={selectedActivityId || ''}
          onSuccess={handleActivityApprovalSuccess}
        />

        <BoardVoteModal
          isOpen={showVoteModal}
          onClose={() => setShowVoteModal(false)}
          applicationId={application.id}
          onSuccess={handleVoteSuccess}
        />

        <MilestoneModal
          open={showMilestoneModal}
          onOpenChange={setShowMilestoneModal}
          implementationId={application.investmentImplementation?.portfolioCompanyId || ''}
          onSuccess={handleMilestoneSuccess}
        />

        <ChecklistModal
          open={showChecklistModal}
          onOpenChange={setShowChecklistModal}
          implementationId={application.investmentImplementation?.portfolioCompanyId || ''}
          currentChecklist={(latestApplication as any)?.investmentImplementation?.checklist}
          onSuccess={handleChecklistSuccess}
        />

        <AssignAnalystModal
          isOpen={showAssignAnalystModal}
          onClose={() => setShowAssignAnalystModal(false)}
          applicationId={application.id}
          businessName={application.businessName}
          onSuccess={refreshSelectedApplication}
        />

        <AnalystScreeningModal
          isOpen={showScreeningScoreModal}
          onClose={() => setShowScreeningScoreModal(false)}
          applicationId={application.id}
          businessName={application.businessName}
          hasAssignedAnalyst={Boolean((latestApplication as any)?.assignedAnalystId || (latestApplication as any)?.assignedAnalyst)}
          onAssignAnalyst={() => {
            setShowScreeningScoreModal(false)
            setShowAssignAnalystModal(true)
          }}
          onSuccess={refreshSelectedApplication}
        />

        <AlertDialog
          open={rbzConfirmOpen}
          onOpenChange={(open) => {
            setRbzConfirmOpen(open)
            if (!open) {
              setRbzFileToUpload(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm RBZ Document Upload</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to upload this RBZ Exchange Control document:
                <span className="block mt-2 font-medium text-foreground">{rbzFileToUpload?.name || 'No file selected'}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={rbzUploading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  void handleConfirmRbzUpload()
                }}
                disabled={rbzUploading || !rbzFileToUpload}
              >
                {rbzUploading ? 'Uploading...' : 'Upload Document'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {stages.map((stage, index) => {
          const status = getStageStatus(index);
          const isCompleted = status === "completed"
          const isCurrent = status === "current"
          const isUpcoming = status === "upcoming"

          //get actula application stage 
          const actualStage = application.currentStage


          // Show accordion for current or completed stage, or if data exists
          let showAccordion = false;
          if (stage.id === "APPLICATION_SUBMISSION") {
            showAccordion = true;
          } else if (isCurrent || isCompleted) {
            showAccordion = true;
          } else if (stage.id === "SCREENING_GROUP" && ['SCREENING_PENDING', 'SCREENING'].includes(latestApplication?.currentStage || '')) {
            showAccordion = true;
          } else if (stage.id === "COMPLIANCE_GROUP" && (isCurrent || isCompleted)) {
            showAccordion = true;
          } else if (stage.id === "DUE_DILIGENCE_GROUP" && dueDiligenceData) {
            showAccordion = true;
          } else if (stage.id === "BOARD_GROUP" && boardReviewData) {
            showAccordion = true;
          } else if (stage.id === "TERM_SHEET_GROUP" && termSheetData) {
            showAccordion = true;
          } else if (stage.id === "INVESTMENT_GROUP" && (fundDisbursementData || (latestApplication as any)?.investmentImplementation)) {
            showAccordion = true;
          }

          return (
            <div key={`${stage.id}-${application.id}`} className="relative flex items-start">
              {index < stages.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
              )}

              <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-white shadow-lg">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : isCurrent ? (
                  <div className={`w-6 h-6 rounded-full ${stage.color} flex items-center justify-center`}>
                    <stage.icon className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="ml-6 flex-1 pb-8">
                <Card className={`transition-all duration-300 ${isCurrent
                  ? 'border-2 border-blue-500 shadow-lg bg-white'
                  : isCompleted
                    ? 'border-green-200 bg-white'
                    : isUpcoming
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 bg-white'
                  }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={`text-base font-normal ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                          }`}>
                          {stage.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Current
                          </Badge>
                        )}
                        {isUpcoming && (
                          <Badge variant="secondary">
                            Upcoming
                          </Badge>
                        )}
                        {stage.id === 'BOARD_GROUP' && voteSummary?.boardStatus === 'IN_PROGRESS' && !voteSummary.isVotingComplete && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Voting in Progress
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {stage.id === "APPLICATION_SUBMISSION" && showAccordion && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="application-data">
                            <AccordionTrigger className="text-left hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                                  <CiFileOn className="w-4 h-4 text-blue-500" />
                                </div>
                                <span>Application Data</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <ApplicationDataSection application={application} />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {stage.id === "SCREENING_GROUP" && showAccordion && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="screening-data">
                            <AccordionTrigger className="text-left hover:bg-cyan-50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-100 to-sky-200 flex items-center justify-center">
                                  <Search className="w-4 h-4 text-cyan-500" />
                                </div>
                                <span>Screening & Analyst Details</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 text-sm p-3 bg-cyan-50/30 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Current Stage</span>
                                  <Badge variant="secondary">{latestApplication?.currentStage || 'N/A'}</Badge>
                                </div>
                                {(latestApplication as any)?.assignedAnalyst && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Assigned Analyst</span>
                                    <span className="font-medium">{(latestApplication as any).assignedAnalyst.firstName} {(latestApplication as any).assignedAnalyst.lastName}</span>
                                  </div>
                                )}
                                {(latestApplication as any)?.screeningScore !== undefined && (latestApplication as any)?.screeningScore !== null && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Screening Score</span>
                                    <span className={`font-semibold ${Number((latestApplication as any).screeningScore) >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {(latestApplication as any).screeningScore}/100
                                    </span>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  Assign an analyst to begin screening. Score &ge; 50 advances to Active DD; below 50 rejects at screening.
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {stage.id === "COMPLIANCE_GROUP" && showAccordion && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="compliance-data">
                            <AccordionTrigger className="text-left hover:bg-rose-50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center">
                                  <Shield className="w-4 h-4 text-rose-500" />
                                </div>
                                <span>Compliance & KYC Status</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 text-sm p-3 bg-rose-50/30 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">KYC Verified</span>
                                  <Badge className={
                                    (latestApplication as any)?.kycVerified
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }>
                                    {(latestApplication as any)?.kycVerified ? 'Verified' : 'Pending'}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Compliance Cleared</span>
                                  <Badge className={
                                    (latestApplication as any)?.complianceCleared
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }>
                                    {(latestApplication as any)?.complianceCleared ? 'Cleared' : 'Pending'}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">RBZ Document</span>
                                  <Badge className={
                                    (latestApplication as any)?.rbzDocumentUrl
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }>
                                    {(latestApplication as any)?.rbzDocumentUrl ? 'Uploaded' : 'Not uploaded'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  RBZ Exchange Control document and KYC verification are required before fund disbursement.
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {stage.id === "DUE_DILIGENCE_GROUP" && showAccordion && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="due-diligence-data">
                            <AccordionTrigger className="text-left hover:bg-amber-50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                                  <Eye className="w-4 h-4 text-amber-500" />
                                </div>
                                <span>Due Diligence Report</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <DueDiligenceSection
                                data={dueDiligenceData}
                                loading={dueDiligenceLoading}
                                error={dueDiligenceData?.error}
                                currentStage={latestApplication?.currentStage || application.currentStage}
                                activityApprovalData={activityApprovalData}
                                onRefresh={() => dispatch(fetchDueDiligenceByApplication(application.id))}
                                onInitiate={onInitiateDueDiligence}
                                onApproveActivity={id => {
                                  setSelectedActivityId(id);
                                  setShowActivityApprovalModal(true);
                                }}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {stage.id === "BOARD_GROUP" && showAccordion && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="board-review-data">
                            <AccordionTrigger className="text-left hover:bg-purple-50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-purple-500" />
                                </div>
                                <span>Board Review Report</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <BoardReviewSection
                                data={boardReviewData}
                                loading={boardReviewLoading}
                                error={boardReviewData?.error}
                                currentStage={latestApplication?.currentStage || application.currentStage}
                                voteSummary={voteSummary}
                                voteSummaryLoading={voteSummaryLoading}
                                onRefresh={() => dispatch(fetchBoardReviewByApplication(application.id))}
                                onInitiate={onInitiateBoardReview}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {stage.id === "TERM_SHEET_GROUP" && showAccordion && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="term-sheet-data">
                            <AccordionTrigger className="text-left hover:bg-indigo-50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span>Term Sheet Details</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <TermSheetSection
                                data={termSheetData}
                                loading={termSheetLoading}
                                error={termSheetData?.error}
                                currentStage={latestApplication?.currentStage || application.currentStage}
                                onRefresh={() => dispatch(fetchTermSheetByApplication(application.id))}
                                onCreate={onCreateTermSheet}
                                onInvestorSign={handleInvestorSignTermSheet}
                                applicationData={latestApplication || application}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {stage.id === "INVESTMENT_GROUP" && showAccordion && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="fund-disbursement-data">
                            <AccordionTrigger className="text-left hover:bg-emerald-50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center">
                                  <DollarSign className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span>Fund Disbursement Details</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <FundDisbursementSection
                                application={application}
                                data={fundDisbursementData}
                                loading={fundDisbursementLoading || implementationLoading || disbursementSummaryLoading}
                                error={fundDisbursementData?.error}
                                implementationData={implementationData}
                                disbursementSummaryData={disbursementSummaryData}
                                approvingDisbursementId={approvingDisbursementId}
                                disbursingFundId={disbursingFundId}
                                transactionReference={transactionReference}
                                onSetApprovingId={setApprovingDisbursementId}
                                onSetDisbursingId={setDisbursingFundId}
                                onSetTransactionReference={setTransactionReference}
                                onApproveDisbursement={handleApproveDisbursement}
                                onDisburseFund={handleDisburseFund}
                                onRefresh={async () => { await refreshSelectedApplication(); }}
                                onCreateMilestone={() => setShowMilestoneModal(true)}
                                onUpdateChecklist={() => setShowChecklistModal(true)}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      <div className="pt-4 border-t border-gray-200">
                        <TimelineStageActions
                          stageId={stage.id}
                          application={application}
                          termSheetData={termSheetData}
                          termSheetDataLoding={termSheetLoading}
                          dueDiligenceData={dueDiligenceData}
                          dueDiligenceLoading={dueDiligenceLoading || boardReviewLoading}
                          activityApprovalData={activityApprovalData}
                          activityApprovalLoading={activityApprovalLoading}
                          boardReviewData={boardReviewData}
                          voteSummary={voteSummary}
                          implementationData={implementationData}
                          implementationLoading={implementationLoading}
                          onInitiateDueDiligence={handleInitiateDueDiligence}
                          onUpdateDueDiligence={handleUpdateDueDiligence}
                          onCompleteDueDiligence={handleCompleteDueDiligence}
                          onCreateDueDiligenceTask={handleCreateTask}
                          onApproveActivity={handleApproveActivity}
                          onInitiateBoardReview={handleInitiateBoardReview}
                          onUpdateBoardReview={handleUpdateBoardReview}
                          onCompleteBoardReview={handleCompleteBoardReview}
                          onVote={() => setShowVoteModal(true)}
                          onCreateTermSheet={handleCreateTermSheet}
                          onUpdateTermSheet={handleUpdateTermSheet}
                          onFinalizeTermSheet={handleFinalizeTermSheet}
                          onSignAsInvestor={() => setInvestorSignModalOpen(true)}
                          onInitiateFundDisbursement={handleInitiateFundDisbursement}
                          onCreateFundDisbursement={handleCreateFundDisbursement}
                          onUpdateChecklist={() => setShowChecklistModal(true)}
                          onAssignAnalyst={handleAssignAnalyst}
                          onAnalystScreening={handleAnalystScreening}
                          onTriggerShortlisting={handleTriggerShortlisting}
                          onUploadRbz={handleUploadRbz}
                          onSetKycVerified={handleSetKycVerified}
                          onRefresh={async () => { await refreshSelectedApplication(); }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
