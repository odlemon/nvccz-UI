"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Loader2, Star } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { BuilderHeader, type BuilderValidationState } from "./builder/builder-header"
import {
  BuilderDimensionsPanel,
  BuilderModulesTree,
  apiModulesToFolders,
  groupLineItemsByModule,
  type SelectedModuleLeaf,
} from "./builder/builder-modules-tree"
import { BuilderLineItemGrid, CreateLineItemDialog } from "./builder/builder-line-item-grid"
import {
  BuilderAttachDimensionsDialog,
  BuilderConfirmDialog,
  BuilderModuleNameDialog,
} from "./builder/builder-module-dialog"
import { BuilderInspector } from "./builder/builder-inspector"
import {
  BuilderAuditDrawer,
  BuilderDependencyMap,
  BuilderExceptionsPanel,
  BuilderDetailedWorkspace,
} from "./builder/builder-governance"
import {
  asNumber,
  fpaApi,
  type FpaAuditEntry,
  type FpaBuilderModule,
  type FpaDependencyGraph,
  type FpaDimension,
  type FpaFormula,
  type FpaFormulaMutationResult,
  type FpaGridValidation,
  type FpaLineItem,
  type FpaLineItemTemplate,
  type FpaModel,
  type FpaSetupError,
  type FpaVersion,
} from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  bootstrapFpaSelection,
  fetchFpaModels,
  setSelectedModelId,
  setSelectedVersionId,
} from "@/lib/store/slices/fpaSlice"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import {
  buildAuditUiRows,
  buildExceptionRows,
  buildValidationChecks,
  validationSummaryFromCounts,
} from "@/lib/fpa/detailed-workspace-adapters"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { lineItemKind } from "@/components/fpa/grid/cell-state"

