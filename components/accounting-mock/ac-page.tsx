import { AccountingV2Layout } from "@/components/layout/accounting-v2-layout"
import { ModuleGuard } from "@/lib/permissions"
import type { ReactNode } from "react"

export function AcV2Page({
  children,
  subModuleId,
}: {
  children: ReactNode
  subModuleId: string
}) {
  return (
    <ModuleGuard moduleId="accounting-v2" subModuleId={subModuleId}>
      <AccountingV2Layout>{children}</AccountingV2Layout>
    </ModuleGuard>
  )
}
