"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CiSearch, CiExport, CiFilter } from "react-icons/ci"

type Option = { label: string; value: string }

export function TableToolbar({
  searchPlaceholder,
  onSearch,
  filterLabel,
  filterOptions = [],
  onFilterChange,
  onExportCsv,
  onExportPdf,
}: {
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  filterLabel?: string
  filterOptions?: Option[]
  onFilterChange?: (v: string) => void
  onExportCsv?: () => void
  onExportPdf?: () => void
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
      <div className="flex-1 relative">
        <CiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={searchPlaceholder || "Search..."}
          className="pl-10"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      {filterOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <CiFilter className="text-gray-500" />
          <Select onValueChange={(v) => onFilterChange?.(v)}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder={filterLabel || "Filter"} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-2 md:ml-auto">
        <Button onClick={onExportCsv} className="rounded-full gradient-primary text-white flex items-center gap-2">
          <CiExport /> CSV
        </Button>
        <Button onClick={onExportPdf} variant="outline" className="rounded-full flex items-center gap-2">
          <CiExport /> PDF
        </Button>
      </div>
    </div>
  )
}


