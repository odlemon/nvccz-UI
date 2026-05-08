"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react"
import { Expense } from "@/lib/api/accounting-api"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DeleteExpenseDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  expense: Expense | null
  isLoading: boolean
}

export function DeleteExpenseDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  expense, 
  isLoading 
}: DeleteExpenseDialogProps) {
  if (!expense) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            Delete Expense
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
            <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-red-500">
              <p className="font-medium text-gray-900">{expense.description}</p>
              <p className="text-sm text-gray-600">
                {expense.vendor?.name} • {expense.currency?.symbol}{expense.totalAmount || expense.amount}
              </p>
              {expense.receiptNumber && (
                <p className="text-xs text-gray-500">Receipt: {expense.receiptNumber}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="rounded-full">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(buttonVariants({ variant: "gradient-danger" }), "rounded-full")}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Expense
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}