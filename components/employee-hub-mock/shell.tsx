"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  Home,
  LayoutGrid,
  LifeBuoy,
  Mail,
  MessagesSquare,
  Newspaper,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { eh } from "@/lib/employee-hub-mock/tokens"
import { EH_NAV_ITEMS, EH_SECONDARY } from "@/lib/employee-hub-mock/nav"
import { ehUser } from "@/lib/employee-hub-mock/fixtures"
import { EhAvatar, EhButton } from "@/components/employee-hub-mock/primitives"

const ICONS: Record<string, ReactNode> = {
  Home: <Home className="h-4 w-4" />,
  Newspaper: <Newspaper className="h-4 w-4" />,
  Mail: <Mail className="h-4 w-4" />,
  MessagesSquare: <MessagesSquare className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  LifeBuoy: <LifeBuoy className="h-4 w-4" />,
  LayoutGrid: <LayoutGrid className="h-4 w-4" />,
}

function isActive(pathname: string, href: string) {
  if (href === "/employee-hub") return pathname === "/employee-hub"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function EmployeeHubSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "shrink-0 border-r bg-white flex flex-col min-h-[calc(100vh-5rem)] sticky top-20 transition-all",
        collapsed ? "w-[72px]" : "w-[220px]"
      )}
      style={{ borderColor: eh.border }}
    >
      <div className={cn("px-3 pt-4 pb-3", collapsed && "px-2")}>
        <Link href="/employee-hub" className="flex items-center gap-2 px-1">
          <Image src="/new_logo.png" alt="Matanho" width={120} height={36} className={cn("h-8 w-auto object-contain", collapsed && "hidden")} />
          {collapsed && (
            <span className="h-8 w-8 rounded-lg bg-[#0EA5B7] text-white text-xs font-bold inline-flex items-center justify-center">M</span>
          )}
        </Link>
        {!collapsed && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-[#F7F6F3] px-2.5 py-2">
            <EhAvatar initials={ehUser.initials} size="sm" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#0F172A] truncate">{ehUser.fullName}</p>
              <p className="text-[10px] text-[#64748B] truncate">{ehUser.title}</p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {EH_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors",
                active ? "bg-[#E6F7F9] text-[#0E7490]" : "text-[#334155] hover:bg-[#F7F6F3]",
                collapsed && "justify-center px-0"
              )}
              title={item.label}
            >
              <span className={cn(active ? "text-[#0EA5B7]" : "text-[#64748B]")}>{ICONS[item.icon]}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t space-y-0.5" style={{ borderColor: eh.border }}>
        <button
          type="button"
          onClick={() => toast("Settings", { description: "Hub preferences open here." })}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium text-[#334155] hover:bg-[#F7F6F3]",
            collapsed && "justify-center px-0"
          )}
        >
          <Settings className="h-4 w-4 text-[#64748B]" />
          {!collapsed && "Settings"}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium text-[#334155] hover:bg-[#F7F6F3]",
            collapsed && "justify-center px-0"
          )}
        >
          <ChevronsLeft className={cn("h-4 w-4 text-[#64748B] transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  )
}

export function EmployeeHubTopChrome() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  const createItems = useMemo(
    () => [
      { label: "Daily cover", href: EH_SECONDARY.cover },
      { label: "Newsletter draft", href: EH_SECONDARY.newsletterEditor },
      { label: "Forum post", href: "/employee-hub/forums" },
      { label: "Leave request", href: "/employee-hub/services" },
    ],
    []
  )

  return (
    <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-md" style={{ borderColor: eh.border }}>
      <div className="flex items-center gap-3 px-4 lg:px-5 h-14">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(`${EH_SECONDARY.search}?q=${encodeURIComponent(q)}`)
              }
            }}
            placeholder="Search Arcus or ask AI..."
            className="w-full h-10 pl-10 pr-16 rounded-full border bg-[#F7F6F3] text-sm outline-none focus:border-[#0EA5B7] focus:bg-white"
            style={{ borderColor: eh.border }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#94A3B8] border border-[#E8E6E1] rounded-md px-1.5 py-0.5">
            ⌘ K
          </span>
        </div>

        <button
          type="button"
          data-arcus-modules
          onClick={() => window.__openArcusAppSwitcher?.()}
          className="inline-flex items-center gap-2 h-10 px-3 rounded-full border bg-white text-sm font-medium text-[#334155] hover:bg-[#F7F6F3]"
          style={{ borderColor: eh.border }}
          aria-label="Switch module"
          title="Switch module"
        >
          <LayoutGrid className="h-4 w-4 text-[#0EA5B7]" />
          <span className="hidden sm:inline">Modules</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
        </button>

        <div className="relative">
          <EhButton onClick={() => setCreateOpen((v) => !v)} className="h-10">
            <Plus className="h-4 w-4" /> Create <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </EhButton>
          {createOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border bg-white shadow-lg p-1.5 z-30" style={{ borderColor: eh.border }}>
              {createItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-[#0F172A] hover:bg-[#F7F6F3]"
                  onClick={() => {
                    setCreateOpen(false)
                    router.push(item.href)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push(EH_SECONDARY.search)}
          className="relative h-10 w-10 rounded-full border bg-white inline-flex items-center justify-center text-[#64748B] hover:bg-[#F7F6F3]"
          style={{ borderColor: eh.border }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-[#DC2626] text-white text-[9px] font-bold inline-flex items-center justify-center">
            3
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push(EH_SECONDARY.profile)}
          className="rounded-full"
          aria-label="Profile"
        >
          <EhAvatar initials={ehUser.initials} />
        </button>
      </div>
    </div>
  )
}

export function EmployeeHubShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: eh.canvas }}>
      <EmployeeHubSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <EmployeeHubTopChrome />
        <div className="flex-1 min-w-0 overflow-auto">{children}</div>
      </div>
    </div>
  )
}

export function AskAiLink({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0EA5B7] hover:underline underline-offset-2"
    >
      <Sparkles className="h-4 w-4" /> Ask Arcus AI
    </button>
  )
}
