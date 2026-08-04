"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Kanban } from "lucide-react"
import { EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehPriorities, ehWorkProjects } from "@/lib/employee-hub-mock/fixtures"
import { cn } from "@/lib/utils"

export function WorkScreen() {
  const router = useRouter()

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-4">
        <h1 className="text-[24px] font-bold text-[#0F172A]">My Work</h1>
        <p className="text-sm text-[#64748B]">Projects, teams, priorities, roadmap and scorecards.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {[
          { label: "Active projects", value: "3", href: "/performance/tasks?tab=projects" },
          { label: "Due this week", value: "8", href: "/employee-hub/calendar" },
          { label: "Focus capacity", value: "72%", href: "/employee-hub/calendar" },
        ].map((s) => (
          <EhCard key={s.label} className="p-4 cursor-pointer" onClick={() => router.push(s.href)}>
            <p className="text-[11px] font-semibold text-[#64748B]">{s.label}</p>
            <p className="text-2xl font-bold text-[#0F172A] mt-1">{s.value}</p>
          </EhCard>
        ))}
      </div>

      <div className="grid xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <EhSectionTitle title="Projects" action={<Link href="/performance/tasks?tab=projects" className="text-[12px] font-semibold text-[#0EA5B7]">Open workspace</Link>} />
          <div className="grid sm:grid-cols-3 gap-3">
            {ehWorkProjects.map((p) => (
              <EhCard key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-bold text-[#0F172A]">{p.name}</p>
                  <EhPill tone={p.status === "On track" ? "success" : "warning"}>{p.status}</EhPill>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">Due {p.due}</p>
                <div className="mt-3 h-1.5 rounded-full bg-[#E8E6E1] overflow-hidden">
                  <div className="h-full rounded-full bg-[#0EA5B7]" style={{ width: `${p.progress}%` }} />
                </div>
                <p className="text-[11px] font-bold text-[#0F172A] mt-1">{p.progress}%</p>
              </EhCard>
            ))}
          </div>

          <EhCard className="p-4">
            <EhSectionTitle title="Kanban preview" action={<Kanban className="h-4 w-4 text-[#64748B]" />} />
            <div className="grid grid-cols-4 gap-2">
              {["Backlog", "In progress", "Review", "Done"].map((col, ci) => (
                <div key={col} className="rounded-xl bg-[#F7F6F3] p-2 min-h-[120px]">
                  <p className="text-[10px] font-bold text-[#64748B] mb-2">{col}</p>
                  {ci < 3 && <div className="rounded-lg bg-white border border-[#E8E6E1] p-2 text-[10px] font-medium">Task card</div>}
                </div>
              ))}
            </div>
            <Link href="/performance/tasks" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0EA5B7]">
              Open full board <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </EhCard>
        </div>

        <div className="xl:col-span-4">
          <EhCard className="p-4">
            <EhSectionTitle title="Priorities" />
            {ehPriorities.map((p) => (
              <div key={p.id} className="flex items-center gap-2 py-2 border-b border-[#F1F5F9] last:border-0">
                <span className={cn("h-2 w-2 rounded-full", p.done ? "bg-[#059669]" : "bg-[#0EA5B7]")} />
                <span className={cn("text-[13px] font-medium", p.done && "line-through text-[#94A3B8]")}>{p.title}</span>
              </div>
            ))}
          </EhCard>
        </div>
      </div>
    </div>
  )
}
