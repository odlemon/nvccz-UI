"use client"

import * as React from "react"
import {
  Building2,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Role = "Investor Admin" | "Viewer" | "Signatory"
type UserStatus = "Active" | "Invited" | "Suspended"
type BankStatus =
  | "Active"
  | "Submitted"
  | "Under Verification"
  | "Approved"
  | "Rejected"

type Colleague = {
  id: string
  name: string
  email: string
  role: Role
  funds: number
  mfa: boolean
  status: UserStatus
  lastActive: string
}

type BankChange = {
  id: string
  fund: string
  requestedBy: string
  submittedAt: string
  status: BankStatus
  maskedAccount: string
}

const COLLEAGUES: Colleague[] = [
  {
    id: "u-1",
    name: "Jane Smith",
    email: "jane.smith@arcuscapital.com",
    role: "Investor Admin",
    funds: 5,
    mfa: true,
    status: "Active",
    lastActive: "May 28, 2025 3:12 PM",
  },
  {
    id: "u-2",
    name: "Tawanda Moyo",
    email: "t.moyo@arcuscapital.com",
    role: "Viewer",
    funds: 3,
    mfa: true,
    status: "Active",
    lastActive: "May 27, 2025 11:05 AM",
  },
  {
    id: "u-3",
    name: "Nyasha Chikore",
    email: "n.chikore@arcuscapital.com",
    role: "Signatory",
    funds: 2,
    mfa: true,
    status: "Active",
    lastActive: "May 26, 2025 9:40 AM",
  },
  {
    id: "u-4",
    name: "Rudo Maposa",
    email: "r.maposa@arcuscapital.com",
    role: "Viewer",
    funds: 2,
    mfa: false,
    status: "Invited",
    lastActive: "—",
  },
]

const BANK_CHANGES: BankChange[] = [
  {
    id: "b-1",
    fund: "Arcus Growth Fund V, L.P.",
    requestedBy: "Jane Smith",
    submittedAt: "May 22, 2025",
    status: "Under Verification",
    maskedAccount: "•••• 4821",
  },
  {
    id: "b-2",
    fund: "Arcus Strategic Income Fund L.P.",
    requestedBy: "Nyasha Chikore",
    submittedAt: "Apr 8, 2025",
    status: "Active",
    maskedAccount: "•••• 1194",
  },
]

const ROLE_STYLE: Record<Role, string> = {
  "Investor Admin": "bg-[#dbeafe] text-[#1d4ed8]",
  Viewer: "bg-[#f3f4f6] text-[#4b5563]",
  Signatory: "bg-[#ede9fe] text-[#6d28d9]",
}

const USER_STATUS: Record<UserStatus, string> = {
  Active: "bg-[#dcfce7] text-[#15803d]",
  Invited: "bg-[#e0f2fe] text-[#0369a1]",
  Suspended: "bg-[#fee2e2] text-[#b91c1c]",
}

const BANK_STATUS: Record<BankStatus, string> = {
  Active: "bg-[#dcfce7] text-[#15803d]",
  Submitted: "bg-[#e0f2fe] text-[#0369a1]",
  "Under Verification": "bg-[#ffedd5] text-[#c2410c]",
  Approved: "bg-[#dbeafe] text-[#1d4ed8]",
  Rejected: "bg-[#fee2e2] text-[#b91c1c]",
}

export function LpOrganisationScreen() {
  const [query, setQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [selectedId, setSelectedId] = React.useState(COLLEAGUES[0].id)

  const filtered = COLLEAGUES.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      if (!`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const selected = filtered.find((u) => u.id === selectedId) ?? filtered[0] ?? null

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a]">My Organisation</h1>
          <p className="mt-1.5 text-[13px] leading-5 text-[#6b7280]">
            Manage users, roles, fund entitlements, and bank instruction changes.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 rounded-full bg-[#2563eb] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
          onClick={() => toast.message("Invite colleague (mock).")}
        >
          <UserPlus className="size-3.5" />
          Invite User
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Organisation",
            value: "Arcus Capital Partners LP",
            helper: "Investor entity",
            icon: <Building2 className="size-4" />,
            bg: "bg-[#dbeafe]",
            color: "text-[#2563eb]",
          },
          {
            label: "Authorised Users",
            value: "4",
            helper: "3 active · 1 invited",
            icon: <UserPlus className="size-4" />,
            bg: "bg-[#ede9fe]",
            color: "text-[#7c3aed]",
          },
          {
            label: "Fund Entitlements",
            value: "5",
            helper: "Across private capital & open-ended",
            icon: <CheckCircle2 className="size-4" />,
            bg: "bg-[#dcfce7]",
            color: "text-[#16a34a]",
          },
          {
            label: "MFA Coverage",
            value: "75%",
            helper: "3 of 4 users enabled",
            icon: <ShieldCheck className="size-4" />,
            bg: "bg-[#ffedd5]",
            color: "text-[#ea580c]",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <span className={cn("flex size-8 items-center justify-center rounded-full", card.bg, card.color)}>
              {card.icon}
            </span>
            <p className="mt-3 text-[12px] font-medium text-[#6b7280]">{card.label}</p>
            <p className="mt-1 text-[18px] font-bold tracking-tight text-[#0f172a]">{card.value}</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-[150px] rounded-full border-[#e5e7eb] text-[12px] shadow-none">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Investor Admin">Investor Admin</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
                <SelectItem value="Signatory">Signatory</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="h-9 rounded-full border-[#e5e7eb] pl-9 text-[12px] shadow-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafafa] text-[11px] font-semibold text-[#6b7280]">
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Funds</th>
                  <th className="px-3 py-2.5">MFA</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Last Active</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const active = selected?.id === user.id
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedId(user.id)}
                      className={cn(
                        "cursor-pointer border-b border-[#f3f4f6] last:border-0",
                        active
                          ? "bg-[#eff6ff] shadow-[inset_3px_0_0_0_#2563eb]"
                          : "hover:bg-[#f9fafb]",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-[#2563eb] text-[11px] font-semibold text-white">
                              {user.name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-[#111827]">{user.name}</p>
                            <p className="text-[11px] text-[#9ca3af]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            ROLE_STYLE[user.role],
                          )}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-[#374151]">{user.funds}</td>
                      <td className="px-3 py-3">
                        {user.mfa ? (
                          <span className="inline-flex items-center gap-1 font-medium text-[#15803d]">
                            <ShieldCheck className="size-3.5" /> Enabled
                          </span>
                        ) : (
                          <span className="text-[#c2410c]">Not set</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            USER_STATUS[user.status],
                          )}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#4b5563]">{user.lastActive}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="rounded-full p-1.5 text-[#6b7280] hover:bg-[#f3f4f6]"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Actions for ${user.name}`}
                            >
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => toast.message("Edit role (mock).")}>
                              Edit role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.message("Manage fund access (mock).")}>
                              Manage fund access
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.message("Suspend user (mock).")}>
                              Suspend user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <aside className="space-y-4">
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-[14px] font-semibold text-[#111827]">User Details</h2>
              <dl className="mt-3 space-y-2.5 text-[12px]">
                {[
                  ["Name", selected.name],
                  ["Email", selected.email],
                  ["Role", selected.role],
                  ["Funds", String(selected.funds)],
                  ["MFA", selected.mfa ? "Enabled" : "Not set"],
                  ["Status", selected.status],
                  ["Last Active", selected.lastActive],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[90px_1fr] gap-2">
                    <dt className="text-[#9ca3af]">{label}</dt>
                    <dd className="font-medium text-[#111827]">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 rounded-lg border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-[11px] leading-4 text-[#1d4ed8]">
                Fund access must remain a subset of organisation entitlements.
              </p>
            </section>
          </aside>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f5f9] px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[#111827]">Bank Instruction Changes</h2>
            <p className="mt-0.5 text-[12px] text-[#6b7280]">
              Changes never activate immediately — MFA and verification are required.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-[#e5e7eb] px-4 text-[12px] font-medium shadow-none"
            onClick={() => toast.message("Request bank change (mock).")}
          >
            <Plus className="size-3.5" />
            Request Change
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#fafafa] text-[11px] font-semibold text-[#6b7280]">
                <th className="px-4 py-2.5">Fund</th>
                <th className="px-3 py-2.5">Account</th>
                <th className="px-3 py-2.5">Requested By</th>
                <th className="px-3 py-2.5">Submitted</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {BANK_CHANGES.map((row) => (
                <tr key={row.id} className="border-b border-[#f3f4f6] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#111827]">{row.fund}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-[#4b5563]">{row.maskedAccount}</td>
                  <td className="px-3 py-3 text-[#4b5563]">{row.requestedBy}</td>
                  <td className="px-3 py-3 text-[#4b5563]">{row.submittedAt}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        BANK_STATUS[row.status],
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
