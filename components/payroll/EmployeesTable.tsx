"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiUser, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function EmployeesTable() {
  const { employees, groups } = useAppSelector(s => s.payroll)

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiUser className="w-5 h-5" /> Employees
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search employees..."
          filterLabel="Group"
          filterOptions={[{ label: "All", value: "all" }]}
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(employees, 5).current.map(emp => {
                const grp = groups.find(g => g.id === emp.employment.payGroupId)
                return (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.employment.jobTitle}</TableCell>
                    <TableCell>{grp?.name}</TableCell>
                    <TableCell>{emp.banking.bankName}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ActionIconButton title="View"><CiRead className="w-4 h-4" /></ActionIconButton>
                        <ActionIconButton title="Actions"><CiSquareMore className="w-4 h-4" /></ActionIconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {(() => { const { page, setPage, totalPages } = usePagination(employees, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


