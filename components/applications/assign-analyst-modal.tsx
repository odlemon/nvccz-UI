"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { applicationsApi, InvestmentUser } from "@/lib/api/applications-api"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"

interface AssignAnalystModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  businessName: string
  onSuccess: () => void
}

export function AssignAnalystModal({
  isOpen,
  onClose,
  applicationId,
  businessName,
  onSuccess,
}: AssignAnalystModalProps) {
  const [users, setUsers] = useState<InvestmentUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      setSelectedUserId("")
    }
  }, [isOpen])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await applicationsApi.getInvestmentUsers()
      setUsers(res.data || [])
    } catch (e: any) {
      toast.error("Failed to load analysts", { description: e?.message })
    } finally {
      setUsersLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please select an analyst")
      return
    }

    try {
      setSubmitting(true)
      await applicationsApi.assignAnalyst(applicationId, selectedUserId)
      const user = users.find((u) => u.id === selectedUserId)
      toast.success("Lead analyst assigned", {
        description: user
          ? `${user.firstName} ${user.lastName}`
          : "Analyst assigned successfully",
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error("Failed to assign analyst", { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Assign Lead Analyst
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                {businessName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <Label>Select Analyst *</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={usersLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    usersLoading ? "Loading analysts..." : "Choose an analyst"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm space-y-1.5">
              {(() => {
                const user = users.find((u) => u.id === selectedUserId)
                if (!user) return null
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    {user.userDepartment && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Department
                        </span>
                        <span className="font-medium">
                          {user.userDepartment}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium">
                        {user.role?.name || user.roleCode}
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            The assigned analyst will be responsible for conducting the
            initial screening and scoring of this application. Only the
            assigned analyst can submit a screening score.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedUserId}
              className="rounded-full gap-1.5 gradient-primary text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign Analyst
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
