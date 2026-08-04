"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PenLine, Plus } from "lucide-react"
import { EhButton, EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehNewsletters } from "@/lib/employee-hub-mock/fixtures"
import { cn } from "@/lib/utils"

export function NewslettersScreen() {
  const router = useRouter()
  const [view, setView] = useState<"library" | "studio">("library")

  return (
    <div className="p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A]">Newsletters</h1>
          <p className="text-sm text-[#64748B]">Featured issues, library and publishing studio.</p>
        </div>
        <EhButton onClick={() => router.push("/employee-hub/newsletters/editor")}>
          <Plus className="h-4 w-4" /> New issue
        </EhButton>
      </div>

      <div className="flex gap-2 mb-5">
        {(["library", "studio"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)} className={cn("px-4 py-2 rounded-full text-[13px] font-semibold capitalize", view === v ? "bg-[#0F172A] text-white" : "bg-white border border-[#E8E6E1] text-[#334155]")}>{v}</button>
        ))}
      </div>

      {view === "library" ? (
        <>
          <EhCard className="p-5 mb-4 overflow-hidden cursor-pointer" onClick={() => router.push("/employee-hub/newsletters/nl1")}>
            <div className="grid md:grid-cols-2 gap-4 items-center">
              <div className="h-36 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#0EA5B7]" />
              <div>
                <EhPill tone="cyan">Featured</EhPill>
                <h2 className="mt-2 text-[20px] font-bold text-[#0F172A]">{ehNewsletters[0].title}</h2>
                <p className="text-[13px] text-[#64748B] mt-1">{ehNewsletters[0].issue}</p>
                <p className="mt-2 text-[14px] text-[#334155]">{ehNewsletters[0].body}</p>
              </div>
            </div>
          </EhCard>
          <EhSectionTitle title="Library" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ehNewsletters.map((nl) => (
              <EhCard key={nl.id} className="p-4 cursor-pointer" onClick={() => router.push(`/employee-hub/newsletters/${nl.id}`)}>
                <EhPill tone={nl.status === "Published" ? "success" : "warning"}>{nl.status}</EhPill>
                <p className="mt-2 text-[15px] font-bold text-[#0F172A]">{nl.title}</p>
                <p className="text-[12px] text-[#64748B] mt-1">{nl.issue}</p>
                <p className="text-[11px] text-[#94A3B8] mt-2">{nl.audience}</p>
              </EhCard>
            ))}
          </div>
        </>
      ) : (
        <EhCard className="p-6 text-center">
          <PenLine className="h-10 w-10 text-[#0EA5B7] mx-auto mb-3" />
          <p className="text-[16px] font-bold text-[#0F172A]">Publishing studio</p>
          <p className="text-sm text-[#64748B] mt-1 max-w-md mx-auto">Draft issues, manage review stages and audience controls.</p>
          <EhButton className="mt-4" onClick={() => router.push("/employee-hub/newsletters/editor")}>Open editor</EhButton>
        </EhCard>
      )}
    </div>
  )
}
