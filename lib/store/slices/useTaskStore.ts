import { useSelector, useDispatch } from "react-redux"
import { RootState } from "../index"
import { 
  fetchTasks, 
  createTask, 
  updateTask, 
  updateTaskStage,
  deleteTask, 
  fetchActivityLogs, 
  createActivityLog,
  updateActivityLog,
  deleteActivityLog,
  addTaskActivity,
  setFilters,
  setSearchTerm,
  setCurrentPage,
  setSelectedTask,
  clearError
} from "./taskSlice"

const useTaskStore = () => {
  const dispatch = useDispatch()
  const state = useSelector((state: RootState) => state.tasks)

  return {
    // State
    tasks: state.tasks,
    activityLogs: state.activityLogs,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    searchTerm: state.searchTerm,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    selectedTask: state.selectedTask,

    // Actions
    fetchTasks: (filters?: any) => dispatch(fetchTasks(filters)),
    createTask: (taskData: any) => dispatch(createTask(taskData)),
    updateTask: (taskId: string, taskData: any) => dispatch(updateTask({ taskId, taskData })),
    updateTaskStage: (taskId: string, stage: string, notes?: string) => 
      dispatch(updateTaskStage({ taskId, stage, notes })),
    deleteTask: (taskId: string) => dispatch(deleteTask(taskId)),
    fetchActivityLogs: (filters?: any) => dispatch(fetchActivityLogs(filters)),
    createActivityLog: (activityData: any) => dispatch(createActivityLog(activityData)),
    updateActivityLog: (id: string, updates: any) => dispatch(updateActivityLog({ id, updates })),
    deleteActivityLog: (id: string) => dispatch(deleteActivityLog(id)),
    addTaskActivity: (taskId: string, activityData: any) => 
      dispatch(addTaskActivity({ taskId, activityData })),
    setFilters: (filters: any) => dispatch(setFilters(filters)),
    setSearchTerm: (term: string) => dispatch(setSearchTerm(term)),
    setCurrentPage: (page: number) => dispatch(setCurrentPage(page)),
    setSelectedTask: (task: any) => dispatch(setSelectedTask(task)),
    clearError: () => dispatch(clearError())
  }
}

export { useTaskStore }
