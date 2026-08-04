"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Flame,
  ListTodo,
  Lock,
  Play,
  Settings2,
  Sparkles,
  Target,
  Thermometer,
  Users,
  Video,
} from "lucide-react"
import { toast } from "sonner"
import { EhAvatar, EhButton, EhCard, EhPill, EhSectionTitle } from "@/components/employee-hub-mock/primitives"
import { AskAiLink } from "@/components/employee-hub-mock/shell"
import {
  ehFeedCards,
  ehHomeToday,
  ehPriorities,
  ehUser,
} from "@/lib/employee-hub-mock/fixtures"
import { EH_SECONDARY } from "@/lib/employee-hub-mock/nav"
import { cn } from "@/lib/utils"

function Donut({ value }: { value: number }) {
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#E8E6E1" strokeWidth="10" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="#0EA5B7"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-[#0F172A] leading-none">{value}%</span>
      </div>
    </div>
  )
}

export function EmployeeHomeScreen() {
  const router = useRouter()
  const [priorities, setPriorities] = useState(ehPriorities)
  const doneCount = priorities.filter((p) => p.done).length

  const dateLabel = useMemo(() => "Wednesday, 16 July · Harare, Zimbabwe", [])

  return (
    <div className="p-4 lg:p-5 space-y-4 max-w-[1400px]">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] lg:text-[28px] font-bold text-[#0F172A] tracking-tight">
            Good morning, {ehUser.firstName}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <EhPill tone="warning">
            <Flame className="h-3.5 w-3.5" /> 4-day focus streak
          </EhPill>
          <EhPill tone="azure">
            <Thermometer className="h-3.5 w-3.5" /> 18°C
          </EhPill>
        </div>
      </div>

      {/* Hero */}
      <EhCard className="relative overflow-hidden p-6 lg:p-7">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none bg-gradient-to-l from-[#E6F7F9] via-[#E6F7F9]/40 to-transparent" />
        <div className="relative max-w-2xl">
          <h2 className="text-[22px] lg:text-[24px] font-bold text-[#0F172A] tracking-tight">
            Your day, beautifully organised
          </h2>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Plan with clarity. Focus with intention. Finish stronger.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: <Calendar className="h-4 w-4 text-[#0EA5B7]" />,
                label: "Next meeting",
                value: "Portfolio review · 09:00 (Boardroom A)",
              },
              {
                icon: <Target className="h-4 w-4 text-[#0EA5B7]" />,
                label: "Focus block",
                value: "14:00 – 16:00 (Protected time)",
              },
              {
                icon: <ListTodo className="h-4 w-4 text-[#0EA5B7]" />,
                label: "3 priorities",
                value: "See what matters most in My Work",
              },
            ].map((slot) => (
              <div key={slot.label} className="rounded-2xl border border-[#E8E6E1] bg-white/80 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B]">
                  {slot.icon}
                  {slot.label}
                </div>
                <p className="mt-1 text-[12px] font-semibold text-[#0F172A] leading-snug">{slot.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <EhButton
              onClick={() => {
                toast.success("Day started", { description: "Focus block protected until 16:00." })
                router.push("/employee-hub/calendar")
              }}
            >
              <Play className="h-4 w-4" /> Start my day
            </EhButton>
            <AskAiLink onClick={() => router.push(EH_SECONDARY.search)} />
          </div>
        </div>
      </EhCard>

      {/* Middle grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today */}
          <EhCard className="p-4">
            <EhSectionTitle
              title="Today"
              action={
                <Link href="/employee-hub/calendar" className="text-[12px] font-semibold text-[#0EA5B7] hover:underline">
                  Open calendar
                </Link>
              }
            />
            <div className="space-y-3">
              {ehHomeToday.map((item) => (
                <div key={item.time + item.title} className="flex gap-3">
                  <div className="w-12 shrink-0 text-[11px] font-bold text-[#64748B] pt-0.5">{item.time}</div>
                  <div className="flex-1 min-w-0 border-l-2 border-[#E6F7F9] pl-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-[#0F172A]">{item.title}</p>
                        <p className="text-[11px] text-[#94A3B8]">{item.meta}</p>
                      </div>
                      {item.kind === "meeting" && <Video className="h-3.5 w-3.5 text-[#64748B]" />}
                      {item.kind === "workshop" && <Users className="h-3.5 w-3.5 text-[#64748B]" />}
                      {item.kind === "focus" && <Lock className="h-3.5 w-3.5 text-[#0EA5B7]" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </EhCard>

          {/* Priorities */}
          <EhCard className="p-4">
            <EhSectionTitle
              title="My Priorities"
              action={
                <Link href="/employee-hub/work" className="text-[12px] font-semibold text-[#0EA5B7] hover:underline">
                  Open My Work
                </Link>
              }
            />
            <p className="text-[12px] text-[#64748B] mb-2">
              <span className="font-bold text-[#0F172A]">{doneCount} of {priorities.length}</span> on track
            </p>
            <div className="h-1.5 rounded-full bg-[#E8E6E1] mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0EA5B7] transition-all"
                style={{ width: `${(doneCount / priorities.length) * 100}%` }}
              />
            </div>
            <div className="space-y-2.5">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    setPriorities((prev) => prev.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)))
                  }
                  className="w-full flex items-start gap-2 text-left group"
                >
                  {p.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[#0EA5B7] mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-[#CBD5E1] mt-0.5 shrink-0 group-hover:text-[#0EA5B7]" />
                  )}
                  <span className={cn("text-[13px] font-medium", p.done ? "text-[#94A3B8] line-through" : "text-[#0F172A]")}>
                    {p.title}
                  </span>
                </button>
              ))}
            </div>
          </EhCard>

          {/* Performance pulse */}
          <EhCard className="p-4">
            <EhSectionTitle
              title="Performance Pulse"
              action={
                <Link href="/employee-hub/performance" className="text-[12px] font-semibold text-[#0EA5B7] hover:underline">
                  View performance
                </Link>
              }
            />
            <div className="flex items-center gap-4">
              <Donut value={74} />
              <div>
                <p className="text-sm font-bold text-[#0F172A]">74% Q3 goals</p>
                <EhPill tone="success" className="mt-1">
                  On track
                </EhPill>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: "Project progress", value: 68 },
                { label: "Timesheet", value: 94 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#64748B] font-medium">{row.label}</span>
                    <span className="font-bold text-[#0F172A]">{row.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#E8E6E1] overflow-hidden">
                    <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </EhCard>
        </div>

        {/* Right column: Daily cover + quick actions */}
        <div className="xl:col-span-3 space-y-4">
          <EhCard className="overflow-hidden">
            <div className="px-3 pt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#0F172A]">
              <Sparkles className="h-3.5 w-3.5 text-[#0EA5B7]" /> Daily Cover
            </div>
            <div
              className="mx-3 mt-2 rounded-2xl h-28 relative overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: "url(/matanho-login-bg.jpg)" }}
            >
              <div className="absolute inset-0 bg-[#0F172A]/45" />
              <div className="relative z-10 p-3 text-white">
                <p className="text-[10px] font-semibold tracking-wider opacity-90">GOOD MORNING, {ehUser.firstName.toUpperCase()}</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-[11px] font-bold text-[#0EA5B7] tracking-wide">MOOD: DEEP FOCUS</p>
              <p className="text-[12px] text-[#334155]">
                <span className="font-semibold text-[#0F172A]">Intention:</span> Make complex things feel simple.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <EhPill>3 priorities</EhPill>
                <EhPill>2h 30m focus</EhPill>
                <EhPill tone="cyan">74% goals</EhPill>
              </div>
              <EhButton variant="outline" className="w-full mt-2 h-9 text-xs" onClick={() => router.push(EH_SECONDARY.cover)}>
                Create today&apos;s cover
              </EhButton>
            </div>
          </EhCard>

          <EhCard className="p-2">
            <p className="px-2 pt-1 pb-2 text-[12px] font-bold text-[#0F172A]">Quick actions</p>
            {[
              { label: "Start task", href: "/employee-hub/work" },
              { label: "Log time", href: "/performance/timesheets" },
              { label: "Request leave", href: "/employee-hub/services" },
              { label: "Find a colleague", href: "/employee-hub/people" },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => router.push(a.href)}
                className="w-full flex items-center justify-between px-2 py-2.5 rounded-xl text-[13px] font-medium text-[#0F172A] hover:bg-[#F7F6F3]"
              >
                {a.label}
                <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
              </button>
            ))}
          </EhCard>
        </div>
      </div>

      {/* What's happening */}
      <div>
        <EhSectionTitle
          title="What's happening"
          action={
            <Link href="/employee-hub/news" className="text-[12px] font-semibold text-[#0EA5B7] hover:underline">
              View all
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ehFeedCards.map((card) => (
            <EhCard key={card.id} className="overflow-hidden" onClick={() => router.push(card.href)}>
              <div
                className={cn(
                  "h-28 bg-gradient-to-br",
                  card.type === "News" && "from-[#0EA5B7] to-[#0369A1]",
                  card.type === "Newsletter" && "from-[#1E293B] to-[#0EA5B7]",
                  card.type === "Forum" && "from-[#334155] to-[#64748B]"
                )}
              />
              <div className="p-3">
                <EhPill tone={card.type === "News" ? "cyan" : card.type === "Newsletter" ? "azure" : "neutral"}>
                  {card.type}
                </EhPill>
                <p className="mt-2 text-[13px] font-bold text-[#0F172A] leading-snug line-clamp-2">{card.title}</p>
                {"author" in card && card.author && (
                  <p className="mt-1 text-[11px] text-[#94A3B8]">by {card.author}</p>
                )}
                {card.type === "Forum" && (
                  <p className="mt-2 text-[12px] font-semibold text-[#0EA5B7]">Join discussion</p>
                )}
              </div>
            </EhCard>
          ))}
          <EhCard className="overflow-hidden opacity-80">
            <div className="h-28 bg-gradient-to-br from-[#94A3B8] to-[#475569]" />
            <div className="p-3">
              <EhPill>Events</EhPill>
              <p className="mt-2 text-[13px] font-bold text-[#0F172A]">Leadership offsite · Friday</p>
            </div>
          </EhCard>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-4 border-t border-[#E8E6E1]">
        <p className="text-sm text-[#64748B]">Everything you need, one calm place.</p>
        <EhButton
          variant="outline"
          className="h-9"
          onClick={() => toast("Customise home", { description: "Widget preferences saved locally in this mock." })}
        >
          <Settings2 className="h-4 w-4" /> Customise home
        </EhButton>
      </div>
    </div>
  )
}
