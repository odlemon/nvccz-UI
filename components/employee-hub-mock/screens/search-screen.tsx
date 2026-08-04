"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { FileText, MessageSquare, Shield, Sparkles, Users } from "lucide-react"
import { EhButton, EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehNewsArticles, ehPeople, ehPriorities } from "@/lib/employee-hub-mock/fixtures"

const prompts = ["Summarise my week", "Draft a project status", "Who owns risk models?", "Prepare for portfolio review"]

export function SearchScreen() {
  const params = useSearchParams()
  const initial = params.get("q") ?? "Prepare me for today's portfolio review"
  const [query, setQuery] = useState(initial)
  const [mode, setMode] = useState<"Ask" | "Search" | "Recent" | "Saved">("Ask")

  const results = useMemo(() => {
    const q = query.toLowerCase()
    return {
      tasks: ehPriorities.filter((p) => p.title.toLowerCase().includes(q) || q.includes("task") || q.includes("prepare")),
      docs: ehNewsArticles.filter((a) => a.title.toLowerCase().includes(q) || q.includes("portfolio") || q.includes("deck")),
      people: ehPeople.filter((p) => p.name.toLowerCase().includes(q) || q.includes("who")),
    }
  }, [query])

  return (
    <div className="p-4 lg:p-5 max-w-[1100px] mx-auto">
      <div className="mb-5">
        <h1 className="text-[24px] font-bold text-[#0F172A]">Ask Arcus</h1>
        <p className="text-sm text-[#64748B]">Search, understand and act across your work.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-2 flex lg:flex-col gap-1">
          {(["Ask", "Search", "Recent", "Saved"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`px-3 py-2 rounded-xl text-[13px] font-semibold text-left ${mode === m ? "bg-[#E6F7F9] text-[#0E7490]" : "text-[#64748B] hover:bg-[#F7F6F3]"}`}>{m}</button>
          ))}
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0EA5B7]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-[#0EA5B7] text-sm outline-none bg-white shadow-sm"
              placeholder="Ask Arcus anything…"
            />
          </div>

          <EhCard className="p-5">
            <EhPill tone="cyan">Meeting · Portfolio review · 09:00 · Boardroom A</EhPill>
            <h2 className="mt-3 text-[18px] font-bold text-[#0F172A]">Here&apos;s your brief</h2>
            <div className="grid md:grid-cols-3 gap-4 mt-4 text-[13px]">
              <div>
                <p className="font-bold text-[#0F172A] mb-2">What changed</p>
                <ul className="text-[#64748B] space-y-1 list-disc list-inside">
                  <li>Q3 investment deck updated</li>
                  <li>Risk model assumptions refreshed</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#0F172A] mb-2">Decisions needed</p>
                <ol className="text-[#64748B] space-y-1 list-decimal list-inside">
                  <li>Confirm portfolio positioning</li>
                  <li>Approve SME narrative</li>
                </ol>
              </div>
              <div>
                <p className="font-bold text-[#0F172A] mb-2">Suggested preparation</p>
                <ul className="text-[#64748B] space-y-1 list-disc list-inside">
                  <li>Review deck</li>
                  <li>Check risk memo</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <EhButton>Open workspace</EhButton>
              <EhButton variant="outline">+ Create preparation task</EhButton>
            </div>
          </EhCard>

          <div className="grid sm:grid-cols-2 gap-3">
            <EhCard className="p-4">
              <EhSectionTitle title="Tasks" />
              {results.tasks.length ? results.tasks.map((t) => (
                <p key={t.id} className="text-[13px] font-medium text-[#0F172A] py-1">{t.title}</p>
              )) : <p className="text-[12px] text-[#94A3B8]">No matching tasks</p>}
            </EhCard>
            <EhCard className="p-4">
              <EhSectionTitle title="Documents" />
              {results.docs.map((d) => (
                <div key={d.id} className="flex items-center gap-2 py-1 text-[13px]">
                  <FileText className="h-4 w-4 text-[#0EA5B7]" /> {d.title}
                </div>
              ))}
            </EhCard>
            <EhCard className="p-4">
              <EhSectionTitle title="People" />
              {results.people.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-1 text-[13px]">
                  <Users className="h-4 w-4 text-[#64748B]" /> {p.name}
                </div>
              ))}
            </EhCard>
            <EhCard className="p-4">
              <EhSectionTitle title="Discussions" />
              <div className="flex items-center gap-2 py-1 text-[13px]">
                <MessageSquare className="h-4 w-4 text-[#64748B]" /> Q3 strategy workshop prep
              </div>
            </EhCard>
          </div>

          <div className="flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button key={p} type="button" onClick={() => setQuery(p)} className="px-3 py-1.5 rounded-full border border-[#E8E6E1] text-[12px] font-medium text-[#334155] hover:border-[#0EA5B7]">{p}</button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <EhCard className="p-4">
            <EhSectionTitle title="Sources searched" />
            {[
              { n: "My Work", c: 12 },
              { n: "Calendar", c: 3 },
              { n: "Documents", c: 8 },
            ].map((s) => (
              <div key={s.n} className="flex justify-between text-[12px] py-1">
                <span className="text-[#64748B]">{s.n}</span>
                <span className="font-bold text-[#0F172A]">{s.c}</span>
              </div>
            ))}
          </EhCard>
          <EhCard className="p-4">
            <EhSectionTitle title="Related people" />
            {ehPeople.slice(0, 3).map((p) => (
              <p key={p.id} className="text-[13px] font-medium text-[#0F172A] py-1">{p.name}</p>
            ))}
          </EhCard>
          <EhCard className="p-4 bg-[#F7F6F3]">
            <div className="flex gap-2">
              <Shield className="h-5 w-5 text-[#0EA5B7] shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-[#0F172A]">Safe by design</p>
                <p className="text-[11px] text-[#64748B] mt-1">Arcus AI only uses information you have permission to access.</p>
              </div>
            </div>
          </EhCard>
        </div>
      </div>
    </div>
  )
}
