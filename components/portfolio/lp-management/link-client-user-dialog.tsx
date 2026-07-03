"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { linkClientToUser } from "@/lib/store/slices/lpPortalAdminSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { ClientRecord } from "@/lib/api/capital-calls-api"
import { toast } from "sonner"
import { Loader2, Link2 } from "lucide-react"

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message
  }
  return fallback
}

interface LinkClientUserFormProps {
  client: ClientRecord
  onLinked: (updated: ClientRecord) => void
  onCancel?: () => void
}

/**
 * Bare form for linking a Client record to a portal User account. Rendered
 * standalone (below) inside a Dialog, and also embedded inline by
 * invite-membership-dialog.tsx when the selected client isn't linked yet.
 *
 * There's no user-search endpoint in this API surface yet, so this is a
 * plain text field for the target user's account ID rather than a picker.
 */
export function LinkClientUserForm({ client, onLinked, onCancel }: LinkClientUserFormProps) {
  const dispatch = useAppDispatch()
  const [userId, setUserId] = useState("")
  const loading = useAppSelector((s) => s.lpPortalAdmin.linkUserLoadingByClientId[client.id] || false)
  const error = useAppSelector((s) => s.lpPortalAdmin.linkUserErrorByClientId[client.id])

  const handleSubmit = async () => {
    const trimmed = userId.trim()
    if (!trimmed) {
      toast.error("Portal User ID is required")
      return
    }
    try {
      const result = await dispatch(linkClientToUser({ clientId: client.id, userId: trimmed })).unwrap()
      toast.success(`${client.legalName} linked to portal user`)
      onLinked(result.data)
    } catch (err) {
      toast.error("Failed to link client to user", { description: errorMessage(err, "Please try again.") })
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
        <strong>{client.legalName}</strong> is not yet linked to a portal user account. Linking is required
        before granting LP portal access.
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Portal User ID</Label>
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="e.g. usr_8f21c4d0"
          className="h-9 font-mono text-sm"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">Paste the target user's account ID.</p>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button size="sm" className="gradient-primary text-white" onClick={handleSubmit} disabled={loading || !userId.trim()}>
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Linking…
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5 mr-1.5" /> Link User
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

interface LinkClientUserDialogProps {
  client: ClientRecord
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinked: (updated: ClientRecord) => void
}

/** Standalone dialog wrapper around LinkClientUserForm — e.g. triggered from
 *  a "Link to portal user" action on an unlinked client row in ClientPicker. */
export function LinkClientUserDialog({ client, open, onOpenChange, onLinked }: LinkClientUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Client to Portal User</DialogTitle>
          <DialogDescription>Connect this client record to an existing portal user account.</DialogDescription>
        </DialogHeader>
        <LinkClientUserForm
          client={client}
          onLinked={(updated) => {
            onLinked(updated)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
