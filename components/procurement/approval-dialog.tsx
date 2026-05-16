"use client"

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => Promise<void>
  loading?: boolean
  confirmLabel?: string
  confirmVariant?: 'gradient-create' | 'gradient-danger'
  // Optional reason textarea (used by reject flows)
  reasonValue?: string
  onReasonChange?: (val: string) => void
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonRequired?: boolean
}

export function ApprovalDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
  confirmLabel = 'Confirm',
  confirmVariant = 'gradient-create',
  reasonValue,
  onReasonChange,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Provide a reason...',
  reasonRequired = false,
}: ApprovalDialogProps) {
  const showReason = typeof onReasonChange === 'function'
  const disableConfirm =
    loading || (showReason && reasonRequired && !(reasonValue ?? '').trim())

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {showReason && (
          <div className="space-y-2 py-1">
            <Label htmlFor="approval-dialog-reason">
              {reasonLabel}
              {reasonRequired && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <Textarea
              id="approval-dialog-reason"
              value={reasonValue ?? ''}
              onChange={(e) => onReasonChange!(e.target.value)}
              placeholder={reasonPlaceholder}
              disabled={loading}
              className="min-h-[100px]"
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="rounded-full h-10 px-6">Cancel</AlertDialogCancel>
          <Button
            variant={confirmVariant}
            className="rounded-full h-10 px-6 shadow-sm"
            onClick={onConfirm}
            disabled={disableConfirm}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
