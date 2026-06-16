"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { format } from "date-fns"
import {
  Building2, Plus, RefreshCw, Zap, Database, ChevronRight,
  Layers, CheckCircle2, Settings, AlertTriangle, Loader2,
  Globe, Lock, X, Check, ChevronsUpDown,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { AppDispatch, RootState } from "@/lib/store/store"
import {
  fetchEntities, createEntity, fetchEntityCoa,
  resyncEntityCoa, triggerGlSync,
} from "@/lib/store/slices/forecastingSlice"
import type { ForecastEntity, ForecastChartOfAccount } from "@/lib/api/forecasting-api"

// ─── Entity type badge ────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  return type === "INTERNAL_SUBSIDIARY" ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
      <Building2 className="w-2.5 h-2.5" /> Internal
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
      <Globe className="w-2.5 h-2.5" /> External
    </span>
  )
}

// ─── Entity COA Drawer ────────────────────────────────────────────────────────
function EntityCoaPanel({ entity, onClose }: { entity: ForecastEntity; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>()
  const { entityCoa, entityCoaLoading } = useSelector((s: RootState) => s.forecasting)
  const [resyncing, setResyncing] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    dispatch(fetchEntityCoa(entity.id))
  }, [entity.id, dispatch])

  const handleResync = async () => {
    setResyncing(true)
    try {
      const result = await dispatch(resyncEntityCoa(entity.id)).unwrap() as any
      toast.success("COA resynced", {
        description: `${result?.accounts_added ?? 0} added, ${result?.accounts_updated ?? 0} updated`,
      })
      dispatch(fetchEntityCoa(entity.id))
    } catch (err: any) {
      toast.error("Resync failed", { description: err?.message })
    } finally {
      setResyncing(false)
    }
  }

  const filtered = entityCoa.filter(a =>
    !search ||
    a.account_name.toLowerCase().includes(search.toLowerCase()) ||
    a.account_no.toLowerCase().includes(search.toLowerCase()) ||
    a.account_type.toLowerCase().includes(search.toLowerCase())
  )

  // Group by type
  const groups = filtered.reduce<Record<string, ForecastChartOfAccount[]>>((acc, a) => {
    const t = a.account_type ?? "OTHER"
    if (!acc[t]) acc[t] = []
    acc[t].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{entity.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {entityCoa.length} accounts · {entity.type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entity.type === "INTERNAL_SUBSIDIARY" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-xs gap-1.5"
              onClick={handleResync}
              disabled={resyncing}
            >
              {resyncing
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <RefreshCw className="w-3 h-3" />}
              Resync COA
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={onClose}>
            <X className="w-3.5 h-3.5 mr-1" /> Close
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Database className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search accounts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Account list */}
      {entityCoaLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <Database className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No accounts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groups).map(([type, accounts]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{type}</span>
                <span className="text-[10px] text-gray-300">({accounts.length})</span>
              </div>
              <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {accounts.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50/60">
                    <span className="text-xs font-mono text-gray-400 w-16 shrink-0 truncate">{a.account_no}</span>
                    <span className="text-xs text-gray-800 flex-1 truncate">{a.account_name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {a.source_account_id && (
                        <span title="Linked to GL" className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        a.natural_balance === "CREDIT" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                      }`}>{a.natural_balance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Create Entity Modal ──────────────────────────────────────────────────────
function CreateEntityModal({
  open, onClose, entities,
}: {
  open: boolean; onClose: () => void; entities: ForecastEntity[]
}) {
  const dispatch = useDispatch<AppDispatch>()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "INTERNAL_SUBSIDIARY" as "INTERNAL_SUBSIDIARY" | "EXTERNAL_STARTUP",
    base_currency: "USD",
    clone_from_entity_id: "",
  })

  useEffect(() => {
    if (open) {
      const def = entities.find(e => e.is_default) ?? entities[0]
      setForm(p => ({ ...p, name: "", clone_from_entity_id: def?.id ?? "" }))
    }
  }, [open, entities])

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Entity name is required"); return }
    setSaving(true)
    try {
      await dispatch(createEntity({
        name: form.name.trim(),
        type: form.type,
        base_currency: form.base_currency,
        clone_from_entity_id: form.clone_from_entity_id || undefined,
      })).unwrap()
      toast.success("Entity created", {
        description: `${form.name} has been created with a cloned chart of accounts.`,
      })
      onClose()
    } catch (err: any) {
      toast.error("Failed to create entity", { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            Create Forecast Entity
          </DialogTitle>
          <DialogDescription>
            A new entity is created with a full clone of its chart of accounts. Internal subsidiaries retain GL source links for actuals sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Entity Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Sunrise Holdings (Subsidiary)"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL_SUBSIDIARY">Internal Subsidiary</SelectItem>
                  <SelectItem value="EXTERNAL_STARTUP">External Startup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Base Currency</Label>
              <Select value={form.base_currency} onValueChange={v => setForm(p => ({ ...p, base_currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ZIG">ZIG</SelectItem>
                  <SelectItem value="ZWL">ZWL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Clone COA From</Label>
            <Select
              value={form.clone_from_entity_id}
              onValueChange={v => setForm(p => ({ ...p, clone_from_entity_id: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Select source entity" /></SelectTrigger>
              <SelectContent>
                {entities.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}{e.is_default ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {form.type === "INTERNAL_SUBSIDIARY"
                ? "All cloned accounts will retain GL source links for actuals sync."
                : "External startup accounts won't have GL source links — they contribute 0 to GL sync."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-full h-9 px-5">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-full h-9 px-5 gradient-primary text-white shadow"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : <><Building2 className="w-4 h-4 mr-2" /> Create Entity</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── GL Sync Card ─────────────────────────────────────────────────────────────
function GlSyncCard({ entities }: { entities: ForecastEntity[] }) {
  const dispatch = useDispatch<AppDispatch>()
  const [syncing, setSyncing] = useState(false)
  const [scenarioId, setScenarioId] = useState("")

  const handleSync = async () => {
    setSyncing(true)
    try {
      await dispatch(triggerGlSync({ scenario_id: scenarioId.trim() || undefined })).unwrap()
      toast.success("GL sync triggered", { description: "Actuals are being synced in the background." })
      setScenarioId("")
    } catch (err: any) {
      toast.error("GL sync failed", { description: err?.message })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
          </div>
          GL Actuals Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Triggers the daily GL actuals sync cron job (<span className="font-mono">POST /cron/forecasting/gl-sync</span>).
          This pulls real GL entries into forecast cells for variance analysis.
          Normally runs on schedule — use this to force an immediate sync.
        </p>

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Auth: requires <span className="font-mono">X-Forecast-Gl-Sync-Cron-Secret</span> header or loopback origin. Ensure the server env is configured.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Scenario ID <span className="text-gray-400 font-normal">(leave blank to sync all)</span></Label>
          <Input
            placeholder="cmqdsp6fd00counvohyzhxu1o"
            value={scenarioId}
            onChange={e => setScenarioId(e.target.value)}
            className="h-9 text-xs font-mono"
          />
        </div>

        <Button
          className="w-full h-9 rounded-full gradient-primary text-white shadow gap-2"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing…</>
            : <><Zap className="w-4 h-4" /> Trigger GL Sync</>}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export function EntitySettings() {
  const dispatch = useDispatch<AppDispatch>()
  const { entities, entitiesLoading } = useSelector((s: RootState) => s.forecasting)

  const [createOpen, setCreateOpen]     = useState(false)
  const [coaEntity, setCoaEntity]       = useState<ForecastEntity | null>(null)

  useEffect(() => {
    dispatch(fetchEntities())
  }, [dispatch])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> Forecasting Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage forecast entities, chart of accounts, and GL sync operations.
          </p>
        </div>
        <Button
          className="h-9 rounded-full gradient-primary text-white shadow gap-2 shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" /> New Entity
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Entities list ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Entities</h2>
            <Button
              size="sm" variant="ghost"
              className="h-7 rounded-full text-xs gap-1 text-gray-500"
              onClick={() => dispatch(fetchEntities())}
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>

          {entitiesLoading && entities.length === 0 ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : entities.length === 0 ? (
            <Card className="border-dashed border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <Building2 className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500">No entities found</p>
                <p className="text-xs text-muted-foreground mt-1">Create an entity to start forecasting</p>
                <Button
                  className="mt-4 h-8 rounded-full gradient-primary text-white text-xs gap-1.5"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" /> New Entity
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {entities.map(entity => (
                <Card
                  key={entity.id}
                  className={cn(
                    "bg-white border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
                    coaEntity?.id === entity.id ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-200"
                  )}
                  onClick={() => setCoaEntity(coaEntity?.id === entity.id ? null : entity)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Icon + name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          entity.type === "INTERNAL_SUBSIDIARY" ? "gradient-primary" : "bg-purple-500"
                        )}>
                          {entity.type === "INTERNAL_SUBSIDIARY"
                            ? <Building2 className="w-5 h-5 text-white" />
                            : <Globe className="w-5 h-5 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-900 truncate">{entity.name}</p>
                            {entity.is_default && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">Default</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <TypeBadge type={entity.type} />
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full text-xs gap-1 text-blue-600 hover:bg-blue-50 shrink-0"
                        onClick={e => { e.stopPropagation(); setCoaEntity(coaEntity?.id === entity.id ? null : entity) }}
                      >
                        <Database className="w-3.5 h-3.5" />
                        View COA
                        <ChevronRight className={cn("w-3 h-3 transition-transform", coaEntity?.id === entity.id && "rotate-90")} />
                      </Button>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-50">
                      {[
                        { icon: Database, label: "Accounts", value: entity.account_count ?? 0 },
                        { icon: Layers,   label: "Scenarios", value: entity.scenario_count ?? 0 },
                        { icon: entity.type === "INTERNAL_SUBSIDIARY" ? CheckCircle2 : Lock, label: "Type", value: entity.type === "INTERNAL_SUBSIDIARY" ? "GL Linked" : "Standalone" },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Icon className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-700">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: COA panel + GL Sync ──────────────────────────────────── */}
        <div className="space-y-4">
          {/* COA panel */}
          {coaEntity ? (
            <Card className="bg-white border border-blue-200 shadow-sm">
              <CardContent className="p-4">
                <EntityCoaPanel entity={coaEntity} onClose={() => setCoaEntity(null)} />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border border-dashed border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Database className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Select an entity</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">to view its chart of accounts</p>
              </CardContent>
            </Card>
          )}

          {/* GL Sync */}
          <GlSyncCard entities={entities} />
        </div>
      </div>

      {/* Modals */}
      <CreateEntityModal open={createOpen} onClose={() => setCreateOpen(false)} entities={entities} />
    </div>
  )
}
