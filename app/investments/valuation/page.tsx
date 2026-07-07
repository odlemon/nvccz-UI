import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { ComingSoonPanel } from "@/components/investments/terminal/coming-soon-panel"

export default function ValuationPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-valuation">
      <InvestmentsLayout>
        <ComingSoonPanel
          module="Valuation"
          description="NAV, P&L, price validation, and FX conversion runs"
          plannedItems={[
            "NAV Runs",
            "P&L Runs",
            "Price Validation",
            "FX Conversion",
          ]}
        />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
