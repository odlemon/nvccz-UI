"use client"

import { useState, useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { DepartmentManagementSkeleton } from "./department-skeleton"
import { DepartmentViewDrawer } from "./department-view-drawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Building2,
  Search,
  X,
  Users,
  Target,
  ArrowDown
} from "lucide-react"
import { 
  CiViewList,
  CiBank,
  CiRedo
} from "react-icons/ci"
import { toast } from "sonner"

export function DepartmentManagement() {
  const dispatch = useAppDispatch()
  const { availableDepartments, loading, error } = useAppSelector((state) => state.performance)
  const [viewingDepartment, setViewingDepartment] = useState<any>(null)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const hasLoadedRef = useRef(false)

  // Load available departments using thunk
  const loadDepartments = (forceReload = false) => {
    // Prevent duplicate calls
    if ((hasLoadedRef.current || loading) && !forceReload) {
      console.log('Skipping duplicate load request')
      return
    }
    
    console.log('Loading available departments...')
    hasLoadedRef.current = true
    
    dispatch(fetchAvailableDepartments())
      .unwrap()
      .then(() => {
        // toast.success("Departments loaded successfully")
      })
      .catch((error) => {
        console.error('Failed to load departments:', error)
        toast.error("Failed to load departments")
        hasLoadedRef.current = false // Reset on error to allow retry
      })
  }

  useEffect(() => {
    // Only load once on mount
    if (!hasLoadedRef.current) {
      loadDepartments()
    }
  }, [])

  // Filter departments by search term
  const filteredDepartments = Array.isArray(availableDepartments) 
    ? availableDepartments.filter(dept => {
        const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             dept.description.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
      })
    : []

  const handleViewDepartment = (department: any) => {
    setViewingDepartment(department)
    setIsViewDrawerOpen(true)
  }

  // Department icon mapping
  const getDepartmentIcon = (name: string) => {
    const icons: Record<string, any> = {
      'Finance': '💰',
      'Sales': '📈',
      'Operations': '⚙️',
      'Procurement': '🛒',
      'Human Resources': '👥',
      'Marketing': '📣',
      'Legal': '⚖️',
      'IT': '💻'
    }
    return icons[name] || '🏢'
  }

  const getDepartmentColor = (name: string) => {
    const colors: Record<string, string> = {
      'Finance': 'from-green-500 to-emerald-600',
      'Sales': 'from-blue-500 to-cyan-600',
      'Operations': 'from-purple-500 to-violet-600',
      'Procurement': 'from-orange-500 to-amber-600',
      'Human Resources': 'from-pink-500 to-rose-600',
      'Marketing': 'from-yellow-500 to-orange-500',
      'Legal': 'from-indigo-500 to-blue-600',
      'IT': 'from-teal-500 to-cyan-600'
    }
    return colors[name] || 'from-gray-500 to-gray-600'
  }

  // Organizational hierarchy structure
  const getOrganizationalStructure = () => {
    const structure = {
      executive: filteredDepartments.filter(d => ['Finance', 'Operations'].includes(d.name)),
      core: filteredDepartments.filter(d => ['Sales', 'Marketing', 'Procurement'].includes(d.name)),
      support: filteredDepartments.filter(d => ['Human Resources', 'Legal', 'IT'].includes(d.name))
    }
    return structure
  }

  const orgStructure = getOrganizationalStructure()

  // Department Card Component
  const DepartmentCard = ({ department }: { department: any }) => (
    <Card className="bg-white border border-gray-200 rounded-2xl shadow-none hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-normal">{department.name}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => handleViewDepartment(department)}
              title="View Details"
            >
              <CiViewList className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getDepartmentColor(department.name)} flex items-center justify-center text-lg shadow-md`}>
            {getDepartmentIcon(department.name)}
          </div>
          <Badge className="bg-green-100 text-green-800">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {department.description}
        </p>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Category</span>
            <span className="text-sm font-medium">
              {orgStructure.executive.some(d => d.name === department.name) ? 'Executive' :
               orgStructure.core.some(d => d.name === department.name) ? 'Core' : 'Support'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Level</span>
            <span className="text-sm font-medium">
              {orgStructure.executive.some(d => d.name === department.name) ? 'Level 1' :
               orgStructure.core.some(d => d.name === department.name) ? 'Level 2' : 'Level 3'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Available
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Department Overview</h1>
          <p className="text-gray-600 font-normal">Organizational hierarchy and structure</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => loadDepartments(true)}
          disabled={loading}
          className="rounded-full bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300"
        >
          <CiRedo className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Loading State */}
      {loading && <DepartmentManagementSkeleton />}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-red-500">⚠️</div>
            <span className="text-red-700">{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadDepartments(true)}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      {!loading && !error && availableDepartments.length > 0 && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Indicator */}
          {searchTerm && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
              <span className="text-sm text-gray-600">
                {filteredDepartments.length} result{filteredDepartments.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CiBank className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? "Try adjusting your search criteria."
              : "No departments are currently available."
            }
          </p>
        </div>
      )}

      {/* Organizational Hierarchy */}
      {!loading && !error && filteredDepartments.length > 0 && (
        <div className="space-y-8">
          {/* Executive Level */}
          {orgStructure.executive.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  Executive Level
                </Badge>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                {orgStructure.executive.map((department, index) => (
                  <DepartmentCard key={index} department={department} />
                ))}
              </div>
              {/* Arrow Connector */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-px bg-gradient-to-b from-purple-400 to-blue-400" />
                  <ArrowDown className="w-6 h-6 text-blue-500 animate-bounce" />
                </div>
              </div>
            </div>
          )}

          {/* Core Departments Level */}
          {orgStructure.core.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  Core Departments
                </Badge>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgStructure.core.map((department, index) => (
                  <DepartmentCard key={index} department={department} />
                ))}
              </div>
              {/* Arrow Connector */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-px bg-gradient-to-b from-blue-400 to-green-400" />
                  <ArrowDown className="w-6 h-6 text-green-500 animate-bounce" />
                </div>
              </div>
            </div>
          )}

          {/* Support Departments Level */}
          {orgStructure.support.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  Support Departments
                </Badge>
                <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgStructure.support.map((department, index) => (
                  <DepartmentCard key={index} department={department} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    
      {/* View Drawer */}
      <DepartmentViewDrawer
        department={viewingDepartment}
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false)
          setViewingDepartment(null)
        }}
      />
    </div>
  )
}
