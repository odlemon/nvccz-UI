"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiViewTable, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function GroupsTable() {
  const { groups, schedules } = useAppSelector(s => s.payroll)

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiViewTable className="w-5 h-5" /> Pay Groups
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search groups..."
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(groups, 5).current.map(g => {
                const sched = schedules.find(s => s.id === g.scheduleId)
                return (
                  <TableRow key={g.id}>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{sched?.name}</TableCell>
                    <TableCell>{g.currencyId}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ActionIconButton title="View"><CiRead className="w-4 h-4" /></ActionIconButton>
                        <ActionIconButton title="More"><CiSquareMore className="w-4 h-4" /></ActionIconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {(() => { const { page, setPage, totalPages } = usePagination(groups, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


