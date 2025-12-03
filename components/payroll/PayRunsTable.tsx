"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiCalendar, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function PayRunsTable() {
  const { payRuns, groups } = useAppSelector(s => s.payroll)

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiCalendar className="w-5 h-5" /> Pay Runs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search pay runs..."
          filterLabel="Status"
          filterOptions={[{ label: "All", value: "all" }, { label: "Draft", value: "DRAFT" }, { label: "Posted", value: "POSTED" }]}
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(payRuns, 5).current.map(run => {
                const grp = groups.find(g => g.id === run.payGroupId)
                return (
                  <TableRow key={run.id}>
                    <TableCell>{run.name}</TableCell>
                    <TableCell>{grp?.name}</TableCell>
                    <TableCell>{run.periodStart} → {run.periodEnd}</TableCell>
                    <TableCell>{run.payoutDate}</TableCell>
                    <TableCell>{run.status}</TableCell>
                    <TableCell>${run.statistics.grossTotal.toLocaleString()}</TableCell>
                    <TableCell>${run.statistics.netTotal.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ActionIconButton title="Open"><CiRead className="w-4 h-4" /></ActionIconButton>
                        <ActionIconButton title="More"><CiSquareMore className="w-4 h-4" /></ActionIconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {(() => { const { page, setPage, totalPages } = usePagination(payRuns, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


