"use client"

import { useParams } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ProjectWorkspaceMockScreen } from "@/components/performance-mock/screens/project-workspace-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function ProjectWorkspacePage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="tasks-management">
      <PerformanceLayout>
        <ProjectWorkspaceMockScreen projectId={projectId} />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
