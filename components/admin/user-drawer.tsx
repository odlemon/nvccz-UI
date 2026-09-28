"use client"

import { UserMasterDetails } from "./user-master-details"
import { STATUS_BADGE_CLASS, statusLabel } from "./user-master-shared"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { User as UserType } from "@/lib/api/admin-api"
import { CopyText } from "@/components/ui/copy-text"
import { 
  User, 
  Mail,
  Building2,
  Shield,
  Calendar,
  Edit,
  X,
  Trash2,
  CheckCircle,
  Vote,
  UserPlus,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { 
  clearUserDetails, 
  fetchUserDetails,
  fetchBoardVotingMembers,
  updateVotingPower
} from "@/lib/store/slices/adminSlice"
import { UpdateVotingPowerDialog } from "./update-voting-power-dialog"
import { toast } from "sonner"


interface UserDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: UserType | null
  onEdit: (user: UserType) => void
  onDelete: (user: UserType) => void
}

type TabType = "overview" | "role" | "permissions" | "voting"

const tabs = [
  {
    id: "overview" as TabType,
    label: "Overview",
    icon: User
  },
  {
    id: "role" as TabType,
    label: "Role & Department",
    icon: Building2
  },
  {
    id: "permissions" as TabType,
    label: "Permissions",
    icon: Shield
  },
  {
    id: "voting" as TabType,
    label: "Board Voting",
    icon: Vote,
    condition: (user: UserType) => user.roleCode === 'BOARD_MEMBER' || user.roleCode === 'BOARD_CHAIR'
  }
]

// Skeleton Loaders
function VotingStatusSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}

function VotingMembersListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-1 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function UserDrawer({ isOpen, onClose, user, onEdit, onDelete }: UserDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedMemberForUpdate, setSelectedMemberForUpdate] = useState<any | null>(null)
  const dispatch = useAppDispatch()
  const { 
    selectedUserDetails, 
    selectedUserDetailsLoading,
    boardVotingMembers,
    boardVotingMembersLoading,
    loading
  } = useAppSelector(state => state.admin)

  // Fetch detailed user info when drawer opens
  useEffect(() => {
    if (isOpen && user) {
      dispatch(fetchUserDetails(user.id))
      
      // Fetch board voting members if user is board member/chair
      if (user.roleCode === 'BOARD_MEMBER' || user.roleCode === 'BOARD_CHAIR') {
        dispatch(fetchBoardVotingMembers())
      }
    }
    
    return () => {
      if (!isOpen) {
        dispatch(clearUserDetails())
      }
    }
  }, [isOpen, user, dispatch])

  if (!user) return null

  // Use detailed user data if available, otherwise use basic user data
  const userDetails = selectedUserDetails || user
  const permissions = userDetails.role?.permissions || []

  const handleEdit = () => {
    onEdit(user)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm(`Remove ${user.firstName} ${user.lastName}?

A user with transaction history is deactivated and kept on record; only a user with no history is deleted.`)) {
      onDelete(user)
      onClose()
    }
  }

  const getInitialsGradient = (name: string) => {
    const gradients = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-green-500 to-green-600", 
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-red-500 to-red-600",
      "bg-gradient-to-br from-yellow-500 to-yellow-600",
      "bg-gradient-to-br from-teal-500 to-teal-600",
      "bg-gradient-to-br from-orange-500 to-orange-600",
      "bg-gradient-to-br from-cyan-500 to-cyan-600"
    ]
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return gradients[Math.abs(hash) % gradients.length]
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Permission matrix from actual API data
  const getPermissions = () => {
    if (!permissions || permissions.length === 0) {
      return []
    }

    // Group permissions by module
    const permissionGroups: Record<string, any> = {}
    
    permissions.forEach((perm: any) => {
      const name = perm.name
      const value = perm.value
      
      // Extract module and action from permission name (e.g., "view_dashboard" -> module: "dashboard", action: "view")
      const parts = name.split('_')
      const action = parts[0]
      const module = parts.slice(1).join(' ').replace(/^\w/, (c: string) => c.toUpperCase())
      
      if (!permissionGroups[module]) {
        permissionGroups[module] = {
          module,
          read: false,
          create: false,
          update: false,
          delete: false
        }
      }
      
      if (action === 'view') permissionGroups[module].read = value
      if (action === 'create') permissionGroups[module].create = value
      if (action === 'manage') {
        permissionGroups[module].create = value
        permissionGroups[module].update = value
        permissionGroups[module].delete = value
      }
      if (action === 'edit') permissionGroups[module].update = value
      if (action === 'delete') permissionGroups[module].delete = value
    })
    
    return Object.values(permissionGroups)
  }

  const permissionMatrix = getPermissions()

  const isBoardMember = user?.roleCode === 'BOARD_MEMBER' || user?.roleCode === 'BOARD_CHAIR'
  const votingMember = boardVotingMembers.find(member => member.id === user?.id)
  const isVotingMember = !!votingMember
  const totalVotingPower = boardVotingMembers.reduce((sum, member) => sum + member.votingPower, 0)

  const handleUpdateVotingPower = async (userId: string, votingPower: number) => {
    try {
      await dispatch(updateVotingPower({ userId, votingPower })).unwrap()
      toast.success('Voting power updated successfully')
      setShowUpdateDialog(false)
      setSelectedMemberForUpdate(null)
    } catch (error: any) {
      toast.error('Failed to update voting power', {
        description: error || 'Please try again.'
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[35vw] min-w-[800px] max-w-[1200px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-normal flex items-center gap-2">
              <User className="w-6 h-6" />
              User Details
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleEdit}
                className="rounded-full h-10 w-10"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                className="rounded-full h-10 w-10 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="rounded-full h-10 w-10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Header */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium ${getInitialsGradient(`${user.firstName} ${user.lastName}`)}`}>
                  {getInitials(user.firstName, user.lastName)}
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {user.role.name}
                    </Badge>
                    <Badge variant="outline" className={STATUS_BADGE_CLASS[String(userDetails.status || 'ACTIVE').toUpperCase() as keyof typeof STATUS_BADGE_CLASS]}>
                      {statusLabel(userDetails.status)}
                    </Badge>
                    {user.userDepartment && (
                      <Badge variant="outline">
                        {user.userDepartment}
                      </Badge>
                    )}
                    {user.departmentRole && (
                      <Badge variant="secondary">
                        {user.departmentRole}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6">
              {tabs.filter(tab => !tab.condition || tab.condition(user)).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer",
                    activeTab === tab.id
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"
                      layoutId="activeTab"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Overview Tab */}
            {activeTab === "overview" && <UserMasterDetails user={userDetails} />}

            {/* Role Tab */}
            {activeTab === "role" && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5" />
                    Role Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-normal text-gray-500">Role Name</label>
                      <p className="text-sm text-gray-900 mt-1 font-medium">{user.role.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-normal text-gray-500">Role Description</label>
                      <p className="text-sm text-gray-900 mt-1">{user.role.description}</p>
                    </div>
                    {user.roleCode && (
                      <div>
                        <label className="text-sm font-normal text-gray-500">Role Code</label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">{user.roleCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                {user.userDepartment && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5" />
                      Department Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-normal text-gray-500">Department</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{user.userDepartment}</p>
                      </div>
                      {user.departmentRole && (
                        <div>
                          <label className="text-sm font-normal text-gray-500">Department Role</label>
                          <Badge className="mt-1" variant="secondary">{user.departmentRole}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === "permissions" && (
              <div className="space-y-4">
                {selectedUserDetailsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5" />
                        Permission Matrix
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Module</th>
                              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Read</th>
                              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Create</th>
                              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Update</th>
                              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {permissionMatrix.map((permission, index) => (
                              <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                                <td className="py-3 px-3 text-sm text-gray-900">{permission.module}</td>
                                <td className="py-3 px-3 text-center">
                                  {permission.read ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {permission.create ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {permission.update ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {permission.delete ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Permissions are defined by the user's role: <strong>{userDetails.role?.name}</strong>. 
                        {userDetails.role?.description && ` ${userDetails.role.description}`}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Board Voting Tab */}
            {activeTab === "voting" && isBoardMember && (
              <div className="space-y-4">
                {/* Current User Voting Status */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                    <Vote className="w-5 h-5" />
                    Voting Member Status
                  </h3>
                  {boardVotingMembersLoading ? (
                    <VotingStatusSkeleton />
                  ) : isVotingMember ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-green-900">Active Voting Member</p>
                          <p className="text-xs text-green-700 mt-1">
                            Voting Power: {votingMember.votingPower}%
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedMemberForUpdate(votingMember)
                          setShowUpdateDialog(true)
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Update Voting Power
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">Not assigned as a voting member</p>
                      <Button
                        onClick={() => {
                          setSelectedMemberForUpdate({
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            roleCode: user.roleCode,
                            departmentRole: user.departmentRole || '',
                            votingPower: 0
                          })
                          setShowUpdateDialog(true)
                        }}
                        className="gradient-primary"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign as Voting Member
                      </Button>
                    </div>
                  )}
                </div>

                {/* All Voting Members */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5" />
                    All Board Voting Members
                  </h3>
                  
                  {boardVotingMembersLoading ? (
                    <VotingMembersListSkeleton />
                  ) : (
                    <>
                      {/* Voting Power Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Total Voting Power</span>
                          <span className="font-medium">{totalVotingPower}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              totalVotingPower === 100 ? 'bg-green-500' : 
                              totalVotingPower > 100 ? 'bg-red-500' : 
                              'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(totalVotingPower, 100)}%` }}
                          />
                        </div>
                        {totalVotingPower !== 100 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {totalVotingPower < 100 
                              ? `${100 - totalVotingPower}% remaining to assign` 
                              : `Exceeded by ${totalVotingPower - 100}%`}
                          </p>
                        )}
                      </div>

                      {/* Voting Members List */}
                      <div className="space-y-2">
                        {boardVotingMembers.map((member) => (
                          <div 
                            key={member.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              member.id === user?.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                getInitialsGradient(`${member.firstName} ${member.lastName}`)
                              }`}>
                                {getInitials(member.firstName, member.lastName)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {member.firstName} {member.lastName}
                                  {member.id === user?.id && (
                                    <span className="ml-2 text-xs text-blue-600">(You)</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                    {member.roleCode}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {member.departmentRole}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-lg font-bold text-blue-600">{member.votingPower}%</p>
                                <p className="text-xs text-gray-500">voting power</p>
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedMemberForUpdate(member)
                                  setShowUpdateDialog(true)
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {boardVotingMembers.length === 0 && (
                          <p className="text-center text-sm text-gray-500 py-4">
                            No voting members assigned yet
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update Voting Power Dialog */}
        {selectedMemberForUpdate && (
          <UpdateVotingPowerDialog
            isOpen={showUpdateDialog}
            onClose={() => {
              setShowUpdateDialog(false)
              setSelectedMemberForUpdate(null)
            }}
            member={selectedMemberForUpdate}
            onSubmit={handleUpdateVotingPower}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
