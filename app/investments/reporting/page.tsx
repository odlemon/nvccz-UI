import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { ComingSoonPanel } from "@/components/investments/terminal/coming-soon-panel"

export default function ReportingPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-reporting">
      <InvestmentsLayout>
        <ComingSoonPanel
          module="Reporting"
          description="Portfolio, P&L, and trade reports"
          plannedItems={[
            "Portfolio Reports",
            "P&L Reports",
            "Trade Reports",
          ]}
        />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
