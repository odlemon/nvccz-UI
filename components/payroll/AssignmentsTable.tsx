"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiViewTable, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function AssignmentsTable() {
  const { assignments, employees, components } = useAppSelector(s => s.payroll)

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiViewTable className="w-5 h-5" /> Employee Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search assignments..."
          filterLabel="Component Type"
          filterOptions={[{ label: "All", value: "all" }, { label: "Earning", value: "EARNING" }, { label: "Deduction", value: "DEDUCTION" }, { label: "Contribution", value: "CONTRIBUTION" }]}
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(assignments, 5).current.map(a => {
                const emp = employees.find(e => e.id === a.employeeId)
                const comp = components.find(c => c.id === a.componentId)
                return (
                  <TableRow key={a.id}>
                    <TableCell>{emp?.firstName} {emp?.lastName}</TableCell>
                    <TableCell>{comp?.name}</TableCell>
                    <TableCell>${a.value.amount.toLocaleString()}</TableCell>
                    <TableCell>{a.value.currencyId}</TableCell>
                    <TableCell>{a.effectiveFrom}</TableCell>
                    <TableCell>{a.effectiveTo || "-"}</TableCell>
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
        {(() => { const { page, setPage, totalPages } = usePagination(assignments, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


