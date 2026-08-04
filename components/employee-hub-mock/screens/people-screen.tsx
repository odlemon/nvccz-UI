"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Mail, MessageCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { EhAvatar, EhCard, EhPill } from "@/components/employee-hub-mock/primitives"
import { ehPeople } from "@/lib/employee-hub-mock/fixtures"

const statusTone = {
  Available: "success",
  "In a meeting": "warning",
  Focus: "cyan",
  Away: "neutral",
} as const

export function PeopleScreen() {
  const [q, setQ] = useState("")
  const filtered = useMemo(
    () => ehPeople.filter((p) => !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || p.dept.toLowerCase().includes(q.toLowerCase())),
    [q]
  )

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-4">
        <h1 className="text-[24px] font-bold text-[#0F172A]">People Directory</h1>
        <p className="text-sm text-[#64748B]">Employee search, availability, expertise and org context.</p>
      </div>

      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, team or skill…" className="w-full h-10 pl-10 pr-4 rounded-full border border-[#E8E6E1] text-sm outline-none focus:border-[#0EA5B7]" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <EhCard key={p.id} className="p-4">
            <div className="flex items-start gap-3">
              <EhAvatar initials={p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} />
              <div className="flex-1 min-w-0">
                <Link href="/employee-hub/profile" className="text-[15px] font-bold text-[#0F172A] hover:text-[#0EA5B7]">{p.name}</Link>
                <p className="text-[12px] text-[#64748B]">{p.title}</p>
                <p className="text-[11px] text-[#94A3B8]">{p.dept}</p>
                <EhPill tone={statusTone[p.status]} className="mt-2">{p.status}</EhPill>
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.skills.map((s) => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] font-medium">{s}</span>)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
              <button type="button" onClick={() => toast("Message sent", { description: `Opening chat with ${p.name}` })} className="flex-1 h-8 rounded-full border border-[#E8E6E1] text-[11px] font-semibold inline-flex items-center justify-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Message</button>
              <button type="button" onClick={() => toast("Email draft opened")} className="flex-1 h-8 rounded-full border border-[#E8E6E1] text-[11px] font-semibold inline-flex items-center justify-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</button>
            </div>
          </EhCard>
        ))}
      </div>
    </div>
  )
}
