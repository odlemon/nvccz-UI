"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { GoalsManagement } from "@/components/performance/goals-management"
import { ModuleGuard } from "@/lib/permissions"
import { useEffect } from "react"
import { useAppDispatch } from "@/lib/store"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { toast } from "sonner"

export default function GoalsPage() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Fetch available departments with error handling
    const fetchDepartments = async () => {
      try {
        await dispatch(fetchAvailableDepartments()).unwrap()
      } catch (error) {
        console.error('Failed to fetch departments:', error)
        toast.error('Failed to load departments', {
          description: 'Please refresh the page to try again'
        })
      }
    }
    
    fetchDepartments()
  }, [dispatch])

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="goals-management">
      <PerformanceLayout>
        <div className="p-6">
          <GoalsManagement />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
