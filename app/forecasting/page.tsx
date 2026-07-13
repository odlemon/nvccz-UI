import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaHomeBoard } from "@/components/fpa/fpa-home-board"

export default function FpaHomePage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-home">
      <FpaHomeBoard />
    </ModuleGuard>
  )
}
