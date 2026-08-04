"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Lock, Plus, Video } from "lucide-react"
import { toast } from "sonner"
import { EhButton, EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { ehCalendarWeek, ehHomeToday } from "@/lib/employee-hub-mock/fixtures"
import { cn } from "@/lib/utils"

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
const calendars = ["Aisha Ubuntu", "My Tasks", "Arcus Company", "Team – Investments", "Holidays – Zimbabwe"]

export function CalendarScreen() {
  const [view, setView] = useState<"Day" | "Week" | "Month">("Week")
  const [selected, setSelected] = useState(ehHomeToday[0])
  const [sources, setSources] = useState(Object.fromEntries(calendars.map((c) => [c, true])))

  return (
    <div className="p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A]">Calendar</h1>
          <p className="text-sm text-[#64748B]">Week planning, focus blocks and meeting context.</p>
        </div>
        <div className="flex gap-2">
          {(["Day", "Week", "Month"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={cn("px-3 py-1.5 rounded-full text-[12px] font-semibold", view === v ? "bg-[#0F172A] text-white" : "border border-[#E8E6E1]")}>{v}</button>
          ))}
          <EhButton onClick={() => toast("Create event")}><Plus className="h-4 w-4" /> Create event</EhButton>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Next meeting", value: "Portfolio review · 09:00" },
          { label: "Focus hours", value: "3h 00m of 4h goal" },
          { label: "Open tasks", value: "7 tasks · 2 overdue" },
          { label: "Timesheet", value: "3h 45m of 8h" },
        ].map((s) => (
          <EhCard key={s.label} className="p-3">
            <p className="text-[11px] font-semibold text-[#64748B]">{s.label}</p>
            <p className="text-[13px] font-bold text-[#0F172A] mt-1">{s.value}</p>
          </EhCard>
        ))}
      </div>

      <div className="grid xl:grid-cols-12 gap-4">
        <EhCard className="xl:col-span-2 p-3 hidden lg:block">
          <p className="text-[12px] font-bold mb-2">July 2026</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#94A3B8] mb-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
            {Array.from({ length: 31 }, (_, i) => (
              <span key={i} className={cn("py-1 rounded-full", i + 1 === 16 ? "bg-[#0EA5B7] text-white font-bold" : "text-[#334155]")}>{i + 1}</span>
            ))}
          </div>
          <p className="text-[11px] font-bold text-[#0F172A] mt-4 mb-2">Calendars</p>
          {calendars.map((c) => (
            <label key={c} className="flex items-center gap-2 text-[11px] py-1 cursor-pointer">
              <input type="checkbox" checked={sources[c]} onChange={() => setSources((p) => ({ ...p, [c]: !p[c] }))} className="accent-[#0EA5B7]" />
              {c}
            </label>
          ))}
        </EhCard>

        <EhCard className="xl:col-span-7 p-3 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button type="button" className="h-8 w-8 rounded-full border border-[#E8E6E1] inline-flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-[14px] font-bold text-[#0F172A]">16 July 2026</span>
              <button type="button" className="h-8 w-8 rounded-full border border-[#E8E6E1] inline-flex items-center justify-center"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <EhButton variant="outline" className="h-8 text-xs">Focus mode</EhButton>
          </div>
          <div className="grid grid-cols-6 min-w-[520px]">
            <div />
            {ehCalendarWeek.map((d) => (
              <div key={d.day} className="text-center pb-2 border-b border-[#E8E6E1]">
                <p className="text-[10px] text-[#64748B]">{d.day}</p>
                <p className={cn("text-[13px] font-bold", d.date === 16 ? "text-[#0EA5B7]" : "text-[#0F172A]")}>{d.date}</p>
              </div>
            ))}
            {hours.map((h) => (
              <div key={h} className="contents">
                <div className="text-[10px] text-[#94A3B8] pr-2 py-3 text-right border-r border-[#F1F5F9]">{h}</div>
                {ehCalendarWeek.map((d) => (
                  <div key={`${d.day}-${h}`} className="border-b border-r border-[#F1F5F9] min-h-[36px] relative p-0.5">
                    {d.date === 16 && h === "09:00" && (
                      <button type="button" onClick={() => setSelected(ehHomeToday[0])} className="absolute inset-x-0.5 top-0.5 rounded-md bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-bold px-1 py-0.5 truncate">
                        Portfolio review
                      </button>
                    )}
                    {d.date === 16 && h === "13:00" && (
                      <div className="absolute inset-x-0.5 top-0.5 rounded-md bg-[#E6F7F9] text-[#0E7490] text-[9px] font-bold px-1 py-0.5 flex items-center gap-0.5">
                        <Lock className="h-2.5 w-2.5" /> Focus
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </EhCard>

        <EhCard className="xl:col-span-3 p-4">
          <EhSectionTitle title="Event details" />
          <p className="text-[15px] font-bold text-[#0F172A]">{selected.title}</p>
          <p className="text-[12px] text-[#64748B] mt-1">Thu, 16 Jul · {selected.time} · {selected.meta}</p>
          <EhButton className="w-full mt-4"><Video className="h-4 w-4" /> Join meeting</EhButton>
          <p className="text-[12px] font-bold text-[#0F172A] mt-4 mb-2">Agenda</p>
          <ul className="text-[12px] text-[#64748B] space-y-1 list-disc list-inside">
            <li>Portfolio performance overview</li>
            <li>Risk and exposures</li>
            <li>Q3 narrative alignment</li>
          </ul>
        </EhCard>
      </div>
    </div>
  )
}
