"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { revokeMembership } from "@/lib/store/slices/lpPortalAdminSlice"
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
import { Button } from "@/components/ui/button"
import { Loader2, ShieldOff } from "lucide-react"
import { toast } from "sonner"
import type { LpPortalMembership } from "@/lib/api/lp-portal-admin-api"

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message
  }
  return fallback
}

interface RevokeMembershipDialogProps {
  membership: LpPortalMembership
}

export function RevokeMembershipDialog({ membership }: RevokeMembershipDialogProps) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const isLoading = useAppSelector((s) => s.lpPortalAdmin.revokeLoadingById[membership.membershipId] || false)

  const handleConfirm = async () => {
    try {
      await dispatch(revokeMembership(membership.membershipId)).unwrap()
      toast.success("LP membership revoked")
      setOpen(false)
    } catch (err) {
      toast.error("Failed to revoke membership", { description: errorMessage(err, "Please try again.") })
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!isLoading) setOpen(v)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 rounded-full text-xs text-red-600 border-red-200 hover:bg-red-50 bg-white">
          Revoke
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <ShieldOff className="w-4 h-4 text-red-500" />
            </div>
            Revoke LP Membership
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to revoke portal access for{" "}
            <strong>{membership.clientLegalName || membership.userEmail || "this LP"}</strong>? They will
            immediately lose access to the LP portal.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              if (!isLoading) handleConfirm()
            }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Revoking…
              </>
            ) : (
              "Revoke Access"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
