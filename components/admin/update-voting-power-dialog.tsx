"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Shield, AlertCircle } from "lucide-react"
import type { BoardVotingMember, User } from "@/lib/api/admin-api"

interface UpdateVotingPowerDialogProps {
  isOpen: boolean
  onClose: () => void
  member: BoardVotingMember | null
  onSubmit: (userId: string, votingPower: number) => Promise<void>
  currentTotal: number
  availableUsers?: User[]
}

export function UpdateVotingPowerDialog({
  isOpen,
  onClose,
  member,
  onSubmit,
  currentTotal,
  availableUsers = []
}: UpdateVotingPowerDialogProps) {
  const isCreateMode = member === null
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [votingPower, setVotingPower] = useState<number>(isCreateMode ? 0 : member?.votingPower || 0)
  const [submitting, setSubmitting] = useState(false)

  // Reset state when dialog opens/closes or member changes
  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        setSelectedUserId("")
        setVotingPower(0)
      } else {
        setVotingPower(member?.votingPower || 0)
      }
    }
  }, [isOpen, isCreateMode, member])

  const handleSubmit = async () => {
    if (votingPower < 0 || votingPower > 100) {
      return
    }

    const userId = isCreateMode ? selectedUserId : member?.id
    if (!userId) return

    setSubmitting(true)
    try {
      await onSubmit(userId, votingPower)
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Calculate available voting power
  const otherMembersTotal = isCreateMode 
    ? currentTotal 
    : currentTotal - (member?.votingPower || 0)
  const availablePower = 100 - otherMembersTotal
  const newTotal = otherMembersTotal + votingPower
  const isValidTotal = newTotal <= 100 && votingPower > 0

  const selectedUser = isCreateMode 
    ? availableUsers.find(u => u.id === selectedUserId)
    : member

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {isCreateMode ? 'Assign Voting Power' : 'Update Voting Power'}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode 
              ? 'Assign voting power to a board member (total must equal 100%)'
              : 'Adjust the voting power for this board member (total must equal 100%)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Selection (Create Mode) */}
          {isCreateMode && (
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {availableUsers.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      All users have voting power assigned
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.firstName} {user.lastName}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Member Info (Update Mode or After Selection) */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                {(selectedUser.departmentRole || selectedUser.roleCode) && (
                  <div className="flex gap-2 mt-1">
                    {selectedUser.departmentRole && (
                      <Badge variant="outline" className="text-xs">
                        {selectedUser.departmentRole}
                      </Badge>
                    )}
                    {selectedUser.roleCode && (
                      <Badge variant="outline" className="text-xs">
                        {selectedUser.roleCode}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voting Power Summary */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600 mb-1">Current Total</p>
                <p className="text-lg font-bold text-gray-900">{currentTotal}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Available</p>
                <p className="text-lg font-bold text-blue-600">{availablePower}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">New Total</p>
                <p className={`text-lg font-bold ${newTotal === 100 ? 'text-green-600' : newTotal > 100 ? 'text-red-600' : 'text-orange-600'}`}>
                  {newTotal}%
                </p>
              </div>
            </div>
          </div>

          {/* Voting Power Input */}
          <div className="space-y-2">
            <Label>Voting Power (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={votingPower}
              onChange={(e) => setVotingPower(Number(e.target.value))}
              className="rounded-full"
              disabled={isCreateMode && !selectedUserId}
            />
            {!isCreateMode && member && (
              <p className="text-xs text-gray-500">
                Current: {member.votingPower}% → New: {votingPower}%
              </p>
            )}
          </div>

          {/* Validation Warning */}
          {newTotal > 100 && votingPower > 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900">Exceeds Maximum</p>
                <p className="text-xs text-red-700">
                  Total voting power cannot exceed 100%. Current total would be {newTotal}%.
                  You need to reduce by {newTotal - 100}%.
                </p>
              </div>
            </div>
          )}
          {newTotal < 100 && votingPower > 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Configuration In Progress</p>
                <p className="text-xs text-blue-700">
                  Total will be {newTotal}%. You still have {100 - newTotal}% available to assign to other members.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting || 
                !isValidTotal || 
                votingPower <= 0 ||
                (isCreateMode && !selectedUserId) ||
                (!isCreateMode && member && votingPower === member.votingPower)
              }
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isCreateMode ? 'Assigning...' : 'Updating...'}
                </>
              ) : (
                isCreateMode ? 'Assign Power' : 'Update Power'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
