"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Filter, MessageSquare, PenLine, Pin } from "lucide-react"
import { EhButton, EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehForumSpaces, ehForums } from "@/lib/employee-hub-mock/fixtures"
import { cn } from "@/lib/utils"

export function ForumsScreen() {
  const router = useRouter()
  const [tab, setTab] = useState("All discussions")

  return (
    <div className="p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A]">Forums</h1>
          <p className="text-sm text-[#64748B]">Ask, share and build knowledge together.</p>
        </div>
        <div className="flex gap-2">
          <input placeholder="Search forums…" className="h-10 px-4 rounded-full border border-[#E8E6E1] text-sm w-48 outline-none focus:border-[#0EA5B7]" />
          <EhButton onClick={() => router.push("/employee-hub/forums/f1")}><PenLine className="h-4 w-4" /> Start a discussion</EhButton>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {ehForumSpaces.map((s) => (
          <EhCard key={s.id} className="px-4 py-3 shrink-0 min-w-[140px]">
            <p className="text-[13px] font-bold text-[#0F172A]">{s.name}</p>
            <p className="text-[11px] text-[#64748B]">{s.count} discussions</p>
          </EhCard>
        ))}
      </div>

      <div className="grid xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex gap-1">
              {["All discussions", "Unanswered", "Following", "My discussions"].map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-full text-[12px] font-semibold", tab === t ? "bg-[#0F172A] text-white" : "text-[#64748B]")}>{t}</button>
              ))}
            </div>
            <div className="flex gap-2 text-[12px]">
              <span className="text-[#64748B]">Sort: Last activity</span>
              <button type="button" className="inline-flex items-center gap-1 font-semibold text-[#334155]"><Filter className="h-3.5 w-3.5" /> Filter</button>
            </div>
          </div>
          <EhCard className="overflow-hidden">
            {ehForums.map((f, i) => (
              <button key={f.id} type="button" onClick={() => router.push(`/employee-hub/forums/${f.id}`)} className="w-full text-left px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F7F6F3] flex gap-3 items-start">
                {i === 0 ? <Pin className="h-4 w-4 text-[#0EA5B7] shrink-0 mt-0.5" /> : <MessageSquare className="h-4 w-4 text-[#94A3B8] shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-bold text-[#0F172A]">{f.title}</p>
                    {i === 1 && <EhPill tone="success">Solved</EhPill>}
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-0.5">{f.excerpt}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-1">{f.space} · {f.author} · {f.replies} replies · {f.views} views</p>
                </div>
              </button>
            ))}
          </EhCard>
        </div>
        <div className="xl:col-span-4 space-y-4">
          <EhCard className="p-4">
            <EhSectionTitle title="Knowledge that lasts" />
            <p className="text-[12px] font-bold text-[#64748B] mb-2">Accepted answers</p>
            {ehForums.slice(0, 2).map((f) => (
              <div key={f.id} className="flex gap-2 py-2 text-[12px]">
                <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                <span className="font-medium text-[#0F172A]">{f.title}</span>
              </div>
            ))}
          </EhCard>
          <EhCard className="p-4">
            <EhSectionTitle title="Trending topics" />
            <div className="flex flex-wrap gap-1.5">
              {["Risk management", "Sustainability", "AI in investment"].map((t) => (
                <EhPill key={t} tone="cyan">{t}</EhPill>
              ))}
            </div>
          </EhCard>
        </div>
      </div>
    </div>
  )
}
