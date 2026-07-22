"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { Mail, Users2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchLpColleagues, revokeLpColleague } from "@/lib/store/slices/lpPortalSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { InviteColleagueDialog } from "./invite-colleague-dialog"

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "default"
    case "PENDING":
      return "secondary"
    case "REVOKED":
      return "destructive"
    default:
      return "outline"
  }
}

export function LpColleagues() {
  const dispatch = useAppDispatch()
  const { colleagues, colleaguesLoading, colleaguesError } = useAppSelector((s) => s.lpPortal)

  useEffect(() => {
    dispatch(fetchLpColleagues())
  }, [dispatch])

  const handleRevoke = async (membershipId: string) => {
    try {
      await dispatch(revokeLpColleague(membershipId)).unwrap()
      toast.success("Colleague access revoked.")
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Failed to revoke colleague access")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Colleagues</h1>
          <p className="text-sm text-muted-foreground">Manage who on your team can access this LP account.</p>
        </div>
        <InviteColleagueDialog />
      </div>

      {colleaguesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : colleaguesError ? (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{colleaguesError}</CardContent>
        </Card>
      ) : colleagues.length === 0 ? (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="py-12 text-center space-y-2">
            <Users2 className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No colleagues have been invited yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {colleagues.map((c) => (
            <Card key={c.membershipId} className="border-gray-200 shadow-none">
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.name || c.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline">{c.lpRole}</Badge>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {c.status}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">Revoke</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke colleague access?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {c.email} will lose access to this LP account. This can&apos;t be undone from here.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRevoke(c.membershipId)}>
                          Revoke Access
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