export function FpaModelBuilder({ modelId }: { modelId?: string }) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    selectedModelId,
    selectedVersionId,
    selectedScenarioId,
    models,
    versions,
    bootstrapped,
  } = useAppSelector((s) => s.fpa)
  const { canConfigureBuilder } = useFpaPermissions()

  const queryModelId = searchParams.get("modelId")
  const queryVersionId = searchParams.get("versionId")
  const queryView = searchParams.get("view")
  const routeModelId = modelId && modelId !== "default" ? modelId : null
  const id = routeModelId || queryModelId || selectedModelId

  const [viewMode, setViewMode] = useState<"structure" | "detailed">(
    () => (queryView === "detailed" ? "detailed" : "structure"),
  )

  const [model, setModel] = useState<FpaModel | null>(null)
  const [lineItems, setLineItems] = useState<FpaLineItem[]>([])
  const [dimensions, setDimensions] = useState<FpaDimension[]>([])
  const [selected, setSelected] = useState<FpaLineItem | null>(null)
  const [expression, setExpression] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [moduleKey, setModuleKey] = useState<string | null>(null)
  const [selectedLeaf, setSelectedLeaf] = useState<SelectedModuleLeaf | null>(null)
  const [centreTab, setCentreTab] = useState<"items" | "templates" | "validations" | "history">(
    "items",
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [moduleDialog, setModuleDialog] = useState<
    | { mode: "create"; parentModuleId?: string | null; parentName?: string | null }
    | { mode: "rename"; moduleId: string; currentName: string }
    | null
  >(null)
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null)
  const [moduleDialogBusy, setModuleDialogBusy] = useState(false)
  const [dimsAttachOpen, setDimsAttachOpen] = useState(false)
  const [modelDimKeys, setModelDimKeys] = useState<string[]>([])
  const [periodKeys, setPeriodKeys] = useState<string[]>([])
  const [demoCreate, setDemoCreate] = useState<{
    name: string
    code: string
    kind: "INPUT" | "CALCULATED"
    nonce: number
  } | null>(null)
  const [demoFormulaPatch, setDemoFormulaPatch] = useState<{
    rowId: string
    formula: string
    nonce: number
  } | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showLineItemsOnMap, setShowLineItemsOnMap] = useState(true)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [formulaValid, setFormulaValid] = useState<boolean | null>(null)
  const [formulaMessage, setFormulaMessage] = useState<string | null>(null)
  const [impact, setImpact] = useState<unknown>(null)
  const [depGraph, setDepGraph] = useState<Record<string, string[]> | null>(null)
  const [liveDepGraph, setLiveDepGraph] = useState<FpaDependencyGraph | null>(null)
  const [depApiMissing, setDepApiMissing] = useState(false)
  const [previewByLine, setPreviewByLine] = useState<Record<string, Array<number | null>>>({})
  const [periodLabels, setPeriodLabels] = useState<string[]>([])
  const [validation, setValidation] = useState<BuilderValidationState>({
    valid: null,
    errorCount: 0,
    warningCount: 0,
    circular: null,
    circularPath: null,
  })
  const [errors, setErrors] = useState<FpaSetupError[]>([])
  const [warnings, setWarnings] = useState<FpaSetupError[]>([])
  const [info, setInfo] = useState<FpaSetupError[]>([])
  const [apiModules, setApiModules] = useState<FpaBuilderModule[]>([])
  const [auditEntries, setAuditEntries] = useState<
    Array<{ time: string; user: string; action: string; details: string }>
  >([])
  const [rawAuditEntries, setRawAuditEntries] = useState<FpaAuditEntry[]>([])
  const [lineItemTemplates, setLineItemTemplates] = useState<FpaLineItemTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [gridValidations, setGridValidations] = useState<FpaGridValidation[]>([])
  const [validationSummary, setValidationSummary] = useState<{
    total: number
    passed: number
    warnings: number
    errors: number
  } | null>(null)
  /** Structure builder is API-only — no demo fallbacks. */
  const structureHardcoded = false
  const gridHardcoded = false

  const modelVersions: FpaVersion[] = useMemo(() => {
    const fromStore = versions.filter((v) => !id || v.modelId === id || !v.modelId)
    if (fromStore.length) return fromStore
    return (model?.versions || []) as FpaVersion[]
  }, [versions, model?.versions, id])

  const preferredVersionId = useMemo(() => {
    const draft = modelVersions.find((v) => String(v.status).toUpperCase() === "DRAFT")
    return draft?.id || modelVersions[0]?.id || null
  }, [modelVersions])

  const versionId = queryVersionId || selectedVersionId || preferredVersionId
  const activeVersion = modelVersions.find((v) => v.id === versionId) || null
  const versionLocked = String(activeVersion?.status || "").toUpperCase() === "LOCKED"
  const canEditLive = canConfigureBuilder && !versionLocked

  const syncUrl = useCallback(
    (
      nextModelId: string,
      nextVersionId?: string | null,
      nextView?: "structure" | "detailed",
    ) => {
      const sp = new URLSearchParams()
      if (nextVersionId) sp.set("versionId", nextVersionId)
      const view = nextView ?? viewMode
      if (view === "detailed") sp.set("view", "detailed")
      const q = sp.toString()
      router.push(`/forecasting/model-builder/${nextModelId}${q ? `?${q}` : ""}`)
    },
    [router, viewMode],
  )

  // If store/URL points at a locked snapshot but a DRAFT exists, move Builder to the draft
  useEffect(() => {
    if (!id || queryVersionId) return
    if (!versionLocked) return
    const draft = modelVersions.find((v) => String(v.status).toUpperCase() === "DRAFT")
    if (!draft?.id || draft.id === versionId) return
    dispatch(setSelectedVersionId(draft.id))
    syncUrl(id, draft.id, viewMode)
  }, [
    id,
    queryVersionId,
    versionLocked,
    modelVersions,
    versionId,
    dispatch,
    syncUrl,
    viewMode,
  ])

  const openDetailedWorkspace = useCallback(
    (leaf?: SelectedModuleLeaf | null) => {
      if (leaf) setSelectedLeaf(leaf)
      setViewMode("detailed")
      if (id) {
        const sp = new URLSearchParams()
        if (versionId) sp.set("versionId", versionId)
        sp.set("view", "detailed")
        router.replace(`/forecasting/model-builder/${id}?${sp.toString()}`)
      }
    },
    [id, router, versionId],
  )

  const backToStructure = useCallback(() => {
    setViewMode("structure")
    if (id) {
      const sp = new URLSearchParams()
      if (versionId) sp.set("versionId", versionId)
      const q = sp.toString()
      router.replace(`/forecasting/model-builder/${id}${q ? `?${q}` : ""}`)
    }
  }, [id, router, versionId])

  useEffect(() => {
    setViewMode(queryView === "detailed" ? "detailed" : "structure")
  }, [queryView])

  useEffect(() => {
    if (!bootstrapped) void dispatch(fetchFpaModels())
  }, [bootstrapped, dispatch])

  const modules = useMemo(() => groupLineItemsByModule(lineItems), [lineItems])
  const activeModule = useMemo(
    () => modules.find((m) => m.key === moduleKey) || modules[0] || null,
    [modules, moduleKey],
  )
  const scopedItems = useMemo(() => {
    if (selectedLeaf?.leafId) {
      return lineItems.filter((li) => li.moduleId === selectedLeaf.leafId)
    }
    return activeModule?.items || lineItems
  }, [selectedLeaf?.leafId, lineItems, activeModule])

  const mapFallbackModules = useMemo(
    () =>
      apiModules.map((m) => ({
        id: m.id,
        name: m.name,
        items: lineItems
          .filter((li) => li.moduleId === m.id)
          .map((li) => ({ id: li.id, name: li.name, code: li.code })),
      })),
    [apiModules, lineItems],
  )

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setModel(null)
      setLineItems([])
      return
    }
    setLoading(true)
    try {
      if (routeModelId) await dispatch(bootstrapFpaSelection(routeModelId))
      else await dispatch(bootstrapFpaSelection(id))

      const [mRes, liRes, dimRes, modRes, graphRes, modelDimRes] = await Promise.all([
        fpaApi.getModel(id),
        fpaApi.listLineItems(id),
        fpaApi.listDimensions().catch(() => ({ success: false as const, data: [] as FpaDimension[] })),
        fpaApi.listModules(id).catch(() => ({ success: false as const, data: [] as FpaBuilderModule[] })),
        fpaApi
          .getDependencyGraph(id, { view: "module" })
          .catch(() => ({ success: false as const, data: null })),
        fpaApi
          .getModelDimensions(id)
          .catch(() => ({ success: false as const, data: null })),
      ])
      if (!mRes.success) throw new Error(mRes.message || "Model failed")
      setModel(mRes.data || null)

      // Heal missing default formulas on older models (idempotent)
      try {
        await fpaApi.seedModelDefaults(id)
      } catch {
        /* optional */
      }

      // Refetch LIs + graph after seed so formulas/edges are current
      const [liRes2, graphRes2] = await Promise.all([
        fpaApi.listLineItems(id).catch(() => liRes),
        fpaApi
          .getDependencyGraph(id, { view: "module" })
          .catch(() => graphRes),
      ])
      const items = liRes2.success
        ? liRes2.data || []
        : liRes.success
          ? liRes.data || []
          : mRes.data?.lineItems || []
      setLineItems(items)
      setDimensions(dimRes.success ? dimRes.data || [] : [])
      setModelDimKeys(
        modelDimRes.success
          ? (modelDimRes.data?.dimensions || []).map((d) => d.key).filter(Boolean)
          : (mRes.data as { dimensions?: Array<{ key?: string }> })?.dimensions
              ?.map((d) => d.key || "")
              .filter(Boolean) || [],
      )
      const mods = modRes.success ? modRes.data || [] : []
      setApiModules(mods)
      const liveGraph = graphRes2.success && graphRes2.data ? graphRes2.data : graphRes.success ? graphRes.data : null
      if (liveGraph) {
        setLiveDepGraph(liveGraph)
        const g: Record<string, string[]> = {}
        for (const e of liveGraph.edges || []) {
          const list = g[e.sourceLineItemId] || []
          list.push(e.targetLineItemId)
          g[e.sourceLineItemId] = list
        }
        setDepGraph(g)
        setDepApiMissing(false)
      } else {
        setLiveDepGraph(null)
        setDepApiMissing(true)
      }

      // Prefer first API module leaf for structure selection
      const folders = apiModulesToFolders(mods)
      const firstFolder = folders[0]
      const firstLeaf = firstFolder?.children[0]
      let initialSelected: FpaLineItem | null = null
      if (firstFolder && firstLeaf) {
        setSelectedLeaf({
          folderId: firstFolder.id,
          folderName: firstFolder.name,
          leafId: firstLeaf.id,
          leafName: firstLeaf.name,
        })
        initialSelected =
          items.find((li) => li.moduleId === firstLeaf.id) ||
          items.find((li) => li.moduleId === firstFolder.id) ||
          items[0] ||
          null
      } else {
        setSelectedLeaf(null)
        initialSelected = items[0] || null
      }

      const groups = groupLineItemsByModule(items)
      setModuleKey((prev) => prev || groups[0]?.key || null)
      setSelected((prev) => items.find((x) => x.id === prev?.id) || initialSelected)
      setExpression(
        (items.find((x) => x.id === selected?.id) || initialSelected)?.formulas?.[0]?.expression ||
          "",
      )

      const published =
        mRes.data?.publishedAt ||
        (mRes.data?.versions || []).find((v) => String(v.status).toUpperCase() === "LOCKED")
      setValidation((v) => ({
        ...v,
        lastPublishedAt:
          mRes.data?.publishedAt ||
          (typeof published === "object" ? published?.publishedAt || published?.lockedAt : null) ||
          null,
        lastPublishedBy:
          mRes.data?.publishedByName ||
          (typeof published === "object"
            ? published?.publishedByName || null
            : null) ||
          null,
      }))

      const ver = versionId || mRes.data?.defaultVersionId || mRes.data?.versions?.[0]?.id
      const scen = selectedScenarioId || mRes.data?.defaultScenarioId || mRes.data?.scenarios?.[0]?.id
      if (ver) {
        try {
          const grid = await fpaApi.getGrid(id, {
            versionId: ver,
            scenarioId: scen || undefined,
            pageSize: 500,
          })
          if (grid.success && grid.data) {
            const periods = (grid.data.periods || [])
              .map((p) => {
                if (p.label) return p.label
                if (p.periodDate) {
                  const d = new Date(p.periodDate)
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })
                }
                return p.key || ""
              })
              .filter(Boolean)
              .slice(0, 6)
            setPeriodLabels(periods)
            const byLine: Record<string, Array<number | null>> = {}
            const periodIsos = (grid.data.periods || [])
              .map((p) => p.periodDate || p.key || "")
              .filter(Boolean)
              .slice(0, 6)
            setPeriodKeys(periodIsos)
            for (const li of grid.data.lineItems || items) {
              byLine[li.id] = periodIsos.map((iso) => {
                const cell = grid.data!.cells.find(
                  (c) => c.lineItemId === li.id && (c.periodDate === iso || c.periodDate?.startsWith(iso)),
                )
                return cell ? asNumber(cell.value) : null
              })
            }
            setPreviewByLine(byLine)
          }
        } catch {
          setPeriodLabels([])
          setPreviewByLine({})
        }
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${id}`,
        method: "GET",
        message: errorMessage(err),
        impact: "Model builder empty",
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id, routeModelId, dispatch, versionId, selectedScenarioId])

  useEffect(() => {
    void load()
  }, [load])

  const selectLineItem = (li: FpaLineItem) => {
    setSelected(li)
    setModuleKey(String(li.category || "General").trim() || "General")
    setExpression(li.formulas?.[0]?.expression || "")
    setFormulaValid(null)
    setFormulaMessage(null)
    setImpact(null)
    const fxId = li.formulas?.[0]?.id
    if (fxId) {
      void fpaApi
        .getImpactMap(fxId)
        .then((res) => {
          if (res.success) setImpact(res.data)
        })
        .catch(() => setImpact(null))
    }
  }

  const selectModule = (key: string) => {
    setModuleKey(key)
    const mod = modules.find((m) => m.key === key)
    const first = mod?.items[0]
    if (first) selectLineItem(first)
  }

  const runValidateModel = async () => {
    if (!id) return
    setBusyKey("validate")
    try {
      const [vRes, dRes] = await Promise.all([
        fpaApi.validateModel(id),
        fpaApi
          .dependencyCheck({
            modelId: id,
            lineCodes: lineItems.map((l) => l.code),
          })
          .catch(() => null),
      ])

      const errs: FpaSetupError[] = []
      const warns: FpaSetupError[] = []
      const infos: FpaSetupError[] = []
      let circular: boolean | null = null
      let circularPath: string[] | null = null
      if (vRes.success && vRes.data) {
        const data = vRes.data
        for (const e of data.errors || []) {
          const sev = String(e.severity || e.step || "").toUpperCase()
          if (sev.includes("WARN")) warns.push(e)
          else if (sev.includes("INFO")) infos.push(e)
          else errs.push(e)
        }
        for (const e of data.warnings || []) warns.push(e)
        for (const e of data.info || []) infos.push(e)
        if (data.circular) {
          circular = true
          circularPath = data.circularPath || data.circularCheck?.path || null
        }
      } else if (!vRes.success) {
        throw new Error(vRes.message || "Validate failed")
      }

      setErrors(errs)
      setWarnings(warns)
      setInfo(infos)

      let graph: Record<string, string[]> | null = null
      if (dRes?.success && dRes.data) {
        if (dRes.data.circular) {
          circular = true
          circularPath = dRes.data.path || circularPath
        } else if (circular == null) {
          circular = false
        }
        graph = dRes.data.graph || null
        setDepApiMissing(false)
      } else {
        setDepApiMissing(true)
      }
      // Prefer dedicated dependency-graph
      try {
        const gRes = await fpaApi.getDependencyGraph(id, {
          view: "module",
          moduleId: selectedLeaf?.leafId || undefined,
        })
        if (gRes.success && gRes.data) {
          setLiveDepGraph(gRes.data)
          const g: Record<string, string[]> = {}
          for (const e of gRes.data.edges || []) {
            const list = g[e.sourceLineItemId] || []
            list.push(e.targetLineItemId)
            g[e.sourceLineItemId] = list
          }
          graph = g
          if (gRes.data.circular) {
            circular = true
            circularPath = gRes.data.circularPath || circularPath
          }
          setDepApiMissing(false)
        }
      } catch {
        /* optional */
      }
      setDepGraph(graph)

      setValidation((prev) => ({
        ...prev,
        valid: errs.length === 0 && (vRes.data?.passed ?? errs.length === 0),
        errorCount: errs.length,
        warningCount: warns.length,
        circular,
        circularPath,
      }))
      setShowValidationModal(true)
      void loadValidationSummary()
      void loadGridValidations()
      toast.success(
        errs.length === 0 ? "Model validation passed" : `Validation found ${errs.length} error(s)`,
      )
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const runTestCalc = async () => {
    if (!id || !versionId) {
      toast.error("Select a workspace/version first")
      return
    }
    setBusyKey("test")
    try {
      const scen = selectedScenarioId || model?.defaultScenarioId || model?.scenarios?.[0]?.id
      const calc = await fpaApi.testCalculation(versionId, {
        scenarioId: scen || null,
        moduleId: selectedLeaf?.leafId || null,
        pageSize: 500,
      })
      if (!calc.success) throw new Error(calc.message || "Test calculation failed")

      const gridPayload = calc.data?.grid
      const grid =
        gridPayload ||
        (
          await fpaApi.getGrid(id, {
            versionId,
            scenarioId: scen || undefined,
            pageSize: 500,
          })
        ).data

      if (grid) {
        const periods = (grid.periods || [])
          .map((p) => {
            if (p.label) return p.label
            if (p.periodDate) {
              const d = new Date(p.periodDate)
              return d.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })
            }
            return p.key || ""
          })
          .filter(Boolean)
          .slice(0, 6)
        setPeriodLabels(periods)
        const periodIsos = (grid.periods || [])
          .map((p) => p.periodDate || p.key || "")
          .filter(Boolean)
          .slice(0, 6)
        setPeriodKeys(periodIsos)
        const byLine: Record<string, Array<number | null>> = {}
        for (const li of grid.lineItems || lineItems) {
          byLine[li.id] = periodIsos.map((iso) => {
            const cell = grid.cells.find(
              (c) =>
                c.lineItemId === li.id &&
                (c.periodDate === iso || c.periodDate?.startsWith(iso)),
            )
            return cell ? asNumber(cell.value) : null
          })
        }
        setPreviewByLine(byLine)
      }
      toast.success(calc.data?.message || "Test calculation complete")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const validateFormula = async () => {
    // Demo / offline formulas — validate locally without round-trip
    if (selected?.id?.startsWith("demo-")) {
      const ok = expression.trim().length > 0 && !/circular/i.test(expression)
      setFormulaValid(ok)
      setFormulaMessage(ok ? "No issues" : "Enter a formula")
      if (ok) toast.success("Formula valid")
      else toast.error("Enter a formula")
      return
    }
    try {
      const res = await fpaApi.validateFormula(expression)
      if (!res.success) throw new Error(res.message)
      setFormulaValid(Boolean(res.data?.valid))
      setFormulaMessage(res.data?.message || null)
      if (res.data?.valid) toast.success("Formula valid")
      else toast.error(res.data?.message || "Invalid formula")
    } catch (err) {
      setFormulaValid(false)
      setFormulaMessage(errorMessage(err))
      toast.error(errorMessage(err))
    }
  }

  const saveFormula = async () => {
    if (!id || !selected) return
    if (lineItemKind(selected) === "INPUT") {
      toast.error("INPUT rows do not use formulas")
      return
    }
    setBusyKey("save")
    try {
      // Demo rows — patch UI only, no full reload
      if (selected.id.startsWith("demo-")) {
        const demoId = selected.id.replace(/^demo-/, "")
        setSelected({
          ...selected,
          formulas: [{ id: selected.formulas?.[0]?.id || `fx-${demoId}`, expression }],
        })
        setFormulaValid(true)
        setFormulaMessage("No issues")
        setDemoFormulaPatch({ rowId: demoId, formula: expression, nonce: Date.now() })
        toast.success("Formula saved")
        return
      }

      const dep = await fpaApi.dependencyCheck({
        modelId: id,
        formulaId: selected.formulas?.[0]?.id,
        dependsOnLineItemCodes: expression.match(/\[([^\]]+)\]/g)?.map((s) => s.slice(1, -1)) || [],
        lineCodes: [selected.code],
      })
      if (dep.success && dep.data?.circular) {
        toast.error(
          `Circular reference: ${(dep.data.path || []).join(" → ") || "detected"}`,
        )
        return
      }

      const existing = selected.formulas?.[0]
      let savedFx: FpaFormula | undefined = existing
      let impactPayload: unknown = null
      if (existing?.id) {
        const res = await fpaApi.updateFormula(existing.id, {
          expression,
          lineItemId: selected.id,
        })
        if (!res.success) throw new Error(res.message)
        const data = res.data as FpaFormula | FpaFormulaMutationResult | undefined
        if (data && "formula" in data && data.formula) {
          savedFx = data.formula
          impactPayload = data.impact || null
        } else {
          savedFx = (data as FpaFormula) || { ...existing, expression }
        }
      } else {
        const res = await fpaApi.createFormula(id, {
          lineItemId: selected.id,
          expression,
        })
        if (!res.success) throw new Error(res.message)
        const data = res.data as FpaFormula | FpaFormulaMutationResult | undefined
        if (data && "formula" in data && data.formula) {
          savedFx = data.formula
          impactPayload = data.impact || null
        } else {
          savedFx = (data as FpaFormula) || {
            id: `tmp-${Date.now()}`,
            expression,
            lineItemId: selected.id,
          }
        }
      }

      // Patch in place — no full model reload
      const nextSelected: FpaLineItem = {
        ...selected,
        formulas: [{ ...(savedFx as FpaFormula), expression }],
        formulaId: savedFx?.id || selected.formulaId,
      }
      setSelected(nextSelected)
      setLineItems((prev) => prev.map((li) => (li.id === selected.id ? nextSelected : li)))
      if (impactPayload) setImpact(impactPayload)
      setFormulaValid(true)
      setFormulaMessage("No issues")
      toast.success("Formula saved")

      // Refresh dependency graph quietly
      try {
        const gRes = await fpaApi.getDependencyGraph(id, { view: "module" })
        if (gRes.success && gRes.data) {
          setLiveDepGraph(gRes.data)
          const g: Record<string, string[]> = {}
          for (const e of gRes.data.edges || []) {
            const list = g[e.sourceLineItemId] || []
            list.push(e.targetLineItemId)
            g[e.sourceLineItemId] = list
          }
          setDepGraph(g)
          setDepApiMissing(false)
        }
      } catch {
        /* optional */
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${id}/formulas`,
        method: "POST",
        message: errorMessage(err),
        impact: "Cannot save formulas in builder",
        request: { lineItemId: selected.id, expression },
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const runPublish = async () => {
    if (!id || !versionId) {
      toast.error("Select a workspace/version first")
      return
    }
    if (versionLocked) {
      toast.error("This workspace is already locked. Reopen a working copy first.")
      return
    }
    setBusyKey("publish")
    try {
      const res = await fpaApi.publishVersion(versionId, { notes: "Published from Model Builder" })
      if (!res.success) throw new Error(res.message || "Publish blocked")
      const data = res.data
      setValidation((prev) => ({
        ...prev,
        valid: true,
        lastPublishedAt: data?.publishedAt || new Date().toISOString(),
        lastPublishedBy: data?.publishedByName || data?.publishedBy || null,
      }))
      if (model) {
        setModel({
          ...model,
          status: "PUBLISHED" as typeof model.status,
          publishedAt: data?.publishedAt,
          publishedByName: data?.publishedByName,
        })
      }

      // Publish locks the snapshot; switch Builder to the new DRAFT working copy
      const nextWorkingId =
        data?.workingCopyVersionId ||
        data?.workingCopy?.id ||
        null
      if (nextWorkingId && id) {
        await dispatch(fetchFpaModels())
        await dispatch(bootstrapFpaSelection(id))
        dispatch(setSelectedVersionId(nextWorkingId))
        syncUrl(id, nextWorkingId, viewMode)
        toast.success("Published — switched to new working copy")
        await load()
      } else {
        toast.success("Model published")
        toast.message("No working copy returned — use Reopen workspace to edit")
      }
      void loadAudit()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const loadAudit = async () => {
    if (!id) return
    try {
      const res = await fpaApi.getModelAudit(id, { limit: 40 })
      if (!res.success || !res.data) return
      const raw = Array.isArray(res.data) ? res.data : res.data.entries || []
      const entries = raw as FpaAuditEntry[]
      setRawAuditEntries(entries)
      setAuditEntries(
        entries.map((e) => ({
          time: e.at ? new Date(e.at).toLocaleString() : "",
          user: e.userName || e.userId || "User",
          action: e.action,
          details: e.summary || "",
        })),
      )
    } catch {
      /* keep empty */
    }
  }

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const res = await fpaApi.listLineItemTemplates()
      if (res.success) setLineItemTemplates(res.data || [])
      else setLineItemTemplates([])
    } catch {
      setLineItemTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }

  const loadGridValidations = async () => {
    if (!id) return
    try {
      const scen = selectedScenarioId || model?.defaultScenarioId || model?.scenarios?.[0]?.id
      const res = await fpaApi.getGridValidations(id, {
        versionId: versionId || undefined,
        scenarioId: scen || undefined,
      })
      if (!res.success || !res.data) {
        setGridValidations([])
        return
      }
      const data = res.data
      const list = Array.isArray(data)
        ? data
        : data.items || data.errors || []
      setGridValidations(list)
    } catch {
      setGridValidations([])
    }
  }

  const loadValidationSummary = async () => {
    if (!id) return
    try {
      const res = await fpaApi.getValidationSummary(id)
      if (!res.success || !res.data) {
        setValidationSummary(null)
        return
      }
      setValidationSummary({
        total: res.data.total ?? 0,
        passed: res.data.passed ?? 0,
        warnings: res.data.warnings ?? 0,
        errors: res.data.errors ?? 0,
      })
    } catch {
      setValidationSummary(null)
    }
  }

  const applyTemplate = async (templateId: string, templateName: string) => {
    if (!id || !selectedLeaf?.leafId) {
      toast.error("Select a module first")
      return
    }
    if (versionLocked) {
      toast.error("Workspace is locked — reopen a working copy first")
      return
    }
    setBusyKey("template")
    try {
      const res = await fpaApi.applyLineItemTemplate(id, selectedLeaf.leafId, { templateId })
      if (!res.success) throw new Error(res.message || "Apply template failed")
      const created = res.data?.lineItems || []
      if (created.length) {
        setLineItems((prev) => {
          const ids = new Set(prev.map((x) => x.id))
          return [...prev, ...created.filter((x) => !ids.has(x.id))]
        })
        selectLineItem(created[0])
      } else {
        await load()
      }
      setCentreTab("items")
      toast.success(`Applied “${templateName}”`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const centreValidationRows = useMemo(() => {
    const rows: Array<{
      id: string
      severity: "ok" | "warn" | "error"
      rule: string
      detail: string
      lineItemId?: string | null
    }> = []
    for (const [i, e] of errors.entries()) {
      rows.push({
        id: `err-${e.code}-${i}`,
        severity: "error",
        rule: e.code || e.field || "Error",
        detail: e.message,
        lineItemId: e.lineItemId,
      })
    }
    for (const [i, e] of warnings.entries()) {
      rows.push({
        id: `warn-${e.code}-${i}`,
        severity: "warn",
        rule: e.code || e.field || "Warning",
        detail: e.message,
        lineItemId: e.lineItemId,
      })
    }
    for (const [i, e] of info.entries()) {
      rows.push({
        id: `info-${e.code}-${i}`,
        severity: "ok",
        rule: e.code || e.field || "Info",
        detail: e.message,
        lineItemId: e.lineItemId,
      })
    }
    for (const [i, v] of gridValidations.entries()) {
      const sev = String(v.severity || "").toUpperCase()
      rows.push({
        id: `grid-${v.code || "v"}-${i}`,
        severity: sev === "ERROR" ? "error" : sev === "WARNING" || sev === "WARN" ? "warn" : "ok",
        rule: v.code || v.field || "Grid check",
        detail: v.message,
        lineItemId: v.lineItemId,
      })
    }
    if (!rows.length && validation.valid === true) {
      rows.push({
        id: "passed",
        severity: "ok",
        rule: "Model validation",
        detail: "Last validate passed with no issues",
      })
    }
    return rows
  }, [errors, warnings, info, gridValidations, validation.valid])

  const centreHistoryRows = useMemo(
    () =>
      rawAuditEntries.map((e, i) => ({
        id: e.id || `h-${i}`,
        action: e.action || "Change",
        target: e.entityType || e.entityId || "Model",
        detail: e.summary || "",
        user: e.userName || e.userId || "User",
        when: e.at ? new Date(e.at).toLocaleString() : "",
      })),
    [rawAuditEntries],
  )

  const refreshModules = async () => {
    if (!id) return
    try {
      const res = await fpaApi.listModules(id)
      if (res.success) setApiModules(res.data || [])
    } catch {
      /* ignore */
    }
  }

  const handleCreateModule = () => {
    if (!id) return
    setModuleDialog({ mode: "create", parentModuleId: null, parentName: null })
  }

  const handleAddChildModule = (parentModuleId: string, parentName: string) => {
    if (!id) return
    setModuleDialog({ mode: "create", parentModuleId, parentName })
  }

  const handleRenameModule = (moduleId: string, currentName: string) => {
    setModuleDialog({ mode: "rename", moduleId, currentName })
  }

  const submitModuleName = async (name: string) => {
    if (!id || !moduleDialog) return
    setModuleDialogBusy(true)
    try {
      if (moduleDialog.mode === "create") {
        const parentId = moduleDialog.parentModuleId || null
        const res = await fpaApi.createModule(id, {
          name,
          parentModuleId: parentId,
        })
        if (!res.success || !res.data) throw new Error(res.message || "Create failed")
        toast.success(parentId ? "Submodule created" : "Module created")
        await refreshModules()
        const m = res.data
        const parent = parentId
          ? apiModules.find((x) => x.id === parentId) ||
            (await fpaApi.listModules(id)).data?.find((x) => x.id === parentId)
          : null
        setSelectedLeaf({
          folderId: parentId || m.id,
          folderName: parent?.name || moduleDialog.parentName || m.name,
          leafId: m.id,
          leafName: m.name,
        })
        setSelected(null)
        setExpression("")
      } else {
        const { moduleId, currentName } = moduleDialog
        if (name === currentName) {
          setModuleDialog(null)
          return
        }
        const res = await fpaApi.updateModule(moduleId, { name })
        if (!res.success) throw new Error(res.message || "Rename failed")
        toast.success("Module renamed")
        await refreshModules()
        if (selectedLeaf?.leafId === moduleId) {
          setSelectedLeaf({ ...selectedLeaf, leafName: name })
        }
      }
      setModuleDialog(null)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setModuleDialogBusy(false)
    }
  }

  const handleDuplicateModule = async (moduleId: string) => {
    try {
      const res = await fpaApi.duplicateModule(moduleId)
      if (!res.success) throw new Error(res.message || "Duplicate failed")
      toast.success("Module duplicated")
      await refreshModules()
      const items = await fpaApi.listLineItems(id!)
      if (items.success) setLineItems(items.data || [])
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleDeleteModule = (moduleId: string) => {
    setDeleteModuleId(moduleId)
  }

  const confirmDeleteModule = async () => {
    if (!deleteModuleId) return
    setModuleDialogBusy(true)
    try {
      let res = await fpaApi.deleteModule(deleteModuleId)
      if (!res.success) {
        res = await fpaApi.deleteModule(deleteModuleId, { cascade: true })
      }
      if (!res.success) throw new Error(res.message || "Delete failed")
      toast.success("Module deleted")
      setDeleteModuleId(null)
      await refreshModules()
      const items = id ? await fpaApi.listLineItems(id) : null
      if (items?.success) setLineItems(items.data || [])
      if (selectedLeaf?.leafId === deleteModuleId) {
        setSelectedLeaf(null)
        setSelected(null)
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setModuleDialogBusy(false)
    }
  }

  const persistLineItemProperties = async (patch: {
    name?: string
    description?: string
    format?: string
    currency?: string | null
    displayScale?: number
    summaryMethod?: string
  }) => {
    if (!selected || selected.id.startsWith("demo-")) return
    try {
      const res = await fpaApi.updateLineItem(selected.id, patch)
      if (!res.success || !res.data) throw new Error(res.message || "Update failed")
      setSelected(res.data)
      setLineItems((prev) => prev.map((li) => (li.id === res.data!.id ? res.data! : li)))
      toast.success("Properties saved")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const commitGridCell = async (lineItemId: string, periodIndex: number, value: number) => {
    if (!id || !versionId) {
      toast.error("Select a workspace/version first")
      return
    }
    if (versionLocked) {
      toast.error("This workspace is locked. Reopen a working copy to edit values.")
      return
    }
    const periodDate = periodKeys[periodIndex]
    if (!periodDate) {
      toast.error("Period not available")
      return
    }
    const li = lineItems.find((x) => x.id === lineItemId)
    if (li && lineItemKind(li) === "CALCULATED") {
      toast.error("Calculated cells cannot be edited")
      return
    }
    const scen = selectedScenarioId || model?.defaultScenarioId || model?.scenarios?.[0]?.id
    if (!scen) {
      toast.error("No scenario available for this model")
      return
    }
    // Optimistic UI
    setPreviewByLine((prev) => {
      const row = [...(prev[lineItemId] || periodKeys.map(() => null))]
      row[periodIndex] = value
      return { ...prev, [lineItemId]: row }
    })
    try {
      const res = await fpaApi.updateGridCells(id, {
        versionId,
        scenarioId: scen,
        updates: [{ lineItemId, periodDate, value }],
      })
      if (!res.success) throw new Error(res.message || "Cell update failed")
      toast.success("Value saved")
    } catch (err) {
      const msg = errorMessage(err)
      toast.error(msg)
      if (/locked/i.test(msg)) {
        toast.message("Use Reopen workspace to create an editable draft copy")
      }
      // reload grid preview
      try {
        const grid = await fpaApi.getGrid(id, {
          versionId,
          scenarioId: scen,
          pageSize: 500,
        })
        if (grid.success && grid.data) {
          const byLine: Record<string, Array<number | null>> = {}
          for (const row of grid.data.lineItems || lineItems) {
            byLine[row.id] = periodKeys.map((iso) => {
              const cell = grid.data!.cells.find(
                (c) =>
                  c.lineItemId === row.id &&
                  (c.periodDate === iso || c.periodDate?.startsWith(iso)),
              )
              return cell ? asNumber(cell.value) : null
            })
          }
          setPreviewByLine(byLine)
        }
      } catch {
        /* ignore */
      }
    }
  }

  const reopenWorkspace = async () => {
    if (!versionId || !id) return
    setBusyKey("reopen")
    try {
      const res = await fpaApi.requestReopenVersion(versionId, {
        reason: "Continue Model Builder edits",
      })
      if (!res.success || !res.data) throw new Error(res.message || "Reopen failed")
      const data = res.data as {
        workingCopyVersionId?: string
        version?: FpaVersion
        sourceVersionId?: string
      }
      const nextId = data.workingCopyVersionId || data.version?.id
      if (!nextId) throw new Error("No working copy returned")
      await dispatch(fetchFpaModels())
      await dispatch(bootstrapFpaSelection(id))
      dispatch(setSelectedVersionId(nextId))
      syncUrl(id, nextId, viewMode)
      toast.success("Editable working copy created")
      await load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  useEffect(() => {
    if (historyOpen || centreTab === "history" || viewMode === "detailed") void loadAudit()
    if (centreTab === "templates") void loadTemplates()
    if (centreTab === "validations" || viewMode === "detailed") void loadGridValidations()
    if (viewMode === "detailed") void loadValidationSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, centreTab, id, versionId, viewMode])

  const detailedAuditRows = useMemo(
    () => buildAuditUiRows(rawAuditEntries),
    [rawAuditEntries],
  )

  const detailedExceptionRows = useMemo(
    () => buildExceptionRows(errors, warnings, info, gridValidations, lineItems),
    [errors, warnings, info, gridValidations, lineItems],
  )

  const detailedValidationSummary = useMemo(
    () => validationSummaryFromCounts(validationSummary, detailedExceptionRows),
    [validationSummary, detailedExceptionRows],
  )

  const detailedValidationChecks = useMemo(
    () => buildValidationChecks(errors, warnings, info, gridValidations, lineItems),
    [errors, warnings, info, gridValidations, lineItems],
  )

  const formulaImpact = useMemo(() => {
    const data = impact as {
      precedents?: Array<{ id: string; code: string; name: string }>
      dependents?: Array<{ id: string; code: string; name: string }>
    } | null
    if (!data?.precedents?.length && !data?.dependents?.length) return null
    return data
  }, [impact])

  const dimTags = useMemo(() => {
    // Match A.3 inspector chrome; merge API names when present
    const design = ["Time", "Product", "Region", "Customer Segment", "Version"]
    if (!dimensions.length) return design
    const fromApi = dimensions.map((d) => d.name).filter(Boolean)
    const merged = [...design]
    for (const n of fromApi) {
      if (!merged.some((x) => x.toLowerCase() === n.toLowerCase())) merged.push(n)
    }
    return merged.slice(0, 5)
  }, [dimensions])

  const allModelsLink = (
    <Link
      href="/forecasting/model-builder"
      className="h-9 inline-flex items-center gap-1 text-[13px] font-medium text-[#2563eb] hover:underline"
    >
      <ChevronLeft className="w-4 h-4" /> All models
    </Link>
  )

  if (!canConfigureBuilder) {
    return (
      <div className="min-h-full bg-[#f8fafc]">
        <FpaPageHeader
          title="Model Builder"
          hideFilters
          searchPlaceholder="Search line items, modules, dimensions..."
          actions={allModelsLink}
        />
        <div className="p-8 max-w-lg mx-auto text-center space-y-2">
          <p className="text-sm font-semibold text-[#0f172a]">
            You don&apos;t have access to Model Builder
          </p>
          <p className="text-xs text-[#64748b]">
            Model Builder is for FP&A admins. Use Model Planning to enter assumptions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fpa-thin-scroll flex flex-col h-[calc(100vh-5rem)] min-h-0 overflow-hidden bg-white">
      <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-[#e2e8f0] bg-white">
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-base font-semibold text-[#0f172a]">Model Builder</h1>
          <Star className="w-4 h-4 text-[#cbd5e1]" />
        </div>
        <div className="flex-1" />
        {allModelsLink}
      </div>

      {!id ? (
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="text-center max-w-md">
            <p className="text-sm font-medium text-[#0f172a]">No model selected</p>
            <p className="text-xs text-[#64748b] mt-1">
              Open a model from the list, or create a new one.
            </p>
            <Link
              href="/forecasting/model-builder"
              className="inline-flex mt-4 h-9 items-center rounded-full bg-[#2563eb] px-4 text-xs text-white"
            >
              All models
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-[#64748b]">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading model…
        </div>
      ) : (
        <>
          {viewMode === "structure" ? (
            <BuilderHeader
              models={models.length ? models : model ? [model] : []}
              modelId={id}
              versions={modelVersions}
              versionId={versionId}
              validation={validation}
              busyKey={busyKey}
              canConfigure={canConfigureBuilder}
              versionLocked={versionLocked}
              onReopenWorkspace={() => void reopenWorkspace()}
              hardcodeChrome={false}
              onModelChange={(mid) => {
                dispatch(setSelectedModelId(mid))
                dispatch(setSelectedVersionId(null))
                syncUrl(mid, null, viewMode)
              }}
              onVersionChange={(vid) => {
                dispatch(setSelectedVersionId(vid))
                if (id) {
                  const sp = new URLSearchParams()
                  sp.set("versionId", vid)
                  router.replace(`/forecasting/model-builder/${id}?${sp.toString()}`)
                }
              }}
              onValidate={() => void runValidateModel()}
              onTestCalc={() => void runTestCalc()}
              onChangeHistory={() => setHistoryOpen(true)}
              onPublish={() => void runPublish()}
            />
          ) : null}

          {viewMode === "detailed" ? (
            <BuilderDetailedWorkspace
              model={model}
              leaf={selectedLeaf}
              validation={validation}
              canEdit={canConfigureBuilder}
              onBack={backToStructure}
              onOpenHistory={() => setHistoryOpen(true)}
              onTestCalc={() => void runTestCalc()}
              onLeafChange={(leaf) => {
                setSelectedLeaf(leaf)
                const matchItems = lineItems.filter((li) => li.moduleId === leaf.leafId)
                if (matchItems[0]) {
                  selectLineItem(matchItems[0])
                  return
                }
                const match = modules.find(
                  (m) =>
                    m.label.toLowerCase().includes(leaf.folderName.split(" ")[0].toLowerCase()) ||
                    m.key.toLowerCase().includes(leaf.folderId.split("-")[0]),
                )
                if (match) selectModule(match.key)
              }}
              lineItems={scopedItems}
              apiModules={apiModules}
              periodLabels={periodLabels}
              periodKeys={periodKeys}
              previewByLine={previewByLine}
              selectedLineItemId={selected?.id || null}
              auditRows={detailedAuditRows}
              exceptionRows={detailedExceptionRows}
              validationSummary={detailedValidationSummary}
              validationChecks={detailedValidationChecks}
              formulaImpact={formulaImpact}
              onCellCommit={
                canEditLive
                  ? (liId, periodIndex, value) => void commitGridCell(liId, periodIndex, value)
                  : undefined
              }
              onValidate={() => void runValidateModel()}
              onSelectRow={(row) => {
                const li = lineItems.find((x) => x.id === row.id)
                if (li) {
                  selectLineItem(li)
                  setExpression(row.formula)
                  return
                }
                setSelected({
                  id: row.id,
                  modelId: id || "",
                  code: row.id.toUpperCase().replace(/-/g, "_"),
                  name: row.name,
                  lineItemType: row.kind === "CALCULATED" ? "CALC" : "REVENUE",
                  category: selectedLeaf?.folderName || "General",
                  isEditable: row.kind === "INPUT",
                  formulas:
                    row.kind === "CALCULATED" && row.formula
                      ? [{ id: `fx-${row.id}`, expression: row.formula }]
                      : [],
                })
                setExpression(row.formula === "Input" ? "" : row.formula)
              }}
            />
          ) : (
          <>
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            {/* Left: Modules + Dimensions */}
            <aside className="w-full lg:w-[240px] xl:w-[260px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#e2e8f0] bg-[#f8fafc] flex flex-col min-h-0 max-h-[45vh] lg:max-h-none p-3 gap-3 overflow-hidden">
              <BuilderModulesTree
                modules={modules}
                selectedModuleKey={activeModule?.key || null}
                selectedLineItemId={selected?.id || null}
                onSelectModule={selectModule}
                onSelectLineItem={selectLineItem}
                canCreateModule={canConfigureBuilder && !versionLocked}
                onCreateModuleClick={() => handleCreateModule()}
                useHardcoded={structureHardcoded}
                apiModules={apiModules}
                selectedLeaf={selectedLeaf}
                onSelectLeaf={(leaf) => {
                  setSelectedLeaf(leaf)
                  const matchItems = lineItems.filter((li) => li.moduleId === leaf.leafId)
                  if (matchItems[0]) {
                    selectLineItem(matchItems[0])
                    return
                  }
                  setSelected(null)
                  setExpression("")
                }}
                onOpenWorkspace={(leaf) => openDetailedWorkspace(leaf)}
                onRenameModule={(mid, name) => handleRenameModule(mid, name)}
                onDuplicateModule={(mid) => void handleDuplicateModule(mid)}
                onDeleteModule={(mid) => handleDeleteModule(mid)}
                onAddChildModule={handleAddChildModule}
              />
              <BuilderDimensionsPanel
                dimensions={dimensions}
                modelDimensionKeys={modelDimKeys}
                useHardcoded={false}
                onAttachClick={() => setDimsAttachOpen(true)}
              />
            </aside>

            {/* Center: Line grid + Dependency map (spaced cards) */}
            <main className="flex-1 min-w-0 min-h-0 flex flex-col gap-3 p-3 bg-[#f8fafc] border-b lg:border-b-0 overflow-y-auto fpa-thin-scroll">
              <div className="flex-[1.2] min-h-[280px] flex flex-col overflow-hidden">
                <BuilderLineItemGrid
                  module={activeModule}
                  leafId={selectedLeaf?.leafId || null}
                  pathOverride={
                    selectedLeaf
                      ? { parent: selectedLeaf.folderName, leaf: selectedLeaf.leafName }
                      : null
                  }
                  items={scopedItems}
                  selectedId={selected?.id || null}
                  periodLabels={periodLabels}
                  periodKeys={periodKeys}
                  previewByLine={previewByLine}
                  canEdit={canEditLive}
                  useHardcoded={gridHardcoded}
                  demoCreate={null}
                  demoFormulaPatch={null}
                  onSelect={selectLineItem}
                  onDemoSelect={undefined}
                  onCellCommit={
                    canEditLive
                      ? (liId, periodIndex, value) => void commitGridCell(liId, periodIndex, value)
                      : undefined
                  }
                  onAddLineItem={() => {
                    if (versionLocked) {
                      toast.error("Workspace is locked — reopen a working copy first")
                      return
                    }
                    setCreateOpen(true)
                  }}
                  centreTab={centreTab}
                  onCentreTab={(t) => {
                    setCentreTab(t)
                    if (t === "history") setHistoryOpen(false)
                  }}
                  currency={model?.baseCurrency || "USD"}
                  onOpenDetailedWorkspace={() => openDetailedWorkspace(selectedLeaf)}
                  templates={lineItemTemplates}
                  templatesLoading={templatesLoading || busyKey === "template"}
                  onApplyTemplate={(tid, name) => void applyTemplate(tid, name)}
                  validationRows={centreValidationRows}
                  historyRows={centreHistoryRows}
                  onFocusValidation={(lineItemId) => {
                    if (!lineItemId) return
                    const li = lineItems.find((x) => x.id === lineItemId)
                    if (li) {
                      selectLineItem(li)
                      setCentreTab("items")
                    }
                  }}
                />
              </div>
              <div className="shrink-0 h-[500px] min-h-[500px] w-full overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col">
                <BuilderDependencyMap
                  graph={depGraph}
                  liveGraph={liveDepGraph}
                  circular={validation.circular}
                  circularPath={validation.circularPath}
                  showLineItems={showLineItemsOnMap}
                  onToggleLineItems={setShowLineItemsOnMap}
                  apiMissing={depApiMissing && !liveDepGraph}
                  activeModuleLabel={selectedLeaf?.leafName || activeModule?.label || null}
                  activeModuleId={selectedLeaf?.leafId || null}
                  selectedItemName={selected?.name || null}
                  fallbackModules={mapFallbackModules}
                  onSelectModule={(moduleId, moduleLabel) => {
                    const folders = apiModulesToFolders(apiModules)
                    for (const folder of folders) {
                      const child = folder.children.find(
                        (c) => c.id === moduleId || c.name === moduleLabel,
                      )
                      if (child) {
                        const leaf = {
                          folderId: folder.id,
                          folderName: folder.name,
                          leafId: child.id,
                          leafName: child.name,
                        }
                        setSelectedLeaf(leaf)
                        const matchItems = lineItems.filter((li) => li.moduleId === child.id)
                        if (matchItems[0]) selectLineItem(matchItems[0])
                        else {
                          setSelected(null)
                          setExpression("")
                        }
                        return
                      }
                    }
                    const mod = apiModules.find((m) => m.id === moduleId || m.name === moduleLabel)
                    if (mod) {
                      setSelectedLeaf({
                        folderId: mod.id,
                        folderName: mod.name,
                        leafId: mod.id,
                        leafName: mod.name,
                      })
                      const matchItems = lineItems.filter((li) => li.moduleId === mod.id)
                      if (matchItems[0]) selectLineItem(matchItems[0])
                      else {
                        setSelected(null)
                        setExpression("")
                      }
                    }
                  }}
                  onSelectNode={(code) => {
                    const li = lineItems.find((x) => x.code === code || x.name === code)
                    if (li) selectLineItem(li)
                  }}
                />
              </div>
            </main>

            {/* Right: Properties inspector */}
            <div className="w-full lg:w-[300px] xl:w-[320px] shrink-0 min-h-[280px] lg:min-h-0 p-3 lg:pl-0">
              <BuilderInspector
                selected={selected}
                expression={expression}
                onExpressionChange={setExpression}
                canEdit={canEditLive}
                busy={busyKey === "save"}
                formulaValid={formulaValid}
                formulaMessage={formulaMessage}
                impact={impact}
                dimensionTags={dimTags}
                modulePath={
                  selectedLeaf
                    ? `${selectedLeaf.folderName} / ${selectedLeaf.leafName}`
                    : activeModule?.label || null
                }
                onValidateFormula={() => void validateFormula()}
                onSaveFormula={() => void saveFormula()}
                onPersistProperties={(patch) => void persistLineItemProperties(patch)}
                  onSelectReference={(name) => {
                  const li = lineItems.find((x) => x.name === name || x.code === name)
                  if (li) selectLineItem(li)
                }}
              />
            </div>
          </div>

          <BuilderExceptionsPanel
            open={showValidationModal}
            onClose={() => setShowValidationModal(false)}
            title={
              errors.length === 0 && warnings.length === 0
                ? "Validation passed"
                : "Validation results"
            }
            errors={errors}
            warnings={warnings}
            info={info}
            onFocus={(code) => {
              const li = lineItems.find(
                (x) => x.code === code || x.id === code || x.name === code,
              )
              if (li) selectLineItem(li)
            }}
          />
          </>
          )}
        </>
      )}

      <BuilderModuleNameDialog
        open={Boolean(moduleDialog)}
        mode={moduleDialog?.mode === "rename" ? "rename" : "create"}
        initialName={moduleDialog?.mode === "rename" ? moduleDialog.currentName : ""}
        parentName={moduleDialog?.mode === "create" ? moduleDialog.parentName : null}
        busy={moduleDialogBusy}
        onClose={() => {
          if (!moduleDialogBusy) setModuleDialog(null)
        }}
        onSubmit={submitModuleName}
      />

      <BuilderConfirmDialog
        open={Boolean(deleteModuleId)}
        title="Delete module"
        message="Delete this module? If it has line items, they will be removed as well."
        confirmLabel="Delete"
        busy={moduleDialogBusy}
        onClose={() => {
          if (!moduleDialogBusy) setDeleteModuleId(null)
        }}
        onConfirm={confirmDeleteModule}
      />

      <BuilderAttachDimensionsDialog
        open={dimsAttachOpen}
        catalog={dimensions}
        attachedKeys={modelDimKeys}
        busy={moduleDialogBusy}
        onClose={() => {
          if (!moduleDialogBusy) setDimsAttachOpen(false)
        }}
        onSave={async (body) => {
          if (!id) return
          setModuleDialogBusy(true)
          try {
            const res = await fpaApi.putModelDimensions(id, { dimensions: body })
            if (!res.success) throw new Error(res.message || "Attach failed")
            setModelDimKeys((res.data?.dimensions || []).map((d) => d.key))
            toast.success("Dimensions updated")
            setDimsAttachOpen(false)
          } catch (err) {
            toast.error(errorMessage(err))
          } finally {
            setModuleDialogBusy(false)
          }
        }}
      />

      <CreateLineItemDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultCategory={selectedLeaf?.leafName || activeModule?.key || "General"}
        onCreate={async (body) => {
          if (!id) throw new Error("No model selected")
          const res = await fpaApi.createLineItem(id, {
            ...body,
            moduleId: selectedLeaf?.leafId || undefined,
          })
          if (!res.success || !res.data) throw new Error(res.message || "Create failed")
          setLineItems((prev) => {
            if (prev.some((x) => x.id === res.data!.id || x.code === res.data!.code)) return prev
            return [...prev, res.data!]
          })
          setSelected(res.data)
          setExpression(res.data.formulas?.[0]?.expression || "")
          setCentreTab("items")
          toast.success("Line item added")
        }}
      />

      <BuilderAuditDrawer
        entries={auditEntries}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  )
}
