"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAppDispatch } from "@/lib/store"
import { reviewFinancialReport } from "@/lib/store/slices/portfolioCompaniesSlice"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { PortfolioFinancialReport } from "@/lib/api/portfolio-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

interface FinancialReportReviewModalProps {
  isOpen: boolean
  onClose: () => void
  report: PortfolioFinancialReport | null
}

export function FinancialReportReviewModal({ isOpen, onClose, report }: FinancialReportReviewModalProps) {
  const { canPerformAction } = useRolePermissions()
  const canReviewReports = canPerformAction('portfolio-management', 'update')
  
  const dispatch = useAppDispatch()
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (action: 'ACCEPT' | 'REJECT') => {
    if (!report) return
    setLoading(true)
    try {
      await dispatch(reviewFinancialReport({
        companyId: report.portfolioCompanyId,
        reportId: report.id,
        data: { action, comment }
      })).unwrap()
      toast.success(`Report ${action.toLowerCase()}ed successfully.`)
      onClose()
    } catch (error: any) {
      toast.error(error || "Failed to submit review.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Financial Report</DialogTitle>
          <DialogDescription>Reviewing: {report?.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="comment">Review Comment</Label>
            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {canReviewReports ? (
            <>
              <Button variant="destructive" onClick={() => handleSubmit('REJECT')} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Reject
              </Button>
              <Button onClick={() => handleSubmit('ACCEPT')} disabled={loading} variant="gradient-create">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Accept
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">You don't have permission to review reports</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
