"use client"

import * as React from "react"
import { FileUp, Inbox, Search, SlidersHorizontal, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function LpPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string
  description?: string
  eyebrow?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">{eyebrow}</p>}
        <h1 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 [&_button]:rounded-full">{actions}</div>}
    </div>
  )
}

export function LpSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]", className)}>
      {(title || description || actions) && (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 [&_button]:rounded-full">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </section>
  )
}

export function LpKpiCard({
  label,
  value,
  helper,
  change,
  icon,
  tone = "default",
  onClick,
}: {
  label: string
  value: React.ReactNode
  helper?: string
  change?: string
  icon?: React.ReactNode
  tone?: "default" | "positive" | "warning" | "critical"
  onClick?: () => void
}) {
  const toneClass = {
    default: "text-slate-950",
    positive: "text-emerald-700",
    warning: "text-amber-700",
    critical: "text-red-700",
  }[tone]

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className={cn("mt-2 truncate text-lg font-semibold tabular-nums tracking-tight", toneClass)}>{value}</div>
      {(helper || change) && (
        <div className="mt-1 flex min-h-4 items-center justify-between gap-2 text-[10px]">
          <span className="truncate text-slate-500">{helper}</span>
          {change && <span className={cn("shrink-0 font-medium", toneClass)}>{change}</span>}
        </div>
      )}
    </>
  )
  const className = cn(
    "min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
    onClick && "transition-colors hover:border-blue-300 hover:bg-blue-50/30",
  )

  return onClick
    ? <button type="button" onClick={onClick} className={className}>{content}</button>
    : <div className={className}>{content}</div>
}

export function LpMetricStrip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6", className)}>{children}</div>
}

const statusTones: Record<string, string> = {
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ALLOCATED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FINAL: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ISSUED: "border-blue-200 bg-blue-50 text-blue-700",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  ASSIGNED: "border-blue-200 bg-blue-50 text-blue-700",
  PUBLISHED: "border-blue-200 bg-blue-50 text-blue-700",
  PROVISIONAL: "border-amber-200 bg-amber-50 text-amber-700",
  ESTIMATED: "border-amber-200 bg-amber-50 text-amber-700",
  AWAITING_INVESTOR: "border-amber-200 bg-amber-50 text-amber-700",
  AWAITING_INTERNAL: "border-amber-200 bg-amber-50 text-amber-700",
  AWAITING_NAV: "border-amber-200 bg-amber-50 text-amber-700",
  REQUIRES_SIGNATURE: "border-amber-200 bg-amber-50 text-amber-700",
  OVERDUE: "border-red-200 bg-red-50 text-red-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-600",
  SUPERSEDED: "border-slate-200 bg-slate-100 text-slate-600",
  UNDER_REVIEW: "border-violet-200 bg-violet-50 text-violet-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RESTATED: "border-violet-200 bg-violet-50 text-violet-700",
}

export function LpStatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide shadow-none",
        statusTones[status] ?? "border-slate-200 bg-slate-50 text-slate-600",
        className,
      )}
    >
      {(label ?? status).replaceAll("_", " ")}
    </Badge>
  )
}

export interface LpTableColumn<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  align?: "left" | "center" | "right"
  className?: string
}

export function LpDenseTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  selectedRowKey,
  emptyMessage = "No records match the current filters.",
  stickyHeader = true,
}: {
  columns: LpTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => React.Key
  onRowClick?: (row: T) => void
  selectedRowKey?: React.Key
  emptyMessage?: string
  stickyHeader?: boolean
}) {
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-slate-50")}>
          <TableRow className="border-slate-200 hover:bg-slate-50">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  "h-9 whitespace-nowrap px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  column.className,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-28 text-center text-xs text-slate-500">{emptyMessage}</TableCell>
            </TableRow>
          ) : rows.map((row) => {
            const rowKey = getRowKey(row)
            return (
              <TableRow
                key={rowKey}
                data-state={selectedRowKey === rowKey ? "selected" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(event) => {
                  if (onRowClick && (event.key === "Enter" || event.key === " ")) onRowClick(row)
                }}
                className={cn(
                  "h-10 border-slate-100 text-xs",
                  onRowClick && "cursor-pointer hover:bg-blue-50/50",
                  selectedRowKey === rowKey && "bg-blue-50",
                )}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      "whitespace-nowrap px-3 py-2 text-xs text-slate-700",
                      column.align === "right" && "text-right tabular-nums",
                      column.align === "center" && "text-center",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function LpFilterBar({
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records...",
  actions,
  className,
}: {
  children?: React.ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2", className)}>
      {onSearchChange && (
        <div className="relative min-w-[190px] flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 rounded-full border-slate-200 pl-8 text-xs shadow-none"
          />
        </div>
      )}
      {children}
      {actions && <div className="ml-auto flex items-center gap-2 [&_button]:rounded-full">{actions}</div>}
    </div>
  )
}

export function LpFilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className,
}: {
  value?: string
  onValueChange?: (value: string) => void
  placeholder: string
  options: Array<{ value: string; label: string }>
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className={cn("h-8 min-w-[130px] text-xs", className)}>
        <SlidersHorizontal className="size-3" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function LpDetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "wide",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: "default" | "wide" | "preview"
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden bg-white p-0",
          width === "default" && "sm:max-w-md",
          width === "wide" && "sm:max-w-xl",
          width === "preview" && "sm:max-w-3xl",
        )}
      >
        <SheetHeader className="border-b border-slate-200 px-5 py-4 pr-14">
          <SheetTitle className="text-base">{title}</SheetTitle>
          {description && <SheetDescription className="text-xs">{description}</SheetDescription>}
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 rounded-full" aria-label="Close details">
              <X className="size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <SheetFooter className="border-t border-slate-200 p-4 [&_button]:rounded-full">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

export function LpUploadArea({
  label = "Drag and drop files here",
  description = "PDF, XLSX, DOCX or image files",
  accept,
  multiple = true,
  onFiles,
  className,
}: {
  label?: string
  description?: string
  accept?: string
  multiple?: boolean
  onFiles?: (files: File[]) => void
  className?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const submitFiles = (files: FileList | null) => {
    if (files?.length) onFiles?.(Array.from(files))
  }

  return (
    <div
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        submitFiles(event.dataTransfer.files)
      }}
      className={cn(
        "flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center transition-colors",
        dragging && "border-blue-500 bg-blue-50",
        className,
      )}
    >
      <FileUp className="mb-2 size-5 text-blue-600" />
      <p className="text-xs font-medium text-slate-800">{label}</p>
      <p className="mt-1 text-[10px] text-slate-500">{description}</p>
      <Button type="button" variant="outline" size="pill" className="mt-3 rounded-full bg-white" onClick={() => inputRef.current?.click()}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={(event) => submitFiles(event.target.files)}
      />
    </div>
  )
}

export function LpEmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-slate-100">
        <Inbox className="size-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>}
      {action && <div className="mt-4 [&_button]:rounded-full">{action}</div>}
    </div>
  )
}
