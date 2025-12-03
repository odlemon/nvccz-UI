"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiWallet, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function PaymentsTable() {
  const { paymentBatches, employees } = useAppSelector(s => s.payroll)
  const batch = paymentBatches[0]

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiWallet className="w-5 h-5" /> Payment Batch
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search payments..."
          filterLabel="Status"
          filterOptions={[{ label: "All", value: "all" }, { label: "Pending", value: "PENDING" }, { label: "Completed", value: "COMPLETED" }]}
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(batch.payments, 5).current.map(p => {
                const emp = employees.find(e => e.id === p.employeeId)
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{emp?.firstName} {emp?.lastName}</TableCell>
                    <TableCell>${p.amount.toLocaleString()}</TableCell>
                    <TableCell>{batch.status}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ActionIconButton title="Pay"><CiRead className="w-4 h-4" /></ActionIconButton>
                        <ActionIconButton title="Details"><CiSquareMore className="w-4 h-4" /></ActionIconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {(() => { const { page, setPage, totalPages } = usePagination(batch.payments, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


