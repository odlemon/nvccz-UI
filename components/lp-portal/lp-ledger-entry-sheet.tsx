"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { clearSelectedLedgerEntry } from "@/lib/store/slices/lpPortalSlice"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface LpLedgerEntrySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}

export function LpLedgerEntrySheet({ open, onOpenChange }: LpLedgerEntrySheetProps) {
  const dispatch = useAppDispatch()
  const { selectedLedgerEntry, ledgerEntryLoading, ledgerEntryError } = useAppSelector((s) => s.lpPortal)

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) dispatch(clearSelectedLedgerEntry())
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ledger Entry</SheetTitle>
          <SheetDescription>Capital account transaction detail</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {ledgerEntryLoading && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          )}

          {!ledgerEntryLoading && ledgerEntryError && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">{ledgerEntryError}</p>
            </div>
          )}

          {!ledgerEntryLoading && !ledgerEntryError && selectedLedgerEntry && (
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
                <Badge variant="outline">{selectedLedgerEntry.type}</Badge>
                <span className="text-lg font-semibold tabular-nums text-gray-900">
                  {selectedLedgerEntry.amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                  {selectedLedgerEntry.currencyCode}
                </span>
              </div>

              <Row label="Fund" value={selectedLedgerEntry.fundId} />
              <Row label="Value Date" value={selectedLedgerEntry.valueDate} />
              <Row label="Description" value={selectedLedgerEntry.description || "—"} />
              <Row label="Created" value={selectedLedgerEntry.createdAt} />
              {selectedLedgerEntry.bankConfirmationRef && (
                <Row label="Bank Confirmation Ref" value={selectedLedgerEntry.bankConfirmationRef} />
              )}
              {selectedLedgerEntry.bankConfirmationDate && (
                <Row label="Bank Confirmation Date" value={selectedLedgerEntry.bankConfirmationDate} />
              )}

              {selectedLedgerEntry.callNoticeDocumentId && (
                <div className="pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/lp-portal/vault?documentId=${selectedLedgerEntry.callNoticeDocumentId}`}>
                      <FileText className="w-4 h-4" />
                      View call notice
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
