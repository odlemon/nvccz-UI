"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDashboard } from "@/lib/store/slices/applicationPortalSlice"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"

interface InvestmentRecipientGuardProps {
  children: React.ReactNode
}

export function InvestmentRecipientGuard({ children }: InvestmentRecipientGuardProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { dashboard, dashboardLoading } = useAppSelector((state) => state.applicationPortal)

  useEffect(() => {
    if (!dashboard && !dashboardLoading) {
      dispatch(fetchDashboard())
    }
  }, [dashboard, dashboardLoading, dispatch])

  if (dashboardLoading || (!dashboard && !dashboardLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasReceivedInvestment =
    Boolean((dashboard as any)?.hasReceivedInvestment) ||
    Boolean((dashboard as any)?.summary?.hasReceivedInvestment)

  if (!hasReceivedInvestment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Section Locked</h3>
            <p className="text-sm text-muted-foreground">
              This section becomes available once your company has received investment funding.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/application-portal")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
