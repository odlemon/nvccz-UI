"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CiCirclePlus, CiDollar, CiReceipt } from "react-icons/ci"
import { format } from "date-fns"
import { AddExpenseDialog } from "@/components/events/add-expense-dialog"

interface EventExpensesTabProps {
  eventId: string
}

export function EventExpensesTab({ eventId }: EventExpensesTabProps) {
  const dispatch = useAppDispatch()
  const { currentEventExpenses, currentEvent, loading } = useAppSelector(
    (state) => state.events
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const totalExpenses = currentEventExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const approvedBudget = currentEvent?.approvedBudget ? Number(currentEvent.approvedBudget) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "PAID":
        return "bg-green-100 text-green-700 border-green-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Expenses</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <CiDollar size={16} className="text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal text-white">${(totalExpenses / 1000).toFixed(1)}K</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-white/80">{currentEventExpenses.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <span className="text-white text-sm font-bold">%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal">
              {approvedBudget > 0 ? `${((totalExpenses / approvedBudget) * 100).toFixed(1)}%` : "N/A"}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground">
                ${totalExpenses.toLocaleString()} of ${approvedBudget.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Remaining Budget</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <span className="text-white text-sm font-bold">-</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-5xl font-normal ${
              approvedBudget - totalExpenses >= 0 ? "text-white" : "text-red-300"
            }`}>
              ${((approvedBudget - totalExpenses) / 1000).toFixed(1)}K
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-white/80">
                {approvedBudget > 0
                  ? `${(((approvedBudget - totalExpenses) / approvedBudget) * 100).toFixed(1)}% left`
                  : "No budget"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Expenses</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal">
              {currentEventExpenses.filter((e) => e.status === "APPROVED").length}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground">
                Out of {currentEventExpenses.length} total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Event Expenses</h3>
          <p className="text-sm text-muted-foreground">Track all expenses for this event</p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          variant="gradient-create"
          className="gap-2 rounded-full h-10 px-6 shadow-sm"
        >
          <CiCirclePlus size={20} />
          Record Expense
        </Button>
      </div>

      {/* Expenses Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentEventExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {format(new Date(expense.paymentDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{expense.description}</div>
                    {expense.receiptPath && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <CiReceipt size={14} />
                        Receipt attached
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{expense.category}</Badge>
                </TableCell>
                <TableCell>{expense.vendor || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase">
                    {expense.paymentMethod}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${Number(expense.amount).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(expense.status)}>{expense.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {currentEventExpenses.length === 0 && (
          <div className="text-center py-12">
            <CiDollar size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No expenses recorded yet</p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              variant="gradient-create"
              className="mt-4 gap-2 rounded-full h-10 px-6 shadow-sm"
            >
              <CiCirclePlus size={20} />
              Record First Expense
            </Button>
          </div>
        )}
      </Card>

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        eventId={eventId}
      />
    </div>
  )
}
