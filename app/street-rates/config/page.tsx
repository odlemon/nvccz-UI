import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { StreetRatesLayout } from "@/components/layout/street-rates-layout"
import { StreetRatesConfig } from "@/components/street-rates/street-rates-config"

export default function StreetRatesConfigPage() {
  return (
    <ModuleGuard moduleId="street-rates" subModuleId="street-rates-config">
      <StreetRatesLayout>
        <StreetRatesConfig />
      </StreetRatesLayout>
    </ModuleGuard>
  )
}
