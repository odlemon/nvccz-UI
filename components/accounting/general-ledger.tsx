"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Calculator, 
  FileText, 
  Calendar, 
  DollarSign,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { CreateJournalEntryModal } from "./create-journal-entry-modal"
import { JournalEntryViewDrawer } from "./journal-entry-view-drawer"
import { TrialBalanceView } from "./trial-balance-view"
import { accountingApi, JournalEntryFilters } from "@/lib/api/accounting-api"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

// Helper function to trim spaces
const cleanString = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

const cleanNumber = (value: any, defaultValue: number = 0): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// CSV Export utility function
const exportToCSV = (journalEntries: JournalEntry[]) => {
  // Prepare CSV headers
  const headers = [
    "Transaction Date",
    "Reference Number",
    "Journal Entry Description",
    "Account Number",
    "Account Name",
    "Account Type",
    "Line Description",
    "Debit Amount",
    "Credit Amount",
    "Status",
    "Created By",
    "Total Amount"
  ]

  // Prepare CSV rows
  const rows = journalEntries.flatMap(entry => 
    entry.journalEntryLines.map((line, index) => [
      format(new Date(entry.transactionDate), 'yyyy-MM-dd'),
      cleanString(entry.referenceNumber),
      index === 0 ? cleanString(entry.description) : "", // Only show on first line
      cleanString(line.chartOfAccount.accountNo),
      cleanString(line.chartOfAccount.accountName),
      cleanString(line.chartOfAccount.accountType),
      cleanString(line.description),
      cleanNumber(line.debitAmount).toFixed(2),
      cleanNumber(line.creditAmount).toFixed(2),
      index === 0 ? entry.status : "", // Only show on first line
      index === 0 ? `${entry.createdBy.firstName} ${entry.createdBy.lastName}` : "", // Only show on first line
      index === 0 ? cleanNumber(entry.totalAmount).toFixed(2) : "" // Only show on first line
    ])
  )

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell)
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(",")
    )
  ].join("\n")

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", `journal_entries_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`)
  link.style.visibility = "hidden"
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.success(`Exported ${journalEntries.length} journal entries to CSV`)
}

interface JournalEntry {
  id: string
  transactionDate: string
  referenceNumber: string
  description: string
  totalAmount: string
  status: 'PENDING' | 'POSTED' | 'VOID'
  journalEntryLines: JournalEntryLine[]
  createdBy: {
    firstName: string
    lastName: string
  }
}

interface JournalEntryLine {
  id: string
  debitAmount: string
  creditAmount: string
  description: string
  chartOfAccount: {
    accountNo: string
    accountName: string
    accountType: string
  }
}

interface GroupedEntry {
  date: string
  entries: JournalEntry[]
  totalDebit: number
  totalCredit: number
}

const tabs = [
  {
    id: "journal",
    label: "Journal Entries",
    icon: FileText,
    description: "View and manage journal entries",
    gradient: "from-blue-400 to-blue-600"
  },
  {
    id: "trial-balance",
    label: "Trial Balance",
    icon: BarChart3,
    description: "View trial balance report",
    gradient: "from-green-400 to-green-600"
  }
]

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Posted', value: 'POSTED' },
  { label: 'Void', value: 'VOID' }
]

