"use client"

import { useTaskStore } from "@/lib/store/slices/useTaskStore"

export function TaskManagementTest() {
  const { tasks, loading, error } = useTaskStore()
  
  return (
    <div>
      <h1>Task Management Test</h1>
      <p>Tasks: {tasks.length}</p>
      <p>Loading: {loading ? "Yes" : "No"}</p>
      <p>Error: {error || "None"}</p>
    </div>
  )
}
