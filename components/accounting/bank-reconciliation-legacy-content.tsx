"use client"

import { useEffect, useState, useCallback } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Plus, Landmark } from "lucide-react"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchCashbookBanks } from "@/lib/store/slices/accountingSlice"
import {
  fetchReconciliationSessions,
  clearActiveSession,
} from "@/lib/store/slices/reconciliationSlice"
import { ReconciliationSession } from "@/lib/api/reconciliation-api"
import { CashbookBank } from "@/lib/api/cashbook-api"
import { ReconciliationSessionList } from "@/components/accounting/reconciliation/reconciliation-session-list"
import { ReconciliationLiveWorkspace } from "@/components/accounting/reconciliation/reconciliation-live-workspace"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ViewMode = "sessions" | "workspace"

export function BankReconciliationLegacyContent() {
  const dispatch = useDispatch<AppDispatch>()
  const cashbookBanks = useSelector((state: RootState) => state.accounting.cashbookBanks)
  const cashbookBanksLoading = useSelector((state: RootState) => state.accounting.cashbookBanksLoading)

  const [viewMode, setViewMode] = useState<ViewMode>("sessions")
  const [workspaceSessionId, setWorkspaceSessionId] = useState<string | null>(null)
  const [selectedBankId, setSelectedBankId] = useState<string>("")

  const selectedBank: CashbookBank | null = cashbookBanks.find(b => b.id === selectedBankId) || null

  // Load banks on mount
  useEffect(() => {
    dispatch(fetchCashbookBanks({}))
  }, [dispatch])

  // Auto-select first bank
  useEffect(() => {
    if (cashbookBanks.length > 0 && !selectedBankId) {
      setSelectedBankId(cashbookBanks[0].id)
    }
  }, [cashbookBanks, selectedBankId])

  // Load sessions when bank changes
  useEffect(() => {
    if (selectedBankId) {
      dispatch(fetchReconciliationSessions(selectedBankId))
    }
  }, [dispatch, selectedBankId])

  const handleBankChange = (bankId: string) => {
    setSelectedBankId(bankId)
    setViewMode("sessions")
    setWorkspaceSessionId(null)
    dispatch(clearActiveSession())
  }

  const handleNewReconciliation = () => {
    dispatch(clearActiveSession())
    setWorkspaceSessionId(null)
    setViewMode("workspace")
  }

  const handleOpenSession = useCallback((session: ReconciliationSession) => {
    setWorkspaceSessionId(session.id)
    setViewMode("workspace")
  }, [])

  const handleViewSession = useCallback((session: ReconciliationSession) => {
    setWorkspaceSessionId(session.id)
    setViewMode("workspace")
  }, [])

  const handleBackToSessions = useCallback(() => {
    setViewMode("sessions")
    if (selectedBankId) {
      dispatch(fetchReconciliationSessions(selectedBankId))
    }
  }, [dispatch, selectedBankId])

  return (
        <div className="space-y-6 p-6" data-bank-reconciliation-module>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-normal">Bank Reconciliation</h1>
              <p className="text-muted-foreground">
                Reconcile cashbook entries against bank statements
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Bank Selector */}
              <Select value={selectedBankId} onValueChange={handleBankChange}>
                <SelectTrigger className="w-64 rounded-full">
                  <Landmark className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {cashbookBanks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name} ({bank.accountNumber})
                    </SelectItem>
                  ))}
                  {cashbookBanks.length === 0 && !cashbookBanksLoading && (
                    <div className="p-2 text-sm text-muted-foreground">No banks available</div>
                  )}
                </SelectContent>
              </Select>

              {viewMode === "sessions" && (
                <Button
                  onClick={handleNewReconciliation}
                  disabled={!selectedBankId}
                  className="rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Reconciliation
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          {viewMode === "sessions" && !cashbookBanksLoading && cashbookBanks.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <Landmark className="mx-auto mb-3 h-8 w-8 text-gray-400" />
              <h2 className="text-lg font-medium">No active bank accounts are configured</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">Ask an Accounting administrator to add the organisation&apos;s bank accounts in Accounting Settings → Bank Accounts and link each account to its currency and ledger control account before reconciling.</p>
              <a href="/accounting/settings" className="mt-4 inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-gray-50">Open Accounting Settings</a>
            </div>
          ) : viewMode === "sessions" ? (
            <ReconciliationSessionList
              onOpenSession={handleOpenSession}
              onViewSession={handleViewSession}
            />
          ) : (
            <ReconciliationLiveWorkspace
              selectedBank={selectedBank}
              sessionId={workspaceSessionId}
              onBack={handleBackToSessions}
            />
          )}
        </div>
  )
}
