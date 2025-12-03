"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { approveBudget } from "@/lib/store/slices/eventsSlice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CiCirclePlus, CiCircleCheck } from "react-icons/ci"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AddBudgetItemDialog } from "../add-budget-item-dialog"
import { type BudgetCategory } from "@/lib/api/events-api"

interface EventBudgetTabProps {
  eventId: string
}

const BUDGET_CATEGORIES: BudgetCategory[] = [
  "VENUE",
  "CATERING",
  "DECORATIONS",
  "ENTERTAINMENT",
  "TRANSPORT",
  "MARKETING",
  "TECHNOLOGY",
  "STAFFING",
  "SECURITY",
  "OTHER"
]

export function EventBudgetTab({ eventId }: EventBudgetTabProps) {
  const dispatch = useAppDispatch()
  const { currentEventBudgetItems, currentEvent, loading } = useAppSelector((state) => state.events)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approvalForm, setApprovalForm] = useState({
    approvedBudget: "",
    notes: ""
  })

  const totalEstimated = currentEventBudgetItems.reduce(
    (sum, item) => sum + Number(item.estimatedCost),
    0
  )

  const totalActual = currentEventBudgetItems.reduce(
    (sum, item) => sum + (item.actualCost ? Number(item.actualCost) : 0),
    0
  )

  const approvedBudget = currentEvent?.approvedBudget ? Number(currentEvent.approvedBudget) : 0

  const handleApproveBudget = async () => {
    if (!approvalForm.approvedBudget) {
      toast.error("Approved budget amount is required")
      return
    }

    setApproving(true)
    try {
      await dispatch(
        approveBudget({
          eventId,
          approvedBudget: Number(approvalForm.approvedBudget),
          notes: approvalForm.notes
        })
      ).unwrap()
      
      toast.success("Budget approved successfully")
      setIsApproveDialogOpen(false)
      setApprovalForm({ approvedBudget: "", notes: "" })
    } catch (error: any) {
      console.error("Failed to approve budget:", error)
      toast.error("Failed to approve budget", {
        description: error.message || "Please try again"
      })
    } finally {
      setApproving(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    return category.charAt(0)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      VENUE: "bg-purple-100 text-purple-700",
      CATERING: "bg-orange-100 text-orange-700",
      DECORATIONS: "bg-pink-100 text-pink-700",
      ENTERTAINMENT: "bg-blue-100 text-blue-700",
      TRANSPORT: "bg-green-100 text-green-700",
      MARKETING: "bg-yellow-100 text-yellow-700",
      TECHNOLOGY: "bg-indigo-100 text-indigo-700",
      STAFFING: "bg-teal-100 text-teal-700",
      SECURITY: "bg-red-100 text-red-700",
      OTHER: "bg-gray-100 text-gray-700"
    }
    return colors[category] || colors.OTHER
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Estimated</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <span className="text-white text-sm font-bold">$</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal text-white">${(totalEstimated / 1000).toFixed(1)}K</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-white/80">{currentEventBudgetItems.length} items</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Budget</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal">${(approvedBudget / 1000).toFixed(1)}K</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground">
                {currentEvent?.budgetStatus || "DRAFT"}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="gradient-primary border border-gray-200 hover:border-gray-300 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Actual Spent</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <span className="text-white text-sm font-bold">-</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal text-white">${(totalActual / 1000).toFixed(1)}K</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-white/80">
                {totalActual > 0 ? `${((totalActual / approvedBudget) * 100).toFixed(1)}% used` : "No expenses"}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <span className="text-white text-sm font-bold">+</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-5xl font-normal ${approvedBudget - totalActual >= 0 ? "" : "text-red-600"}`}>
              ${((approvedBudget - totalActual) / 1000).toFixed(1)}K
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground">
                {approvedBudget > 0 ? `${(((approvedBudget - totalActual) / approvedBudget) * 100).toFixed(1)}% left` : "No budget"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Budget Items</h3>
          <p className="text-sm text-muted-foreground">Manage budget line items for this event</p>
        </div>
        <div className="flex items-center gap-2">
          {currentEvent?.budgetStatus !== "APPROVED" && (
            <Button
              onClick={() => {
                setApprovalForm({ approvedBudget: totalEstimated.toString(), notes: "" })
                setIsApproveDialogOpen(true)
              }}
              className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full"
              disabled={currentEventBudgetItems.length === 0}
            >
              <CiCircleCheck size={20} />
              Approve Budget
            </Button>
          )}
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full">
            <CiCirclePlus size={20} />
            Add Item
          </Button>
        </div>
      </div>

      {/* Budget Items Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Estimated</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentEventBudgetItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${getCategoryColor(item.category)} flex items-center justify-center font-semibold text-xs`}>
                      {getCategoryIcon(item.category)}
                    </div>
                    <span className="font-medium text-sm">{item.category}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.itemName}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground line-clamp-1">
                    {item.description || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {item.quantity} {item.unit || "unit"}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{item.vendor || "-"}</div>
                    {item.vendorContact && (
                      <div className="text-xs text-muted-foreground">{item.vendorContact}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${Number(item.estimatedCost).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium text-blue-600">
                  {item.actualCost ? `$${Number(item.actualCost).toLocaleString()}` : "-"}
                </TableCell>
                <TableCell>
                  {item.isApproved ? (
                    <Badge className="bg-green-100 text-green-700">Approved</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {currentEventBudgetItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No budget items yet</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4 gap-2">
              <CiCirclePlus size={20} />
              Add First Item
            </Button>
          </div>
        )}
      </Card>

      {/* Add Budget Item Dialog */}
      <AddBudgetItemDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        eventId={eventId}
      />

      {/* Approve Budget Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Budget</DialogTitle>
            <DialogDescription>
              Review and approve the budget for this event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Estimated Budget</div>
              <div className="text-2xl font-semibold">${totalEstimated.toLocaleString()}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvedBudget">Approved Amount *</Label>
              <Input
                id="approvedBudget"
                type="number"
                value={approvalForm.approvedBudget}
                onChange={(e) => setApprovalForm({ ...approvalForm, approvedBudget: e.target.value })}
                placeholder="48000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvalNotes">Notes</Label>
              <Textarea
                id="approvalNotes"
                value={approvalForm.notes}
                onChange={(e) => setApprovalForm({ ...approvalForm, notes: e.target.value })}
                placeholder="Approved with minor adjustments..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={approving} className="rounded-full">
              Cancel
            </Button>
            <Button 
              onClick={handleApproveBudget} 
              disabled={approving}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full"
            >
              {approving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CiCircleCheck className="mr-2 h-4 w-4" />
                  Approve Budget
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
