import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingDocuments } from "@/components/fundraising/fundraising-documents"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-documents">
      <FundraisingDocuments />
    </ModuleGuard>
  )
}
