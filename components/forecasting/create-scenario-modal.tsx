"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Loader2, TrendingUp, CalendarIcon, ChevronsUpDown, Check,
  Search, ChevronDown, ChevronRight, X,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { AppDispatch, RootState } from "@/lib/store/store"
import {
  setCreateModalOpen,
  fetchEntities,
  fetchEntityCoa,
  clearEntityCoa,
  createScenario,
} from "@/lib/store/slices/forecastingSlice"
import type { CreateScenarioPayload, ForecastChartOfAccount } from "@/lib/api/forecasting-api"

// ─── Date picker ─────────────────────────────────────────────────────────────
function DatePickerField({
  label, required, value, onChange, placeholder = "Pick a date",
}: {
  label: string; required?: boolean
  value: Date | undefined; onChange: (d: Date | undefined) => void; placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal h-10", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {value ? format(value, "dd/MM/yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[300]" align="start">
          <Calendar mode="single" selected={value}
            onSelect={(d) => { onChange(d); setOpen(false) }} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── Entity combobox ──────────────────────────────────────────────────────────
function EntityCombobox({
  entities, loading, value, onChange,
}: {
  entities: { id: string; name: string; is_default: boolean }[]
  loading: boolean; value: string; onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = entities.find(e => e.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10 font-normal", !value && "text-muted-foreground")}
        >
          <span className="truncate">
            {loading ? "Loading entities…" : selected ? selected.name : "Select entity"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[300]" align="start" style={{ minWidth: "260px" }}>
        <Command>
          <CommandInput placeholder="Search entities…" className="h-9" />
          <CommandList>
            <CommandEmpty>No entity found.</CommandEmpty>
            <CommandGroup>
              {entities.map(e => (
                <CommandItem
                  key={e.id}
                  value={e.name}
                  onSelect={() => { onChange(e.id); setOpen(false) }}
                  className="gap-2"
                >
                  <Check className={cn("h-4 w-4 shrink-0", value === e.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{e.name}</span>
                  {e.is_default && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Default</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── COA dimension selector ───────────────────────────────────────────────────
function CoaDimensionSelector({
  coa, loading, selected, onToggle,
}: {
  coa: ForecastChartOfAccount[]
  loading: boolean
  selected: string[]
  onToggle: (accountId: string) => void
}) {
  const [search, setSearch] = useState("")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const filtered = coa.filter(a =>
    !search ||
    a.account_name.toLowerCase().includes(search.toLowerCase()) ||
    a.account_no.toLowerCase().includes(search.toLowerCase())
  )

  // Group by account_type
  const groups = filtered.reduce<Record<string, ForecastChartOfAccount[]>>((acc, a) => {
    const t = a.account_type ?? "OTHER"
    if (!acc[t]) acc[t] = []
    acc[t].push(a)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="space-y-2 rounded-lg border border-gray-200 p-3">
        <p className="text-xs text-muted-foreground">Loading chart of accounts…</p>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-7 rounded" />)}
      </div>
    )
  }

  if (coa.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center">
        <p className="text-xs text-muted-foreground">Select an entity to load its chart of accounts</p>
      </div>
    )
  }

  const toggleGroup = (type: string) => {
    const groupAccounts = groups[type] ?? []
    const allSelected = groupAccounts.every(a => selected.includes(a.id))
    groupAccounts.forEach(a => {
      if (allSelected && selected.includes(a.id)) onToggle(a.id)
      if (!allSelected && !selected.includes(a.id)) onToggle(a.id)
    })
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search accounts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-gray-700" />
          </button>
        )}
      </div>

      <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
        {Object.entries(groups).map(([type, accounts]) => {
          const isCollapsed = collapsed[type]
          const groupSelected = accounts.filter(a => selected.includes(a.id)).length
          const allSelected = groupSelected === accounts.length

          return (
            <div key={type}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 sticky top-0 z-10">
                <button
                  type="button"
                  onClick={() => setCollapsed(c => ({ ...c, [type]: !c[type] }))}
                  className="flex items-center gap-1.5 flex-1 min-w-0"
                >
                  {isCollapsed
                    ? <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">{type}</span>
                  <span className="text-[10px] text-gray-400 ml-1">({accounts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleGroup(type)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-medium shrink-0"
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
                {groupSelected > 0 && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 font-medium shrink-0">
                    {groupSelected}
                  </span>
                )}
              </div>

              {/* Account rows */}
              {!isCollapsed && accounts.map(account => {
                const isSel = selected.includes(account.id)
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => onToggle(account.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors",
                      isSel && "bg-blue-50/60"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      isSel ? "gradient-primary border-transparent" : "border-gray-300 bg-white"
                    )}>
                      {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-[11px] font-mono text-gray-500 shrink-0 w-20 truncate">{account.account_no}</span>
                    <span className="text-xs text-gray-800 flex-1 truncate">{account.account_name}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">{selected.length} account{selected.length !== 1 ? "s" : ""} selected as dimensions</p>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function CreateScenarioModal() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const {
    createModalOpen, createLoading, createError,
    entities, entitiesLoading,
    entityCoa, entityCoaLoading,
  } = useSelector((state: RootState) => state.forecasting)

  const [form, setForm] = useState({
    name: "",
    description: "",
    entity_id: "",
    base_currency: "USD",
    granularity: "MONTHLY" as "MONTHLY" | "QUARTERLY" | "ANNUALLY",
    selectedAccountIds: [] as string[],
  })
  const [horizonStart, setHorizonStart] = useState<Date | undefined>()
  const [horizonEnd, setHorizonEnd] = useState<Date | undefined>()

  // Load entities on open
  useEffect(() => {
    if (createModalOpen && entities.length === 0) dispatch(fetchEntities())
  }, [createModalOpen, dispatch, entities.length])

  // Default to first entity
  useEffect(() => {
    if (createModalOpen && entities.length > 0 && !form.entity_id) {
      const def = entities.find(e => e.is_default) ?? entities[0]
      handleEntityChange(def.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, createModalOpen])

  // Clear COA when modal closes
  useEffect(() => {
    if (!createModalOpen) {
      dispatch(clearEntityCoa())
      setForm({ name: "", description: "", entity_id: "", base_currency: "USD", granularity: "MONTHLY", selectedAccountIds: [] })
      setHorizonStart(undefined)
      setHorizonEnd(undefined)
    }
  }, [createModalOpen, dispatch])

  const handleEntityChange = (entityId: string) => {
    setForm(p => ({ ...p, entity_id: entityId, selectedAccountIds: [] }))
    if (entityId) dispatch(fetchEntityCoa(entityId))
  }

  const toggleAccount = (accountId: string) => {
    setForm(p => ({
      ...p,
      selectedAccountIds: p.selectedAccountIds.includes(accountId)
        ? p.selectedAccountIds.filter(id => id !== accountId)
        : [...p.selectedAccountIds, accountId],
    }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Scenario name is required"); return }
    if (!form.entity_id) { toast.error("Entity is required"); return }
    if (!horizonStart || !horizonEnd) { toast.error("Horizon dates are required"); return }
    if (horizonEnd <= horizonStart) { toast.error("Horizon end must be after start"); return }

    const payload: CreateScenarioPayload = {
      name: form.name.trim(),
      description: form.description || undefined,
      entity_id: form.entity_id,
      base_currency: form.base_currency,
      granularity: form.granularity,
      horizon_start_date: format(horizonStart, "yyyy-MM-dd"),
      horizon_end_date: format(horizonEnd, "yyyy-MM-dd"),
      dimensions: form.selectedAccountIds.map(id => ({ type: "ACCOUNT", value_id: id })),
    }

    try {
      const result = await dispatch(createScenario(payload)).unwrap()
      const newId = result?.scenario_id ?? (result as any)?.id
      toast.success("Scenario created", { description: form.name })
      if (newId) router.push(`/forecasting/scenarios/${newId}`)
    } catch (err: any) {
      toast.error("Failed to create scenario", { description: err?.message || createError || "Please try again" })
    }
  }

  return (
    <Dialog open={createModalOpen} onOpenChange={(open) => !open && dispatch(setCreateModalOpen(false))}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Create Forecast Scenario
          </DialogTitle>
          <DialogDescription>
            Define a new multi-dimensional forecasting scenario. The system will provision an empty hypercube on creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Scenario Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Q3 Strategic Growth Runway"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="Optional description"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Entity + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Entity <span className="text-red-500">*</span></Label>
              <EntityCombobox
                entities={entities}
                loading={entitiesLoading}
                value={form.entity_id}
                onChange={handleEntityChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Base Currency</Label>
              <Select value={form.base_currency} onValueChange={v => setForm(p => ({ ...p, base_currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="ZIG">ZIG — Zimbabwe Gold</SelectItem>
                  <SelectItem value="ZWL">ZWL — Zimbabwe Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Granularity */}
          <div className="space-y-1.5">
            <Label>Granularity</Label>
            <Select value={form.granularity} onValueChange={(v: any) => setForm(p => ({ ...p, granularity: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="ANNUALLY">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Horizon dates */}
          <div className="grid grid-cols-2 gap-3">
            <DatePickerField label="Horizon Start" required value={horizonStart} onChange={setHorizonStart} placeholder="dd/mm/yyyy" />
            <DatePickerField label="Horizon End"   required value={horizonEnd}   onChange={setHorizonEnd}   placeholder="dd/mm/yyyy" />
          </div>

          {/* COA Dimensions */}
          <div className="space-y-2">
            <Label>Account Dimensions</Label>
            <p className="text-xs text-muted-foreground">
              Select accounts from this entity's chart of accounts to include as forecast dimensions
            </p>
            <CoaDimensionSelector
              coa={entityCoa}
              loading={entityCoaLoading}
              selected={form.selectedAccountIds}
              onToggle={toggleAccount}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => dispatch(setCreateModalOpen(false))}
            disabled={createLoading}
            className="rounded-full h-9 px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createLoading}
            className="rounded-full h-9 px-5 gradient-primary text-white shadow"
          >
            {createLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
            ) : (
              <><TrendingUp className="w-4 h-4 mr-2" /> Create Scenario</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
