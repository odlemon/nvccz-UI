"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { 
  fetchAvailableKPIs,
  fetchKPIsByDepartment,
  fetchKPIsByAccountType,
  fetchKPIStatistics,
  fetchAvailableDepartments,
  setSelectedDepartmentFilter,
  setSelectedAccountTypeFilter,
  clearAvailableKPIs,
  fetchFinancialKPIs
} from "@/lib/store/slices/performanceSlice"
import { kpiApiService } from "@/lib/api/kpi-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  BarChart3,
  TrendingUp,
  FileText,
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { CiRedo, CiViewList, CiViewTimeline, CiViewBoard, CiCircleCheck, CiUser } from "react-icons/ci"
import { KPIViewDrawer } from "./kpi-view-drawer"
import { KPIManagementSkeleton } from "./kpi-skeleton"
import { KPIForm } from "./kpi-form"
import { KPIConfirmDeleteModal } from "./kpi-confirm-delete-modal"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { ProcurementDataTable } from "@/components/procurement/procurement-data-table"
import { KPIPerformanceAnalysisTab } from "./kpi-performance-analysis-tab"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"

export function KPIManagement() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const {
    availableKPIs,
    availableDepartments,
    kpiStatistics,
    loading,
    error,
    selectedDepartmentFilter,
    selectedAccountTypeFilter,
    financialKPIs,
    financialKPIsLoading
  } = useAppSelector((state) => state.performance)

  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [viewingKPI, setViewingKPI] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [financialCurrentPage, setFinancialCurrentPage] = useState(1)
  const [financialItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "analysis">("overview")
  const [isKpiFormOpen, setIsKpiFormOpen] = useState(false)
  const [editingKPI, setEditingKPI] = useState<any | null>(null)
  const [isSubmittingKPI, setIsSubmittingKPI] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [kpiToDelete, setKpiToDelete] = useState<any | null>(null)
  const hasLoadedRef = useRef(false)

  // Account types for filtering
  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']

  const totalKPIs = kpiStatistics?.total ?? availableKPIs.length
  const activeKPIs = availableKPIs.filter((kpi) => kpi.isActive).length
  const financialKPIsCount = kpiStatistics?.financial ?? 0
  const nonFinancialKPIs = kpiStatistics?.nonFinancial ?? 0
  const departmentCoverage = kpiStatistics?.byDepartment?.length ?? 0
  const financialPercent = totalKPIs > 0 ? (financialKPIsCount / totalKPIs) * 100 : 0
  const nonFinancialPercent = totalKPIs > 0 ? (nonFinancialKPIs / totalKPIs) * 100 : 0

  // Load initial data
  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadInitialData()
      hasLoadedRef.current = true
    }
  }, [])

  const loadInitialData = async () => {
    try {
      await Promise.all([
        dispatch(fetchAvailableKPIs()).unwrap(),
        dispatch(fetchKPIStatistics()).unwrap(),
        dispatch(fetchAvailableDepartments()).unwrap()
      ])
      toast.success("KPIs loaded successfully")
    } catch (error: any) {
      console.error('Failed to load initial data:', error)
      toast.error("Failed to load KPIs")
    }
  }

  const getErrorText = (error: unknown) => {
    if (typeof error === "string") return error
    if (error && typeof error === "object") {
      const maybeError = error as any
      if (typeof maybeError?.response?.message === "string") return maybeError.response.message
      if (typeof maybeError?.response?.error === "string") return maybeError.response.error
      if (typeof maybeError?.message === "string") return maybeError.message
    }
    return "Unknown error"
  }

  const reloadKPIData = async () => {
    dispatch(clearAvailableKPIs())
    if (selectedDepartmentFilter !== "all") {
      await dispatch(fetchKPIsByDepartment(selectedDepartmentFilter)).unwrap()
    } else if (selectedAccountTypeFilter !== "all") {
      await dispatch(fetchKPIsByAccountType(selectedAccountTypeFilter)).unwrap()
    } else {
      await dispatch(fetchAvailableKPIs()).unwrap()
    }
    await dispatch(fetchKPIStatistics()).unwrap()
    if (activeTab === "financials") {
      await dispatch(fetchFinancialKPIs()).unwrap()
    }
  }

  // Handle filter changes
  useEffect(() => {
    if (!hasLoadedRef.current) return

    const loadFilteredKPIs = async () => {
      try {
        dispatch(clearAvailableKPIs())
        
        if (selectedDepartmentFilter !== 'all') {
          await dispatch(fetchKPIsByDepartment(selectedDepartmentFilter)).unwrap()
        } else if (selectedAccountTypeFilter !== 'all') {
          await dispatch(fetchKPIsByAccountType(selectedAccountTypeFilter)).unwrap()
        } else {
          await dispatch(fetchAvailableKPIs()).unwrap()
        }
      } catch (error: any) {
        console.error('Failed to load filtered KPIs:', error)
        toast.error("Failed to load filtered KPIs")
      }
    }

    loadFilteredKPIs()
  }, [selectedDepartmentFilter, selectedAccountTypeFilter, dispatch])

  useEffect(() => {
    if (activeTab === "financials" && financialKPIs.length === 0 && !financialKPIsLoading) {
      dispatch(fetchFinancialKPIs())
    }
  }, [activeTab, financialKPIs.length, financialKPIsLoading, dispatch])

  const handleRefresh = async () => {
    try {
      await reloadKPIData()
      toast.success("KPIs refreshed successfully")
    } catch (error) {
      toast.error("Failed to refresh KPIs")
    }
  }

  const handleOpenCreateKPI = () => {
    setEditingKPI(null)
    setIsKpiFormOpen(true)
  }

  const handleOpenEditKPI = (kpi: any) => {
    setEditingKPI(kpi)
    setIsKpiFormOpen(true)
  }

  const handleRequestDeleteKPI = (kpi: any) => {
    setKpiToDelete(kpi)
    setIsDeleteModalOpen(true)
  }

  const handleSubmitKPI = async (formData: any) => {
    setIsSubmittingKPI(true)
    try {
      if (editingKPI?.id) {
        await kpiApiService.updateKPI(editingKPI.id, formData)
      } else {
        await kpiApiService.createKPI(formData)
      }

      await reloadKPIData()
      toast.success(`KPI ${editingKPI ? "updated" : "created"} successfully`)
      setIsKpiFormOpen(false)
      setEditingKPI(null)
    } catch (error) {
      toast.error(`Failed to ${editingKPI ? "update" : "create"} KPI: ${getErrorText(error)}`)
    } finally {
      setIsSubmittingKPI(false)
    }
  }

  const handleConfirmDeleteKPI = async () => {
    if (!kpiToDelete?.id) return

    try {
      await kpiApiService.deleteKPI(kpiToDelete.id)
      await reloadKPIData()
      toast.success("KPI deleted successfully")

      if (viewingKPI?.id === kpiToDelete.id) {
        setIsViewDrawerOpen(false)
        setViewingKPI(null)
      }
      setIsDeleteModalOpen(false)
      setKpiToDelete(null)
    } catch (error) {
      toast.error(`Failed to delete KPI: ${getErrorText(error)}`)
      throw error
    }
  }

  const handleViewKPI = (kpi: any) => {
    setViewingKPI(kpi)
    setIsViewDrawerOpen(true)
  }

  const handleResetFilters = () => {
    dispatch(setSelectedDepartmentFilter('all'))
    dispatch(setSelectedAccountTypeFilter('all'))
    setSearchTerm("")
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "overview" | "financials" | "analysis")
  }

  const handleViewFinancialKPI = (kpi: any) => {
    handleViewKPI(kpi)
  }

  // Filter KPIs based on search term
  const filteredKPIs = availableKPIs.filter((kpi) =>
    kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kpi.hardcodedDetails?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kpi.hardcodedDetails?.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic for overview
  const totalPages = Math.ceil(filteredKPIs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedKPIs = filteredKPIs.slice(startIndex, endIndex)

  // Pagination logic for financial KPIs
  const financialTotalPages = Math.ceil(financialKPIs.length / financialItemsPerPage)
  const financialStartIndex = (financialCurrentPage - 1) * financialItemsPerPage
  const financialEndIndex = financialStartIndex + financialItemsPerPage
  const paginatedFinancialKPIs = financialKPIs.slice(financialStartIndex, financialEndIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDepartmentFilter, selectedAccountTypeFilter, searchTerm])

  // Reset financial page when tab changes
  useEffect(() => {
    if (activeTab === 'financials') {
      setFinancialCurrentPage(1)
    }
  }, [activeTab])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleFinancialPageChange = (page: number) => {
    setFinancialCurrentPage(page)
  }

  const getFilterCount = () => {
    let count = 0
    if (selectedDepartmentFilter !== "all") count++
    if (selectedAccountTypeFilter !== "all") count++
    if (searchTerm) count++
    return count
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Percentage': 'from-blue-500 to-blue-600',
      'Metric': 'from-purple-500 to-purple-600',
      'Count': 'from-green-500 to-green-600'
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Asset': 'bg-green-100 text-green-800',
      'Liability': 'bg-red-100 text-red-800',
      'Equity': 'bg-purple-100 text-purple-800',
      'Revenue': 'bg-blue-100 text-blue-800',
      'Expense': 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const departmentNameLookup = useMemo(() => {
    // Add null check and ensure availableDepartments is an array
    if (!availableDepartments || !Array.isArray(availableDepartments)) {
      return new Map()
    }
    return new Map(availableDepartments.map((dept: any) => [dept.id ?? dept.name, dept.name]))
  }, [availableDepartments])

  // Add safe check for any other uses of availableDepartments
  const validDepartments = Array.isArray(availableDepartments) ? availableDepartments : []

  const formatWeight = (value: string | number) => {
    const numeric = typeof value === "string" ? parseFloat(value) : value
    if (Number.isNaN(numeric)) return "–"
    return `${(numeric * 100).toFixed(0)}%`
  }

  const formatUnit = (row: any) => {
    if (!row.hasUnit) return "—"
    return row.unitSymbol ?? row.unit ?? "N/A"
  }

  const financialColumns = [
    { key: "name", label: "KPI", sortable: true },
    {
      key: "hardcodedDetails.code",
      label: "Code",
      render: (_: unknown, row: any) => row.hardcodedDetails?.code ?? "N/A",
      sortable: true,
    },
    {
      key: "hardcodedDetails.accountType",
      label: "Account Type",
      render: (_: unknown, row: any) => row.hardcodedDetails?.accountType ?? "N/A",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
    },
    {
      key: "departmentId",
      label: "Department",
      render: (value: string) => departmentNameLookup.get(value) ?? value ?? "N/A",
      sortable: true,
    },
    {
      key: "weightValue",
      label: "Weight",
      render: (value: string | number) => formatWeight(value),
      sortable: true,
    },
    {
      key: "unit",
      label: "Unit",
      render: (_: unknown, row: any) => formatUnit(row),
      sortable: true,
    },
    {
      key: "hardcodedDetails.journalEntryType",
      label: "Journal",
      render: (_: unknown, row: any) => row.hardcodedDetails?.journalEntryType ?? "N/A",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (_: unknown, row: any) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ]

  const exportFinancialKPIs = () => {
    if (!financialKPIs.length) {
      toast.info("No financial KPIs to export")
      return
    }

    const headers = [
      "KPI",
      "Account Type",
      "Type",
      "Department",
      "Weight",
      "Unit",
      "Account #",
      "Journal",
    ]
    const rows = financialKPIs.map((item) => [
      item.name,
      item.hardcodedDetails?.accountType ?? "",
      item.type,
      item.departmentId ?? "",
      item.weightValue,
      item.unit ?? "",
      item.hardcodedDetails?.accountNumber ?? "",
      item.hardcodedDetails?.journalEntryType ?? "",
    ])

    const csv = [headers, ...rows].map((line) => line.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "financial-kpis.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const mainTabs = [
    { id: "overview", label: "KPIs Overview", icon: CiViewTimeline, gradient: "from-blue-500 to-indigo-600" },
    { id: "financials", label: "Financial KPIs", icon: CiViewBoard, gradient: "from-emerald-500 to-teal-600" },
    { id: "analysis", label: "Performance Analysis", icon: TrendingUp, gradient: "from-purple-500 to-pink-600" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">KPI Management</h1>
          <p className="text-gray-600 font-normal">View and analyze key performance indicators</p>
        </div>
        <div className="flex items-center gap-2">
          {permissions.canCreateKPI && (
            <Button
              onClick={handleOpenCreateKPI}
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create KPI
            </Button>
          )}
          <Button 
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="rounded-full bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300"
          >
            <CiRedo className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {kpiStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
          <Card className="rounded-2xl gradient-primary text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total KPIs</CardTitle>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CiViewTimeline className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl">{totalKPIs}</div>
              <p className="text-xs text-white/80">{activeKPIs} active</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Financial Coverage</CardTitle>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <CiViewBoard className="h-4 w-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl">
                {financialKPIsCount}/{totalKPIs}
              </div>
              <div className="relative mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                  style={{ width: `${financialPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {financialPercent.toFixed(0)}% financial KPIs
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl gradient-primary text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Non-Financial KPIs</CardTitle>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CiCircleCheck className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl">
                {nonFinancialKPIs}/{totalKPIs}
              </div>
              <div className="relative mt-2 h-2 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-white"
                  style={{ width: `${nonFinancialPercent}%` }}
                />
              </div>
              <p className="text-xs text-white/80 mt-1">
                {nonFinancialPercent.toFixed(0)}% non-financial coverage
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Department Performance</CardTitle>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <CiUser className="h-4 w-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl">{departmentCoverage}</div>
              <p className="text-xs text-muted-foreground">Departments with KPIs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center overflow-x-auto border-b px-6 mt-3">
        <div className="flex space-x-1 min-w-max px-4">
          {mainTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                  isActive
                    ? "text-blue-600 border-blue-600 bg-blue-50/40"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                    tab.gradient
                  )}
                >
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {getFilterCount() > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {getFilterCount()} filter{getFilterCount() !== 1 ? 's' : ''} applied
                  </Badge>
                  <Button
                    onClick={handleResetFilters}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search KPIs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Department Filter */}
              <Select 
                value={selectedDepartmentFilter} 
                onValueChange={(value) => {
                  dispatch(setSelectedDepartmentFilter(value))
                  dispatch(setSelectedAccountTypeFilter('all'))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepartments?.map((dept: any) => (
                    <SelectItem key={dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Account Type Filter */}
              <Select 
                value={selectedAccountTypeFilter} 
                onValueChange={(value) => {
                  dispatch(setSelectedAccountTypeFilter(value))
                  dispatch(setSelectedDepartmentFilter('all'))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Account Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Account Types</SelectItem>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {(searchTerm || selectedDepartmentFilter !== 'all' || selectedAccountTypeFilter !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap">
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm("")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedDepartmentFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Department: {selectedDepartmentFilter}
                    <button onClick={() => dispatch(setSelectedDepartmentFilter('all'))} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedAccountTypeFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Account Type: {selectedAccountTypeFilter}
                    <button onClick={() => dispatch(setSelectedAccountTypeFilter('all'))} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-red-700">{error}</span>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* KPIs Grid */}
          {loading ? (
            <KPIManagementSkeleton />
          ) : filteredKPIs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedKPIs.map((kpi) => (
                <Card 
                  key={kpi.id} 
                  className="bg-white border border-gray-200 rounded-2xl shadow-none hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleViewKPI(kpi)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(kpi.type)} flex items-center justify-center shadow-md`}>
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewKPI(kpi)
                        }}
                      >
                        <CiViewList className="w-4 h-4" />
                      </Button>
                      {permissions.canUpdateKPI && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full w-8 h-8 p-0 bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEditKPI(kpi)
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {permissions.canDeleteKPI && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRequestDeleteKPI(kpi)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <CardTitle className="text-base font-semibold line-clamp-2">{kpi.name}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <Badge className="text-xs">{kpi.type}</Badge>
                      {kpi.isActive && <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>}
                      {kpi.hardcodedDetails?.isFinancial && (
                        <Badge className="bg-indigo-100 text-indigo-800 text-xs">Financial</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {kpi.hardcodedDetails?.description || 'No description available'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Weight</span>
                        <span className="font-medium">{(parseFloat(kpi.weightValue) * 100).toFixed(0)}%</span>
                      </div>
                      {kpi.hardcodedDetails?.accountType && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Account Type</span>
                          <Badge className={`${getAccountTypeColor(kpi.hardcodedDetails.accountType)} text-xs`}>
                            {kpi.hardcodedDetails.accountType}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No KPIs Found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedDepartmentFilter !== 'all' || selectedAccountTypeFilter !== 'all'
                  ? "No KPIs match your current filters. Try adjusting your search criteria."
                  : "No KPIs are currently available."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredKPIs.length)} of {filteredKPIs.length} KPIs
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {activeTab === "financials" && (
        <div className="space-y-6">
          {/* Filters for Financial KPIs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Financial KPIs</h3>
              <Button 
                onClick={exportFinancialKPIs}
                variant="outline"
                className="rounded-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Financial KPIs Grid */}
          {financialKPIsLoading ? (
            <KPIManagementSkeleton />
          ) : financialKPIs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedFinancialKPIs.map((kpi) => (
                  <Card 
                    key={kpi.id} 
                    className="bg-white border border-gray-200 rounded-2xl shadow-none hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => handleViewKPI(kpi)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(kpi.type)} flex items-center justify-center shadow-md`}>
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewKPI(kpi)
                          }}
                        >
                          <CiViewList className="w-4 h-4" />
                        </Button>
                        {permissions.canUpdateKPI && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0 bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEditKPI(kpi)
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {permissions.canDeleteKPI && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRequestDeleteKPI(kpi)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <CardTitle className="text-base font-semibold line-clamp-2">{kpi.name}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <Badge className="text-xs">{kpi.type}</Badge>
                        {kpi.isActive && <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>}
                        <Badge className="bg-indigo-100 text-indigo-800 text-xs">Financial</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {kpi.hardcodedDetails?.description || 'No description available'}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Weight</span>
                          <span className="font-medium">{formatWeight(kpi.weightValue)}</span>
                        </div>
                        {kpi.hardcodedDetails?.accountType && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Account Type</span>
                            <Badge className={`${getAccountTypeColor(kpi.hardcodedDetails.accountType)} text-xs`}>
                              {kpi.hardcodedDetails.accountType}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination for Financial KPIs */}
              {financialTotalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-gray-600">
                    Showing {financialStartIndex + 1} to {Math.min(financialEndIndex, financialKPIs.length)} of {financialKPIs.length} Financial KPIs
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handleFinancialPageChange(financialCurrentPage - 1)}
                          className={financialCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(financialTotalPages, 5) }, (_, i) => {
                        let pageNum
                        if (financialTotalPages <= 5) {
                          pageNum = i + 1
                        } else if (financialCurrentPage <= 3) {
                          pageNum = i + 1
                        } else if (financialCurrentPage >= financialTotalPages - 2) {
                          pageNum = financialTotalPages - 4 + i
                        } else {
                          pageNum = financialCurrentPage - 2 + i
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handleFinancialPageChange(pageNum)}
                              isActive={financialCurrentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handleFinancialPageChange(financialCurrentPage + 1)}
                          className={financialCurrentPage === financialTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Financial KPIs Found</h3>
              <p className="text-gray-600">No financial KPIs are currently available.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "analysis" && (
        <KPIPerformanceAnalysisTab />
      )}

      {/* KPI View Drawer */}
      <KPIViewDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false)
          setViewingKPI(null)
        }}
        kpi={viewingKPI}
        onEdit={(kpi) => handleOpenEditKPI(kpi)}
        onDelete={(kpi) => handleRequestDeleteKPI(kpi)}
      />

      <KPIForm
        isOpen={isKpiFormOpen}
        onClose={() => {
          setIsKpiFormOpen(false)
          setEditingKPI(null)
        }}
        onSubmit={handleSubmitKPI}
        kpi={editingKPI}
        isLoading={isSubmittingKPI}
      />

      <KPIConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setKpiToDelete(null)
        }}
        onConfirm={handleConfirmDeleteKPI}
        title="Delete KPI"
        description="Are you sure you want to delete this KPI from the catalog?"
        itemName={kpiToDelete?.name || "Selected KPI"}
      />
    </div>
  )
}



