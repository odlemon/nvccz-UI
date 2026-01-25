"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Users, Shield, Loader2, Plus, AlertTriangle } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchBoardVotingMembers, updateVotingPower, fetchUsers } from "@/lib/store/slices/adminSlice"
import { UpdateVotingPowerDialog } from "@/components/admin/update-voting-power-dialog"
import { toast } from "sonner"

// Skeleton Loaders
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-8 w-12" />
        </div>
      </CardContent>
    </Card>
  )
}

function MemberCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-10 h-10 rounded-md" />
      </div>
    </div>
  )
}

export default function VotingMembers() {
  const dispatch = useAppDispatch()
  const { boardVotingMembers, boardVotingMembersLoading, users } = useAppSelector(state => state.admin)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)

  useEffect(() => {
    dispatch(fetchBoardVotingMembers())
    dispatch(fetchUsers())
  }, [dispatch])

  const handleUpdateVotingPower = async (userId: string, votingPower: number) => {
    // Calculate what the new total would be
    const currentMember = boardVotingMembers.find(m => m.id === userId)
    const otherMembersTotal = boardVotingMembers
      .filter(m => m.id !== userId)
      .reduce((sum, m) => sum + m.votingPower, 0)
    const newTotal = otherMembersTotal + votingPower

    if (newTotal > 100) {
      toast.error('Invalid voting power distribution', {
        description: `Total voting power cannot exceed 100%. New total would be ${newTotal}%`
      })
      return
    }

    try {
      await dispatch(updateVotingPower({ userId, votingPower })).unwrap()
      toast.success('Voting power updated successfully')
      setShowUpdateDialog(false)
      setSelectedMember(null)
    } catch (error: any) {
      toast.error('Failed to update voting power', {
        description: error || 'Please try again.'
      })
    }
  }

  const handleCreateVotingPower = async (userId: string, votingPower: number) => {
    // Check if user already has voting power
    if (boardVotingMembers.find(m => m.id === userId)) {
      toast.error('User already has voting power assigned')
      return
    }

    // Calculate what the new total would be
    const currentTotal = boardVotingMembers.reduce((sum, m) => sum + m.votingPower, 0)
    const newTotal = currentTotal + votingPower

    if (newTotal > 100) {
      toast.error('Invalid voting power distribution', {
        description: `Total voting power cannot exceed 100%. New total would be ${newTotal}%`
      })
      return
    }

    try {
      await dispatch(updateVotingPower({ userId, votingPower })).unwrap()
      toast.success('Voting power assigned successfully')
      setShowCreateDialog(false)
    } catch (error: any) {
      toast.error('Failed to assign voting power', {
        description: error || 'Please try again.'
      })
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getPowerColor = (power: number) => {
    if (power >= 50) return "bg-red-500"
    if (power >= 25) return "bg-orange-500"
    return "bg-blue-500"
  }

  const getPowerLabel = (power: number) => {
    if (power >= 50) return "High Power"
    if (power >= 25) return "Medium Power"
    return "Standard Power"
  }

  const sortedMembers = [...boardVotingMembers].sort((a, b) => b.votingPower - a.votingPower)
  const totalVotingPower = boardVotingMembers.reduce((sum, m) => sum + m.votingPower, 0)

  return (
    <AdminLayout>
      <div className="mx-auto py-6 px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Board Voting Members</h1>
            <p className="text-gray-600 mt-1">Manage board members and their voting powers</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Assign Voting Power
          </Button>
        </div>

        {/* Validation Warning */}
        {totalVotingPower !== 100 && !boardVotingMembersLoading && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">Invalid Voting Power Distribution</p>
                  <p className="text-sm text-orange-700">
                    Total voting power is {totalVotingPower}%. It must equal 100% for voting to be valid.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Card */}
        {boardVotingMembersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">{boardVotingMembers.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">High Power Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <span className="text-2xl font-bold">
                    {boardVotingMembers.filter(m => m.votingPower >= 50).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Voting Power</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold">{totalVotingPower}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Voting Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Voting Members</CardTitle>
            <CardDescription>
              Board members with voting privileges and their respective powers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {boardVotingMembersLoading ? (
              <div className="space-y-3">
                <MemberCardSkeleton />
                <MemberCardSkeleton />
                <MemberCardSkeleton />
              </div>
            ) : boardVotingMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No voting members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {getInitials(member.firstName, member.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {member.departmentRole}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {member.roleCode}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${getPowerColor(member.votingPower)}`} />
                          <span className="text-sm font-medium text-gray-700">
                            {getPowerLabel(member.votingPower)}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{member.votingPower}%</p>
                        <p className="text-xs text-gray-500">voting power</p>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedMember(member)
                          setShowUpdateDialog(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Voting Power Dialog */}
        {selectedMember && (
          <UpdateVotingPowerDialog
            isOpen={showUpdateDialog}
            onClose={() => {
              setShowUpdateDialog(false)
              setSelectedMember(null)
            }}
            member={selectedMember}
            onSubmit={handleUpdateVotingPower}
            currentTotal={totalVotingPower}
          />
        )}

        {/* Create Voting Power Dialog */}
        <UpdateVotingPowerDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          member={null}
          onSubmit={handleCreateVotingPower}
          currentTotal={totalVotingPower}
          availableUsers={users.filter(u => !boardVotingMembers.find(m => m.id === u.id)) as any}
        />
      </div>
    </AdminLayout>
  )
}