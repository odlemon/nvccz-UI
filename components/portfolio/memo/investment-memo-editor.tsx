"use client"

import { useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchMemoHeader, fetchMemoVersionDetail, saveMemoVersion, validateMemoVersion,
  submitMemoVersion, createMemoVersion, uploadMemoAttachment, fetchMemoVersions,
  fetchMemoApprovalHistory,
} from "@/lib/store/slices/applicationSlice"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { APPLICATION_PORTAL_ACTIONS } from "@/lib/config/role-permissions"
import type { MemoSections, ValidationResult } from "@/lib/api/investment-memo-api"
import { MEMO_SECTIONS, type SectionKey } from "./memo-sections-config"
import { MemoSectionNav } from "./memo-section-nav"
import { MemoValidationPanel } from "./memo-validation-panel"
import { MemoApproveRejectDialog } from "./memo-approve-reject-dialog"
import { MemoApprovalHistory } from "./memo-approval-history"
import { MemoVersionsList } from "./memo-versions-list"
import { RichTextEditor } from "./rich-text-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Save, CheckCircle2, Send, Loader2, Plus, Paperclip, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

const EMPTY_SECTIONS: MemoSections = {
  dealTerms: "", overallScore: null, recommendation: "", companyOverview: "",
  executiveSummary: "", investmentThesis: "", financialAnalysis: "",
  marketOpportunity: "", risksAndMitigants: "", additionalInformation: "",
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  LOCKED: "bg-blue-100 text-blue-700",
}

