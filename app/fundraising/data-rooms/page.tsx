import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingDataRooms } from "@/components/fundraising/fundraising-data-rooms"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-data-rooms">
      <FundraisingDataRooms />
    </ModuleGuard>
  )
}
