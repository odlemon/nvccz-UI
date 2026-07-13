"use client"

import { FpaLayout } from "@/components/layout/fpa-layout"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { useFpaBootstrap } from "@/lib/hooks/useFpaBootstrap"

function FpaBootstrap({ children }: { children: React.ReactNode }) {
  useFpaBootstrap()
  return <>{children}</>
}

export default function ForecastingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGuard moduleId="forecasting">
      <FpaLayout>
        <FpaBootstrap>{children}</FpaBootstrap>
      </FpaLayout>
    </ModuleGuard>
  )
}
