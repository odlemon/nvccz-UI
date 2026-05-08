"use client"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { approveBankReconciliationMatch } from "@/lib/store/slices/accountingSlice"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, FileText, List } from "lucide-react"
import { format } from "date-fns"
import { ProcurementDataTable } from "@/components/procurement/procurement-data-table"

function MatchesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(2)].map((_, idx) => (
        <Card key={idx} className="mb-4 animate-pulse">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 rounded-full" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-32 w-full bg-gray-100 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BankTransactionMatchesModal({
  open,
  onClose,
  transaction,
  matches,
  loading,
  reconciliationId
}: {
  open: boolean,
  onClose: () => void,
  transaction: any,
  matches: any[],
  loading: boolean,
  reconciliationId: string
}) {
  const dispatch = useDispatch()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [approveLoading, setApproveLoading] = useState(false)
  const [approveContext, setApproveContext] = useState<{ match: any } | null>(null)

  const handleApproveClick = (match: any) => {
    setApproveContext({ match })
    setIsApproveDialogOpen(true)
  }

  const handleConfirmApprove = async () => {
    if (!approveContext?.match || !transaction) return
    setApproveLoading(true)
    try {
      await dispatch(approveBankReconciliationMatch({
        bankTransactionId: transaction.id,
        journalEntryId: approveContext.match.id,
        reconciliationId: reconciliationId || ""
      }) as any).unwrap()
      toast.success("Match approved successfully")
      setIsApproveDialogOpen(false)
      setApproveContext(null)
    } catch (err: any) {
      const apiError = err?.message || (err?.response?.data?.message ?? "Failed to approve match")
      toast.error(apiError)
    } finally {
      setApproveLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-[1200px] !w-[1200px] !h-[90vh] !max-h-[90vh] overflow-y-auto"
        style={{ padding: 0 }}
      >
        <div className="p-8">
          <DialogHeader>
            <DialogTitle>
              Bank Transaction Matches
            </DialogTitle>
            <DialogClose />
          </DialogHeader>
          {transaction && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-mono">{transaction.description}</span>
                  <Badge className={transaction.isMatched ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {transaction.isMatched ? "Matched" : "Unmatched"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold ml-2">{transaction.amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2">{format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reference:</span>
                    <span className="ml-2">{transaction.reference}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <span className="ml-2">{transaction.confidenceScore ? `${transaction.confidenceScore}%` : "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {loading ? (
            <MatchesSkeleton />
          ) : (
            <div>
              {matches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No matches found.</div>
              ) : (
                matches.map((match: any, idx: number) => (
                  <Card key={match.id || idx} className="mb-4">
                    <CardHeader
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpanded(expanded === match.id ? null : match.id)}
                    >
                      <div className="flex items-center gap-2">
                        <List className="w-5 h-5" />
                        <span className="font-semibold">Match #{idx + 1}</span>
                        <Badge className={match.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {match.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        {expanded === match.id ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </CardHeader>
                    {expanded === match.id && (
                      <CardContent>
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <span className="text-gray-600">Journal Entry:</span>
                            <span className="ml-2 font-mono">{match.referenceNumber}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="gradient-create"
                            className="rounded-full h-9 px-4"
                            onClick={() => handleApproveClick(match)}
                            disabled={approveLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {approveLoading && approveContext?.match?.id === match.id ? "Approving..." : "Approve Match"}
                          </Button>
                        </div>
                        <ProcurementDataTable
                          data={match.journalEntryLines || []}
                          columns={[
                            {
                              key: 'chartOfAccount',
                              label: 'Account',
                              render: (value, row) => value ? `${value.accountNo} - ${value.accountName}` : ''
                            },
                            {
                              key: 'description',
                              label: 'Description',
                              render: (value) => <span>{value}</span>
                            },
                            {
                              key: 'debitAmount',
                              label: 'Debit',
                              render: (value) => <span className="text-red-600 font-bold">{value}</span>
                            },
                            {
                              key: 'creditAmount',
                              label: 'Credit',
                              render: (value) => <span className="text-green-600 font-bold">{value}</span>
                            }
                          ]}
                          title="Journal Entry Lines"
                          loading={false}
                          showSearch={false}
                          showFilters={false}
                          emptyMessage="No journal entry lines."
                        />
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
        {/* Approve Match Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isApproveDialogOpen}
          onClose={() => {
            if (!approveLoading) {
              setIsApproveDialogOpen(false)
              setApproveContext(null)
            }
          }}
          onConfirm={handleConfirmApprove}
          title="Approve Match"
          description={
            <div className="space-y-3">
              <p>Are you sure you want to approve this match?</p>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">{approveContext?.match?.referenceNumber}</p>
                    <p className="text-sm text-green-700">{transaction?.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-green-600 font-medium">Amount:</span>
                    <span className="ml-2 font-semibold">{transaction?.amount}</span>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Date:</span>
                    <span className="ml-2">{transaction && new Date(transaction.transactionDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Once approved, this match will be finalized and linked to the bank transaction.
              </p>
            </div>
          }
          confirmText="Approve Match"
          cancelText="Cancel"
          variant="default"
          isLoading={approveLoading}
          icon={<CheckCircle className="w-6 h-6 text-green-500" />}
        />
      </DialogContent>
    </Dialog>
  )
}
