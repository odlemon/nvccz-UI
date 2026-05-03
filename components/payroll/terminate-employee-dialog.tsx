"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Employee, employeesApi } from "@/lib/api/payroll-api"
import { toast } from "sonner"
import { AlertTriangle, Loader2, UserX } from "lucide-react"

interface TerminateEmployeeDialogProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee
  onTerminated: () => void
}

export function TerminateEmployeeDialog({
  isOpen,
  onClose,
  employee,
  onTerminated,
}: TerminateEmployeeDialogProps) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleTerminate = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for termination")
      return
    }

    try {
      setLoading(true)
      const res = await employeesApi.terminate(employee.id, reason.trim())
      if (res.success) {
        toast.success(res.message || "Employee terminated successfully")
        setReason("")
        onTerminated()
        onClose()
      } else {
        toast.error((res as any).message || "Failed to terminate employee")
      }
    } catch (error: any) {
      console.error("Error terminating employee:", error)
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to terminate employee"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setReason("")
      onClose()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <UserX className="w-5 h-5" />
            Terminate Employee
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            You are about to terminate{" "}
            <span className="font-semibold text-gray-900">
              {employee.user.firstName} {employee.user.lastName}
            </span>{" "}
            ({employee.employeeNumber}).
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-2">
          {/* Warning */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">This action will:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Deactivate the employee record</li>
                <li>Cancel all active performance contracts</li>
                <li>Sync turnover KPI data</li>
              </ul>
              <p className="mt-1 font-medium">This cannot be undone.</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for termination <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Resignation — last day effective immediately"
              className="min-h-[80px] resize-none"
              disabled={loading}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="rounded-full">
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleTerminate}
            disabled={loading || !reason.trim()}
            className="rounded-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Terminating...
              </>
            ) : (
              <>
                <UserX className="w-4 h-4 mr-2" />
                Confirm Termination
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
