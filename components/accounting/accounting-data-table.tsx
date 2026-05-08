"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

export interface AccountingDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title: string
  searchPlaceholder?: string
  filterOptions?: Array<{ label: string; value: string }>
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onCreate?: () => void
  onBulkAction?: (selectedItems: T[], action: string) => void
  bulkActions?: Array<{ label: string; value: string; icon: React.ReactNode }>
  loading?: boolean
  onExport?: (data: T[]) => void
  emptyMessage?: string
}

export function AccountingDataTable<T extends { id: string }>({
  data,
  columns,
  title,
  searchPlaceholder = "Search...",
  filterOptions = [],
  onView,
  onEdit,
  onDelete,
  onCreate,
  onBulkAction,
  bulkActions = [],
  loading = false,
  onExport,
  emptyMessage = "No data found"
}: AccountingDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredData.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id))
    }
  }

  const handleBulkAction = (action: string) => {
    const selectedData = filteredData.filter(item => selectedItems.includes(item.id))
    if (onBulkAction) {
      onBulkAction(selectedData, action)
    }
    setSelectedItems([])
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="w-8 h-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="secondary" className="ml-2">
              {filteredData.length}
            </Badge>
          </CardTitle>
          {onCreate && (
            <Button
              onClick={onCreate}
              variant="gradient-create"
              className="rounded-full px-6"
            >
              <div className="w-4 h-4 mr-2 bg-white/20 rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </div>
              Create New
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {filterOptions.length > 0 && (
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          )}
          
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(filteredData)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.length} selected
            </span>
            {bulkActions.map((action) => (
              <Button
                key={action.value}
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction(action.value)}
                className="flex items-center"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Data Table */}
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-600" 
               style={{ gridTemplateColumns: `auto repeat(${columns.length}, 1fr) auto` }}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>
            {columns.map((column) => (
              <div key={String(column.key)} className="flex items-center">
                {column.label}
              </div>
            ))}
            <div>Actions</div>
          </div>

          {/* Table Body */}
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 p-4 border-b hover:bg-gray-50 transition-colors"
                style={{ gridTemplateColumns: `auto repeat(${columns.length}, 1fr) auto` }}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </div>
                {columns.map((column) => (
                  <div key={String(column.key)} className="flex items-center">
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key])
                    }
                  </div>
                ))}
                <div className="flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(item)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(item)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination would go here */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredData.length} results</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}