export function GeneralLedger() {
  const { permissions } = useAccountingPermissions()
  
  // Permission checks
  const canCreateJournal = permissions.canCreateJournalEntry
  const canEditJournal = permissions.canCreateJournalEntry // Journal entries: create-only per matrix
  const canDeleteJournal = permissions.canCreateJournalEntry
  
  const [activeTab, setActiveTab] = useState("journal")
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load entries when filters change
  useEffect(() => {
    if (activeTab === "journal") {
      loadJournalEntries()
    }
  }, [activeTab, debouncedSearch, statusFilter])

  const loadJournalEntries = useCallback(async () => {
    setLoading(true)
    try {
      // Build filters object
      const filters: JournalEntryFilters = {}
      
      // Only add search if it has a value after trimming
      const trimmedSearch = cleanString(debouncedSearch)
      if (trimmedSearch) {
        filters.search = trimmedSearch
      }
      
      // Only add status if it's not "all"
      if (statusFilter !== "all") {
        filters.status = statusFilter as 'PENDING' | 'POSTED' | 'VOID'
      }

      console.log('Loading journal entries with filters:', filters)

      const response = await accountingApi.getJournalEntries(filters)
      
      if (response.success) {
        setJournalEntries(response.data || [])
        // toast.success(`Loaded ${response.data?.length || 0} journal entries`)
      } else {
        toast.error("Failed to load journal entries", {
          description: response.message || "Unknown error"
        })
      }
    } catch (error: any) {
      console.error('Error loading journal entries:', error)
      toast.error("Failed to load journal entries", {
        description: error.message || "An unexpected error occurred"
      })
      setJournalEntries([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  // Group entries by date
  const groupedEntries = journalEntries.reduce((groups: GroupedEntry[], entry) => {
    const date = format(new Date(entry.transactionDate), 'yyyy-MM-dd')
    const existingGroup = groups.find(g => g.date === date)
    
    if (existingGroup) {
      existingGroup.entries.push(entry)
      existingGroup.totalDebit += entry.journalEntryLines.reduce((sum, line) => 
        sum + cleanNumber(line.debitAmount), 0)
      existingGroup.totalCredit += entry.journalEntryLines.reduce((sum, line) => 
        sum + cleanNumber(line.creditAmount), 0)
    } else {
      groups.push({
        date,
        entries: [entry],
        totalDebit: entry.journalEntryLines.reduce((sum, line) => 
          sum + cleanNumber(line.debitAmount), 0),
        totalCredit: entry.journalEntryLines.reduce((sum, line) => 
          sum + cleanNumber(line.creditAmount), 0)
      })
    }
    
    return groups
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'POSTED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'VOID':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'POSTED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'VOID':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = cleanNumber(amount)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount)
  }

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setIsViewDrawerOpen(true)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDebouncedSearch("")
  }

  const getStats = () => {
    const totalEntries = journalEntries.length
    const pendingEntries = journalEntries.filter(e => e.status === 'PENDING').length
    const postedEntries = journalEntries.filter(e => e.status === 'POSTED').length
    const voidEntries = journalEntries.filter(e => e.status === 'VOID').length
    
    const totalValue = journalEntries.reduce((sum, entry) => 
      sum + cleanNumber(entry.totalAmount), 0)

    return {
      totalEntries,
      pendingEntries,
      postedEntries,
      voidEntries,
      totalValue
    }
  }

  const stats = getStats()

  // Check if filters are active
  const hasActiveFilters = debouncedSearch !== "" || statusFilter !== "all"

  const handleExportCSV = () => {
    if (journalEntries.length === 0) {
      toast.error("No journal entries to export")
      return
    }
    exportToCSV(journalEntries)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">General Ledger</h1>
          <p className="text-muted-foreground">Manage journal entries and view trial balance</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => loadJournalEntries()}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={loading || journalEntries.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {canCreateJournal && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Journal Entry
            </Button>
          )}
        </div>
      </div>

   

      {/* Tab Navigation */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center overflow-x-auto border-b">
            <div className="flex space-x-1 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                      isActive
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                      isActive ? tab.gradient : "from-gray-300 to-gray-400"
                    )}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {activeTab === "journal" && (
            <>
              {/* Advanced Filters */}
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="mb-6">
                <Card className="border border-gray-200 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
                          {hasActiveFilters && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className={cn(
                          "w-4 h-4 text-gray-500 transition-transform duration-200",
                          isFiltersOpen ? "rotate-180" : ""
                        )} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search Input */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700">
                            Search Reference Number
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Search by reference..."
                              className="pl-10 rounded-full text-sm"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                          {searchQuery && (
                            <p className="text-xs text-gray-500">
                              Searching: "{cleanString(searchQuery)}"
                            </p>
                          )}
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700">Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="rounded-full text-sm">
                              <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                            disabled={!hasActiveFilters}
                            className="rounded-full text-xs"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>

                      {/* Active Filters Display */}
                      {hasActiveFilters && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-600">Active filters:</span>
                          {debouncedSearch && (
                            <Badge variant="outline" className="text-xs">
                              Search: {cleanString(debouncedSearch)}
                            </Badge>
                          )}
                          {statusFilter !== "all" && (
                            <Badge variant="outline" className="text-xs">
                              Status: {statusOptions.find(o => o.value === statusFilter)?.label}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Journal Entries Table */}
              <div className="space-y-4">
                {loading ? (
                  <JournalEntriesSkeleton />
                ) : groupedEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {hasActiveFilters ? "No journal entries match your filters" : "No journal entries found"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {hasActiveFilters 
                        ? "Try adjusting your filters or clear them to see all entries" 
                        : "Create your first journal entry to get started"}
                    </p>
                    {hasActiveFilters ? (
                      <Button variant="outline" onClick={handleClearFilters}>
                        Clear Filters
                      </Button>
                    ) : canCreateJournal ? (
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Journal Entry
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {/* Results count */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        Showing {groupedEntries.length} date group{groupedEntries.length !== 1 ? 's' : ''} with {journalEntries.length} entr{journalEntries.length !== 1 ? 'ies' : 'y'}
                      </p>
                    </div>
                    
                    {groupedEntries.map((group) => (
                      <GroupedJournalEntries
                        key={group.date}
                        group={group}
                        onViewEntry={handleViewEntry}
                        formatCurrency={formatCurrency}
                        getStatusIcon={getStatusIcon}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === "trial-balance" && (
            <TrialBalanceView />
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreateJournalEntryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadJournalEntries()
        }}
      />

      {/* View Drawer */}
      <JournalEntryViewDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false)
          setSelectedEntry(null)
        }}
        entry={selectedEntry}
        onEntryUpdated={loadJournalEntries}
      />
    </div>
  )
}

// Custom skeleton component that mimics the journal entries design
function JournalEntriesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Skeleton for 3 grouped date entries */}
      {[1, 2, 3].map((groupIndex) => (
        <Card key={groupIndex} className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="w-5 h-5 bg-blue-200 rounded"></div>
                <div>
                  <div className="h-5 w-48 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-green-200 rounded"></div>
                </div>
                <div className="text-right">
                  <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-red-200 rounded"></div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">
                      <div className="h-3 w-8 bg-gray-300 rounded"></div>
                    </th>
                    <th className="text-left p-3">
                      <div className="h-3 w-12 bg-gray-300 rounded"></div>
                    </th>
                    <th className="text-left p-3">
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                    </th>
                    <th className="text-left p-3">
                      <div className="h-3 w-20 bg-gray-300 rounded"></div>
                    </th>
                    <th className="text-right p-3">
                      <div className="h-3 w-10 bg-gray-300 rounded ml-auto"></div>
                    </th>
                    <th className="text-right p-3">
                      <div className="h-3 w-10 bg-gray-300 rounded ml-auto"></div>
                    </th>
                    <th className="text-center p-3">
                      <div className="h-3 w-12 bg-gray-300 rounded mx-auto"></div>
                    </th>
                    <th className="text-center p-3">
                      <div className="h-3 w-12 bg-gray-300 rounded mx-auto"></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Skeleton for journal entry lines */}
                  {[1, 2, 3].map((lineIndex) => (
                    <tr key={lineIndex} className="hover:bg-gray-50">
                      <td className="p-3">
                        {lineIndex === 1 && (
                          <div className="h-3 w-12 bg-gray-200 rounded"></div>
                        )}
                      </td>
                      <td className="p-3">
                        {lineIndex === 1 && (
                          <div className="h-3 w-32 bg-blue-200 rounded"></div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="h-3 w-40 bg-gray-300 rounded"></div>
                          <div className="h-2 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="h-3 w-36 bg-gray-200 rounded"></div>
                      </td>
                      <td className="p-3 text-right">
                        {lineIndex % 2 === 1 && (
                          <div className="h-3 w-16 bg-green-200 rounded ml-auto"></div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {lineIndex % 2 === 0 && (
                          <div className="h-3 w-16 bg-red-200 rounded ml-auto"></div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {lineIndex === 1 && (
                          <div className="h-5 w-16 bg-yellow-200 rounded-full mx-auto"></div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {lineIndex === 1 && (
                          <div className="h-6 w-6 bg-gray-200 rounded-full mx-auto"></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Loading indicator with text */}
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading journal entries...</span>
        </div>
      </div>
    </div>
  )
}

// Component for grouped journal entries
interface GroupedJournalEntriesProps {
  group: GroupedEntry
  onViewEntry: (entry: JournalEntry) => void
  formatCurrency: (amount: string | number) => string
  getStatusIcon: (status: string) => React.ReactNode
  getStatusColor: (status: string) => string
}

function GroupedJournalEntries({ 
  group, 
  onViewEntry, 
  formatCurrency, 
  getStatusIcon, 
  getStatusColor 
}: GroupedJournalEntriesProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card className="border border-gray-200 shadow-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {format(new Date(group.date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <p className="text-xs text-gray-600">{group.entries.length} entries</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="text-gray-600">Total Debit</div>
                  <div className="font-semibold text-green-600">{formatCurrency(group.totalDebit)}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-600">Total Credit</div>
                  <div className="font-semibold text-red-600">{formatCurrency(group.totalCredit)}</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-600">Date</th>
                    <th className="text-left p-3 font-medium text-gray-600">Ref No.</th>
                    <th className="text-left p-3 font-medium text-gray-600">Account</th>
                    <th className="text-left p-3 font-medium text-gray-600">Description</th>
                    <th className="text-right p-3 font-medium text-gray-600">Debit</th>
                    <th className="text-right p-3 font-medium text-gray-600">Credit</th>
                    <th className="text-center p-3 font-medium text-gray-600">Status</th>
                    <th className="text-center p-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((entry, entryIndex) => (
                    <>
                      {entry.journalEntryLines.map((line, lineIndex) => (
                        <tr 
                          key={`${entry.id}-${line.id}`} 
                          className={cn(
                            "hover:bg-blue-50 transition-colors cursor-pointer group",
                            entryIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          )}
                          onClick={() => onViewEntry(entry)}
                          title="Click to view journal entry details"
                        >
                          <td className="p-3">
                            {lineIndex === 0 && (
                              <span className="text-sm text-gray-600 group-hover:text-blue-700 transition-colors">
                                {format(new Date(entry.transactionDate), 'MMM dd')}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {lineIndex === 0 && (
                              <span className="font-mono text-sm text-blue-600 group-hover:text-blue-800 transition-colors font-semibold">
                                {cleanString(entry.referenceNumber)}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-sm group-hover:text-blue-700 transition-colors">
                                {cleanString(line.chartOfAccount.accountNo)} - {cleanString(line.chartOfAccount.accountName)}
                              </div>
                              <div className="text-xs text-gray-500">{cleanString(line.chartOfAccount.accountType)}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm group-hover:text-blue-700 transition-colors">
                              {cleanString(line.description)}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {line.debitAmount && cleanNumber(line.debitAmount) > 0 && (
                              <span className="font-semibold text-green-600 group-hover:text-green-700 transition-colors">
                                {formatCurrency(line.debitAmount)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {line.creditAmount && cleanNumber(line.creditAmount) > 0 && (
                              <span className="font-semibold text-red-600 group-hover:text-red-700 transition-colors">
                                {formatCurrency(line.creditAmount)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {lineIndex === 0 && (
                              <Badge className={cn(getStatusColor(entry.status), "group-hover:shadow-sm transition-all")}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(entry.status)}
                                  {entry.status}
                                </div>
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {lineIndex === 0 && (
                              <div 
                                className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:from-blue-600 group-hover:to-indigo-700 transition-all cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewEntry(entry)
                                }}
                                title="View journal entry"
                              >
                                <Eye className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Divider row at the end of each journal entry */}
                      {entryIndex < group.entries.length - 1 && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <div className="border-b-2 border-gray-200"></div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}