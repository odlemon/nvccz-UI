"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/portfolio/fund-performance-reporting", label: "Overview" },
  { href: "/portfolio/fund-performance-reporting/templates", label: "Templates" },
  { href: "/portfolio/fund-performance-reporting/schedules", label: "Schedules" },
  { href: "/portfolio/fund-performance-reporting/distribution-lists", label: "Distribution Lists" },
  { href: "/portfolio/fund-performance-reporting/runs", label: "Runs" },
  { href: "/portfolio/fund-performance-reporting/monitoring", label: "Delivery Monitoring" },
  { href: "/portfolio/fund-performance-reporting/audit", label: "Audit Trail" },
]

export function WorkspaceNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const withQuery = (href: string) => {
    const fundId = searchParams.get("fundId")
    return fundId ? `${href}?fundId=${fundId}` : href
  }

  return (
    <nav className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.href === "/portfolio/fund-performance-reporting"
          ? pathname === tab.href
          : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={withQuery(tab.href)}
            className={cn(
              "shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              active
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
