'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ConfirmReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Explain why…',
  confirmLabel = 'Confirm',
  reasonRequired = true,
  onConfirm,
  container,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  reasonLabel?: string
  reasonPlaceholder?: string
  confirmLabel?: string
  reasonRequired?: boolean
  /** Return `false` (or throw) to keep the dialog open after an error. */
  onConfirm: (reason: string) => void | boolean | Promise<void | boolean>
  container?: HTMLElement | null
}) {
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)

  const close = () => {
    if (confirming) return
    setReason('')
    onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (confirming) return
    if (reasonRequired && !reason.trim()) return
    setConfirming(true)
    try {
      const result = await onConfirm(reason.trim())
      if (result === false) return
      setReason('')
      onOpenChange(false)
    } catch {
      // Keep open so the user can fix / retry; parent should surface the error.
    } finally {
      setConfirming(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          if (confirming) return
          setReason('')
        }
        onOpenChange(o)
      }}
    >
      <AlertDialogContent
        container={container}
        onEscapeKeyDown={(e) => {
          if (confirming) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (confirming) e.preventDefault()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block">{reasonLabel}</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            rows={3}
            disabled={confirming}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={confirming} onClick={close}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="default"
            className="rounded-full bg-destructive text-white hover:bg-destructive/90"
            disabled={confirming || (reasonRequired && !reason.trim())}
            onClick={() => void handleConfirm()}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirming ? 'Working…' : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
