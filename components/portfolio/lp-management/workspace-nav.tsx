"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/portfolio/lp-management", label: "Memberships" },
  { href: "/portfolio/lp-management/documents", label: "Document Publishing" },
  { href: "/portfolio/lp-management/mfa-policy", label: "MFA Policy" },
]

export function WorkspaceNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-gray-100 px-6 pt-5 bg-white">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-900">LP Management</h1>
        <p className="text-sm text-muted-foreground">Manage LP portal access, vault document publishing and MFA policy.</p>
      </div>
      <div className="flex items-center gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
