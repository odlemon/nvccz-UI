"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bookmark, ChevronRight, SlidersHorizontal, TrendingUp } from "lucide-react"
import { EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehNewsArticles, ehNewsTabs } from "@/lib/employee-hub-mock/fixtures"
import { cn } from "@/lib/utils"

const trending = [
  "Southern Africa expansion enters its next chapter",
  "Africa's trade momentum",
  "Renewable energy investments",
  "African startups secure funding",
  "Mobile money transactions",
]

const sources = ["Arcus Newsroom", "Reuters", "Bloomberg", "TechCabal", "Business Weekly", "The Herald"]

export function NewsScreen() {
  const router = useRouter()
  const [tab, setTab] = useState("Top stories")

  return (
    <div className="p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A]">News</h1>
          <p className="text-sm text-[#64748B]">Articles and updates from across Arcus and trusted sources.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="h-9 px-3 rounded-full border border-[#E8E6E1] text-[12px] font-semibold inline-flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Personalise
          </button>
          <button type="button" className="h-9 w-9 rounded-full border border-[#E8E6E1] inline-flex items-center justify-center">
            <Bookmark className="h-4 w-4 text-[#64748B]" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-[#E8E6E1]">
        {ehNewsTabs.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("px-3 py-2 text-[13px] font-semibold whitespace-nowrap border-b-2 -mb-px", tab === t ? "border-[#0EA5B7] text-[#0EA5B7]" : "border-transparent text-[#64748B]")}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <EhCard className="md:col-span-2 overflow-hidden cursor-pointer" onClick={() => router.push("/employee-hub/news/n1")}>
              <div className="h-44 bg-gradient-to-br from-[#0EA5B7] to-[#0369A1]" />
              <div className="p-4">
                <EhPill tone="cyan">Arcus Newsroom</EhPill>
                <h2 className="mt-2 text-[16px] font-bold text-[#0F172A] leading-snug">Southern Africa expansion enters its next chapter</h2>
                <p className="mt-1 text-[12px] text-[#64748B]">16 Jul 2026 · 8 min read</p>
                <p className="mt-2 text-[13px] text-[#64748B]">New markets, new partnerships and new opportunities to create sustainable impact across the region.</p>
              </div>
            </EhCard>
            <div className="space-y-3">
              {ehNewsArticles.slice(1).map((a) => (
                <EhCard key={a.id} className="overflow-hidden cursor-pointer" onClick={() => router.push(`/employee-hub/news/${a.id}`)}>
                  <div className="h-20 bg-gradient-to-br from-[#334155] to-[#64748B]" />
                  <div className="p-3">
                    <EhPill>{a.category}</EhPill>
                    <p className="mt-1 text-[12px] font-bold text-[#0F172A] line-clamp-2">{a.title}</p>
                  </div>
                </EhCard>
              ))}
            </div>
          </div>

          <EhSectionTitle title="Latest stories" action={<Link href="/employee-hub/news" className="text-[12px] font-semibold text-[#0EA5B7]">View all</Link>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ehNewsArticles.map((a) => (
              <EhCard key={a.id} className="p-3 cursor-pointer flex gap-3" onClick={() => router.push(`/employee-hub/news/${a.id}`)}>
                <div className="h-16 w-20 rounded-xl bg-gradient-to-br from-[#94A3B8] to-[#475569] shrink-0" />
                <div className="min-w-0">
                  <EhPill className="text-[10px]">{a.author}</EhPill>
                  <p className="mt-1 text-[13px] font-bold text-[#0F172A] line-clamp-2">{a.title}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{a.date} · {a.readMins} min</p>
                </div>
              </EhCard>
            ))}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <EhCard className="p-4">
            <EhSectionTitle title="Trending now" />
            <ol className="space-y-2">
              {trending.map((t, i) => (
                <li key={t} className="flex gap-2 text-[13px]">
                  <span className="font-bold text-[#0EA5B7] w-4">{i + 1}</span>
                  <span className="text-[#0F172A] font-medium">{t}</span>
                </li>
              ))}
            </ol>
            <button type="button" className="mt-3 text-[12px] font-semibold text-[#0EA5B7] inline-flex items-center gap-1">View all trending <ChevronRight className="h-3.5 w-3.5" /></button>
          </EhCard>
          <EhCard className="p-4">
            <EhSectionTitle title="Sources you follow" action={<button type="button" className="text-[12px] text-[#0EA5B7] font-semibold">Manage</button>} />
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s} className="flex items-center justify-between text-[13px] font-medium text-[#0F172A]">
                  {s}<span className="text-[#0EA5B7]">✓</span>
                </div>
              ))}
            </div>
          </EhCard>
          <EhCard className="p-4">
            <EhSectionTitle title="Market brief" />
            <div className="flex gap-1 mb-3">
              {["Africa", "Global", "Commodities"].map((t, i) => (
                <span key={t} className={cn("px-2 py-1 rounded-full text-[10px] font-bold", i === 0 ? "bg-[#E6F7F9] text-[#0E7490]" : "text-[#64748B]")}>{t}</span>
              ))}
            </div>
            {[
              { n: "AFR Top 40", v: "1,842", c: "+0.8%", up: true },
              { n: "JSE All Share", v: "78,420", c: "-0.3%", up: false },
            ].map((r) => (
              <div key={r.n} className="flex justify-between py-1.5 text-[12px] border-b border-[#F1F5F9] last:border-0">
                <span className="font-medium">{r.n}</span>
                <span className={r.up ? "text-[#059669]" : "text-[#DC2626]"}>{r.v} {r.c}</span>
              </div>
            ))}
            <p className="mt-2 text-[10px] text-[#94A3B8] flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Data as at 16 Jul 2026, 10:30 CAT</p>
          </EhCard>
        </div>
      </div>
    </div>
  )
}
