"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store/store"
import { fetchSTIInstruments } from "@/lib/store/slices/shortTermInvestmentsSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Eye,
  Ban,
  DollarSign,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { STIInstrument } from "@/lib/api/short-term-investments-api"
import { voidInstrument, extractErrorMessage } from "@/lib/api/short-term-investments-api"
import { InstrumentViewDrawer } from "./instrument-view-drawer"
import { LiquidateInstrumentModal } from "./liquidate-instrument-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface STIInstrumentsListProps {
  onCreateNew: () => void
}

export function STIInstrumentsList({ onCreateNew }: STIInstrumentsListProps) {
  const dispatch = useDispatch<AppDispatch>()
  const stiState = useSelector((state: RootState) => state.shortTermInvestments)
  const instruments = stiState?.instruments ?? []
  const instrumentsLoading = stiState?.instrumentsLoading ?? false

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedInstrument, setSelectedInstrument] = useState<STIInstrument | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isLiquidateOpen, setIsLiquidateOpen] = useState(false)
  const [sortKey, setSortKey] = useState<string>("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    dispatch(fetchSTIInstruments({
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    }))
  }, [dispatch, statusFilter, debouncedSearch])

  const handleView = (instrument: STIInstrument) => {
    setSelectedInstrument(instrument)
    setIsViewOpen(true)
  }

  const handleLiquidate = (instrument: STIInstrument) => {
    setSelectedInstrument(instrument)
    setIsLiquidateOpen(true)
  }

  const handleVoid = async (instrument: STIInstrument) => {
    if (instrument.status !== "ACTIVE") {
      toast.error("Only active instruments can be voided")
      return
    }
    try {
      await voidInstrument(instrument.id)
      toast.success(`Instrument "${instrument.name}" has been voided`)
      dispatch(fetchSTIInstruments())
    } catch (e: any) {
      toast.error("Failed to void instrument", { description: extractErrorMessage(e) })
    }
  }

  const handleLiquidated = () => {
    setIsLiquidateOpen(false)
    dispatch(fetchSTIInstruments())
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full text-[10px] px-2.5" variant="outline">Active</Badge>
      case "SETTLED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-full text-[10px] px-2.5" variant="outline">Settled</Badge>
      case "VOIDED":
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full text-[10px] px-2.5" variant="outline">Voided</Badge>
      default:
        return <Badge variant="outline" className="rounded-full text-[10px] px-2.5">{status}</Badge>
    }
  }

  // Sort logic
  const sortedInstruments = [...instruments].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortKey === "principal") return dir * (parseFloat(a.principal) - parseFloat(b.principal))
    if (sortKey === "name") return dir * a.name.localeCompare(b.name)
    if (sortKey === "maturityDate") return dir * (new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime())
    if (sortKey === "startDate") return dir * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  })

  const totalPages = Math.max(1, Math.ceil(sortedInstruments.length / pageSize))
  const pagedInstruments = sortedInstruments.slice((page - 1) * pageSize, page * pageSize)

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  return (
    <>
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-sm font-semibold">Investment Instruments</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search instruments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[240px] bg-gray-50 border-gray-200 rounded-full h-9 text-xs shadow-none"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[130px] bg-gray-50 border-gray-200 rounded-full h-9 text-xs shadow-none ring-0 focus:ring-0">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SETTLED">Settled</SelectItem>
                  <SelectItem value="VOIDED">Voided</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="gradient-create"
                className="h-9 px-5 rounded-full gap-2 font-semibold text-xs"
                onClick={onCreateNew}
              >
                <Plus className="w-3.5 h-3.5" />
                New Instrument
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground py-3 px-4">
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                      Instrument <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left font-medium text-muted-foreground py-3 px-3">Category</th>
                  <th className="text-left font-medium text-muted-foreground py-3 px-3">Broker</th>
                  <th className="text-left font-medium text-muted-foreground py-3 px-3">Currency</th>
                  <th className="text-right font-medium text-muted-foreground py-3 px-3">
                    <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("principal")}>
                      Principal <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left font-medium text-muted-foreground py-3 px-3">Method</th>
                  <th className="text-left font-medium text-muted-foreground py-3 px-3">Day Count</th>
                  <th className="text-center font-medium text-muted-foreground py-3 px-3">
                    <button className="flex items-center gap-1 mx-auto hover:text-foreground" onClick={() => toggleSort("startDate")}>
                      Start <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center font-medium text-muted-foreground py-3 px-3">
                    <button className="flex items-center gap-1 mx-auto hover:text-foreground" onClick={() => toggleSort("maturityDate")}>
                      Maturity <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center font-medium text-muted-foreground py-3 px-3">Status</th>
                  <th className="text-center font-medium text-muted-foreground py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {instrumentsLoading && instruments.length === 0 ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(11)].map((_, j) => (
                        <td key={j} className="py-3 px-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sortedInstruments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <DollarSign className="w-8 h-8 text-gray-300" />
                        <p>No instruments found</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={onCreateNew}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Create Instrument
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedInstruments.map((inst, index) => (
                    <tr
                      key={inst.id}
                      className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${index % 2 === 0 ? "" : "bg-muted/20"}`}
                      onClick={() => handleView(inst)}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{inst.name}</p>
                          {inst.capitalErosion && (
                            <Badge className="bg-red-50 text-red-600 border-red-200 rounded-full text-[9px] px-1.5 mt-0.5" variant="outline">
                              Capital Erosion
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{inst.category}</td>
                      <td className="py-3 px-3 text-muted-foreground">{inst.broker}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="rounded-full text-[10px]">
                          {inst.currency.code}
                        </Badge>
                        {inst.functionalCurrencyId && (
                          <span className="text-muted-foreground ml-1 text-[10px]">(FX)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(inst.principal)}</td>
                      <td className="py-3 px-3 text-muted-foreground">{inst.compoundingMethod.replace("_", " ")}</td>
                      <td className="py-3 px-3 text-muted-foreground">{inst.dayCountConvention.replace("_", "/")}</td>
                      <td className="py-3 px-3 text-center text-muted-foreground">
                        {format(new Date(inst.startDate), "MMM dd, yy")}
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground">
                        {format(new Date(inst.maturityDate), "MMM dd, yy")}
                      </td>
                      <td className="py-3 px-3 text-center">{getStatusBadge(inst.status)}</td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                              <span className="text-lg leading-none">...</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-gray-200">
                            <DropdownMenuItem onClick={() => handleView(inst)} className="text-xs gap-2">
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </DropdownMenuItem>
                            {inst.status === "ACTIVE" && (
                              <>
                                <DropdownMenuItem onClick={() => handleLiquidate(inst)} className="text-xs gap-2">
                                  <DollarSign className="w-3.5 h-3.5" /> Liquidate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleVoid(inst)} className="text-xs gap-2 text-red-600">
                                  <Ban className="w-3.5 h-3.5" /> Void
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">
              Showing {sortedInstruments.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedInstruments.length)} of {sortedInstruments.length}
            </p>
            {sortedInstruments.length > pageSize && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), page + 2)
                  .map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "gradient" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Drawer */}
      {selectedInstrument && (
        <InstrumentViewDrawer
          instrument={selectedInstrument}
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
        />
      )}

      {/* Liquidate Modal */}
      {selectedInstrument && (
        <LiquidateInstrumentModal
          instrument={selectedInstrument}
          open={isLiquidateOpen}
          onOpenChange={setIsLiquidateOpen}
          onLiquidated={handleLiquidated}
        />
      )}
    </>
  )
}
