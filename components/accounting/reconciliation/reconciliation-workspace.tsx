"use client"

import { useCallback, useRef, ChangeEvent, useState, useEffect } from "react"
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
  setAutoMatchedEntryIds,
  setImportedStatement,
} from "@/lib/store/slices/reconciliationSlice"
import { CashbookBank } from "@/lib/api/cashbook-api"
import { ReconciliationHeaderForm } from "./reconciliation-header-form"
import { ReconciliationEntriesTable } from "./reconciliation-entries-table"
import { ReconciliationTotalsFooter } from "./reconciliation-totals-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, CheckCircle, XCircle, Loader2, Download } from "lucide-react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getBankStatementTemplateCSV,
  matchStatementTransactionsToEntries,
  parseBankStatementCSV,
} from "@/lib/utils/bank-statement-import"
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

import { ReconciliationComparisonView } from "./reconciliation-comparison-view"
import { LayoutGrid, Columns } from "lucide-react"

interface ReconciliationWorkspaceProps {
  selectedBank: CashbookBank | null
  onBack: () => void
}

export function ReconciliationWorkspace({ selectedBank, onBack }: ReconciliationWorkspaceProps) {
  const dispatch = useDispatch<AppDispatch>()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [viewMode, setViewMode] = useState<"standard" | "comparison">("standard")

  const {
    activeSession,
    entries,
    statementDate,
    statementEndBalance,
    reference,
    openingBalance,
    selectedEntryIds,
    entriesLoading,
    savingDraft,
    finishing,
    discarding,
    importedStatement,
    importedStatementFileName,
    autoMatchedEntryIds,
  } = useSelector((state: RootState) => state.reconciliation)
  const isBalanced = useSelector(selectIsBalanced)

  const isBusy = savingDraft || finishing || discarding

  // Auto-switch to comparison mode when statement is imported
  useEffect(() => {
    if (importedStatement) {
      setViewMode("comparison")
    }
  }, [importedStatement])

  const applyAutoMatch = useCallback((nextEntries: typeof entries) => {
    if (!importedStatement || importedStatement.transactions.length === 0) {
      return
    }

    const matchResult = matchStatementTransactionsToEntries(importedStatement.transactions, nextEntries)
    dispatch(setAutoMatchedEntryIds({ 
      matchedEntryIds: matchResult.matchedEntryIds, 
      matchedMapping: matchResult.matchedMapping 
    }))
    toast.success("Statement imported and compared", {
      description: `Matched ${matchResult.matchedTransactionCount} of ${importedStatement.transactions.length} statement transactions.`,
    })
  }, [dispatch, importedStatement])

  const handleApply = useCallback(async () => {
    if (!selectedBank || !statementDate) return
    try {
      const nextEntries = await dispatch(fetchReconciliationEntries({ bankId: selectedBank.id, asOf: statementDate })).unwrap()
      applyAutoMatch(nextEntries || [])
    } catch (error: any) {
      toast.error("Failed to load reconciliation entries", { description: error?.message || String(error) })
    }
  }, [dispatch, selectedBank, statementDate, applyAutoMatch])

  const handleDownloadTemplate = useCallback(() => {
    const template = getBankStatementTemplateCSV()
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bank-statement-import-template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }, [])

  const handleImportStatement = useCallback(() => {
    importInputRef.current?.click()
  }, [])

  const handleStatementFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!selectedBank) {
      toast.error("Please select a bank account before importing a statement")
      event.target.value = ""
      return
    }

    try {
      const text = await file.text()
      const parsedStatement = parseBankStatementCSV(text)

      if (parsedStatement.transactions.length === 0) {
        toast.error("No valid statement transactions were found in the CSV")
        event.target.value = ""
        return
      }

      dispatch(setImportedStatement({ statement: parsedStatement, fileName: file.name }))

      if (!parsedStatement.statementDate) {
        toast.error("Could not determine statement date from the file")
        event.target.value = ""
        return
      }

      const nextEntries = await dispatch(fetchReconciliationEntries({
        bankId: selectedBank.id,
        asOf: parsedStatement.statementDate,
      })).unwrap()
      applyAutoMatch(nextEntries || [])

      if (parsedStatement.warnings.length > 0) {
        toast.warning("Statement imported with warnings", {
          description: parsedStatement.warnings[0],
        })
      }
    } catch (error: any) {
      toast.error("Failed to import bank statement", {
        description: error?.message || String(error),
      })
    } finally {
      event.target.value = ""
    }
  }, [dispatch, selectedBank, applyAutoMatch])

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

  const handleExport = useCallback(() => {
    const selectedSet = new Set(selectedEntryIds)
    const csvContent = [
      ['Date', 'Reference', 'Name', 'Type', 'Received', 'Paid', 'Reconciled'].join(','),
      ...entries.map(e => [
        e.transactionDate ? format(parseISO(e.transactionDate), 'yyyy-MM-dd') : '',
        e.reference || '',
        `"${(e.counterparty || '').replace(/"/g, '""')}"`,
        e.type,
        e.received || 0,
        e.paid || 0,
        selectedSet.has(e.id) ? 'Yes' : 'No',
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bank-reconciliation-${statementDate || 'export'}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Reconciliation exported')
  }, [entries, selectedEntryIds, statementDate])

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
        onImportStatement={handleImportStatement}
        onDownloadTemplate={handleDownloadTemplate}
        importSummary={importedStatement && importedStatementFileName ? {
          fileName: importedStatementFileName,
          transactionsCount: importedStatement.transactions.length,
          matchedCount: autoMatchedEntryIds.length,
          unmatchedCount: Math.max(0, importedStatement.transactions.length - autoMatchedEntryIds.length),
        } : null}
        disabled={isBusy || (activeSession?.status === "FINALIZED")}
      />

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleStatementFileChange}
      />

      {/* View Toggle (Only if statement is imported) */}
      {importedStatement && (
        <div className="flex items-center justify-end">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border">
            <Button
              variant={viewMode === "standard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("standard")}
              className={cn("h-8 rounded-md px-3 text-xs", viewMode === "standard" && "shadow-sm border")}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-2" />
              Standard View
            </Button>
            <Button
              variant={viewMode === "comparison" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("comparison")}
              className={cn("h-8 rounded-md px-3 text-xs", viewMode === "comparison" && "shadow-sm border")}
            >
              <Columns className="w-3.5 h-3.5 mr-2" />
              Comparison View
            </Button>
          </div>
        </div>
      )}

      {/* Entries Table or Comparison View */}
      {viewMode === "comparison" && importedStatement ? (
        <ReconciliationComparisonView
          loading={entriesLoading}
          disabled={isBusy || (activeSession?.status === "FINALIZED")}
        />
      ) : (
        <ReconciliationEntriesTable
          loading={entriesLoading}
          disabled={isBusy || (activeSession?.status === "FINALIZED")}
        />
      )}

      {/* Totals Footer */}
      <ReconciliationTotalsFooter />

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={isBusy} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={entries.length === 0} className="rounded-full">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

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
