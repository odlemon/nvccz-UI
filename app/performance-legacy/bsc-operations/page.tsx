"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ModuleGuard } from "@/lib/permissions"

export default function BscOperationsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/performance/tasks?tab=bsc-entry")
  }, [router])

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="bsc-entry">
      <PerformanceLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-sm text-[#9CA3AF]">Redirecting to BSC Entry…</div>
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
