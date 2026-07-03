"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchLpDashboard } from "@/lib/store/slices/lpPortalSlice"
import { Button } from "@/components/ui/button"

// TODO: the real set of "manager" values for LpDashboard.lpRole is unconfirmed
// (the API doc only says it's `string | null`) — correct this list once the
// backend's actual lpRole enum is confirmed for account-manager-equivalent LPs.
const MANAGER_LP_ROLES = ["MANAGER", "LP_MANAGER", "ADMIN"]

interface ColleaguesAccessGuardProps {
  children: React.ReactNode
}

export function ColleaguesAccessGuard({ children }: ColleaguesAccessGuardProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { dashboard, dashboardLoading } = useAppSelector((s) => s.lpPortal)

  useEffect(() => {
    if (!dashboard && !dashboardLoading) {
      dispatch(fetchLpDashboard())
    }
  }, [dashboard, dashboardLoading, dispatch])

  if (dashboardLoading || (!dashboard && !dashboardLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isManager = !!dashboard?.lpRole && MANAGER_LP_ROLES.includes(dashboard.lpRole.toUpperCase())

  if (!isManager) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Section Locked</h3>
            <p className="text-sm text-muted-foreground">
              Colleague management is only available to LP Account Managers.
            </p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => router.push("/lp-portal")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
