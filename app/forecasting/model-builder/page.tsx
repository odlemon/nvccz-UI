import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { BuilderModelsList } from "@/components/fpa/builder/builder-models-list"

export default function ModelBuilderListPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-model-builder">
      <BuilderModelsList />
    </ModuleGuard>
  )
}
