"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiViewTable, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function SchedulesTable() {
  const { schedules } = useAppSelector(s => s.payroll)

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiViewTable className="w-5 h-5" /> Pay Schedules
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search schedules..."
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Cutoff</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Pro Rata</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(schedules, 5).current.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.frequency}</TableCell>
                  <TableCell>{s.cutoffDay}</TableCell>
                  <TableCell>{s.payoutDay}</TableCell>
                  <TableCell>{s.proRataBasis}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <ActionIconButton title="View"><CiRead className="w-4 h-4" /></ActionIconButton>
                      <ActionIconButton title="More"><CiSquareMore className="w-4 h-4" /></ActionIconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {(() => { const { page, setPage, totalPages } = usePagination(schedules, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