export function InvestmentMemoEditor({ applicationId }: { applicationId: string }) {
  const dispatch = useAppDispatch()
  const { hasSpecificAction } = useRolePermissions()

  const canDraft = hasSpecificAction("application-portal", APPLICATION_PORTAL_ACTIONS.DRAFT_INVESTMENT_MEMO)
  const canSubmit = hasSpecificAction("application-portal", APPLICATION_PORTAL_ACTIONS.SUBMIT_INVESTMENT_MEMO)
  const canApprove = hasSpecificAction("application-portal", APPLICATION_PORTAL_ACTIONS.APPROVE_INVESTMENT_MEMO)

  const {
    investmentMemoByApp, investmentMemoLoadingByApp,
    memoVersionDetailById, memoVersionDetailLoadingById,
    memoSaving, memoValidating, memoSubmitting,
    memoApprovalHistoryByApp, memoApprovalHistoryLoadingByApp,
    memoVersionsByApp, memoVersionsLoadingByApp,
  } = useAppSelector((s) => s.application as any)

  const header = investmentMemoByApp[applicationId]
  const headerLoading = investmentMemoLoadingByApp[applicationId]
  const currentVersionId: string | null = header?.currentVersionId ?? null
  const version = currentVersionId ? memoVersionDetailById[currentVersionId] : null
  const versionLoading = currentVersionId ? memoVersionDetailLoadingById[currentVersionId] : false
  const approvalHistory = memoApprovalHistoryByApp[applicationId] ?? []
  const approvalHistoryLoading = !!memoApprovalHistoryLoadingByApp[applicationId]
  const versions = memoVersionsByApp[applicationId] ?? []
  const versionsLoading = !!memoVersionsLoadingByApp[applicationId]

  const [activeTab, setActiveTab] = useState<"editor" | "versions" | "history">("editor")
  const [activeKey, setActiveKey] = useState<SectionKey>("executiveSummary")
  const [formSections, setFormSections] = useState<MemoSections>(EMPTY_SECTIONS)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [approveRejectOpen, setApproveRejectOpen] = useState(false)
  const [newVersionOpen, setNewVersionOpen] = useState(false)
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [changeSummary, setChangeSummary] = useState("")
  const loadedVersionIdRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    dispatch(fetchMemoHeader(applicationId))
    dispatch(fetchMemoApprovalHistory(applicationId))
  }, [dispatch, applicationId])

  useEffect(() => {
    if (currentVersionId) dispatch(fetchMemoVersionDetail({ applicationId, versionId: currentVersionId }))
  }, [dispatch, applicationId, currentVersionId])

  useEffect(() => {
    if (activeTab === "versions") dispatch(fetchMemoVersions(applicationId))
  }, [dispatch, applicationId, activeTab])

  // Reset the working form only when a genuinely different version loads —
  // never on a background refetch of the same version (would clobber edits).
  useEffect(() => {
    if (version && version.id !== loadedVersionIdRef.current) {
      setFormSections({ ...EMPTY_SECTIONS, ...version.sections })
      setValidationResult(version.validationPassed != null ? { passed: version.validationPassed, errors: version.validationErrors ?? [] } : null)
      loadedVersionIdRef.current = version.id
    }
  }, [version])

  const isDraft = version?.versionStatus === "DRAFT"
  const readOnly = !isDraft || !canDraft

  const field = (key: SectionKey, value: string) => setFormSections((p) => ({ ...p, [key]: value }))

  const handleSave = async () => {
    if (!currentVersionId) return
    try {
      await dispatch(saveMemoVersion({ applicationId, versionId: currentVersionId, data: { sections: formSections }, validate: false })).unwrap()
      toast.success("Draft saved")
    } catch (err: any) {
      toast.error("Failed to save draft", { description: err.message })
    }
  }

  const handleValidate = async () => {
    if (!currentVersionId) return
    try {
      const result = await dispatch(validateMemoVersion({ applicationId, versionId: currentVersionId })).unwrap()
      setValidationResult(result)
      if (result.passed) toast.success("Validation passed")
      else toast.error("Validation failed", { description: `${result.errors?.length ?? 0} issue(s) found` })
    } catch (err: any) {
      toast.error("Failed to validate", { description: err.message })
    }
  }

  const handleSubmit = async () => {
    if (!currentVersionId) return
    try {
      // Persist the latest edits first so the CIO reviews exactly what's on screen,
      // then always call the actual submit endpoint — the backend enforces the
      // validation-must-pass rule, we don't gate the call on a client-side guess.
      const saved = await dispatch(saveMemoVersion({ applicationId, versionId: currentVersionId, data: { sections: formSections }, validate: true })).unwrap()
      setValidationResult({ passed: saved.validationPassed, errors: saved.validationErrors ?? [] })
      await dispatch(submitMemoVersion({ applicationId, versionId: currentVersionId })).unwrap()
      // The submit response only carries the memo header, not the version's new
      // status — refetch both so the badge/read-only gating update immediately
      // instead of only after the drawer is closed and reopened.
      await Promise.all([
        dispatch(fetchMemoHeader(applicationId)),
        dispatch(fetchMemoVersionDetail({ applicationId, versionId: currentVersionId })),
        dispatch(fetchMemoApprovalHistory(applicationId)),
      ])
      toast.success("Submitted for CIO approval")
    } catch (err: any) {
      toast.error("Failed to submit", { description: err.message })
    }
  }

  const handleCreateVersion = async () => {
    try {
      await dispatch(createMemoVersion({ applicationId, changeSummary: changeSummary || undefined })).unwrap()
      await Promise.all([
        dispatch(fetchMemoHeader(applicationId)),
        dispatch(fetchMemoVersions(applicationId)),
      ])
      toast.success("New draft version created")
      setNewVersionOpen(false)
      setChangeSummary("")
    } catch (err: any) {
      toast.error("Failed to create new version", { description: err.message })
    }
  }

  const handleAttach = async (file: File) => {
    if (!currentVersionId) return
    try {
      await dispatch(uploadMemoAttachment({ applicationId, versionId: currentVersionId, file })).unwrap()
      await dispatch(fetchMemoVersionDetail({ applicationId, versionId: currentVersionId }))
      toast.success("Attachment uploaded")
    } catch (err: any) {
      toast.error("Failed to upload attachment", { description: err.message })
    }
  }

  const activeSectionConfig = MEMO_SECTIONS.find((s) => s.key === activeKey)!

  if (headerLoading && !header) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {version ? (
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[version.versionStatus] ?? "bg-gray-100 text-gray-600"}`}>
            v{version.versionNumber} {version.versionStatus}
          </span>
        ) : <span />}
        {canDraft && (
          <Button
            variant="outline" size="sm"
            className="border-purple-500 text-purple-600 hover:bg-purple-50 rounded-full h-8 text-xs"
            onClick={() => setNewVersionOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Version
          </Button>
        )}
      </div>

      {/* CIO review bar */}
      {header?.workflowStatus === "SUBMITTED" && canApprove && version && (
        <div className="flex items-center justify-between gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-purple-800">
            <ShieldAlert className="w-4 h-4" />
            This memo is awaiting your approval to unlock Call to Vote.
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full"
            onClick={() => setApproveRejectOpen(true)}
          >
            Review &amp; Decide
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full w-fit">
        {(["editor", "versions", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "editor" ? "Editor" : tab === "versions" ? "Versions" : "Approval History"}
          </button>
        ))}
      </div>

      {activeTab === "history" ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <MemoApprovalHistory entries={approvalHistory} loading={approvalHistoryLoading} />
        </div>
      ) : activeTab === "versions" ? (
        <MemoVersionsList applicationId={applicationId} versions={versions} loading={versionsLoading} currentVersionId={currentVersionId} />
      ) : versionLoading && !version ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : !version ? (
        <div className="text-center py-16 text-sm text-muted-foreground">No memo version available yet.</div>
      ) : (
        <div className="flex gap-6 bg-white border border-gray-200 rounded-2xl p-4">
          <MemoSectionNav sections={formSections} activeKey={activeKey} onSelect={setActiveKey} />

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">{activeSectionConfig.label}</h2>
              {activeKey === "recommendation" && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="overall-score" className="text-xs text-muted-foreground">Overall Score</Label>
                  <Input
                    id="overall-score"
                    type="number" min={0} max={5} step={0.1}
                    className="h-8 w-20 font-mono"
                    value={formSections.overallScore ?? ""}
                    disabled={readOnly}
                    onChange={(e) => setFormSections((p) => ({ ...p, overallScore: e.target.value === "" ? null : Number(e.target.value) }))}
                  />
                </div>
              )}
            </div>

            {activeSectionConfig.richText ? (
              <RichTextEditor
                content={formSections[activeKey] as string}
                onChange={(html) => field(activeKey, html)}
                readOnly={readOnly}
              />
            ) : (
              <Textarea
                className="min-h-[200px] font-mono text-sm"
                value={formSections[activeKey] as string}
                disabled={readOnly}
                onChange={(e) => field(activeKey, e.target.value)}
              />
            )}

            <MemoValidationPanel passed={!!validationResult?.passed} errors={validationResult?.errors} />

            {readOnly && (
              <p className="text-xs text-muted-foreground italic">
                {isDraft ? "You don't have permission to edit this memo." : "This version is locked — create a new version to keep editing."}
              </p>
            )}

            {/* Attachment */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => e.target.files?.[0] && handleAttach(e.target.files[0])} />
              <Button
                variant="outline" size="sm"
                className="border-purple-500 text-purple-600 hover:bg-purple-50 rounded-full h-8 text-xs"
                onClick={() => fileInputRef.current?.click()} disabled={readOnly}
              >
                <Paperclip className="w-3 h-3 mr-1.5" /> {version.attachmentFileName || "Attach supplement PDF"}
              </Button>
            </div>

            {/* Action bar */}
            {!readOnly && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Button
                  variant="outline" size="sm"
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 rounded-full"
                  onClick={handleSave} disabled={memoSaving}
                >
                  {memoSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save draft
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 rounded-full"
                  onClick={handleValidate} disabled={memoValidating}
                >
                  {memoValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Validate
                </Button>
                {canSubmit && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full ml-auto"
                    onClick={() => setSubmitConfirmOpen(true)} disabled={memoSubmitting}
                  >
                    {memoSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Submit for CIO approval
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {version && (
        <MemoApproveRejectDialog
          isOpen={approveRejectOpen}
          onClose={() => setApproveRejectOpen(false)}
          applicationId={applicationId}
          versionId={version.id}
          versionLabel={`v${version.versionNumber}`}
        />
      )}

      <Dialog open={newVersionOpen} onOpenChange={setNewVersionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Draft Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Change Summary</Label>
            <Textarea placeholder="What changed in this revision?" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewVersionOpen(false)}>Cancel</Button>
            <Button
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              onClick={handleCreateVersion}
            >
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for CIO Approval?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock the memo from further edits until the CIO approves or rejects it.
              Make sure all sections are complete before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setSubmitConfirmOpen(false); handleSubmit() }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
