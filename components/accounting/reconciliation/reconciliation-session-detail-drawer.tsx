"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, CheckCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { reconciliationApi, ReconciliationSession } from "@/lib/api/reconciliation-api"

interface ReconciliationSessionDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string | null
}

export function ReconciliationSessionDetailDrawer({ isOpen, onClose, sessionId }: ReconciliationSessionDetailDrawerProps) {
  const [session, setSession] = useState<ReconciliationSession | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSession(sessionId)
    }
  }, [isOpen, sessionId])

  const loadSession = async (id: string) => {
    try {
      setLoading(true)
      const response = await reconciliationApi.getSession(id)
      if (response.success && response.data) {
        setSession(response.data)
      }
    } catch (error) {
      console.error("Failed to load session", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy")
    } catch {
      return dateStr
    }
  }

  const formatAmount = (val: number) => {
    return (val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Reconciliation Session
            {session && (
              <Badge className={session.status === "FINALIZED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {session.status}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : session ? (
          <div className="space-y-4 mt-4">
            {/* Session Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Statement Date</p>
                  <p className="font-medium">{formatDate(session.statementDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reference</p>
                  <p className="font-medium">{session.reference || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Opening Balance</p>
                  <p className="font-medium">{formatAmount(session.openingBalance)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Statement End Balance</p>
                  <p className="font-medium">{formatAmount(session.statementEndBalance)}</p>
                </div>
                {session.finishedAt && (
                  <div>
                    <p className="text-gray-500">Finalized At</p>
                    <p className="font-medium">{formatDate(session.finishedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            {session.totals && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Totals</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Received</p>
                    <p className="font-medium text-green-700">{formatAmount(session.totals.totalSelectedReceived)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Paid</p>
                    <p className="font-medium text-red-700">{formatAmount(session.totals.totalSelectedPaid)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reconciled Balance</p>
                    <p className="font-medium">{formatAmount(session.totals.reconciledBalance)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Difference</p>
                    <p className={`font-medium ${Math.abs(session.totals.difference) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                      {formatAmount(session.totals.difference)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reconciled Lines */}
            {session.lines && session.lines.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Reconciled Entries ({session.lines.filter(l => l.selected).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-center">Selected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="text-sm">{formatDate(line.entry.transactionDate)}</TableCell>
                          <TableCell className="text-sm font-mono">{line.entry.reference || "-"}</TableCell>
                          <TableCell className="text-sm">{line.entry.description || line.entry.counterparty || "-"}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {formatAmount(line.entry.received)}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {formatAmount(line.entry.paid)}
                          </TableCell>
                          <TableCell className="text-center">
                            {line.selected && <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            No session data available
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
