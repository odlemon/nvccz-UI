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
import { companyProfileApi, type CompanyAddress } from "@/lib/api/company-profile-api"
import PerformanceContractPDF from "./performance-contract-pdf-document"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
  Printer,
  Award,
  Target,
  DollarSign,
  Search,
  ChevronDown,
  Download,
  Filter,
  Settings2,
  ArrowRight,
  Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type ContractType = "BOARD" | "CEO" | "DEPARTMENT" | "EMPLOYEE"

type ButtonVariant =
  | "gradient"
  | "gradient-create"
  | "gradient-update"
  | "gradient-info"
  | "gradient-warning"
  | "gradient-danger"

interface ContractTypeMeta {
  type: ContractType
  title: string
  ctaLabel: string
  description: string
  icon: React.ElementType
  // Background gradient for the strip on top of the card.
  gradient: string
  iconBg: string
  iconColor: string
  // Maps to the global Button variant so the call-to-action picks up the
  // shared CRUD gradient styling.
  buttonVariant: ButtonVariant
}

const CONTRACT_TYPES: ContractTypeMeta[] = [
  {
    type: "BOARD",
    title: "Board Contract",
    ctaLabel: "Create Board",
    description: "One active Board PC per calendar year.",
    icon: Users,
    gradient: "from-purple-500 to-indigo-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    buttonVariant: "gradient",
  },
  {
    type: "CEO",
    title: "CEO Contract",
    ctaLabel: "Create CEO",
    description: "Auto-resolves the CEO user; override supported.",
    icon: Crown,
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    buttonVariant: "gradient-update",
  },
  {
    type: "DEPARTMENT",
    title: "Department Contract",
    ctaLabel: "Create Dept",
    description: "One per department per calendar year.",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    buttonVariant: "gradient-create",
  },
  {
    type: "EMPLOYEE",
    title: "Employee Contract",
    ctaLabel: "Create Employee",
    description: "One per employee per calendar year.",
    icon: User,
    gradient: "from-blue-500 to-cyan-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonVariant: "gradient-info",
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
  const router = useRouter()
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

  // PDF export wiring (lazy-loaded so @react-pdf/renderer doesn't run on the
  // server) and the active company address used for the letterhead.
  const [isClient, setIsClient] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null)
  const [activeAddress, setActiveAddress] = useState<CompanyAddress | null>(null)

  const [contractDrawerTab, setContractDrawerTab] = useState<'overview' | 'kpis'>('overview')
  const drawerContractMeta = useMemo(
    () => CONTRACT_TYPES.find(c => c.type === selectedContract?.contractType) ?? null,
    [selectedContract?.contractType]
  )

  useEffect(() => {
    setIsClient(true)
    import("@react-pdf/renderer")
      .then((pdfModule) => setPDFDownloadLink(() => pdfModule.PDFDownloadLink))
      .catch(() => {})
    companyProfileApi.getActiveAddress().then((a) => setActiveAddress(a)).catch(() => {})
  }, [])

  // Route the user to the scorecard view that matches the contract type.
  const handleGoToScorecard = () => {
    if (!selectedContract) return
    const t = String(selectedContract.contractType || "").toUpperCase()
    const route =
      t === "CEO" ? "/performance/ceo-scorecards" :
      t === "BOARD" ? "/performance/board-scorecards" :
      t === "DEPARTMENT" ? "/performance/department-scorecards" :
      t === "EMPLOYEE" || t === "USER" ? "/performance/user-scorecards" :
      "/performance/contracts"
    router.push(route)
    setIsDrawerOpen(false)
  }

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
      const res: any = await applicationsApi.getInvestmentUsers()
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
      const res: any = await scorecardApiService.getEmployeesForGeneration(periodLabel)
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
      const res: any = await performanceBscApiService.fetchPerformanceContracts({
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

        {/* Contract type cards — uniform layout: equal heights, single-line
            description, action button anchored to the bottom of every card. */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {CONTRACT_TYPES.map((ct) => {
            const Icon = ct.icon
            return (
              <div
                key={ct.type}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                <div className={`h-1.5 bg-gradient-to-r ${ct.gradient}`} />
                <div className="p-5 flex flex-col flex-1 gap-4">
                  <div
                    className={`w-12 h-12 rounded-full ${ct.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${ct.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-card-foreground truncate">
                      {ct.title}
                    </h3>
                    <p
                      className="text-xs text-muted-foreground mt-0.5 truncate"
                      title={ct.description}
                    >
                      {ct.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => openDialog(ct.type)}
                    variant={ct.buttonVariant}
                    size="sm"
                    className="w-full rounded-full gap-1.5 mt-auto"
                  >
                    <Plus className="w-4 h-4" />
                    {ct.ctaLabel}
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
                        onClick={() => { setSelectedContract(contract); setIsDrawerOpen(true); setContractDrawerTab('overview') }}
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
                  <div className="flex items-center justify-between gap-3 px-5 py-3 bg-muted/20">
                    <span className="text-xs text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, contracts.length)} of {contracts.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full"
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
                            className="h-9 w-9 p-0 rounded-full"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full"
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
                variant={meta?.buttonVariant ?? "gradient-create"}
                className="rounded-full gap-1.5"
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
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedContract && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-3 truncate">
                    {drawerContractMeta && (
                      <div className={`w-8 h-8 rounded-full ${drawerContractMeta.iconBg} flex items-center justify-center shrink-0`}>
                        <drawerContractMeta.icon className={`w-4 h-4 ${drawerContractMeta.iconColor}`} />
                      </div>
                    )}
                    <span className="truncate">{selectedContract.title || "Performance Contract"}</span>
                  </SheetTitle>
                  <div className="flex items-center gap-2 mr-8">
                    <Button
                      onClick={handleGoToScorecard}
                      className="rounded-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Scorecard
                    </Button>
                    {isClient && PDFDownloadLink && (
                      <PDFDownloadLink
                        document={
                          <PerformanceContractPDF
                            contract={selectedContract}
                            activeAddress={activeAddress}
                          />
                        }
                        fileName={`${(selectedContract.contractType || "contract").toLowerCase()}-pc-${selectedContract.periodLabel}.pdf`}
                      >
                        {({ loading: pdfLoading }: any) => (
                          <Button
                            disabled={pdfLoading}
                            variant="outline"
                            className="rounded-full h-10"
                          >
                            <Printer className={`w-4 h-4 mr-2 ${pdfLoading ? "animate-spin" : ""}`} />
                            {pdfLoading ? "Preparing..." : "Export PDF"}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsDrawerOpen(false)}
                      className="rounded-full h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              {/* Tab Navigation */}
              <div className="mt-4 border-b">
                <nav className="flex -mb-px space-x-6">
                  {([
                    { id: 'overview' as const, label: 'Overview', Icon: FileText },
                    { id: 'kpis' as const, label: 'KPIs & Goals', Icon: Target, count: selectedContract.contractKpis?.metricsCount ?? 0 },
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setContractDrawerTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 py-3 px-1 text-sm font-medium transition-colors",
                        contractDrawerTab === tab.id
                          ? "border-b-2 border-blue-600 text-blue-600"
                          : "border-b-2 border-transparent text-gray-500 hover:text-gray-700",
                      )}
                    >
                      <tab.Icon className="h-4 w-4" />
                      {tab.label}
                      {'count' in tab && (
                        <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {(tab as any).count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6 space-y-4">

                {/* ── Overview Tab ── */}
                {contractDrawerTab === 'overview' && (
                  <>
                    {/* Status + Period */}
                    <Card className={cn("border-l-4", selectedContract.status === 'ACTIVE' ? "border-l-green-500" : "border-l-yellow-500")}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", selectedContract.status === 'ACTIVE' ? "bg-green-100" : "bg-yellow-100")}>
                              <CheckCircle2 className={cn("w-5 h-5", selectedContract.status === 'ACTIVE' ? "text-green-600" : "text-yellow-600")} />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <p className="font-semibold">{selectedContract.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Period</p>
                              <p className="font-semibold">{selectedContract.periodLabel}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contract Details */}
                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-purple-500" />
                          <h3 className="text-base font-semibold">Contract Details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <Badge className={cn("mt-1 border-0", drawerContractMeta ? `${drawerContractMeta.iconBg} ${drawerContractMeta.iconColor}` : "")}>
                              {selectedContract.contractType}
                            </Badge>
                          </div>
                          {selectedContract.departmentName && (
                            <div>
                              <p className="text-xs text-muted-foreground">Department</p>
                              <p className="font-medium mt-1">{selectedContract.departmentName}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">Start Date</p>
                            <p className="font-medium">{new Date(selectedContract.periodStart).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">End Date</p>
                            <p className="font-medium">{new Date(selectedContract.periodEnd).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Parties */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 text-blue-500" />
                          <h3 className="text-base font-semibold">Parties to Contract</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">Subject (Obligor)</p>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                {selectedContract.subjectUser?.firstName?.[0] ?? selectedContract.departmentName?.[0] ?? 'S'}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {selectedContract.subjectUser
                                    ? `${selectedContract.subjectUser.firstName} ${selectedContract.subjectUser.lastName}`
                                    : selectedContract.departmentName ?? 'General Entity'}
                                </p>
                                {selectedContract.subjectUser?.email && (
                                  <p className="text-xs text-muted-foreground">{selectedContract.subjectUser.email}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-2">Reviewer</p>
                              {selectedContract.reviewer ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                                    {selectedContract.reviewer.firstName?.[0]}
                                  </div>
                                  <p className="text-sm font-medium truncate">{selectedContract.reviewer.firstName} {selectedContract.reviewer.lastName}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">Unassigned</p>
                              )}
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-2">Approver</p>
                              {selectedContract.approver ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                                    {selectedContract.approver.firstName?.[0]}
                                  </div>
                                  <p className="text-sm font-medium truncate">{selectedContract.approver.firstName} {selectedContract.approver.lastName}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">Unassigned</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Financial Provisions */}
                    <Card className="border-l-4 border-l-emerald-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-4">
                          <DollarSign className="w-5 h-5 text-emerald-500" />
                          <h3 className="text-base font-semibold">Financial Provisions</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-emerald-50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Allocated Budget</p>
                            <p className="text-xl font-bold text-emerald-700 mt-1">
                              {selectedContract.allocatedBudget ? `$${Number(selectedContract.allocatedBudget).toLocaleString()}` : 'N/A'}
                            </p>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Expended Funds</p>
                            <p className="text-xl font-bold text-red-600 mt-1">
                              {selectedContract.actualSpend ? `$${Number(selectedContract.actualSpend).toLocaleString()}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Metadata footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t gap-2 flex-wrap">
                      <span>ID: {selectedContract.id?.slice(0, 8)}...</span>
                      <span>Created {new Date(selectedContract.createdAt || Date.now()).toLocaleDateString()}</span>
                      {selectedContract.createdBy && (
                        <span>By {selectedContract.createdBy.firstName} {selectedContract.createdBy.lastName}</span>
                      )}
                    </div>
                  </>
                )}

                {/* ── KPIs & Goals Tab ── */}
                {contractDrawerTab === 'kpis' && (
                  <>
                    {/* Scorecard status */}
                    {selectedContract.contractKpis?.hasGeneratedScorecard && selectedContract.contractKpis?.scorecard && (
                      <Card className="border-l-4 border-l-amber-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Award className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">Scorecard Generated</p>
                                <p className="text-xs text-muted-foreground">
                                  {selectedContract.contractKpis.scorecard.scorecardType} · {selectedContract.contractKpis.scorecard.periodLabel}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={cn(
                                "border-0",
                                selectedContract.contractKpis.scorecard.status === 'PUBLISHED'
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              )}>
                                {selectedContract.contractKpis.scorecard.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Score: {selectedContract.contractKpis.scorecard.finalScore}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Goal cards */}
                    {(selectedContract.contractKpis?.goals?.length ?? 0) > 0 ? (
                      <div className="space-y-4">
                        {selectedContract.contractKpis.goals.map((goal: any) => {
                          const prog = Math.min(goal.progressPercentage || 0, 100)
                          const fmtVal = (v: number) => {
                            const sym = goal.kpi?.unitSymbol || ''
                            const n = Number(v || 0).toLocaleString()
                            if (!sym) return `${n}${goal.targetUnit ? ` ${goal.targetUnit}` : ''}`
                            return (goal.kpi?.unitCategory?.toLowerCase() === 'percentage') ? `${n}${sym}` : `${sym}${n}`
                          }
                          return (
                            <Card key={goal.id} className={cn(
                              "border-l-4 hover:shadow-md transition-shadow",
                              prog >= 100 ? "border-l-green-500" : prog >= 50 ? "border-l-blue-500" : "border-l-amber-500"
                            )}>
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                      {goal.scorecardPillar && (
                                        <Badge className="bg-indigo-100 text-indigo-700 text-xs border-0">{goal.scorecardPillar}</Badge>
                                      )}
                                      <Badge className={cn(
                                        "text-xs border-0",
                                        goal.stage === 'completed' ? "bg-green-100 text-green-700" :
                                        goal.stage === 'in_progress' ? "bg-blue-100 text-blue-700" :
                                        "bg-gray-100 text-gray-700"
                                      )}>
                                        {goal.stage?.replace(/_/g, ' ')}
                                      </Badge>
                                      {goal.isReverseKpi && (
                                        <Badge className="bg-orange-100 text-orange-700 text-xs border-0">Reverse KPI</Badge>
                                      )}
                                    </div>
                                    <p className="font-semibold text-sm leading-snug">{goal.title}</p>
                                    {goal.kpi && (
                                      <p className="text-xs text-muted-foreground mt-0.5">{goal.kpi.name} · {goal.kpi.unitSymbol}</p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-2xl font-bold">{(goal.progressPercentage || 0).toFixed(0)}%</p>
                                    <p className="text-xs text-muted-foreground">Achievement</p>
                                  </div>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                                  <div
                                    className={cn(
                                      "h-2 rounded-full transition-all duration-500",
                                      prog >= 100 ? "bg-green-500" : prog >= 50 ? "bg-blue-500" : "bg-amber-500"
                                    )}
                                    style={{ width: `${prog}%` }}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-2 bg-gray-50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground">Current</p>
                                    <p className="font-semibold text-sm">{fmtVal(goal.currentValue)}</p>
                                  </div>
                                  <div className="p-2 bg-gray-50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground">Target</p>
                                    <p className="font-semibold text-sm">{fmtVal(goal.targetValue)}</p>
                                  </div>
                                </div>

                                {goal.scorecardWeight != null && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Scorecard Weight</span>
                                    <Badge variant="outline" className="text-xs">{goal.scorecardWeight}%</Badge>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-12">
                          <div className="text-center">
                            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-base font-semibold text-gray-600 mb-2">No KPIs Linked</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                              {selectedContract.contractKpis?.summary || "This contract has no performance goals linked yet."}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {selectedContract.contractKpis?.summary && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-700 leading-relaxed">{selectedContract.contractKpis.summary}</p>
                      </div>
                    )}
                  </>
                )}

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
