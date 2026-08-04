"use client"

import { useState } from "react"
import { EhAvatar, EhButton, EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehUser } from "@/lib/employee-hub-mock/fixtures"
import { toast } from "sonner"

export function ProfileScreen() {
  const [prefs, setPrefs] = useState({ focusAlerts: true, weeklyDigest: true, aiBrief: true })

  return (
    <div className="p-4 lg:p-5 max-w-[900px]">
      <EhCard className="p-6 mb-4">
        <div className="flex flex-wrap items-start gap-4">
          <EhAvatar initials={ehUser.initials} size="lg" />
          <div className="flex-1">
            <h1 className="text-[24px] font-bold text-[#0F172A]">{ehUser.fullName}</h1>
            <p className="text-sm text-[#64748B]">{ehUser.title} · {ehUser.department}</p>
            <p className="text-sm text-[#64748B] mt-1">{ehUser.location}</p>
            <p className="text-sm text-[#0EA5B7] mt-1">{ehUser.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {["Credit", "Modelling", "Portfolio narrative"].map((s) => (
                <EhPill key={s} tone="cyan">{s}</EhPill>
              ))}
            </div>
          </div>
          <EhButton variant="outline" onClick={() => toast("Edit profile")}>Edit profile</EhButton>
        </div>
      </EhCard>

      <div className="grid md:grid-cols-2 gap-4">
        <EhCard className="p-4">
          <EhSectionTitle title="Expertise" />
          <p className="text-[13px] text-[#334155]">Investment analysis, credit memo drafting, risk model validation and LP narrative support.</p>
        </EhCard>
        <EhCard className="p-4">
          <EhSectionTitle title="Preferences" />
          {(Object.keys(prefs) as (keyof typeof prefs)[]).map((k) => (
            <label key={k} className="flex items-center justify-between py-2 text-[13px] font-medium capitalize cursor-pointer">
              {k.replace(/([A-Z])/g, " $1")}
              <input type="checkbox" checked={prefs[k]} onChange={() => setPrefs((p) => ({ ...p, [k]: !p[k] }))} className="accent-[#0EA5B7]" />
            </label>
          ))}
        </EhCard>
        <EhCard className="p-4 md:col-span-2">
          <EhSectionTitle title="Records" />
          <div className="grid sm:grid-cols-3 gap-3 text-[13px]">
            <div className="rounded-xl bg-[#F7F6F3] p-3"><p className="font-bold text-[#0F172A]">Leave balance</p><p className="text-[#64748B] mt-1">18.5 days</p></div>
            <div className="rounded-xl bg-[#F7F6F3] p-3"><p className="font-bold text-[#0F172A]">Latest payslip</p><p className="text-[#64748B] mt-1">June 2026</p></div>
            <div className="rounded-xl bg-[#F7F6F3] p-3"><p className="font-bold text-[#0F172A]">Learning hours</p><p className="text-[#64748B] mt-1">12.5 YTD</p></div>
          </div>
        </EhCard>
      </div>
    </div>
  )
}
