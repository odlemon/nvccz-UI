"use client"

import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { CapitalCallsList } from "@/components/portfolio/funds/capital-calls/capital-calls-list"
import { LpFeesDistributions } from "@/components/portfolio/funds/lp-fees/lp-fees-distributions"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Receipt, TrendingDown, Landmark } from "lucide-react"

export default function CapitalCallsPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="capital-calls">
      <PortfolioLayout>
        <Tabs defaultValue="capital-calls" className="space-y-6">
          <TabsList className="rounded-full bg-muted p-1 h-auto gap-1 mt-4">
            <TabsTrigger
              value="capital-calls"
              className="rounded-full gap-1.5 px-5 py-2 data-[state=active]:shadow-none data-[state=active]:bg-white data-[state=active]:text-foreground"
            >
              <Landmark className="w-4 h-4" />
              Capital Calls
            </TabsTrigger>
            <TabsTrigger
              value="lp-fees"
              className="rounded-full gap-1.5 px-5 py-2 data-[state=active]:shadow-none data-[state=active]:bg-white data-[state=active]:text-foreground"
            >
              <Receipt className="w-4 h-4" />
              LP Fees &amp; Distributions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capital-calls" className="px-1">
            <CapitalCallsList />
          </TabsContent>

          <TabsContent value="lp-fees" className="px-4 pt-4">
            <LpFeesDistributions />
          </TabsContent>
        </Tabs>
      </PortfolioLayout>
    </ModuleGuard>
  )
}
