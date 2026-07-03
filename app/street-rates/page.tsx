import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { StreetRatesLayout } from "@/components/layout/street-rates-layout"
import { StreetRatesDashboard } from "@/components/street-rates/street-rates-dashboard"

export default function StreetRatesPage() {
  return (
    <ModuleGuard moduleId="street-rates" subModuleId="street-rates-dashboard">
      <StreetRatesLayout>
        <StreetRatesDashboard />
      </StreetRatesLayout>
    </ModuleGuard>
  )
}
