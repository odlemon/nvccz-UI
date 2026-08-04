"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Target } from "lucide-react"
import { EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehGoals, ehUser } from "@/lib/employee-hub-mock/fixtures"

export function PerformanceScreen() {
  const router = useRouter()

  return (
    <div className="p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A]">My Performance</h1>
          <p className="text-sm text-[#64748B]">Personal performance narrative, goals and evidence.</p>
        </div>
        <Link href="/performance" className="text-[13px] font-semibold text-[#0EA5B7] inline-flex items-center gap-1">
          Open Performance module <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <EhCard className="p-5 mb-4 bg-gradient-to-r from-[#E6F7F9] to-white">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 rounded-full border-[10px] border-[#0EA5B7] border-r-[#E8E6E1] flex items-center justify-center">
            <span className="text-xl font-bold text-[#0F172A]">74%</span>
          </div>
          <div>
            <p className="text-[18px] font-bold text-[#0F172A]">Q3 goals on track</p>
            <p className="text-sm text-[#64748B]">{ehUser.fullName} · {ehUser.title}</p>
            <EhPill tone="success" className="mt-2">On track</EhPill>
          </div>
        </div>
      </EhCard>

      <EhSectionTitle title="Goals & key results" />
      <div className="space-y-3 mb-6">
        {ehGoals.map((g) => (
          <EhCard key={g.id} className="p-4 cursor-pointer" onClick={() => router.push("/performance/goals")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-[#0EA5B7] mt-0.5" />
                <div>
                  <p className="text-[14px] font-bold text-[#0F172A]">{g.title}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Confidence: {g.confidence}</p>
                </div>
              </div>
              <span className="text-[14px] font-bold text-[#0F172A]">{g.progress}%</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-[#E8E6E1] overflow-hidden">
              <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${g.progress}%` }} />
            </div>
          </EhCard>
        ))}
      </div>

      <EhCard className="p-4">
        <EhSectionTitle title="Evidence & check-ins" />
        <p className="text-[13px] text-[#64748B]">Latest check-in: Portfolio commentary draft submitted · 14 Jul</p>
        <Link href="/performance/reviews" className="mt-3 inline-flex text-[12px] font-semibold text-[#0EA5B7]">View review cycle →</Link>
      </EhCard>
    </div>
  )
}
