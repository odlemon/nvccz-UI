"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useLpPortal } from "@/components/lp-portal/lp-portal-context"
import { LpPortalSidebar } from "@/components/layout/lp-portal-sidebar"
import { portalDocuments } from "@/lib/lp-portal/mock-data"
import { useAppDispatch } from "@/lib/store"
import { logoutUser } from "@/lib/store/slices/authSlice"

const navigationResults = [
  { label: "Dashboard", detail: "Portfolio overview", href: "/lp-portal", icon: Building2 },
  { label: "Capital Activity", detail: "Calls and distributions", href: "/lp-portal/capital-activity", icon: Building2 },
  { label: "Performance", detail: "Investment value history", href: "/lp-portal/performance", icon: Building2 },
  { label: "Documents", detail: "Reports and notices", href: "/lp-portal/documents", icon: FileText },
  { label: "Account Activity", detail: "Transactions and statements", href: "/lp-portal/account-activity", icon: Building2 },
  { label: "Requests", detail: "Open investor requests", href: "/lp-portal/requests", icon: FileText },
]

function PortalSearch({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const results = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return navigationResults.slice(0, 4)
    const pages = navigationResults.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(term))
    const documents = portalDocuments
      .filter((document) => `${document.name} ${document.category}`.toLowerCase().includes(term))
      .map((document) => ({
        label: document.name,
        detail: document.category,
        href: `/lp-portal/documents?document=${document.id}`,
        icon: FileText,
      }))
    return [...pages, ...documents].slice(0, 6)
  }, [query])

  const goTo = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) goTo(results[0].href)
            }}
            type="search"
            aria-label="Global portal search"
            placeholder={mobile ? "Search portal..." : "Search funds, investments, documents..."}
            className="h-9 rounded-full border-slate-200 bg-white pl-4 pr-10 text-[11px] shadow-none placeholder:text-slate-400"
          />
          <Search className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={7}
        className="w-[var(--radix-popover-trigger-width)] rounded-xl border-slate-200 p-1.5 shadow-lg"
      >
        {results.length ? (
          results.map((result) => {
            const Icon = result.icon
            return (
              <button
                key={`${result.href}-${result.label}`}
                type="button"
                onClick={() => goTo(result.href)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-slate-800">{result.label}</span>
                  <span className="block truncate text-[9px] text-slate-500">{result.detail}</span>
                </span>
              </button>
            )
          })
        ) : (
          <p className="px-3 py-5 text-center text-[11px] text-slate-500">No matching results</p>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function LpPortalTopbar() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = React.useState(false)
  const dispatch = useAppDispatch()
  const {
    funds,
    selectedFundId,
    setSelectedFundId,
    asOfDate,
    setAsOfDate,
    valuationStatus,
    unreadCounts,
  } = useLpPortal()

  const handleLogout = async () => {
    await dispatch(logoutUser())
    window.location.href = "/login"
  }

  const formattedAsOfDate = React.useMemo(
    () => new Date(`${asOfDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    [asOfDate],
  )

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4 lg:gap-3 lg:px-5">
        <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full lg:hidden" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[288px] p-0 sm:max-w-[288px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Investor Portal navigation</SheetTitle>
            </SheetHeader>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10 rounded-full" aria-label="Close navigation">
                <X className="size-4" />
              </Button>
            </SheetClose>
            <LpPortalSidebar mobile onNavigate={() => setMobileNavigationOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden min-w-[240px] max-w-[420px] flex-1 md:block">
          <PortalSearch />
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 lg:gap-2.5">
          <Select value={selectedFundId} onValueChange={setSelectedFundId}>
            <SelectTrigger size="sm" className="h-9 w-[132px] rounded-full border-slate-200 px-3 text-[11px] shadow-none sm:w-[154px]">
              <Building2 className="size-3.5 shrink-0 text-blue-600" />
              <SelectValue placeholder="Select fund" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Funds</SelectItem>
              {funds.map((fund) => (
                <SelectItem key={fund.id} value={fund.id}>{fund.shortName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="relative hidden h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[10px] text-slate-600 md:flex">
            <span className="font-medium">As of</span>
            <span className="min-w-[86px] text-[11px] font-semibold text-slate-800">{formattedAsOfDate}</span>
            <CalendarDays className="size-3.5 text-slate-400" />
            <input
              type="date"
              value={asOfDate}
              onChange={(event) => setAsOfDate(event.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Valuation as-of date"
            />
          </label>

          <div className="hidden h-9 min-w-[118px] flex-col justify-center rounded-lg border border-slate-200 bg-white px-3 lg:flex">
            <span className="text-[7px] font-medium uppercase tracking-[0.04em] text-slate-400">Valuation status</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
              <i className="size-1.5 rounded-full bg-emerald-500" />
              {valuationStatus}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative size-9 shrink-0 rounded-full" aria-label={`${unreadCounts.notifications} unread notifications`}>
                <Bell className="size-[18px] text-slate-600" />
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold leading-none text-white">
                  {unreadCounts.notifications}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-xl">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-[10px] font-normal text-blue-600">{unreadCounts.notifications} new</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/lp-portal/capital-activity" className="items-start py-2.5">
                  <span>
                    <b className="block text-xs">Capital call due</b>
                    <span className="text-[10px] text-slate-500">Arcus Growth Fund V, L.P.</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/lp-portal/documents" className="items-start py-2.5">
                  <span>
                    <b className="block text-xs">New document available</b>
                    <span className="text-[10px] text-slate-500">Q1 2025 report</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/lp-portal/requests" className="items-start py-2.5">
                  <span>
                    <b className="block text-xs">KYC update required</b>
                    <span className="text-[10px] text-slate-500">Organisation profile</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/lp-portal/notices">View all notifications</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-11 min-w-0 rounded-full px-1 sm:pr-2">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-blue-700 text-[10px] font-semibold text-white">JS</AvatarFallback>
                </Avatar>
                <span className="hidden min-w-0 text-left lg:block">
                  <span className="block truncate text-[11px] font-semibold leading-4 text-slate-800">Jane Smith</span>
                  <span className="block max-w-[158px] truncate text-[8px] font-normal leading-3 text-slate-500">Arcus Capital Partners LP</span>
                </span>
                <ChevronDown className="hidden size-3.5 shrink-0 text-slate-400 lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl">
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">Jane Smith</p>
                <p className="text-xs font-normal text-slate-500">Arcus Capital Partners LP</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/lp-portal/settings"><UserRound className="mr-2 size-4" />My profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/lp-portal/settings"><Settings className="mr-2 size-4" />Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 size-4" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2 md:hidden">
        <PortalSearch mobile />
        <label className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500">
          <CalendarDays className="size-4" />
          <input
            type="date"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
            className="sr-only"
            aria-label="Valuation as-of date"
          />
        </label>
      </div>
    </header>
  )
}
