"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAppDispatch } from "@/lib/store"
import {
  approveMemoVersion, rejectMemoVersion, fetchMemoHeader,
  fetchMemoVersionDetail, fetchMemoApprovalHistory,
} from "@/lib/store/slices/applicationSlice"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface MemoApproveRejectDialogProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  versionId: string
  versionLabel: string
}

export function MemoApproveRejectDialog({ isOpen, onClose, applicationId, versionId, versionLabel }: MemoApproveRejectDialogProps) {
  const dispatch = useAppDispatch()
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<"APPROVE" | "REJECT" | null>(null)

  const handleConfirm = async () => {
    if (!pendingAction) return
    const action = pendingAction
    setLoading(true)
    try {
      if (action === "APPROVE") {
        await dispatch(approveMemoVersion({ applicationId, versionId, comment })).unwrap()
        toast.success("Investment memo approved", { description: "Call to Vote is now unlocked." })
      } else {
        await dispatch(rejectMemoVersion({ applicationId, versionId, comment })).unwrap()
        toast.success("Investment memo rejected", { description: "Returned to draft for revision." })
      }
      // The approve/reject response only carries the memo header, not the
      // version's new status — refetch both plus approval history so the UI
      // updates immediately instead of only after reopening the drawer.
      await Promise.all([
        dispatch(fetchMemoHeader(applicationId)),
        dispatch(fetchMemoVersionDetail({ applicationId, versionId })),
        dispatch(fetchMemoApprovalHistory(applicationId)),
      ])
      setComment("")
      setPendingAction(null)
      onClose()
    } catch (error: any) {
      toast.error(`Failed to ${action.toLowerCase()} memo`, { description: error?.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CIO Review — Investment Memo</DialogTitle>
            <DialogDescription>Reviewing: {versionLabel}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cio-comment">Comment</Label>
              <Textarea
                id="cio-comment"
                placeholder="Add context for your decision (required for rejection)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => setPendingAction("REJECT")}
              disabled={loading || !comment.trim()}
            >
              Reject
            </Button>
            <Button
              onClick={() => setPendingAction("APPROVE")}
              disabled={loading}
              variant="gradient-create"
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "APPROVE" ? "Approve this Investment Memo?" : "Reject this Investment Memo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "APPROVE"
                ? "This will mark the memo as approved and unlock Call to Vote on the board review. This cannot be undone."
                : "This will return the memo to Draft status with your comment attached, so the analyst can revise and resubmit."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirm() }}
              disabled={loading}
              className={pendingAction === "REJECT" ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {pendingAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
