"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  fetchAvailableDepartments,
  fetchAvailableKPIs,
  breakdownGoalToDepartments,
  breakdownGoalToIndividuals,
} from "@/lib/store/slices/performanceSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  CiEdit,
  CiTrash,
  CiSearch,
  CiFlag1 as CiFlag,
  CiCirclePlus as CiPlus,
  CiCircleCheck as CiTarget,
  CiCircleCheck,
  CiRedo,
  CiViewList
} from "react-icons/ci"
import { toast } from "sonner"
import { GoalFormModal } from "./goal-form-modal"
import { GoalViewDrawer } from "./goal-view-drawer"
import { GoalsSkeleton } from "./goals-skeleton"
import { DepartmentBreakdownModal } from "./department-breakdown-modal"
import { IndividualBreakdownModal } from "./individual-breakdown-modal"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"

const CollapsibleSection = ({
  title,
  count,
  color,
  children,
}: {
  title: string
  count: number
  color: string
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`w-1 h-6 ${color} rounded-full`}></div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <Badge
          className={`${color
            .replace("bg-", "bg-")
            .replace("-500", "-100")} ${color
            .replace("bg-", "text-")
            .replace("-500", "-800")}`}
        >
          {count}
        </Badge>
        <ChevronDown
          className={cn("transition-transform", isOpen && "rotate-180")}
        />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GoalsManagement() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const { goals, goalsLoading, goalError, availableDepartments, availableKPIs } = useAppSelector(
    (state) => state.performance,
  )

  const [activeTab, setActiveTab] = useState<"all" | "company" | "department" | "individual">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [viewingGoal, setViewingGoal] = useState<any>(null)
  const [breakdownGoal, setBreakdownGoal] = useState<any>(null)
  const [isIndividualBreakdownModalOpen, setIsIndividualBreakdownModalOpen] = useState(false)
  const [selectedGoalForIndividualBreakdown, setSelectedGoalForIndividualBreakdown] = useState<any>(null)
  const hasLoadedInitialData = useRef(false)

  useEffect(() => {
    // Only load initial data once when component mounts
    if (!hasLoadedInitialData.current) {
      const loadInitialData = async () => {
        try {
          // Only fetch if data doesn't exist
            await dispatch(fetchGoals()).unwrap()
            await dispatch(fetchAvailableDepartments()).unwrap()
            await dispatch(fetchAvailableKPIs()).unwrap()


       
        } catch (error) {
          console.error("Failed to load initial data:", error)
        }
      }
      
      loadInitialData()
      hasLoadedInitialData.current = true
    }
  }, [dispatch, availableDepartments.length, availableKPIs.length, goals.length])

  const handleCreateGoal = () => {
    setEditingGoal(null)
    setShowCreateModal(true)
  }

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal)
    setShowCreateModal(true)
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm("Are you sure you want to delete this goal? This action cannot be undone.")) {
      toast.promise(dispatch(deleteGoal(goalId)).unwrap(), {
        loading: "Deleting goal...",
        success: "Goal deleted successfully.",
        error: "Failed to delete goal.",
      })
    }
  }

  const handleFormSubmit = async (data: any) => {
    const action = editingGoal ? updateGoal({ goalId: editingGoal.id, data }) : createGoal(data)
    toast.promise(dispatch(action).unwrap(), {
      loading: editingGoal ? "Updating goal..." : "Creating goal...",
      success: `Goal ${editingGoal ? "updated" : "created"} successfully.`,
      error: (err) => `Failed to ${editingGoal ? "update" : "create"} goal: ${err.message}`,
    })
    setShowCreateModal(false)
    setEditingGoal(null)
  }

  const handleBreakdown = (goal: any) => {
    setViewingGoal(null) // Close view drawer
    setBreakdownGoal(goal)
  }

  const handleBreakdownSubmit = async (data: any) => {
    try {
      const result = await dispatch(breakdownGoalToDepartments(data)).unwrap()
      
      // Return success to modal
      return result
    } catch (error: any) {
      console.error("Breakdown error:", error)
      // Toast is already shown in modal's catch block
      // Return false to indicate failure
      return false
    }
  }

  const handleIndividualBreakdownSubmit = async (data: any) => {
    toast.promise(dispatch(breakdownGoalToIndividuals(data)).unwrap(), {
      loading: "Breaking down goal...",
      success: "Goal broken down successfully.",
      error: (err) => `Failed to breakdown goal: ${err.message}`,
    })
    setBreakdownGoal(null)
  }

  const handleRefresh = () => {
    toast.promise(dispatch(fetchGoals()).unwrap(), {
      loading: "Refreshing goals...",
      success: "Goals refreshed successfully.",
      error: "Failed to refresh goals.",
    })
  }

  const filteredGoals = useMemo(
    () =>
      goals.filter(
        (goal) =>
          goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          goal.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [goals, searchTerm],
  )

  const displayGoals = activeTab === "all" ? filteredGoals : filteredGoals.filter((g) => g.type === activeTab)

  const companyGoals = displayGoals.filter((g) => g.type === "company")
  const departmentGoals = displayGoals.filter((g) => g.type === "department")
  const individualGoals = displayGoals.filter((g) => g.type === "individual")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "not_started":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-blue-500"
    if (progress >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  const renderGoalCard = (goal: any) => {
    const progress = Number.parseFloat(goal.progressPercentage || "0")

    return (
      <Card
        key={goal.id}
        className="bg-white border border-gray-200 rounded-2xl shadow-none hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        onClick={() => setViewingGoal(goal)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-normal">{goal.title}</CardTitle>
            <div className="flex items-center gap-1">
              {(permissions.canUpdateCompanyGoal || permissions.canUpdateDepartmentGoal || permissions.canUpdateOwnDepartmentGoal) && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditGoal(goal)
                }}
                title="Edit Goal"
              >
                <CiEdit className="w-5 h-5" />
              </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getPriorityColor(goal.priority)}>{goal.priority}</Badge>
            <Badge className={getStatusColor(goal.status)}>{goal.status.replace("_", " ")}</Badge>
            <Badge variant="outline" className="capitalize">
              {goal.type}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {goal.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{goal.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CiTarget className="w-4 h-4" />
                <span>Department</span>
              </div>
              <p className="text-sm font-medium">{goal.departmentName || "Company-wide"}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CiCircleCheck className="w-4 h-4" />
                <span>Owner</span>
              </div>
              <p className="text-sm font-medium">
                {goal.assignedTo ? `${goal.assignedTo.firstName} ${goal.assignedTo.lastName}` : "Unassigned"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-gray-900">{progress}%</span>
            </div>
            <div className="relative">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Target</span>
              <p className="text-sm font-semibold">{goal.targetValue}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Current</span>
              <p className="text-sm font-semibold">{goal.currentValue}</p>
            </div>
          </div>

          {goal.parentGoal && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <CiFlag className="w-4 h-4" />
                <span className="font-medium">Child of: {goal.parentGoal.title}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (goalsLoading && goals.length === 0) {
    return <GoalsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Goals Management</h1>
          <p className="text-gray-600 font-normal">Create and track performance goals across the organization</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={goalsLoading}>
            <CiRedo className={`w-4 h-4 mr-2 ${goalsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {(permissions.canCreateCompanyGoal || permissions.canCreateDepartmentGoal || permissions.canCreateIndividualGoal) && (
          <Button
            onClick={handleCreateGoal}
            className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <CiPlus className="w-4 h-4 mr-2" />
            Create Goal
          </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
              activeTab === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Goals
            <Badge variant="secondary" className="ml-1">
              {filteredGoals.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("company")}
            className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
              activeTab === "company" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Company Goals
            <Badge variant="secondary" className="ml-1">
              {companyGoals.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("department")}
            className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
              activeTab === "department"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Department Goals
            <Badge variant="secondary" className="ml-1">
              {departmentGoals.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("individual")}
            className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
              activeTab === "individual"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Individual Goals
            <Badge variant="secondary" className="ml-1">
              {individualGoals.length}
            </Badge>
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {goalError && <p className="text-red-500">{goalError}</p>}

      {displayGoals.length > 0 ? (
        <div className="space-y-6">
          {(activeTab === "all" || activeTab === "company") && companyGoals.length > 0 && (
            <CollapsibleSection title="Company Goals" count={companyGoals.length} color="bg-purple-500">
              <div className="space-y-4">{companyGoals.map(renderGoalCard)}</div>
            </CollapsibleSection>
          )}

          {(activeTab === "all" || activeTab === "department") && departmentGoals.length > 0 && (
            <CollapsibleSection title="Department Goals" count={departmentGoals.length} color="bg-blue-500">
              <div className="space-y-4 pl-8 border-l-2 border-blue-200">{departmentGoals.map(renderGoalCard)}</div>
            </CollapsibleSection>
          )}

          {(activeTab === "all" || activeTab === "individual") && individualGoals.length > 0 && (
            <CollapsibleSection title="Individual Goals" count={individualGoals.length} color="bg-green-500">
              <div className="space-y-4 pl-16 border-l-2 border-green-200">{individualGoals.map(renderGoalCard)}</div>
            </CollapsibleSection>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
            <CiFlag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? "No goals match your current search. Try adjusting your search criteria."
              : "Get started by creating your first goal to track performance objectives."}
          </p>
          {(permissions.canCreateCompanyGoal || permissions.canCreateDepartmentGoal || permissions.canCreateIndividualGoal) && (
          <Button onClick={handleCreateGoal}>
            <CiPlus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
          )}
        </div>
      )}

      {viewingGoal && (
        <GoalViewDrawer 
          isOpen={!!viewingGoal} 
          onClose={() => setViewingGoal(null)} 
          goal={viewingGoal} 
          onEdit={(permissions.canUpdateCompanyGoal || permissions.canUpdateDepartmentGoal || permissions.canUpdateOwnDepartmentGoal) ? (goal) => handleEditGoal(goal) : undefined}
          onDelete={(permissions.canDeleteCompanyGoal || permissions.canDeleteDepartmentGoal || permissions.canDeleteOwnDepartmentGoal) ? (goal) => handleDeleteGoal(goal.id) : undefined}
          onBreakdown={handleBreakdown} 
        />
      )}

      {showCreateModal && (
        <GoalFormModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingGoal(null)
          }}
          goal={editingGoal}
          onSubmit={handleFormSubmit}
        />
      )}

      {breakdownGoal?.type === "company" && (
        <DepartmentBreakdownModal
          isOpen={!!breakdownGoal}
          onClose={() => setBreakdownGoal(null)}
          parentGoal={breakdownGoal}
          onSubmit={handleBreakdownSubmit}
        />
      )}

      {breakdownGoal?.type === "department" && (
        <IndividualBreakdownModal
          isOpen={!!breakdownGoal}
          onClose={() => setBreakdownGoal(null)}
          goal={breakdownGoal}
          onSubmit={handleIndividualBreakdownSubmit}
        />
      )}

      <IndividualBreakdownModal
        isOpen={isIndividualBreakdownModalOpen}
        onClose={() => {
          setIsIndividualBreakdownModalOpen(false)
          setSelectedGoalForIndividualBreakdown(null)
        }}
        goal={selectedGoalForIndividualBreakdown}
        onSubmit={handleIndividualBreakdownSubmit}
      />
    </div>
  )
}
