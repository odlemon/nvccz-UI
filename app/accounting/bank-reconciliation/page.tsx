"use client"

import { useEffect, useState, useCallback } from "react"
import { useSelector, useDispatch } from "react-redux"
import { AccountingLayout } from "@/components/layout/accounting-layout"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { Button } from "@/components/ui/button"
import { Plus, Landmark } from "lucide-react"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchCashbookBanks } from "@/lib/store/slices/accountingSlice"
import {
  fetchReconciliationSessions,
  fetchReconciliationSession,
  clearActiveSession,
} from "@/lib/store/slices/reconciliationSlice"
import { ReconciliationSession } from "@/lib/api/reconciliation-api"
import { CashbookBank } from "@/lib/api/cashbook-api"
import { ReconciliationSessionList } from "@/components/accounting/reconciliation/reconciliation-session-list"
import { ReconciliationWorkspace } from "@/components/accounting/reconciliation/reconciliation-workspace"
import { ReconciliationSessionDetailDrawer } from "@/components/accounting/reconciliation/reconciliation-session-detail-drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ViewMode = "sessions" | "workspace"

export default function BankReconciliationPage() {
  const dispatch = useDispatch<AppDispatch>()
  const cashbookBanks = useSelector((state: RootState) => state.accounting.cashbookBanks)
  const cashbookBanksLoading = useSelector((state: RootState) => state.accounting.cashbookBanksLoading)

  const [viewMode, setViewMode] = useState<ViewMode>("sessions")
  const [selectedBankId, setSelectedBankId] = useState<string>("")
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null)

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
    dispatch(clearActiveSession())
  }

  const handleNewReconciliation = () => {
    dispatch(clearActiveSession())
    setViewMode("workspace")
  }

  const handleOpenSession = useCallback((session: ReconciliationSession) => {
    dispatch(fetchReconciliationSession(session.id))
    setViewMode("workspace")
  }, [dispatch])

  const handleViewSession = useCallback((session: ReconciliationSession) => {
    setDetailSessionId(session.id)
    setDetailDrawerOpen(true)
  }, [])

  const handleBackToSessions = useCallback(() => {
    setViewMode("sessions")
    if (selectedBankId) {
      dispatch(fetchReconciliationSessions(selectedBankId))
    }
  }, [dispatch, selectedBankId])

  return (
    <ModuleGuard moduleId="accounting" subModuleId="bank-reconciliation">
      <AccountingLayout>
        <div className="space-y-6 p-6">
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
          {viewMode === "sessions" ? (
            <ReconciliationSessionList
              onOpenSession={handleOpenSession}
              onViewSession={handleViewSession}
            />
          ) : (
            <ReconciliationWorkspace
              selectedBank={selectedBank}
              onBack={handleBackToSessions}
            />
          )}

          {/* Detail Drawer for viewing finalized sessions */}
          <ReconciliationSessionDetailDrawer
            isOpen={detailDrawerOpen}
            onClose={() => {
              setDetailDrawerOpen(false)
              setDetailSessionId(null)
            }}
            sessionId={detailSessionId}
          />
        </div>
      </AccountingLayout>
    </ModuleGuard>
  )
}
