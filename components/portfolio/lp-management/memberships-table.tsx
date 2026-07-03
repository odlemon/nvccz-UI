"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchMemberships } from "@/lib/store/slices/lpPortalAdminSlice"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { LP_MANAGEMENT_ACTIONS } from "@/lib/config/role-permissions"
import type { LpPortalMembership } from "@/lib/api/lp-portal-admin-api"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { InviteMembershipDialog } from "./invite-membership-dialog"
import { RevokeMembershipDialog } from "./revoke-membership-dialog"

const PAGE_SIZE = 15

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">—</Badge>
  }
  return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{status}</Badge>
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString()
}

export function MembershipsTable() {
  const dispatch = useAppDispatch()
  const { memberships, membershipsLoading, membershipsError } = useAppSelector((s) => s.lpPortalAdmin)
  const { hasSpecificAction } = useRolePermissions()
  const canRevoke = hasSpecificAction("portfolio-management", LP_MANAGEMENT_ACTIONS.REVOKE_LP_MEMBER)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchMemberships())
  }, [dispatch])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return memberships
    return memberships.filter((m: LpPortalMembership) =>
      (m.clientLegalName || "").toLowerCase().includes(q) ||
      (m.userEmail || "").toLowerCase().includes(q) ||
      (m.lpRole || "").toLowerCase().includes(q)
    )
  }, [memberships, search])

  useEffect(() => { setPage(1) }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const pageNumbers = useMemo(() => {
    const delta = 2
    const start = Math.max(1, safePage - delta)
    const end = Math.min(totalPages, safePage + delta)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {memberships.length} memberships · {filtered.length} shown
          </p>
        </div>
        <InviteMembershipDialog />
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search client, email, role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs rounded-full border-gray-200 bg-white"
        />
      </div>

      {membershipsLoading ? (
        <Card className="bg-white border border-gray-200 shadow-none p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </Card>
      ) : membershipsError ? (
        <Card className="bg-white border border-gray-200 shadow-none p-8 text-center">
          <p className="text-sm text-red-600">{membershipsError}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-white border border-gray-200 shadow-none">
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {search ? "No memberships match your search" : "No LP Memberships Yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
              {search
                ? "Try adjusting your search terms."
                : "Invite an LP member to grant portal access to a linked client."}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="bg-white border border-gray-200 shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">LP Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Funds</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Created</th>
                  {canRevoke && (
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((m) => (
                  <tr key={m.membershipId} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{m.clientLegalName || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{m.userEmail || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{m.lpRole || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {m.fundIds && m.fundIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.fundIds.map((id) => (
                            <Badge key={id} variant="outline" className="font-mono text-[10px]">
                              {id}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(m.createdAt)}</td>
                    {canRevoke && (
                      <td className="px-4 py-3 text-right">
                        <RevokeMembershipDialog membership={m} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages} · {filtered.length} memberships
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full bg-white"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                {pageNumbers.map((n) => (
                  <Button
                    key={n}
                    variant={safePage === n ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 rounded-full text-xs ${safePage === n ? "gradient-primary text-white" : "bg-white"}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full bg-white"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
