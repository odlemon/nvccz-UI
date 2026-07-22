"use client"

import Link from "next/link"
import { FileText, Layers, Columns3, Network, SlidersHorizontal, LineChart, ChevronRight } from "lucide-react"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmCard, PmPageHeader } from "@/components/performance-mock/primitives"

const configItems = [
  { href: "/performance/configuration/strategy", title: "Company Strategy", description: "Define strategic perspectives, objectives and the company strategy map.", icon: FileText, color: "#7C3AED", bg: "#F5F3FF" },
  { href: "/performance/configuration/themes", title: "Strategic Themes", description: "Group objectives under strategic themes and tag contributing goals.", icon: Layers, color: "#2563EB", bg: "#EFF6FF" },
  { href: "/performance/kpis", title: "KPI Management", description: "Manage KPI definitions, thresholds, owners and data sources.", icon: LineChart, color: "#10B981", bg: "#ECFDF5" },
  { href: "/performance/configuration/pillars", title: "BSC Pillars", description: "Configure balanced-scorecard pillar weights and goal weightings.", icon: Columns3, color: "#F97316", bg: "#FFF7ED" },
  { href: "/performance/configuration/integrations", title: "Integration Mapping", description: "Map KPI data sources to upstream systems and integrations.", icon: Network, color: "#EC4899", bg: "#FDF2F8" },
  { href: "/performance/settings", title: "Settings", description: "General Performance Management preferences and access controls.", icon: SlidersHorizontal, color: "#64748B", bg: "#F1F5F9" },
]

export function ConfigurationHubMockScreen() {
  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Configuration"]} searchPlaceholder="Search configuration…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Configuration"
          subtitle="Set up the building blocks of Performance Management — strategy, themes, KPIs, pillars and integrations."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {configItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <PmCard className="p-4 h-full cursor-pointer hover:border-[#DDD6FE] transition-colors">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.bg, color: item.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#111827]">{item.title}</h3>
                    <ChevronRight className="h-4 w-4 text-[#D1D5DB] shrink-0" />
                  </div>
                  <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{item.description}</p>
                </PmCard>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
