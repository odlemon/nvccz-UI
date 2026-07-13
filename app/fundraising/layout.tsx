"use client"

import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingLayout } from "@/components/layout/fundraising-layout"

export default function FundraisingLayoutRoute({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGuard moduleId="fundraising">
      <FundraisingLayout>{children}</FundraisingLayout>
    </ModuleGuard>
  )
}
