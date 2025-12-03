"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiViewTable, CiRead, CiSquareMore } from "react-icons/ci"
import { TableToolbar } from "@/components/payroll/TableToolbar"
import { ActionIconButton } from "@/components/payroll/ActionIconButton"
import { Pagination, usePagination } from "@/components/payroll/Pagination"

export function ComponentsTable() {
  const { components } = useAppSelector(s => s.payroll)

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CiViewTable className="w-5 h-5" /> Pay Components
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchPlaceholder="Search components..."
          filterLabel="Type"
          filterOptions={[{ label: "All", value: "all" }, { label: "Earning", value: "EARNING" }, { label: "Deduction", value: "DEDUCTION" }, { label: "Contribution", value: "CONTRIBUTION" }]}
        />
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Formula</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usePagination(components, 5).current.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.calculation.method}</TableCell>
                  <TableCell>{c.calculation.formula || "-"}</TableCell>
                  <TableCell>{c.active ? "Yes" : "No"}</TableCell>
                  <TableCell>{c.priority}</TableCell>
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
        {(() => { const { page, setPage, totalPages } = usePagination(components, 5); return (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        ) })()}
      </CardContent>
    </Card>
  )
}


