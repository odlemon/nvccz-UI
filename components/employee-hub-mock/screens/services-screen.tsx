"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import {
  GraduationCap,
  HeartHandshake,
  MonitorSmartphone,
  PalmTree,
  Receipt,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { EhButton, EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehServiceRequests, ehServices, ehUser } from "@/lib/employee-hub-mock/fixtures"
import { cn } from "@/lib/utils"

const iconMap: Record<string, ReactNode> = {
  PalmTree: <PalmTree className="h-5 w-5" />,
  Receipt: <Receipt className="h-5 w-5" />,
  Wallet: <Wallet className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  MonitorSmartphone: <MonitorSmartphone className="h-5 w-5" />,
  HeartHandshake: <HeartHandshake className="h-5 w-5" />,
}

const statusTone = { "In progress": "azure", Pending: "warning", Completed: "success" } as const

export function ServicesScreen() {
  const [q, setQ] = useState("")

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-4">
        <h1 className="text-[24px] font-bold text-[#0F172A]">Employee Services</h1>
        <p className="text-sm text-[#64748B]">Everything you need, in one place.</p>
      </div>

      <EhCard className="p-5 mb-4">
        <p className="text-[15px] font-bold text-[#0F172A] mb-3">How can we help you today?</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services…" className="w-full h-11 pl-10 pr-4 rounded-full border border-[#E8E6E1] text-sm outline-none focus:border-[#0EA5B7]" />
          </div>
          <EhButton variant="cyan" onClick={() => toast("Arcus AI", { description: "How can I help with employee services?" })}>
            <Sparkles className="h-4 w-4" /> Ask Arcus AI
          </EhButton>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 text-[12px]">
          {["Annual leave", "Payslip", "Travel", "Laptop support", "Learning"].map((t) => (
            <button key={t} type="button" onClick={() => setQ(t)} className="text-[#0EA5B7] font-semibold hover:underline">{t}</button>
          ))}
        </div>
      </EhCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Leave balance", value: "18.5 days", sub: "Renews 01 Jan 2027" },
          { label: "Latest payslip", value: "US$3,450", sub: "June 2026" },
          { label: "Pending expenses", value: "US$215.60", sub: "2 items" },
          { label: "Learning hours", value: "12.5 hrs", sub: "Year to date" },
        ].map((s) => (
          <EhCard key={s.label} className="p-4">
            <p className="text-[11px] font-semibold text-[#64748B]">{s.label}</p>
            <p className="text-[18px] font-bold text-[#0F172A] mt-1">{s.value}</p>
            <p className="text-[11px] text-[#94A3B8]">{s.sub}</p>
          </EhCard>
        ))}
      </div>

      <EhSectionTitle title="Browse services" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {ehServices.map((s) => (
          <EhCard key={s.id} className="p-4 cursor-pointer hover:border-[#0EA5B7]/40" onClick={() => toast(s.title, { description: s.desc })}>
            <div className="h-10 w-10 rounded-xl bg-[#E6F7F9] text-[#0EA5B7] inline-flex items-center justify-center mb-2">
              {iconMap[s.icon]}
            </div>
            <p className="text-[14px] font-bold text-[#0F172A]">{s.title}</p>
            <p className="text-[12px] text-[#64748B] mt-0.5">{s.desc}</p>
          </EhCard>
        ))}
      </div>

      <EhSectionTitle title="My requests" />
      <EhCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9] text-left text-[#64748B]">
                <th className="px-4 py-2 font-semibold">Request #</th>
                <th className="px-4 py-2 font-semibold">Service</th>
                <th className="px-4 py-2 font-semibold">Submitted</th>
                <th className="px-4 py-2 font-semibold">Owner</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Next action</th>
              </tr>
            </thead>
            <tbody>
              {ehServiceRequests.map((r) => (
                <tr key={r.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F7F6F3]">
                  <td className="px-4 py-3 font-mono text-[#334155]">{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-[#0F172A]">{r.service}</td>
                  <td className="px-4 py-3 text-[#64748B]">{r.submitted}</td>
                  <td className="px-4 py-3">{r.owner}</td>
                  <td className="px-4 py-3"><EhPill tone={statusTone[r.status]}>{r.status}</EhPill></td>
                  <td className="px-4 py-3 text-[#64748B]">{r.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EhCard>

      <EhCard className="mt-4 p-4 hidden xl:block max-w-sm ml-auto">
        <p className="text-[13px] font-bold text-[#0F172A]">Arcus AI Concierge</p>
        <p className="text-[12px] text-[#64748B] mt-1">Good morning, {ehUser.firstName}. How can I help you today?</p>
      </EhCard>
    </div>
  )
}
