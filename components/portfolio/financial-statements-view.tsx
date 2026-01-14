"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFinancialReports, submitFinancialReports } from "@/lib/store/slices/applicationPortalSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { FileText, Download, Upload, Send, Eye, Edit, Trash2, File as FileIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { FinancialReportUploadModal } from "./financial-report-upload-modal"
import { FinancialReportType } from "@/lib/api/application-portal-api"
import { FinancialStatementsSkeleton } from "./financial-statements-skeleton"
import { GradientBorderButton } from "@/components/ui/gradient-border-button"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
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

export function FinancialStatementsView() {
  const dispatch = useAppDispatch()
  const { financialReports, financialReportsLoading, loading } = useAppSelector((state) => state.applicationPortal)
  const { canPerformAction } = useRolePermissions()

  // Permission checks
  const canUploadReport = canPerformAction('application-portal', 'create') || true
  const canSubmitReports = canPerformAction('application-portal', 'update') || true
  const canDeleteReport = canPerformAction('application-portal', 'delete')

  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [isUploadModalOpen, setUploadModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchFinancialReports())
  }, [dispatch])

  const handleSelectReport = (reportId: string) => {
    setSelectedReports(prev =>
      prev.includes(reportId) ? prev.filter(id => id !== reportId) : [...prev, reportId]
    )
  }

  const handleSubmitReports = async () => {
    if (selectedReports.length === 0) {
      toast.info("Please select at least one report to submit.")
      return
    }
    try {
      await dispatch(submitFinancialReports({ reportIds: selectedReports })).unwrap()
      toast.success("Selected reports submitted for review.")
      setSelectedReports([])
      setIsConfirmOpen(false) // Close dialog on success
    } catch (error: any) {
      toast.error(error || "Failed to submit reports.")
    }
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      BALANCE_SHEET: 'Balance Sheet',
      INCOME_STATEMENT: 'Income Statement',
      CASHFLOW_STATEMENT: 'Cashflow Statement',
    }
    return map[type] || type
  }

  if (financialReportsLoading) {
    return <FinancialStatementsSkeleton />
  }

  return (
    <div className="space-y-6">
      <FinancialReportUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Statements</CardTitle>
              <p className="text-muted-foreground text-sm">Upload and manage your company's financial reports.</p>
            </div>
            <div className="flex gap-2">
              {canUploadReport && (
                <Button onClick={() => setUploadModalOpen(true)} className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white"><Upload className="w-4 h-4 mr-2" /> Upload Report</Button>
              )}
              {canSubmitReports && (
                <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button disabled={selectedReports.length === 0 || loading} className="rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white">
                      <Send className="w-4 h-4 mr-2" /> Submit Selected ({selectedReports.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to submit {selectedReports.length} financial report(s) for review? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async (e) => {
                          e.preventDefault() // Prevent dialog from closing immediately
                          await handleSubmitReports()
                        }}
                        disabled={loading}
                      >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirm & Submit
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Download Template:</p>
              <a href="/NVCCZ_FIINANCIALS_REPORTS.xlsx" download="NVCCZ_FIINANCIALS_REPORTS.xlsx">
                <GradientBorderButton>
                  <Download className="w-4 h-4 mr-1" /> Financial Reports Template
                </GradientBorderButton>
              </a>
            </div>

            {!financialReportsLoading && financialReports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No financial reports</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by uploading a financial report.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {financialReports.map((report, idx) => (
                <motion.div
                  key={report.id}
                  className="group relative border rounded-2xl p-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-xs text-blue-600 font-medium">{getTypeLabel(report.reportType)}</p>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button asChild size="sm" className="bg-white/90 hover:bg-white text-gray-900 rounded-full">
                        <a href={report.reportUrl} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-1" /> Preview</a>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{report.title}</p>
                        <p className="text-xs text-gray-500">{format(new Date(report.periodStart), 'd MMM yyyy')} - {format(new Date(report.periodEnd), 'd MMM yyyy')}</p>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className={
                          report.status === 'DRAFT' ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                            report.status === 'SUBMITTED' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                              'bg-gradient-to-r from-green-400 to-green-600 text-white'
                        }>{report.status}</Badge>
                      </div>
                    </div>

                    <div className="flex justify-center gap-2">
                      {report.isDraft && (
                        <div className="flex items-center space-x-2">
                          <Checkbox id={`select-${report.id}`} checked={selectedReports.includes(report.id)} onCheckedChange={() => handleSelectReport(report.id)} />
                          <label htmlFor={`select-${report.id}`} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Select for Submission</label>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
