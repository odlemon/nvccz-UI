"use client"

import { useState } from "react"
import { Check, Link2, Shield, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { EhButton, EhCard, EhPill } from "@/components/employee-hub-mock/primitives"
import { ehCoverLooks, ehCoverMoods, ehUser } from "@/lib/employee-hub-mock/fixtures"
import { cn } from "@/lib/utils"

export function DailyCoverScreen() {
  const [look, setLook] = useState("Editorial Mono")
  const [mood, setMood] = useState("Deep Focus")
  const [intention, setIntention] = useState("Make complex things feel simple.")
  const [toggles, setToggles] = useState({ priorities: true, focus: true, goals: true, weather: true })
  const [format, setFormat] = useState("Story 9:16")

  return (
    <div className="p-4 lg:p-5 max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A]">Daily Cover</h1>
          <p className="text-sm text-[#64748B]">Turn today into something worth sharing.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#64748B]">Saved automatically</span>
          <EhButton variant="outline" onClick={() => toast.success("Cover exported")}>Export cover</EhButton>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5">
          <EhCard className="p-4">
            <div
              className="mx-auto w-[240px] aspect-[9/16] rounded-3xl overflow-hidden relative shadow-xl border border-[#E8E6E1]"
              style={{ backgroundImage: "url(/matanho-login-bg.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/30 via-transparent to-[#0F172A]/50" />
              <div className="relative z-10 p-4 text-white h-full flex flex-col">
                <p className="text-[9px] font-bold tracking-widest opacity-90">WEDNESDAY, 16 JULY</p>
                <p className="text-[11px] font-bold mt-1">GOOD MORNING, {ehUser.firstName.toUpperCase()}</p>
                <EhPill tone="cyan" className="mt-3 w-fit text-[9px]">{mood.toUpperCase()}</EhPill>
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm" />
                </div>
                <p className="text-[11px] leading-snug">Today&apos;s intention: {intention}</p>
                <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[8px] font-bold">
                  {toggles.priorities && <span>3 PRIORITIES</span>}
                  {toggles.focus && <span>2h 30m FOCUS</span>}
                  {toggles.goals && <span>74% GOALS</span>}
                </div>
                {toggles.weather && (
                  <p className="mt-2 text-[9px] opacity-80">Harare · 18°C · Partly cloudy</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[#64748B]">
              <span>−</span> 100% <span>+</span>
              <span className="ml-2">Story preview 9:16</span>
            </div>
            <EhPill tone="success" className="mx-auto mt-3 w-fit">
              <Shield className="h-3 w-3" /> Privacy safe
            </EhPill>
          </EhCard>
        </div>

        <div className="xl:col-span-7 space-y-5">
          {[
            { step: 1, title: "Choose a look", content: (
              <div className="flex flex-wrap gap-2">
                {ehCoverLooks.map((l) => (
                  <button key={l} type="button" onClick={() => setLook(l)} className={cn("px-3 py-2 rounded-xl border text-[12px] font-semibold", look === l ? "border-[#0EA5B7] bg-[#E6F7F9] text-[#0E7490]" : "border-[#E8E6E1]")}>
                    {l}{look === l && <Check className="inline h-3 w-3 ml-1" />}
                  </button>
                ))}
              </div>
            )},
            { step: 2, title: "Set your mood", content: (
              <div className="flex flex-wrap gap-2">
                {ehCoverMoods.map((m) => (
                  <button key={m} type="button" onClick={() => setMood(m)} className={cn("px-3 py-2 rounded-full border text-[12px] font-medium", mood === m ? "border-[#0F172A] bg-[#F7F6F3]" : "border-[#E8E6E1]")}>{m}</button>
                ))}
              </div>
            )},
            { step: 3, title: "Personalise", content: (
              <div className="space-y-3">
                <input value={intention} onChange={(e) => setIntention(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[#E8E6E1] text-sm outline-none focus:border-[#0EA5B7]" />
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(toggles) as (keyof typeof toggles)[]).map((k) => (
                    <label key={k} className="inline-flex items-center gap-2 text-[12px] capitalize cursor-pointer">
                      <input type="checkbox" checked={toggles[k]} onChange={() => setToggles((p) => ({ ...p, [k]: !p[k] }))} className="accent-[#0EA5B7]" />
                      {k === "goals" ? "Goal progress" : k}
                    </label>
                  ))}
                </div>
              </div>
            )},
            { step: 4, title: "Privacy check", content: (
              <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-3 text-[13px] text-[#047857]">
                <Shield className="inline h-4 w-4 mr-1" />
                Ready to share. Client names, meetings and confidential figures are hidden.
                <button type="button" className="block mt-1 font-semibold underline" onClick={() => toast("Hidden details", { description: "Mock privacy review panel." })}>Review hidden details →</button>
              </div>
            )},
            { step: 5, title: "Share format", content: (
              <div className="flex flex-wrap gap-2">
                {["Story 9:16", "Square 1:1", "Motion"].map((f) => (
                  <button key={f} type="button" onClick={() => setFormat(f)} className={cn("px-4 py-2 rounded-xl border text-[12px] font-semibold", format === f ? "border-[#0F172A] bg-[#F7F6F3]" : "border-[#E8E6E1]")}>{f}</button>
                ))}
              </div>
            )},
          ].map(({ step, title, content }) => (
            <EhCard key={step} className="p-4">
              <p className="text-[11px] font-bold text-[#0EA5B7] mb-1">Step {step}</p>
              <p className="text-[14px] font-bold text-[#0F172A] mb-3">{title}</p>
              {content}
            </EhCard>
          ))}

          <div className="flex flex-col sm:flex-row gap-2">
            <EhButton className="flex-1" onClick={() => toast.success("Daily cover created")}>
              <Sparkles className="h-4 w-4" /> Create my cover
            </EhButton>
            <EhButton variant="outline" className="flex-1" onClick={() => toast.success("Link copied")}>
              <Link2 className="h-4 w-4" /> Copy share link
            </EhButton>
          </div>
        </div>
      </div>
    </div>
  )
}
