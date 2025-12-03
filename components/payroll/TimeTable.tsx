"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiViewTable, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function TimeTable() {
  const { timeSheets, employees } = useAppSelector(s => s.payroll)
  const ts = timeSheets[0]

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiViewTable className="w-5 h-5" /> Time & Leave
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search time entries..."
          filterLabel="Status"
          filterOptions={[{ label: "All", value: "all" }, { label: "Approved", value: "APPROVED" }, { label: "Draft", value: "DRAFT" }]}
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(ts.entries, 5).current.map((e, idx) => {
                const emp = employees.find(x => x.id === ts.employeeId)
                return (
                  <TableRow key={idx}>
                    <TableCell>{emp?.firstName} {emp?.lastName}</TableCell>
                    <TableCell>{ts.periodStart} → {ts.periodEnd}</TableCell>
                    <TableCell>{ts.status}</TableCell>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>{e.hours}</TableCell>
                    <TableCell>{e.type}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ActionIconButton title="Approve"><CiRead className="w-4 h-4" /></ActionIconButton>
                        <ActionIconButton title="Details"><CiSquareMore className="w-4 h-4" /></ActionIconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {(() => { const { page, setPage, totalPages } = usePagination(ts.entries, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


