'use client'

import { useState } from 'react'
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
  onConfirm: (reason: string) => void
  container?: HTMLElement | null
}) {
  const [reason, setReason] = useState('')

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setReason('')
        onOpenChange(o)
      }}
    >
      <AlertDialogContent container={container}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block">{reasonLabel}</label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={reasonPlaceholder} rows={3} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="default"
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim())
              setReason('')
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
