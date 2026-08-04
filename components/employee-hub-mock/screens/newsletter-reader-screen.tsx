"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { EhCard, EhPill } from "@/components/employee-hub-mock/primitives"
import { ehNewsletters } from "@/lib/employee-hub-mock/fixtures"
import { cn } from "@/lib/utils"

export function NewsletterReaderScreen({ id }: { id: string }) {
  const router = useRouter()
  const nl = ehNewsletters.find((n) => n.id === id) ?? ehNewsletters[0]
  const [chapter, setChapter] = useState(0)

  return (
    <div className="p-4 lg:p-5 max-w-[1000px] mx-auto">
      <button type="button" onClick={() => router.push("/employee-hub/newsletters")} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0EA5B7] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to library
      </button>
      <div className="grid lg:grid-cols-12 gap-5">
        <aside className="lg:col-span-3">
          <EhCard className="p-3">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-2">Chapters</p>
            {nl.chapters.map((c, i) => (
              <button key={c} type="button" onClick={() => setChapter(i)} className={cn("w-full text-left px-2 py-2 rounded-lg text-[13px] font-medium", chapter === i ? "bg-[#E6F7F9] text-[#0E7490]" : "text-[#334155] hover:bg-[#F7F6F3]")}>{c}</button>
            ))}
          </EhCard>
        </aside>
        <article className="lg:col-span-9">
          <EhPill tone="cyan">{nl.issue}</EhPill>
          <h1 className="mt-3 text-[28px] font-bold text-[#0F172A]">{nl.title}</h1>
          <p className="text-sm text-[#64748B] mt-1">Audience: {nl.audience}</p>
          <div className="mt-6 prose prose-slate max-w-none">
            <h2 className="text-[20px] font-bold text-[#0F172A]">{nl.chapters[chapter]}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#334155]">{nl.body}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#334155]">
              This distraction-free reader keeps focus on the issue narrative. Use chapter navigation on the left to jump between sections.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
