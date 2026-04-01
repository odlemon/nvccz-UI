"use client"

import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import {
  fetchReconciliationEntries,
  createReconciliationDraft,
  updateReconciliationDraft,
  finishReconciliationSession,
  discardReconciliationSession,
  clearActiveSession,
  selectIsBalanced,
} from "@/lib/store/slices/reconciliationSlice"
import { CashbookBank } from "@/lib/api/cashbook-api"
import { ReconciliationHeaderForm } from "./reconciliation-header-form"
import { ReconciliationEntriesTable } from "./reconciliation-entries-table"
import { ReconciliationTotalsFooter } from "./reconciliation-totals-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, CheckCircle, XCircle, Loader2 } from "lucide-react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ReconciliationWorkspaceProps {
  selectedBank: CashbookBank | null
  onBack: () => void
}

export function ReconciliationWorkspace({ selectedBank, onBack }: ReconciliationWorkspaceProps) {
  const dispatch = useDispatch<AppDispatch>()
  const {
    activeSession,
    statementDate,
    statementEndBalance,
    reference,
    openingBalance,
    selectedEntryIds,
    entriesLoading,
    savingDraft,
    finishing,
    discarding,
  } = useSelector((state: RootState) => state.reconciliation)
  const isBalanced = useSelector(selectIsBalanced)

  const isBusy = savingDraft || finishing || discarding

  const handleApply = useCallback(() => {
    if (!selectedBank || !statementDate) return
    dispatch(fetchReconciliationEntries({ bankId: selectedBank.id, asOf: statementDate }))
  }, [dispatch, selectedBank, statementDate])

  const handleSaveDraft = useCallback(async () => {
    if (!selectedBank) return

    try {
      if (activeSession) {
        // Update existing draft
        await dispatch(updateReconciliationDraft({
          sessionId: activeSession.id,
          data: {
            statementDate: statementDate || undefined,
            statementEndBalance: statementEndBalance ?? undefined,
            reference: reference || undefined,
            openingBalance: openingBalance ?? undefined,
            lines: selectedEntryIds.map(id => ({ cashbookEntryId: id, selected: true })),
          },
        })).unwrap()
      } else {
        // Create new draft
        await dispatch(createReconciliationDraft({
          bankId: selectedBank.id,
          data: {
            statementDate,
            statementEndBalance: statementEndBalance ?? 0,
            reference: reference || undefined,
            openingBalance: openingBalance ?? 0,
            selectedEntryIds,
          },
        })).unwrap()
      }
      toast.success("Draft saved successfully")
    } catch (error: any) {
      toast.error("Failed to save draft", { description: error.message || String(error) })
    }
  }, [dispatch, selectedBank, activeSession, statementDate, statementEndBalance, reference, openingBalance, selectedEntryIds])

  const handleFinish = useCallback(async () => {
    if (!selectedBank) return

    try {
      let sessionId = activeSession?.id

      if (!sessionId) {
        // Auto-create draft first
        const created = await dispatch(createReconciliationDraft({
          bankId: selectedBank.id,
          data: {
            statementDate,
            statementEndBalance: statementEndBalance ?? 0,
            reference: reference || undefined,
            openingBalance: openingBalance ?? 0,
            selectedEntryIds,
          },
        })).unwrap()
        sessionId = created?.id
      } else {
        // Save current state
        await dispatch(updateReconciliationDraft({
          sessionId,
          data: {
            statementDate: statementDate || undefined,
            statementEndBalance: statementEndBalance ?? undefined,
            reference: reference || undefined,
            openingBalance: openingBalance ?? undefined,
            lines: selectedEntryIds.map(id => ({ cashbookEntryId: id, selected: true })),
          },
        })).unwrap()
      }

      if (!sessionId) {
        toast.error("Failed to create session")
        return
      }

      // Finalize
      await dispatch(finishReconciliationSession(sessionId)).unwrap()
      toast.success("Reconciliation finalized successfully")
      onBack()
    } catch (error: any) {
      toast.error("Failed to finalize reconciliation", { description: error.message || String(error) })
    }
  }, [dispatch, selectedBank, activeSession, statementDate, statementEndBalance, reference, openingBalance, selectedEntryIds, onBack])

  const handleDiscard = useCallback(async () => {
    if (!activeSession) {
      dispatch(clearActiveSession())
      onBack()
      return
    }

    try {
      await dispatch(discardReconciliationSession(activeSession.id)).unwrap()
      toast.success("Reconciliation discarded")
      dispatch(clearActiveSession())
      onBack()
    } catch (error: any) {
      toast.error("Failed to discard reconciliation", { description: error.message || String(error) })
    }
  }, [dispatch, activeSession, onBack])

  const handleBack = () => {
    dispatch(clearActiveSession())
    onBack()
  }

  return (
    <div className="space-y-4">
      {/* Header Form */}
      <ReconciliationHeaderForm
        selectedBank={selectedBank}
        onApply={handleApply}
        disabled={isBusy || (activeSession?.status === "FINALIZED")}
      />

      {/* Entries Table */}
      <ReconciliationEntriesTable
        loading={entriesLoading}
        disabled={isBusy || (activeSession?.status === "FINALIZED")}
      />

      {/* Totals Footer */}
      <ReconciliationTotalsFooter />

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <Button variant="outline" onClick={handleBack} disabled={isBusy} className="rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sessions
        </Button>

        {activeSession?.status !== "FINALIZED" && (
          <div className="flex items-center gap-3">
            {/* Discard */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isBusy} className="rounded-full text-red-600 border-red-200 hover:bg-red-50">
                  {discarding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Discard
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Discard Reconciliation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will discard the current reconciliation session. Any unsaved changes will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDiscard} className="bg-red-600 hover:bg-red-700">
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Save Draft */}
            <Button variant="outline" onClick={handleSaveDraft} disabled={isBusy} className="rounded-full">
              {savingDraft ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>

            {/* Finish */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isBusy || (!activeSession && selectedEntryIds.length === 0)}
                  className="rounded-full bg-green-600 hover:bg-green-700"
                >
                  {finishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Finish Reconciliation
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isBalanced ? "Finish Reconciliation?" : "Difference Not Zero"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isBalanced
                      ? "This will finalize the reconciliation. Selected entries will be marked as reconciled."
                      : "The reconciled balance does not match the statement end balance. Are you sure you want to finalize? This may fail if the server requires a zero difference."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
                    Finish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  )
}
