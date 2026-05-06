"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  createPerformanceContract,
  fetchAvailableDepartments,
} from "@/lib/store/slices/performanceSlice"
import { applicationsApi, type InvestmentUser } from "@/lib/api/applications-api"
import { scorecardApiService } from "@/lib/api/scorecard-service"
import { performanceBscApiService } from "@/lib/api/performance-bsc-api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  User,
  Building2,
  Crown,
  Plus,
  Loader2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

type ContractType = "BOARD" | "CEO" | "DEPARTMENT" | "EMPLOYEE"

interface ContractTypeMeta {
  type: ContractType
  title: string
  description: string
  icon: React.ElementType
  gradient: string
  iconBg: string
  iconColor: string
}

const CONTRACT_TYPES: ContractTypeMeta[] = [
  {
    type: "BOARD",
    title: "Board Contract",
    description: "One active Board PC per calendar year.",
    icon: Users,
    gradient: "from-purple-500 to-indigo-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    type: "CEO",
    title: "CEO Contract",
    description: "Auto-resolves the CEO user; override supported.",
    icon: Crown,
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    type: "DEPARTMENT",
    title: "Department Contract",
    description: "One per department per calendar year.",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    type: "EMPLOYEE",
    title: "Employee Contract",
    description: "One per employee per calendar year.",
    icon: User,
    gradient: "from-blue-500 to-cyan-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
]

interface ContractFormState {
  periodYear: string
  periodLabel: string
  title: string
  departmentName: string
  subjectUserId: string
  reviewerUserId: string
  approverUserId: string
  firstName: string
  lastName: string
}

interface ContractEmployeeOption {
  id: string
  firstName: string
  lastName: string
  email: string
  userDepartment: string | null
}

function defaultForm(year: number): ContractFormState {
  return {
    periodYear: String(year),
    periodLabel: String(year),
    title: "",
    departmentName: "",
    subjectUserId: "",
    reviewerUserId: "",
    approverUserId: "",
    firstName: "",
    lastName: "",
  }
}

export function PerformanceContractsManagement() {
  const dispatch = useAppDispatch()
  const { availableDepartments, availableDepartmentsLoading, bscOperationLoading } =
    useAppSelector((s) => s.performance)

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [users, setUsers] = useState<InvestmentUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [contractEmployees, setContractEmployees] = useState<ContractEmployeeOption[]>([])
  const [contractEmployeesLoading, setContractEmployeesLoading] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)

  const [dialogType, setDialogType] = useState<ContractType | null>(null)
  const [form, setForm] = useState<ContractFormState>(defaultForm(currentYear))
  const [createdRecords, setCreatedRecords] = useState<
    Array<{ type: ContractType; label: string; year: number; createdAt: string }>
  >([])

  const [filters, setFilters] = useState({
    contractType: "" as ContractType | "",
    status: "ACTIVE",
    departmentName: "",
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Drawer
  const [selectedContract, setSelectedContract] = useState<any | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchAvailableDepartments())
    void loadUsers()
    void loadContractEmployees(String(currentYear))
    void loadContracts(currentYear)
  }, [dispatch])

  useEffect(() => {
    void loadContracts(selectedYear)
  }, [selectedYear])

  useEffect(() => {
    void loadContracts(selectedYear)
  }, [filters])

  useEffect(() => {
    void loadContractEmployees(String(selectedYear))
  }, [selectedYear])

  useEffect(() => {
    if (dialogType !== "EMPLOYEE") return
    const period = form.periodYear || String(selectedYear)
    void loadContractEmployees(period)
  }, [dialogType, form.periodYear, selectedYear])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await applicationsApi.getInvestmentUsers()
      setUsers(res.data || [])
    } catch (e: any) {
      toast.error("Failed to load users", { description: e?.message })
    } finally {
      setUsersLoading(false)
    }
  }

  const loadContractEmployees = async (periodLabel: string) => {
    setContractEmployeesLoading(true)
    try {
      const res = await scorecardApiService.getEmployeesForGeneration(periodLabel)
      const mapped = (res.data?.employees || []).map((emp) => ({
        id: emp.id,
        firstName: emp.firstName || "",
        lastName: emp.lastName || "",
        email: emp.email || "",
        userDepartment: emp.userDepartment,
      }))
      setContractEmployees(mapped)

      setForm((prev) =>
        prev.subjectUserId && !mapped.some((emp) => emp.id === prev.subjectUserId)
          ? {
              ...prev,
              subjectUserId: "",
              firstName: "",
              lastName: "",
              departmentName: "",
            }
          : prev,
      )
    } catch (e: any) {
      setContractEmployees([])
      toast.error("Failed to load employees with contracts", {
        description: e?.message,
      })
    } finally {
      setContractEmployeesLoading(false)
    }
  }

  const loadContracts = async (year: number) => {
    setContractsLoading(true)
    try {
      const res = await performanceBscApiService.fetchPerformanceContracts({
        periodYear: year,
        periodLabel: String(year),
        contractType: filters.contractType || undefined,
        status: filters.status || undefined,
        departmentName: filters.departmentName || undefined,
        skip: 0,
        take: 500,
      })
      setContracts(res.data || [])
    } catch (e: any) {
      toast.error("Failed to load contracts", { description: e?.message })
      setContracts([])
    } finally {
      setContractsLoading(false)
    }
  }

  const openDialog = (type: ContractType) => {
    setForm(defaultForm(selectedYear))
    setDialogType(type)
  }

  const closeDialog = () => {
    setDialogType(null)
  }

  const yearOptions = useMemo(() => {
    const years: number[] = []
    for (let y = currentYear + 1; y >= currentYear - 3; y--) years.push(y)
    return years
  }, [currentYear])

  const meta = useMemo(
    () => CONTRACT_TYPES.find((c) => c.type === dialogType) ?? null,
    [dialogType]
  )

  const handleSubmit = async () => {
    if (!dialogType) return
    const year = Number.parseInt(form.periodYear, 10) || selectedYear

    const payload: any = {
      periodYear: year,
      periodLabel: form.periodLabel || String(year),
    }
    if (form.title.trim()) payload.title = form.title.trim()
    if (form.reviewerUserId) payload.reviewerUserId = form.reviewerUserId
    if (form.approverUserId) payload.approverUserId = form.approverUserId

    if (dialogType === "DEPARTMENT") {
      if (!form.departmentName.trim()) {
        toast.error("Select a department")
        return
      }
      payload.departmentName = form.departmentName.trim()
    }

    if (dialogType === "EMPLOYEE") {
      if (!form.subjectUserId) {
        toast.error("Select an employee")
        return
      }
      payload.subjectUserId = form.subjectUserId
      if (form.firstName) payload.firstName = form.firstName
      if (form.lastName) payload.lastName = form.lastName
      if (form.departmentName) payload.departmentName = form.departmentName
    }

    if (dialogType === "CEO" && form.subjectUserId) {
      payload.subjectUserId = form.subjectUserId
    }

    try {
      await dispatch(
        createPerformanceContract({ type: dialogType, payload })
      ).unwrap()

      toast.success(`${meta?.title} created`, {
        description: `Period ${payload.periodLabel}`,
      })
      setCreatedRecords((prev) => [
        {
          type: dialogType,
          label: payload.periodLabel,
          year,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      await loadContracts(year)
      closeDialog()
    } catch (error: any) {
      const msg = String(error || "").toLowerCase()
      if (msg.includes("duplicate") || msg.includes("409")) {
        toast.info(`${meta?.title} already exists for ${year}`)
      } else {
        toast.error(`Failed to create ${meta?.title}`, {
          description: String(error || "Unknown error"),
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumb + header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shrink-0">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Performance</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-card-foreground font-medium">Contracts</span>
        </nav>
        <div className="flex items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number.parseInt(v, 10))}
          >
            <SelectTrigger className="w-[120px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => {
              dispatch(fetchAvailableDepartments())
              void loadUsers()
              void loadContractEmployees(String(selectedYear))
            }}
            disabled={usersLoading || availableDepartmentsLoading || contractEmployeesLoading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                usersLoading || availableDepartmentsLoading || contractEmployeesLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Contract Type</Label>
              <Select
                value={filters.contractType || "ALL"}
                onValueChange={(v) =>
                  setFilters({ ...filters, contractType: (v === "ALL" ? "" : v as ContractType) })
                }
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="BOARD">Board</SelectItem>
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="DEPARTMENT">Department</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status || "ALL"}
                onValueChange={(v) => setFilters({ ...filters, status: v === "ALL" ? "" : v })}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select
                value={filters.departmentName || "ALL"}
                onValueChange={(v) => setFilters({ ...filters, departmentName: v === "ALL" ? "" : v })}
                disabled={availableDepartmentsLoading}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All departments</SelectItem>
                  {availableDepartments.map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full w-full"
                onClick={() => setFilters({ contractType: "", status: "ACTIVE", departmentName: "" })}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-card-foreground">
                Performance Contracts
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Create and manage annual Balanced Scorecard performance
                contracts for the Board, CEO, each department, and
                individual employees. One contract per entity per
                calendar year.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Badge className="bg-white/70 text-card-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  Active Period: {selectedYear}
                </Badge>
                <Badge className="bg-white/70 text-card-foreground">
                  {availableDepartments.length} departments
                </Badge>
                <Badge className="bg-white/70 text-card-foreground">
                  {contractEmployees.length} employees with contracts
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Contract type cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {CONTRACT_TYPES.map((ct) => {
            const Icon = ct.icon
            return (
              <div
                key={ct.type}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className={`h-1.5 bg-gradient-to-r ${ct.gradient}`} />
                <div className="p-5 space-y-4">
                  <div
                    className={`w-12 h-12 rounded-full ${ct.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${ct.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-card-foreground">
                      {ct.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ct.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => openDialog(ct.type)}
                    className={`w-full rounded-full gap-1.5 bg-gradient-to-r ${ct.gradient} text-white`}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create {ct.type === "EMPLOYEE" ? "Employee" : ct.type === "DEPARTMENT" ? "Dept" : ct.title.split(" ")[0]}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Active Contracts List */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="bg-primary px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-primary-foreground">
              Active Contracts
            </h3>
            <span className="text-xs text-primary-foreground/80">
              {contracts.length} contracts
            </span>
          </div>
          <div className="divide-y divide-border">
            {contractsLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                <p>Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No contracts found with current filters.</p>
              </div>
            ) : (
              <>
                {contracts
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((contract: any) => {
                    const ctMeta = CONTRACT_TYPES.find((c) => c.type === contract.contractType)
                    return (
                      <div
                        key={contract.id}
                        onClick={() => { setSelectedContract(contract); setIsDrawerOpen(true) }}
                        className="flex items-center justify-between px-5 py-3 text-sm hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {ctMeta && (
                            <div
                              className={`w-8 h-8 rounded-full ${ctMeta.iconBg} flex items-center justify-center flex-shrink-0`}
                            >
                              <ctMeta.icon className={`w-4 h-4 ${ctMeta.iconColor}`} />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-card-foreground">
                              {contract.title || `${contract.contractType} Contract`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {contract.departmentName && `${contract.departmentName} • `}
                              {contract.periodLabel}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              contract.status === "ACTIVE"
                                ? "default"
                                : contract.status === "INACTIVE"
                                  ? "outline"
                                  : "secondary"
                            }
                            className="rounded-full"
                          >
                            {contract.status}
                          </Badge>
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    )
                  })}

                {/* Pagination */}
                {contracts.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-5 py-3 bg-muted/20">
                    <span className="text-xs text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, contracts.length)} of {contracts.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.ceil(contracts.length / itemsPerPage) }, (_, i) => i + 1)
                        .slice(Math.max(0, currentPage - 3), currentPage + 2)
                        .map((page) => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        disabled={currentPage >= Math.ceil(contracts.length / itemsPerPage)}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Helper: direct links to scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <a
            href="/performance/board-scorecards"
            className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">View</p>
                <p className="text-sm font-medium">Board Scorecards</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </a>
          <a
            href="/performance/ceo-scorecards"
            className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">View</p>
                <p className="text-sm font-medium">CEO Scorecards</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </a>
          <a
            href="/performance/department-scorecards"
            className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">View</p>
                <p className="text-sm font-medium">Department Scorecards</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </a>
          <a
            href="/performance/user-scorecards"
            className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">View</p>
                <p className="text-sm font-medium">Employee Scorecards</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </a>
        </div>
      </main>

      {/* Create contract dialog */}
      <Dialog open={!!dialogType} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {meta && (
                <div
                  className={`w-10 h-10 rounded-full ${meta.iconBg} flex items-center justify-center`}
                >
                  <meta.icon className={`w-5 h-5 ${meta.iconColor}`} />
                </div>
              )}
              <div>
                <DialogTitle>Create {meta?.title}</DialogTitle>
                <DialogDescription>{meta?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Period Year *</Label>
                <Select
                  value={form.periodYear}
                  onValueChange={(v) =>
                    setForm({ ...form, periodYear: v, periodLabel: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Period Label</Label>
                <Input
                  value={form.periodLabel}
                  onChange={(e) =>
                    setForm({ ...form, periodLabel: e.target.value })
                  }
                  placeholder="e.g. 2026 or 2026-Q1"
                  className="rounded-full"
                />
              </div>
            </div>

            {dialogType === "DEPARTMENT" && (
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Select
                  value={form.departmentName}
                  onValueChange={(v) => setForm({ ...form, departmentName: v })}
                  disabled={availableDepartmentsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        availableDepartmentsLoading
                          ? "Loading..."
                          : "Select department"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(dialogType === "EMPLOYEE" || dialogType === "CEO") && (
              <div className="space-y-1.5">
                <Label>
                  {dialogType === "CEO"
                    ? "CEO User (optional — auto-resolves)"
                    : "Employee *"}
                </Label>
                <Select
                  value={form.subjectUserId}
                  onValueChange={(v) => {
                    const pool = dialogType === "EMPLOYEE" ? contractEmployees : users
                    const user = pool.find((u: any) => u.id === v)
                    setForm({
                      ...form,
                      subjectUserId: v,
                      firstName: user?.firstName || "",
                      lastName: user?.lastName || "",
                      departmentName: user?.userDepartment || "",
                    })
                  }}
                  disabled={dialogType === "EMPLOYEE" ? contractEmployeesLoading : usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        (dialogType === "EMPLOYEE" ? contractEmployeesLoading : usersLoading)
                          ? "Loading..."
                          : dialogType === "CEO"
                            ? "Leave empty to auto-resolve"
                            : "Select employee"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(dialogType === "EMPLOYEE" ? contractEmployees : users).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex flex-col">
                          <span>
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {u.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Title (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={`${meta?.title} ${form.periodLabel}`}
                className="rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reviewer (optional)</Label>
                <Select
                  value={form.reviewerUserId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, reviewerUserId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Approver (optional)</Label>
                <Select
                  value={form.approverUserId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, approverUserId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              Creating will enforce one active contract per entity per
              calendar year. Duplicate attempts return 409 and prompt you
              to view the existing contract.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={closeDialog}
                className="rounded-full"
                disabled={bscOperationLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={bscOperationLoading}
                className={`rounded-full gap-1.5 text-white bg-gradient-to-r ${meta?.gradient || "from-blue-500 to-blue-600"}`}
              >
                {bscOperationLoading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Create Contract
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto p-0 border-l-2 border-gray-100">
          {selectedContract && (
            <div className="flex flex-col h-full bg-white">
              <SheetHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <FileText className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
                      {selectedContract.contractType} CONTRACT
                    </Badge>
                    <button 
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <SheetTitle className="text-3xl font-light text-white tracking-tight leading-tight">
                    {selectedContract.title || `${selectedContract.contractType} Contract`}
                  </SheetTitle>
                  <div className="flex items-center gap-6 text-blue-100/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{selectedContract.periodLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm font-medium">{selectedContract.departmentName || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Status Section */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Lifecycle Status</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant={selectedContract.status === "ACTIVE" ? "default" : "secondary"} className="px-4 py-1.5 rounded-xl text-xs font-semibold shadow-none border-2">
                      {selectedContract.status}
                    </Badge>
                    <Badge variant="outline" className="px-4 py-1.5 rounded-xl text-xs font-semibold shadow-none border-2 border-gray-100 text-gray-500">
                      VERSION 1.0
                    </Badge>
                  </div>
                </section>

                {/* Primary Actors */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Subject Participant</h4>
                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100">
                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-gray-900">{selectedContract.subjectUser?.firstName || "N/A"} {selectedContract.subjectUser?.lastName || ""}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{selectedContract.subjectUser?.email || "No Participant Assigned"}</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Created By</h4>
                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100">
                         <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <User className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-gray-900">{selectedContract.createdBy?.firstName || "System"} {selectedContract.createdBy?.lastName || ""}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{selectedContract.createdBy?.email || "Automated Setup"}</p>
                         </div>
                      </div>
                   </div>
                </section>

                {/* Period & Department */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Reporting Period</h4>
                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100">
                         <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Calendar className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-gray-900">{selectedContract.periodLabel}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                               {selectedContract.periodStart ? new Date(selectedContract.periodStart).toLocaleDateString() : "N/A"} - {selectedContract.periodEnd ? new Date(selectedContract.periodEnd).toLocaleDateString() : "N/A"}
                            </p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Departmental Unit</h4>
                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100">
                         <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Building2 className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-gray-900">{selectedContract.departmentName || "N/A"}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">Primary Org Unit</p>
                         </div>
                      </div>
                   </div>
                </section>

                {/* Workflow Roles */}
                <section className="space-y-4 pt-4 border-t border-gray-50">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Workflow Approval Chain</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl space-y-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reviewer</span>
                            <Badge variant="outline" className={cn("text-[9px] font-bold uppercase", selectedContract.reviewer ? "border-emerald-200 text-emerald-600" : "border-gray-200 text-gray-400")}>
                               {selectedContract.reviewer ? "Assigned" : "Pending"}
                            </Badge>
                         </div>
                         <p className="text-sm font-semibold text-gray-800">
                            {selectedContract.reviewer ? `${selectedContract.reviewer.firstName} ${selectedContract.reviewer.lastName}` : "No Reviewer Assigned"}
                         </p>
                      </div>
                      <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl space-y-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Approver</span>
                            <Badge variant="outline" className={cn("text-[9px] font-bold uppercase", selectedContract.approver ? "border-emerald-200 text-emerald-600" : "border-gray-200 text-gray-400")}>
                               {selectedContract.approver ? "Assigned" : "Pending"}
                            </Badge>
                         </div>
                         <p className="text-sm font-semibold text-gray-800">
                            {selectedContract.approver ? `${selectedContract.approver.firstName} ${selectedContract.approver.lastName}` : "No Approver Assigned"}
                         </p>
                      </div>
                   </div>
                </section>

                {/* Financials & Metadata */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Budget Allocation</h4>
                      <div className="p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100 flex items-center justify-between">
                         <div>
                            <p className="text-xs font-bold text-gray-900">${(selectedContract.allocatedBudget || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400 uppercase mt-0.5">Allocated</p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-bold text-red-600">${(selectedContract.actualSpend || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400 uppercase mt-0.5">Actual Spend</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">System Metadata</h4>
                      <div className="p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100">
                         <p className="text-sm font-semibold text-gray-900 capitalize">{selectedContract.metadata?.source?.replace(/_/g, ' ') || "Manual Entry"}</p>
                         <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">Source Origin</p>
                      </div>
                   </div>
                </section>

                {/* KPI Overview (Placeholder) */}
                <section className="space-y-4 pt-4 border-t border-gray-50">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Contract KPIs</h4>
                      <Badge className="bg-blue-50 text-blue-600 border-none rounded-full px-3 py-1 text-[10px] font-bold">12 METRICS</Badge>
                   </div>
                   <div className="bg-gray-50 rounded-2xl p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center mb-3">
                         <RefreshCw className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Scorecard details are being processed.</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-[240px]">Navigate to individual scorecards to view detailed KPI breakdown.</p>
                   </div>
                </section>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0 flex gap-4">
                 <Button className="flex-1 rounded-2xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-none border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
                    GO TO SCORECARD
                 </Button>
                 <Button variant="outline" className="flex-1 rounded-2xl h-12 bg-white border-2 border-gray-200 text-gray-600 font-semibold text-xs shadow-none hover:bg-gray-50">
                    PRINT CONTRACT
                 </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
