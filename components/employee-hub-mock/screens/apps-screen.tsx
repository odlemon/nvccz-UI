"use client"

import { useRouter } from "next/navigation"
import { Clock, ExternalLink, LayoutGrid, Star } from "lucide-react"
import { EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehApps, ehRecentApps } from "@/lib/employee-hub-mock/fixtures"
import { MODULE_CONFIG } from "@/lib/config/modules"

export function AppsScreen() {
  const router = useRouter()
  const permitted = MODULE_CONFIG.filter((m) => m.id !== "homepage" && m.id !== "employee-hub").slice(0, 8)

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-4">
        <h1 className="text-[24px] font-bold text-[#0F172A]">Apps</h1>
        <p className="text-sm text-[#64748B]">Permission-aware module launcher and recent workflows.</p>
      </div>

      <EhSectionTitle title="Recent" />
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {ehRecentApps.map((a) => (
          <EhCard key={a.name} className="p-4 cursor-pointer flex items-center gap-3" onClick={() => router.push(a.path)}>
            <Clock className="h-4 w-4 text-[#0EA5B7]" />
            <div>
              <p className="text-[14px] font-bold text-[#0F172A]">{a.name}</p>
              <p className="text-[11px] text-[#94A3B8]">Last opened {a.last}</p>
            </div>
          </EhCard>
        ))}
      </div>

      <EhSectionTitle title="Connected modules" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {ehApps.map((app) => (
          <EhCard key={app.id} className="p-4 cursor-pointer group" onClick={() => router.push(app.path)}>
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] inline-flex items-center justify-center">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <ExternalLink className="h-4 w-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-3 text-[15px] font-bold text-[#0F172A]">{app.name}</p>
            <p className="text-[12px] text-[#64748B] mt-0.5">{app.desc}</p>
            <EhPill tone="success" className="mt-2">Access granted</EhPill>
          </EhCard>
        ))}
      </div>

      <EhSectionTitle title="All modules" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {permitted.map((m) => (
          <button key={m.id} type="button" onClick={() => router.push(m.path)} className="text-left p-3 rounded-2xl border border-[#E8E6E1] bg-white hover:border-[#0EA5B7]/40 transition-colors">
            <p className="text-[13px] font-bold text-[#0F172A]">{m.name}</p>
            <p className="text-[10px] text-[#94A3B8] line-clamp-2 mt-0.5">{m.description}</p>
          </button>
        ))}
      </div>

      <EhCard className="mt-6 p-4 flex items-center gap-3">
        <Star className="h-5 w-5 text-[#0EA5B7]" />
        <p className="text-[13px] text-[#64748B]">Pinned apps sync with the App Switcher. Permissions reflect your role.</p>
      </EhCard>
    </div>
  )
}
