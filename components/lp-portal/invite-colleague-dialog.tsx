"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"
import { useAppDispatch } from "@/lib/store"
import { inviteLpColleague } from "@/lib/store/slices/lpPortalSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function InviteColleagueDialog() {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setEmail("")
    setError(null)
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const handleInvite = async () => {
    if (!email.trim()) {
      setError("Enter an email address.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await dispatch(inviteLpColleague(email.trim())).unwrap()
      toast.success("Invitation sent.")
      handleOpenChange(false)
    } catch (err: any) {
      // Surfaced inline (not a toast) so it stays visible next to the helper text
      // that explains the same constraint — the confirmed real 404 message is
      // exactly "User not found — invite must match an existing account".
      setError(typeof err === "string" ? err : "User not found — invite must match an existing account")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm">
          <UserPlus className="w-4 h-4" /> Invite Colleague
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Colleague</DialogTitle>
          <DialogDescription>Grant another team member read access to this LP account.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="colleague-email">Email address</Label>
          <Input
            id="colleague-email"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">
            The colleague must already have an Arcus account with this email address.
          </p>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
