"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Target,
  Calendar as CalendarIcon2,
  Flag,
  DollarSign,
  Percent,
  Users,
  AlertCircle
} from "lucide-react"
import { Task } from "@/lib/store/slices/taskSlice"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { usersApi } from "@/lib/api/users-api"
import { setUsers, setUsersError, setUsersLoading } from "@/lib/store/slices/usersSlice"
import * as yup from "yup"

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskData: any) => void
  task?: Task | null
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Goal {
  id: string
  title: string
  type: string
  category: string
}

// Validation schema
const taskValidationSchema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().optional(),
  priority: yup.string().required("Priority is required"),
  stage: yup.string().required("Stage is required"),
  date: yup.string().required("Due date is required"),
  assignedToId: yup.string().required("Primary assignee is required"),
  team: yup.array().of(yup.string()).optional(),
  goalId: yup.string().optional(),
  isPerformanceTask: yup.boolean().optional(),
  monetaryValue: yup.number().optional(),
  percentValue: yup.number().optional(),
  department: yup.string().optional(),
  category: yup.string().optional(),
  status: yup.string().optional()
})

type TaskFormData = yup.InferType<typeof taskValidationSchema>

export function TaskForm({ isOpen, onClose, onSubmit, task }: TaskFormProps) {
  const dispatch = useAppDispatch()
  const { items: users, loading: usersLoading } = useAppSelector(state => state.users)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const [isTeamOpen, setIsTeamOpen] = useState(false)
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskValidationSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      stage: task?.stage || "todo",
      date: task?.date || "",
      assignedToId: task?.assignedToId || "",
      team: task?.team || [],
      goalId: task?.goalId || "",
      isPerformanceTask: task?.isPerformanceTask || false,
      monetaryValue: task?.monetaryValue ? parseFloat(task.monetaryValue) : 0,
      percentValue: task?.percentValue ? parseFloat(task.percentValue) : 0,
      department: task?.department || "",
      category: task?.category || "",
      status: task?.status || "active"
    },
    mode: "onChange"
  })

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        dispatch(setUsersLoading(true))
        dispatch(setUsersError(null))
        const res = await usersApi.getAll()
        dispatch(setUsers(res.data || []))
      } catch (e: any) {
        dispatch(setUsersError(e?.message || 'Failed to load users'))
      } finally {
        dispatch(setUsersLoading(false))
      }
    }
    loadUsers()
  }, [dispatch])

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        stage: task.stage || "todo",
        date: task.date || "",
        assignedToId: task.assignedToId || "",
        team: task.team || [],
        goalId: task.goalId || "",
        isPerformanceTask: task.isPerformanceTask || false,
        monetaryValue: task.monetaryValue ? parseFloat(task.monetaryValue) : 0,
        percentValue: task.percentValue ? parseFloat(task.percentValue) : 0,
        department: task.department || "",
        category: task.category || "",
        status: task.status || "active"
      })
      
      // Set selected users for team
      if (task.team && task.team.length > 0) {
        const teamUsers = users.filter(user => task.team.includes(user.id))
        setSelectedUsers(teamUsers)
      }
      
      // Set selected date
      if (task.date) {
        setSelectedDate(new Date(task.date))
      }
    } else {
      reset({
        title: "",
        description: "",
        priority: "medium",
        stage: "todo",
        date: "",
        assignedToId: "",
        team: [],
        goalId: "",
        isPerformanceTask: false,
        monetaryValue: 0,
        percentValue: 0,
        department: "",
        category: "",
        status: "active"
      })
      setSelectedUsers([])
      setSelectedDate(undefined)
    }
  }, [task, users, reset])

  const handleFormSubmit = async (data: TaskFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const submitData = {
        ...data,
        team: selectedUsers.map(user => user.id),
        date: selectedDate ? selectedDate.toISOString() : data.date
      }
      
      await onSubmit(submitData)
      toast.success(task ? "Task updated successfully" : "Task created successfully")
      onClose()
    } catch (error) {
      toast.error("Failed to save task")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id)
      if (exists) {
        return prev.filter(u => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setValue("date", date.toISOString())
    }
  }

  const getSelectedUser = (userId: string) => {
    return users.find(user => user.id === userId)
  }

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="title"
                      placeholder="Enter task title"
                      className={errors.title ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errors.priority ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && (
                  <p className="text-sm text-red-500">{errors.priority.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Enter task description"
                    rows={3}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage *</Label>
                <Controller
                  name="stage"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errors.stage ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.stage && (
                  <p className="text-sm text-red-500">{errors.stage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Due Date *</Label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal rounded-full ${!selectedDate && "text-muted-foreground"} ${errors.date ? "border-red-500" : ""}`}
                        >
                          <CalendarIcon2 className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assignment</h3>
            
            <div className="space-y-2">
              <Label>Primary Assignee *</Label>
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <Popover open={isUserOpen} onOpenChange={setIsUserOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isUserOpen}
                        className={`w-full justify-between rounded-full ${errors.assignedToId ? "border-red-500" : ""}`}
                      >
                        {field.value ? getSelectedUser(field.value)?.firstName + " " + getSelectedUser(field.value)?.lastName : "Select user"}
                        <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.firstName} ${user.lastName}`}
                              onSelect={() => {
                                field.onChange(user.id)
                                setIsUserOpen(false)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src="" />
                                  <AvatarFallback className="text-xs">
                                    {getUserInitials(user.firstName, user.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{user.firstName} {user.lastName}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.assignedToId && (
                <p className="text-sm text-red-500">{errors.assignedToId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Team Members</Label>
              <Popover open={isTeamOpen} onOpenChange={setIsTeamOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isTeamOpen}
                    className="w-full justify-between rounded-full"
                  >
                    {selectedUsers.length > 0 ? `${selectedUsers.length} members selected` : "Select team members"}
                    <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.firstName} ${user.lastName}`}
                          onSelect={() => handleUserSelect(user)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedUsers.some(u => u.id === user.id)}
                              onChange={() => handleUserSelect(user)}
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="" />
                              <AvatarFallback className="text-xs">
                                {getUserInitials(user.firstName, user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.firstName} {user.lastName}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      {user.firstName} {user.lastName}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            
            <div className="flex items-center space-x-2">
              <Controller
                name="isPerformanceTask"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isPerformanceTask"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isPerformanceTask">This is a performance task</Label>
            </div>

            {watch("isPerformanceTask") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monetaryValue">Monetary Value</Label>
                  <Controller
                    name="monetaryValue"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="number"
                          placeholder="0"
                          className="pl-10"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentValue">Percent Value</Label>
                  <Controller
                    name="percentValue"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="number"
                          placeholder="0"
                          className="pl-10"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>


          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}