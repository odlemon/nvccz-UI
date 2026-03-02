import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { TermSheet } from "@/components/applications/term-sheet"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function TermSheetPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="applications">
      <PortfolioLayout>
        <TermSheet />
      </PortfolioLayout>
    </ModuleGuard>
  )
}
