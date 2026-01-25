"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CiSearch,
  CiFilter,
  CiEdit,
  CiTrash
} from "react-icons/ci"
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MoreHorizontal
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

export interface RichDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title: string
  searchPlaceholder?: string
  filterOptions?: { label: string; value: string }[]
  extraControls?: React.ReactNode
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  onBulkAction?: (selectedRows: T[], action: string) => void
  bulkActions?: { label: string; value: string; icon?: React.ReactNode }[]
  loading?: boolean
  pageSize?: number
  exportable?: boolean
  onExport?: (data: T[]) => void
  onExportRow?: (row: T) => void
}

export function RichDataTable<T extends { id: string }>({
  data,
  columns,
  title,
  searchPlaceholder = "Search...",
  filterOptions = [],
  extraControls,
  onEdit,
  onDelete,
  onView,
  onBulkAction,
  bulkActions = [],
  loading = false,
  pageSize = 10,
  exportable = true,
  onExport,
  onExportRow
}: RichDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterValue, setFilterValue] = useState("all")
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.key]
          const term = searchTerm.toLowerCase()
          if (value == null) return false
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return value.toString().toLowerCase().includes(term)
          }
          if (typeof value === 'object') {
            try {
              const flattened = Object.values(value)
                .filter(v => v != null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'))
                .map(v => v.toString().toLowerCase())
                .join(' ')
              return flattened.includes(term)
            } catch {
              return false
            }
          }
          return false
        })
      )
    }

    // Apply filter
    if (filterValue !== "all") {
      // Apply filter across any filterable columns; if none, try a known derived type key
      const filterableColumns = columns.filter(col => col.filterable)
      if (filterableColumns.length > 0) {
        filtered = filtered.filter(row =>
          filterableColumns.some(col => {
            // Handle computed fields like '__type'
            if (col.key === '__type') {
              const name = (row as any).name || ''
              const nameLower = name.toLowerCase()
              let computedType = 'OTHER'

              // Check if this is an allowance type (housing, transport, medical, short-time, leave types)
              if (nameLower.includes('housing') || nameLower.includes('house')) computedType = 'HOUSING'
              else if (nameLower.includes('transport') || nameLower.includes('travel')) computedType = 'TRANSPORT'
              else if (nameLower.includes('medical') || nameLower.includes('health')) computedType = 'MEDICAL'
              else if (nameLower.includes('short-time') || nameLower.includes('short time') || nameLower.includes('shorttime')) computedType = 'SHORT_TIME'
              else if (nameLower.includes('sick leave') || nameLower.includes('sick') || nameLower.includes('illness')) computedType = 'SICK_LEAVE'
              else if (nameLower.includes('annual leave') || nameLower.includes('vacation') || nameLower.includes('holiday')) computedType = 'ANNUAL_LEAVE'
              else if (nameLower.includes('unpaid leave') || nameLower.includes('unpaid') || nameLower.includes('no pay')) computedType = 'UNPAID_LEAVE'
              // Check if this is a deduction type (loan, pension, advance)
              else if (nameLower.includes('loan') || nameLower.includes('borrow')) computedType = 'LOAN'
              else if (nameLower.includes('pension') || nameLower.includes('retirement')) computedType = 'PENSION'
              else if (nameLower.includes('advance') || nameLower.includes('prepaid')) computedType = 'ADVANCE'

              return computedType === filterValue
            }

            const value: any = (row as any)[col.key as any]
            if (value == null) return false
            return value.toString() === filterValue
          })
        )
      } else {
        // Fallback: support derived type field '__type' computed on the fly
        filtered = filtered.filter(row => {
          const v = (row as any)['__type'] ?? (row as any)['type'] ?? ''
          return v.toString() === filterValue
        })
      }
    }

    return filtered
  }, [data, searchTerm, filterValue, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle sorting
  const handleSort = (key: keyof T) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }

  // Handle row selection
  const handleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginatedData.map(row => row.id))
    }
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    const selectedRowsData = data.filter(row => selectedRows.includes(row.id))
    onBulkAction?.(selectedRowsData, action)
    setSelectedRows([])
  }

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(sortedData)
    } else {
      // Default CSV export
      const csvContent = [
        columns.map(col => col.label).join(','),
        ...sortedData.map(row =>
          columns.map(col => {
            const value = row[col.key]
            return typeof value === 'string' ? `"${value}"` : value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const getSortIcon = (key: keyof T) => {
    if (sortConfig?.key !== key) return null
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />
  }

  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-normal">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-normal">
            {title}
            {selectedRows.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedRows.length} selected
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="rounded-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
            {filterOptions.length > 0 && (
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-48 rounded-full">
                  <CiFilter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {extraControls && (
            <div className="flex items-center gap-3 shrink-0">
              {extraControls}
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">
              {selectedRows.length} items selected
            </span>
            <div className="flex gap-2">
              {bulkActions.map(action => (
                <Button
                  key={action.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction(action.value)}
                  className="rounded-full"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          {paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <CiSearch className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || filterValue !== 'all'
                  ? 'No allowance types match your current search or filter criteria.'
                  : 'No allowance types have been created yet.'
                }
              </p>
              <div className="flex gap-2">
                {(searchTerm || filterValue !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setSearchTerm('')
                      setFilterValue('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
                  onClick={() => window.location.reload()}
                >
                  <CiSearch className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  {columns.map(column => (
                    <TableHead
                      key={String(column.key)}
                      className={`${column.width || ''} ${column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => onView?.(row)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.includes(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                      />
                    </TableCell>
                    {columns.map(column => (
                      <TableCell key={String(column.key)}>
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || '-')
                        }
                      </TableCell>
                    ))}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(row)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          {onExportRow && (
                            <DropdownMenuItem onClick={() => onExportRow(row)}>
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                          )}
                          {onEdit && (row as any).status === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => onEdit(row)}>
                              <CiEdit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (row as any).status !== 'COMPLETED' && (
                            <DropdownMenuItem
                              onClick={() => onDelete(row)}
                              className="text-red-600"
                            >
                              <CiTrash className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="rounded-full w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-full"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
