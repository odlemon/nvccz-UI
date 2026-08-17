"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  CreditCard,
  FileBarChart,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ac } from "@/lib/accounting-mock/tokens"
import { AC_NAV_ITEMS } from "@/lib/accounting-mock/nav"
import { acCurrency, acEntity, acFxRate, acFxRateDetail, acPeriod } from "@/lib/accounting-mock/fixtures"

const ICONS: Record<string, ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Wallet: <Wallet className="h-4 w-4" />,
  Receipt: <Receipt className="h-4 w-4" />,
  ShoppingCart: <ShoppingCart className="h-4 w-4" />,
  ArrowLeftRight: <ArrowLeftRight className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  Package: <Package className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
  Landmark: <Landmark className="h-4 w-4" />,
  FileBarChart: <FileBarChart className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
}

function isActive(pathname: string, href: string) {
  if (href === "/accounting-v2") return pathname === "/accounting-v2"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AccountingMockSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col h-full min-h-0 overflow-hidden transition-all text-white",
        collapsed ? "w-[72px]" : "w-[220px]"
      )}
      style={{ backgroundColor: ac.navy }}
    >
      <div className={cn("px-3 pt-4 pb-3 border-b border-white/10", collapsed && "px-2")}>
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-white/70">ARCUS</p>
              <p className="text-[13px] font-bold tracking-tight">ACCOUNTING</p>
            </div>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="h-7 w-7 rounded-md inline-flex items-center justify-center text-white/70 hover:bg-white/10"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {AC_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[12px] font-medium transition-colors",
                active ? "bg-[#2563EB] text-white" : "text-[#CBD5E1] hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-0"
              )}
            >
              {ICONS[item.icon]}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-[#94A3B8] hover:bg-white/5",
            collapsed && "justify-center px-0"
          )}
        >
          <ChevronsLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  )
}

const AC_ENTITIES = [acEntity, "MCP Holdings (Pvt) Ltd", "Mukuru Advisory (Pvt) Ltd"]
const AC_PERIODS = [acPeriod, "June 2026", "May 2026", "April 2026", "FY 2026", "FY 2025"]
const AC_CURRENCIES = [acCurrency, "ZiG"]

/**
 * Context selector — a real dropdown whose trigger is rendered as a pill.
 * The native select sits transparent on top so it stays keyboard accessible.
 */
function AcContextSelect({
  value,
  options,
  onChange,
  icon,
  label,
  className,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  icon?: ReactNode
  label: string
  className?: string
}) {
  return (
    <div className={cn("relative inline-flex items-center shrink-0", className)}>
      <span className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-6 rounded-full border border-[#E5E7EB] bg-white text-[11px] font-medium text-[#0B1739]">
        {icon}
        <span className="truncate max-w-[210px]">{value}</span>
      </span>
      <ChevronDown className="absolute right-2 h-3 w-3 text-[#9CA3AF] pointer-events-none" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

/**
 * Slim context strip under the global topbar. Deliberately holds only the
 * entity / period / currency filters — search, notifications, help and the
 * user menu live in the global topbar and are not duplicated here.
 */
export function AccountingMockTopChrome() {
  const [entity, setEntity] = useState(acEntity)
  const [period, setPeriod] = useState(acPeriod)
  const [currency, setCurrency] = useState(acCurrency)

  return (
    <div className="shrink-0 border-b bg-white" style={{ borderColor: ac.border }}>
      <div className="flex items-center gap-2 px-4 h-11 overflow-x-auto">
        <AcContextSelect
          label="Entity"
          value={entity}
          options={AC_ENTITIES}
          onChange={(v) => {
            setEntity(v)
            toast("Entity", { description: v })
          }}
          icon={<Building2 className="h-3.5 w-3.5 text-[#6B7280]" />}
        />
        <AcContextSelect
          label="Period"
          value={period}
          options={AC_PERIODS}
          onChange={(v) => {
            setPeriod(v)
            toast("Period", { description: v })
          }}
          icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
        />
        <AcContextSelect
          label="Currency"
          value={currency}
          options={AC_CURRENCIES}
          onChange={(v) => {
            setCurrency(v)
            toast("Currency", { description: v })
          }}
        />
        <span className="hidden lg:inline-flex items-baseline gap-1.5 shrink-0 pl-1 text-[10px]">
          <span className="font-semibold text-[#0B1739]">{acFxRate}</span>
          <span className="text-[#9CA3AF]">({acFxRateDetail})</span>
        </span>
      </div>
    </div>
  )
}

export function AccountingMockShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: ac.canvas }}>
      <AccountingMockSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        <AccountingMockTopChrome />
        <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
