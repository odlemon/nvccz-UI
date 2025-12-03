"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiFileOn, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function PayslipsTable() {
  const { payslips, employees } = useAppSelector(s => s.payroll)

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiFileOn className="w-5 h-5" /> Payslips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search payslips..."
          filterLabel="Currency"
          filterOptions={[{ label: "All", value: "all" }, { label: "USD", value: "USD" }]}
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payslip</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(payslips, 5).current.map(ps => {
                const emp = employees.find(e => e.id === ps.employeeId)
                return (
                  <TableRow key={ps.id}>
                    <TableCell>{ps.id}</TableCell>
                    <TableCell>{emp?.firstName} {emp?.lastName}</TableCell>
                    <TableCell>${ps.totals.gross.toLocaleString()}</TableCell>
                    <TableCell>${ps.totals.netPay.toLocaleString()}</TableCell>
                    <TableCell>{ps.currencyId}</TableCell>
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
        {(() => { const { page, setPage, totalPages } = usePagination(payslips, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


