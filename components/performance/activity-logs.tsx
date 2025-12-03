"use client"

import { useState, useEffect } from "react"
// Removed Card and Dialog usage per new design
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  Calendar,
  User,
  Target,
  Flag,
  Activity,
  Plus,
  Search,
  Pencil,
  Trash
} from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ActivityLog, fetchActivityLogs, createActivityLog, updateActivityLog, deleteActivityLog } from "@/lib/store/slices/taskSlice"
import { useTaskStore } from "@/lib/store/slices/useTaskStore"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { toast } from "sonner"
import { TaskListSkeleton } from "@/components/ui/skeleton-loaders"
import { performanceAPI } from "@/lib/api/performance-data"
import { goalsDataService } from "@/lib/api/goals-data"
import { kpiDataService } from "@/lib/api/kpi-data"
import { format } from "date-fns"

interface ActivityLogsProps {
  isOpen: boolean
  onClose: () => void
}

export function ActivityLogs({ isOpen, onClose }: ActivityLogsProps) {
  const { fetchActivityLogs: fetchLogs, createActivityLog: createLog, updateActivityLog: updateLog, deleteActivityLog: removeLog, addTaskActivity, clearError } = useTaskStore()
  const activityLogs = useSelector((state: RootState) => state.tasks.activityLogs)
  const loading = useSelector((state: RootState) => state.tasks.loading)
  const tasksList = useSelector((state: RootState) => state.tasks.tasks)
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [kpis, setKpis] = useState<any[]>([])
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [loadingKpis, setLoadingKpis] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activityTypeFilter, setActivityTypeFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [goalFilter, setGoalFilter] = useState("all")
  const [taskFilter, setTaskFilter] = useState("all")
  const [kpiFilter, setKpiFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [filters, setFilters] = useState({
    activityType: undefined as string | undefined,
    goalId: undefined as string | undefined,
    taskId: undefined as string | undefined,
    kpiId: undefined as string | undefined,
    userId: undefined as string | undefined,
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined
  })

  // Fetch activity logs when filters change
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    const load = async () => {
      setInitialLoading(true)
      try {
        await fetchLogs(filters as any)
      } finally {
        if (isMounted) setInitialLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filters])

  // Load goals and KPIs for selectors
  useEffect(() => {
    if (isOpen) {
      loadGoals()
      loadKpis()
    }
  }, [isOpen])

  const loadGoals = async () => {
    try {
      setLoadingGoals(true)
      const response = await goalsDataService.getGoals({})
      setGoals(response.goals || [])
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoadingGoals(false)
    }
  }

  const loadKpis = async () => {
    try {
      setLoadingKpis(true)
      const response = await kpiDataService.getKPIs({})
      setKpis(response || [])
    } catch (error) {
      console.error('Failed to load KPIs:', error)
    } finally {
      setLoadingKpis(false)
    }
  }

  // total pages derive from API count if provided; keep simple client-side for now
  useEffect(() => {
    if (isOpen) {
      setTotalPages(1)
    }
  }, [isOpen, activityLogs])

  const handleCreate = async (data: any) => {
    try {
      const payload: any = {
        activityType: data.activityType,
        title: data.title,
        description: data.description,
      }
      if (data.goalId) payload.goalId = data.goalId
      if (data.taskId) payload.taskId = data.taskId
      if (data.kpiId) payload.kpiId = data.kpiId
      if (data.metadata) {
        try { payload.metadata = JSON.parse(data.metadata) } catch { /* ignore bad json */ }
      }
      await createLog(payload as any)
      toast.success("Activity log created", { description: data.title })
      setShowCreateDialog(false)
      return true
    } catch (e) {
      toast.error("Failed to create activity", { description: String((e as Error).message || e) })
      throw e
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      const updates: any = {
        activityType: data.activityType,
        title: data.title,
        description: data.description,
      }
      if (data.goalId !== undefined) updates.goalId = data.goalId || null
      if (data.taskId !== undefined) updates.taskId = data.taskId || null
      if (data.kpiId !== undefined) updates.kpiId = data.kpiId || null
      if (data.metadata) {
        try { updates.metadata = JSON.parse(data.metadata) } catch { /* ignore */ }
      }
      await updateLog(id, updates)
      toast.success("Activity updated", { description: data.title })
      setEditingLog(null)
      setShowCreateDialog(false)
    } catch (e) {
      toast.error("Failed to update activity", { description: String((e as Error).message || e) })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeLog(id)
      toast.success("Deleted activity")
    } catch (e) {
      toast.error("Failed to delete activity", { description: String((e as Error).message || e) })
    }
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "goal_update":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "task_completion":
        return "bg-green-100 text-green-800 border-green-200"
      case "task_creation":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "kpi_update":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case "goal_update":
        return <Target className="h-4 w-4" />
      case "task_completion":
        return <Flag className="h-4 w-4" />
      case "task_creation":
        return <Plus className="h-4 w-4" />
      case "kpi_update":
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' HH:mm")
    } catch {
      return "Invalid date"
    }
  }

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Handle filter changes and update backend filters
  const handleActivityTypeChange = (value: string) => {
    setActivityTypeFilter(value)
    setFilters({
      ...filters,
      activityType: value === "all" ? undefined : value
    })
  }

  const handleGoalChange = (value: string) => {
    setGoalFilter(value)
    setFilters({
      ...filters,
      goalId: value === "all" ? undefined : value
    })
  }

  const handleTaskChange = (value: string) => {
    setTaskFilter(value)
    setFilters({
      ...filters,
      taskId: value === "all" ? undefined : value
    })
  }

  const handleKpiChange = (value: string) => {
    setKpiFilter(value)
    setFilters({
      ...filters,
      kpiId: value === "all" ? undefined : value
    })
  }

  const handleUserChange = (value: string) => {
    setUserFilter(value)
    setFilters({
      ...filters,
      userId: value === "all" ? undefined : value
    })
  }

  const handleDateFromChange = (value: string) => {
    setDateFromFilter(value)
    setFilters({
      ...filters,
      dateFrom: value || undefined
    })
  }

  const handleDateToChange = (value: string) => {
    setDateToFilter(value)
    setFilters({
      ...filters,
      dateTo: value || undefined
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setActivityTypeFilter("all")
    setGoalFilter("all")
    setTaskFilter("all")
    setKpiFilter("all")
    setUserFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
    setFilters({
      activityType: undefined,
      goalId: undefined,
      taskId: undefined,
      kpiId: undefined,
      userId: undefined,
      dateFrom: undefined,
      dateTo: undefined
    })
  }

  // Backend filtering - no client-side filtering needed
  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const itemsPerPage = 10
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  if (loading || initialLoading || (isOpen && activityLogs.length === 0 && !loading)) {
    return <TaskListSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Activity Logs
          </h2>
          <p className="text-muted-foreground">
            Track and monitor all performance activities and updates
          </p>
        </div>
      </div>

      {/* Filters and Search - No cards, direct div layout */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={activityTypeFilter} onValueChange={handleActivityTypeChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="goal_update">Goal Updates</SelectItem>
              <SelectItem value="task_completion">Task Completions</SelectItem>
              <SelectItem value="task_creation">Task Creation</SelectItem>
              <SelectItem value="kpi_update">KPI Updates</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-between rounded-full">
                {goalFilter !== "all" ? (goals.find(g => g.id === goalFilter)?.title || "Goal") : "All Goals"}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" sideOffset={4} className="p-0 w-[360px] max-h-80 overflow-auto rounded-lg shadow-lg">
              <Command className="max-h-80 overflow-auto">
                <CommandInput placeholder="Search goals..." />
                <CommandEmpty>No goals found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="All Goals" onSelect={() => handleGoalChange("all")}>All Goals</CommandItem>
                  {goals.map((g) => (
                    <CommandItem key={g.id} value={g.title} onSelect={() => handleGoalChange(g.id)}>
                      {g.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-between rounded-full">
                {taskFilter !== "all" ? (tasksList.find(t => t.id === taskFilter)?.title || "Task") : "All Tasks"}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" sideOffset={4} className="p-0 w-[360px] max-h-80 overflow-auto rounded-lg shadow-lg">
              <Command className="max-h-80 overflow-auto">
                <CommandInput placeholder="Search tasks..." />
                <CommandEmpty>No tasks found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="All Tasks" onSelect={() => handleTaskChange("all")}>All Tasks</CommandItem>
                  {tasksList.map((t) => (
                    <CommandItem key={t.id} value={t.title} onSelect={() => handleTaskChange(t.id)}>
                      {t.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-between rounded-full">
                {kpiFilter !== "all" ? (kpis.find(k => k.id === kpiFilter)?.name || "KPI") : "All KPIs"}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" sideOffset={4} className="p-0 w-[360px] max-h-80 overflow-auto rounded-lg shadow-lg">
              <Command className="max-h-80 overflow-auto">
                <CommandInput placeholder="Search KPIs..." />
                <CommandEmpty>No KPIs found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="All KPIs" onSelect={() => handleKpiChange("all")}>All KPIs</CommandItem>
                  {kpis.map((k) => (
                    <CommandItem key={k.id} value={k.name} onSelect={() => handleKpiChange(k.id)}>
                      {k.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Select value={userFilter} onValueChange={handleUserChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="user1">Admin User</SelectItem>
              <SelectItem value="user2">Jane Smith</SelectItem>
              <SelectItem value="user3">Bob Johnson</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px]">
            <DatePicker
              value={dateFromFilter ? new Date(dateFromFilter) : undefined}
              onChange={(d) => handleDateFromChange(d ? d.toISOString() : "")}
              placeholder="dd/mm/yyyy"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <DatePicker
              value={dateToFilter ? new Date(dateToFilter) : undefined}
              onChange={(d) => handleDateToChange(d ? d.toISOString() : "")}
              placeholder="dd/mm/yyyy"
            />
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
          <Button onClick={clearFilters} variant="outline" className="ml-2">
            <Search className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Activity Logs List */}
      <div className="space-y-4">
        {paginatedLogs.map((log) => (
          <div key={log.id} className="rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-gray-300">
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback>
                  {getUserInitials(log.user.firstName, log.user.lastName)}
                </AvatarFallback>
              </Avatar>

              {/* Activity Content */}
              <div className="flex-1 space-y-3">
                {/* Activity Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getActivityTypeColor(log.activityType)}>
                        {getActivityTypeIcon(log.activityType)}
                        <span className="ml-1">{log.activityType.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{log.title}</h3>
                    <p className="text-muted-foreground">{log.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => { setEditingLog(log); setShowCreateDialog(true) }}
                      title="Edit Activity"
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => handleDelete(log.id)}
                      title="Delete Activity"
                    >
                      <Trash className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Activity Details */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(log.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{log.user.firstName} {log.user.lastName}</span>
                  </div>
                </div>

                {/* Related Items */}
                {(log.goal || log.task || log.kpi) && (
                  <div className="space-y-2">
                    {log.goal && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Goal:</span>
                        <span>{log.goal.title}</span>
                      </div>
                    )}
                    {log.task && (
                      <div className="flex items-center gap-2 text-sm">
                        <Flag className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Task:</span>
                        <span>{log.task.title}</span>
                      </div>
                    )}
                    {log.kpi && (
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">KPI:</span>
                        <span>{log.kpi.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Achievement Values */}
                {(log.monetaryValueAchieved || log.percentValueAchieved) && (
                  <div className="flex gap-4 text-sm">
                    {log.monetaryValueAchieved && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Value:</span>
                        <span>${log.monetaryValueAchieved.toLocaleString()}</span>
                      </div>
                    )}
                    {log.percentValueAchieved && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Progress:</span>
                        <span>{log.percentValueAchieved}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Activity Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setEditingLog(null) } }}>
        <DialogContent className="max-w-3xl md:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingLog ? "Edit Activity Log" : "Create Activity Log"}</DialogTitle>
          </DialogHeader>
          <CreateActivityDialog
            isOpen={showCreateDialog}
            onClose={() => { setShowCreateDialog(false); setEditingLog(null) }}
            onSubmit={(data) => {
              if (editingLog) {
                handleUpdate(editingLog.id, data)
              } else {
                handleCreate(data)
              }
            }}
            {...(editingLog ? { initial: editingLog } as any : {})}
            goals={goals}
            kpis={kpis}
            loadingGoals={loadingGoals}
            loadingKpis={loadingKpis}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Create Activity Dialog Component
interface CreateActivityDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initial?: Partial<ActivityLog>
  goals?: any[]
  kpis?: any[]
  loadingGoals?: boolean
  loadingKpis?: boolean
}

function CreateActivityDialog({ isOpen, onClose, onSubmit, initial, goals = [], kpis = [], loadingGoals = false, loadingKpis = false }: CreateActivityDialogProps) {
  const { tasks } = useSelector((state: RootState) => state.tasks)
  const [formData, setFormData] = useState({
    title: initial?.title || "",
    description: (initial as any)?.description || "",
    activityType: (initial as any)?.activityType || "goal_update",
    goalId: (initial as any)?.goalId || "",
    taskId: (initial as any)?.taskId || "",
    kpiId: (initial as any)?.kpiId || "",
    metadata: initial ? JSON.stringify((initial as any)?.metadata ?? {}, null, 2) : ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      await onSubmit(formData)
    } finally {
      // If success, parent closes dialog (unmounts). If error, re-enable.
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-base font-semibold">Basic Information</h3>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="activityType">Activity Type</Label>
            <Select value={formData.activityType} onValueChange={(value) => setFormData({ ...formData, activityType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goal_update">Goal Update</SelectItem>
                <SelectItem value="task_completion">Task Completion</SelectItem>
                <SelectItem value="task_creation">Task Creation</SelectItem>
                <SelectItem value="kpi_update">KPI Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Goal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between rounded-full max-w-full">
                    <span className="truncate text-left">
                      {formData.goalId ? (goals.find(g => g.id === formData.goalId)?.title || "Select goal") : "Select goal"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" sideOffset={4} className="p-0 w-[360px] max-h-80 overflow-auto rounded-lg shadow-lg">
                  <Command className="max-h-80 overflow-auto">
                    <CommandInput placeholder="Search goals..." />
                    <CommandEmpty>No goals found.</CommandEmpty>
                    <CommandGroup>
                      {loadingGoals ? (
                        <div className="p-3 text-sm text-muted-foreground">Loading goals...</div>
                      ) : (
                        goals.map((g) => (
                          <CommandItem key={g.id} value={g.title} onSelect={() => setFormData({ ...formData, goalId: g.id })}>
                            {g.title}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Task</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between rounded-full max-w-full">
                    <span className="truncate text-left">
                      {formData.taskId ? (tasks.find(t => t.id === formData.taskId)?.title || "Select task") : "Select task"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" sideOffset={4} className="p-0 w-[360px] max-h-80 overflow-auto rounded-lg shadow-lg">
                  <Command className="max-h-80 overflow-auto">
                    <CommandInput placeholder="Search tasks..." />
                    <CommandEmpty>No tasks found.</CommandEmpty>
                    <CommandGroup>
                      {tasks.map((t) => (
                        <CommandItem key={t.id} value={t.title} onSelect={() => setFormData({ ...formData, taskId: t.id })}>
                          {t.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>KPI</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between rounded-full max-w-full">
                    <span className="truncate text-left">
                      {formData.kpiId ? (kpis.find(k => k.id === formData.kpiId)?.name || "Select KPI") : "Select KPI"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" sideOffset={4} className="p-0 w-[360px] max-h-80 overflow-auto rounded-lg shadow-lg">
                  <Command className="max-h-80 overflow-auto">
                    <CommandInput placeholder="Search KPIs..." />
                    <CommandEmpty>No KPIs found.</CommandEmpty>
                    <CommandGroup>
                      {loadingKpis ? (
                        <div className="p-3 text-sm text-muted-foreground">Loading KPIs...</div>
                      ) : (
                        kpis.map((k) => (
                          <CommandItem key={k.id} value={k.name} onSelect={() => setFormData({ ...formData, kpiId: k.id })}>
                            {k.name}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Previous Value</Label>
              <Input
                placeholder="e.g. 15"
                value={(JSON.parse(formData.metadata || '{}').previousValue ?? '').toString()}
                onChange={(e) => {
                  const meta = (() => { try { return JSON.parse(formData.metadata || '{}') } catch { return {} } })()
                  meta.previousValue = e.target.value
                  setFormData({ ...formData, metadata: JSON.stringify(meta) })
                }}
              />
            </div>
            <div>
              <Label>New Value</Label>
              <Input
                placeholder="e.g. 20"
                value={(JSON.parse(formData.metadata || '{}').newValue ?? '').toString()}
                onChange={(e) => {
                  const meta = (() => { try { return JSON.parse(formData.metadata || '{}') } catch { return {} } })()
                  meta.newValue = e.target.value
                  setFormData({ ...formData, metadata: JSON.stringify(meta) })
                }}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                placeholder="e.g. market_conditions"
                value={(JSON.parse(formData.metadata || '{}').reason ?? '').toString()}
                onChange={(e) => {
                  const meta = (() => { try { return JSON.parse(formData.metadata || '{}') } catch { return {} } })()
                  meta.reason = e.target.value
                  setFormData({ ...formData, metadata: JSON.stringify(meta) })
                }}
              />
            </div>
          </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          <Button type="submit" disabled={isSubmitting} className={isSubmitting ? 'opacity-90 cursor-not-allowed' : ''}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 inline-block rounded-full border-2 border-white/60 border-b-transparent animate-spin" />
                {initial ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              initial ? 'Update Activity' : 'Create Activity'
            )}
            </Button>
          </div>
      </form>
    </div>
  )
}