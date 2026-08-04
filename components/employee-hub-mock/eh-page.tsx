import { EmployeeHubLayout } from "@/components/layout/employee-hub-layout"
import { ModuleGuard } from "@/lib/permissions"
import type { ReactNode } from "react"

export function EhPage({
  children,
  subModuleId,
}: {
  children: ReactNode
  subModuleId: string
}) {
  return (
    <ModuleGuard moduleId="employee-hub" subModuleId={subModuleId}>
      <EmployeeHubLayout>{children}</EmployeeHubLayout>
    </ModuleGuard>
  )
}
