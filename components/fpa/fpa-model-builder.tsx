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
import { CreateDataMappingDialog, MAPPING_SOURCE_SYSTEMS } from "./builder/create-data-mapping-dialog"
import { BuilderModelSettingsDialog } from "./builder/builder-model-settings-dialog"
import { ImportSourceFileDialog } from "./builder/import-source-file-dialog"
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
  type FpaDataMappingsResponse,
  type FpaDependencyGraph,
  type FpaDimension,
  type FpaExceptionsResponse,
  type FpaFormula,
  type FpaFormulaMutationResult,
  type FpaGridValidation,
  type FpaLineItem,
  type FpaLineItemTemplate,
  type FpaModel,
  type FpaSensitivityAnalysis,
  type FpaSetupError,
  type FpaValidationChecksResponse,
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
  buildExceptionRowsFromFeed,
  buildMappingUiRows,
  buildSensitivityView,
  buildTraceViewFromApi,
  buildCellMetaFromDetail,
  buildValidationChecks,
  buildValidationChecksFromCatalog,
  inferSuggestedMappingsFromLineItems,
  mappingSummaryPct,
  validationSummaryFromCounts,
  type DetailedCellMeta,
  type DetailedTraceView,
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
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [mappingDialogTargetId, setMappingDialogTargetId] = useState<string | null>(null)
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false)
  const [importSourceOpen, setImportSourceOpen] = useState(false)
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
  const [dataMappings, setDataMappings] = useState<FpaDataMappingsResponse | null>(null)
  const [mappingsInferred, setMappingsInferred] = useState(false)
  const [exceptionsFeed, setExceptionsFeed] = useState<FpaExceptionsResponse | null>(null)
  const [sensitivity, setSensitivity] = useState<FpaSensitivityAnalysis | null>(null)
  const [fyTotals, setFyTotals] = useState<Record<string, number> | null>(null)
  const [validationChecksApi, setValidationChecksApi] =
    useState<FpaValidationChecksResponse | null>(null)
  const [gridGrain, setGridGrain] = useState<"monthly" | "quarterly" | "annual">("monthly")
  /** lineItemId → cell id per period index (for Formula Trace) */
  const [cellIdsByLine, setCellIdsByLine] = useState<Record<string, Array<string | null>>>({})
  const [cellMeta, setCellMeta] = useState<DetailedCellMeta | null>(null)
  const [cellTrace, setCellTrace] = useState<DetailedTraceView | null>(null)
  const [mappingEditInitial, setMappingEditInitial] = useState<{
    id: string
    sourceSystem: string
    sourceField: string
    targetLineItemId: string
    status: "MAPPED" | "UNMAPPED" | "SUGGESTED" | "TYPE_MISMATCH" | "STALE"
    notes?: string
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
  const versionStatusU = String(activeVersion?.status || "").toUpperCase()
  const versionLocked = versionStatusU === "LOCKED" || versionStatusU === "PUBLISHED"
  const modelPublished = String(model?.status || "").toUpperCase() === "PUBLISHED"
  /** Do not allow Publish when the model or selected version is already published/locked. */
  const publishDisabled = versionLocked || modelPublished
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
        // Soft setup issues (scope/coa on draft) arrive as warnings — do not block "Validated"
        valid: errs.length === 0,
        errorCount: errs.length,
        warningCount: warns.length,
        circular,
        circularPath,
      }))
      setShowValidationModal(true)
      void loadValidationSummary()
      void loadValidationChecks()
      void loadGridValidations()
      void loadExceptionsFeed()
      toast.success(
        errs.length === 0
          ? warns.length
            ? `Validated with ${warns.length} warning(s)`
            : "Model validation passed"
          : `Validation found ${errs.length} error(s)`,
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
            moduleId: selectedLeaf?.leafId || undefined,
            grain: viewMode === "detailed" ? gridGrain : undefined,
            pageSize: 500,
          })
        ).data

      if (grid) {
        applyGridPayload(grid, lineItems)
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

  const saveFormulaForLineItem = async (lineItemId: string, nextExpression: string) => {
    if (!id) return
    const target = lineItems.find((x) => x.id === lineItemId) || selected
    if (!target || target.id !== lineItemId) {
      toast.error("Line item not found")
      return
    }
    if (lineItemKind(target) === "INPUT") {
      toast.error("INPUT rows do not use formulas")
      return
    }
    setBusyKey("save")
    setExpression(nextExpression)
    try {
      const dep = await fpaApi.dependencyCheck({
        modelId: id,
        formulaId: target.formulas?.[0]?.id,
        dependsOnLineItemCodes:
          nextExpression.match(/\[([^\]]+)\]/g)?.map((s) => s.slice(1, -1)) || [],
        lineCodes: [target.code],
      })
      if (dep.success && dep.data?.circular) {
        toast.error(
          `Circular reference: ${(dep.data.path || []).join(" → ") || "detected"}`,
        )
        return
      }

      const existing = target.formulas?.[0]
      let savedFx: FpaFormula | undefined = existing
      let impactPayload: unknown = null
      if (existing?.id) {
        const res = await fpaApi.updateFormula(existing.id, {
          expression: nextExpression,
          lineItemId: target.id,
        })
        if (!res.success) throw new Error(res.message)
        const data = res.data as FpaFormula | FpaFormulaMutationResult | undefined
        if (data && "formula" in data && data.formula) {
          savedFx = data.formula
          impactPayload = data.impact || null
        } else {
          savedFx = (data as FpaFormula) || { ...existing, expression: nextExpression }
        }
      } else {
        const res = await fpaApi.createFormula(id, {
          lineItemId: target.id,
          expression: nextExpression,
        })
        if (!res.success) throw new Error(res.message)
        const data = res.data as FpaFormula | FpaFormulaMutationResult | undefined
        if (data && "formula" in data && data.formula) {
          savedFx = data.formula
          impactPayload = data.impact || null
        } else {
          savedFx = (data as FpaFormula) || {
            id: `tmp-${Date.now()}`,
            expression: nextExpression,
            lineItemId: target.id,
          }
        }
      }

      const nextSelected: FpaLineItem = {
        ...target,
        formulas: [{ ...(savedFx as FpaFormula), expression: nextExpression }],
        formulaId: savedFx?.id || target.formulaId,
      }
      setSelected(nextSelected)
      setLineItems((prev) => prev.map((li) => (li.id === target.id ? nextSelected : li)))
      if (impactPayload) setImpact(impactPayload)
      setFormulaValid(true)
      setFormulaMessage("No issues")
      toast.success("Formula saved")
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${id}/formulas`,
        method: "POST",
        message: errorMessage(err),
        impact: "Cannot save formulas from Detailed workspace",
        request: { lineItemId, expression: nextExpression },
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const saveFormula = async () => {
    if (!id || !selected) return
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
    await saveFormulaForLineItem(selected.id, expression)
  }

  const runPublish = async () => {
    if (!id || !versionId) {
      toast.error("Select a workspace/version first")
      return
    }
    if (publishDisabled) {
      toast.error(
        modelPublished
          ? "This model is already published. Open a draft model to publish."
          : "This workspace is already published/locked. Reopen a working copy first.",
      )
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
      const msg = errorMessage(err)
      if (/scope|coa|chart of accounts|409/i.test(msg)) {
        toast.error(msg, {
          description:
            "Publish still requires bound scope + COA. Open Structure setup or rely on seed-defaults for empty drafts.",
        })
      } else {
        toast.error(msg)
      }
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

  const loadValidationChecks = async () => {
    if (!id) return
    try {
      const res = await fpaApi.getValidationChecks(id)
      if (res.success && res.data) {
        setValidationChecksApi(res.data)
        if (res.data.summary) {
          setValidationSummary({
            total: res.data.summary.total ?? 0,
            passed: res.data.summary.passed ?? 0,
            warnings: res.data.summary.warnings ?? 0,
            errors: res.data.summary.errors ?? 0,
          })
        }
      } else {
        setValidationChecksApi(null)
      }
    } catch {
      setValidationChecksApi(null)
    }
  }

  const applyGridPayload = (
    grid: {
      periods?: Array<{
        label?: string
        periodDate?: string
        key?: string
        readOnly?: boolean
      }>
      lineItems?: FpaLineItem[]
      cells: Array<{ id?: string; lineItemId: string; periodDate?: string; value?: unknown }>
      fyTotals?: Record<string, number>
    },
    itemsFallback: FpaLineItem[],
  ) => {
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
    setPeriodLabels(periods)
    const periodIsos = (grid.periods || [])
      .map((p) => p.periodDate || p.key || "")
      .filter(Boolean)
    setPeriodKeys(periodIsos)
    const byLine: Record<string, Array<number | null>> = {}
    const byCell: Record<string, Array<string | null>> = {}
    for (const li of grid.lineItems || itemsFallback) {
      byLine[li.id] = periodIsos.map((iso) => {
        const cell = grid.cells.find(
          (c) => c.lineItemId === li.id && (c.periodDate === iso || c.periodDate?.startsWith(iso)),
        )
        return cell ? asNumber(cell.value) : null
      })
      byCell[li.id] = periodIsos.map((iso) => {
        const cell = grid.cells.find(
          (c) => c.lineItemId === li.id && (c.periodDate === iso || c.periodDate?.startsWith(iso)),
        )
        return cell?.id || null
      })
    }
    setPreviewByLine(byLine)
    setCellIdsByLine(byCell)
    setFyTotals(grid.fyTotals || null)
  }

  const loadDetailedGrid = async (opts?: {
    grain?: "monthly" | "quarterly" | "annual"
    seedIfSparse?: boolean
  }) => {
    if (!id || !versionId) return
    const scen = selectedScenarioId || model?.defaultScenarioId || model?.scenarios?.[0]?.id
    const grain = opts?.grain || gridGrain
    const moduleId = selectedLeaf?.leafId || undefined

    if (opts?.seedIfSparse !== false && !versionLocked && scen) {
      try {
        await fpaApi.seedVersionCells(versionId, {
          scenarioId: scen,
          fillMissing: true,
        })
      } catch {
        /* seed is best-effort */
      }
    }

    try {
      const grid = await fpaApi.getGrid(id, {
        versionId,
        scenarioId: scen || undefined,
        moduleId,
        grain,
        pageSize: 500,
      })
      if (grid.success && grid.data) {
        applyGridPayload(grid.data, lineItems)
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${id}/grid`,
        method: "GET",
        message: errorMessage(err),
        impact: "Detailed grid empty",
        response: err,
      })
    }
  }

  const loadDataMappings = async () => {
    if (!id) return
    const moduleId = selectedLeaf?.leafId || undefined
    try {
      const res = await fpaApi.getDataMappings(id, {
        moduleId,
        limit: 200,
      })
      const apiData =
        res.success && res.data
          ? res.data
          : ({ summary: { total: 0, mapped: 0, pct: 0 }, entries: [] } as FpaDataMappingsResponse)

      if ((apiData.entries?.length || 0) > 0) {
        setDataMappings(apiData)
        setMappingsInferred(false)
        return
      }

      // Backend catalog empty (common on fresh DRAFT models) — derive from structure.
      const inferred = inferSuggestedMappingsFromLineItems(lineItems, moduleId)
      setDataMappings(inferred)
      setMappingsInferred(inferred.entries.length > 0)
    } catch {
      const inferred = inferSuggestedMappingsFromLineItems(lineItems, moduleId)
      setDataMappings(inferred)
      setMappingsInferred(inferred.entries.length > 0)
    }
  }

  const loadExceptionsFeed = async () => {
    if (!id) return
    try {
      const scen = selectedScenarioId || model?.defaultScenarioId || model?.scenarios?.[0]?.id
      const res = await fpaApi.getExceptions(id, {
        versionId: versionId || undefined,
        scenarioId: scen || undefined,
        moduleId: selectedLeaf?.leafId || undefined,
      })
      if (res.success && res.data) setExceptionsFeed(res.data)
      else setExceptionsFeed(null)
    } catch {
      setExceptionsFeed(null)
    }
  }

  const loadSensitivity = async (opts?: { driverLineItemId?: string; shockPct?: number }) => {
    if (!id || !versionId) {
      setSensitivity(null)
      return
    }
    const scen = selectedScenarioId || model?.defaultScenarioId || model?.scenarios?.[0]?.id
    if (!scen) {
      setSensitivity(null)
      return
    }
    const shockPct = opts?.shockPct ?? 5
    const scoped = selectedLeaf?.leafId
      ? lineItems.filter((li) => li.moduleId === selectedLeaf.leafId)
      : lineItems
    const pool = scoped.length ? scoped : lineItems
    if (!pool.length) {
      setSensitivity(null)
      return
    }

    if (opts?.driverLineItemId) {
      try {
        const res = await fpaApi.runSensitivityAnalysis(id, {
          versionId,
          scenarioId: scen,
          driverLineItemId: opts.driverLineItemId,
          shock: { type: "PERCENT", value: shockPct },
        })
        if (res.success && res.data) {
          setSensitivity(res.data)
          return
        }
        toast.error(res.message || "Sensitivity analysis failed")
      } catch (err) {
        toast.error(errorMessage(err))
      }
      return
    }

    const score = (li: FpaLineItem) => {
      const blob = `${li.code || ""} ${li.name || ""} ${li.lineItemType || ""}`.toUpperCase()
      let s = 0
      if (selected?.id && li.id === selected.id) s += 100
      if (/UNIT|PRICE|ARR|BOOKING|HEADCOUNT|SEAT|VOLUME/.test(blob)) s += 40
      if (lineItemKind(li) === "INPUT") s += 20
      if (li.formulas?.length) s -= 10
      return s
    }

    const candidates = [...pool].sort((a, b) => score(b) - score(a))
    let best: FpaSensitivityAnalysis | null = null

    for (const driver of candidates.slice(0, 8)) {
      try {
        const res = await fpaApi.runSensitivityAnalysis(id, {
          versionId,
          scenarioId: scen,
          driverLineItemId: driver.id,
          shock: { type: "PERCENT", value: shockPct },
        })
        if (!res.success || !res.data) continue
        best = res.data
        if ((res.data.impacts || []).some((x) => Math.abs(x.deltaTotal || 0) > 0)) {
          setSensitivity(res.data)
          return
        }
      } catch {
        /* try next driver */
      }
    }

    setSensitivity(best)
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
    if (viewMode === "detailed") {
      void loadDetailedGrid({ seedIfSparse: true })
      void loadValidationSummary()
      void loadValidationChecks()
      void loadDataMappings()
      void loadExceptionsFeed()
      void runValidateModel()
      void loadSensitivity()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, centreTab, id, versionId, viewMode, selectedLeaf?.leafId, lineItems.length])

  useEffect(() => {
    if (viewMode !== "detailed") return
    void loadSensitivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selected?.id, versionId, selectedScenarioId])

  useEffect(() => {
    if (viewMode !== "detailed" || !id || !selected?.id) {
      setCellMeta(null)
      setCellTrace(null)
      return
    }
    const ids = cellIdsByLine[selected.id] || []
    const cellId = ids.find(Boolean) || null
    if (!cellId) {
      setCellMeta(null)
      setCellTrace(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [detailRes, traceRes] = await Promise.all([
          fpaApi.getCellDetail(id, cellId),
          fpaApi.getCellTrace(id, cellId),
        ])
        if (cancelled) return
        setCellMeta(detailRes.success ? buildCellMetaFromDetail(detailRes.data) : null)
        setCellTrace(traceRes.success ? buildTraceViewFromApi(traceRes.data) : null)
      } catch {
        if (!cancelled) {
          setCellMeta(null)
          setCellTrace(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [viewMode, id, selected?.id, cellIdsByLine])

  const detailedAuditRows = useMemo(
    () => buildAuditUiRows(rawAuditEntries),
    [rawAuditEntries],
  )

  const detailedMappingRows = useMemo(
    () => buildMappingUiRows(dataMappings?.entries || []),
    [dataMappings],
  )

  const detailedMappedPct = useMemo(
    () => mappingSummaryPct(dataMappings?.summary),
    [dataMappings],
  )

  const composedExceptionRows = useMemo(
    () => buildExceptionRows(errors, warnings, info, gridValidations, lineItems),
    [errors, warnings, info, gridValidations, lineItems],
  )

  const feedExceptionRows = useMemo(
    () => buildExceptionRowsFromFeed(exceptionsFeed),
    [exceptionsFeed],
  )

  const detailedExceptionRows = useMemo(() => {
    if (feedExceptionRows.length) return feedExceptionRows
    return composedExceptionRows
  }, [feedExceptionRows, composedExceptionRows])

  const detailedSensitivity = useMemo(() => buildSensitivityView(sensitivity), [sensitivity])

  const detailedValidationSummary = useMemo(() => {
    if (validationChecksApi?.summary) {
      return {
        total: validationChecksApi.summary.total,
        passed: validationChecksApi.summary.passed,
        warnings: validationChecksApi.summary.warnings,
        errors: validationChecksApi.summary.errors,
      }
    }
    return validationSummaryFromCounts(validationSummary, detailedExceptionRows)
  }, [validationChecksApi, validationSummary, detailedExceptionRows])

  const composedValidationChecks = useMemo(
    () => buildValidationChecks(errors, warnings, info, gridValidations, lineItems),
    [errors, warnings, info, gridValidations, lineItems],
  )

  const catalogValidationChecks = useMemo(
    () => buildValidationChecksFromCatalog(validationChecksApi),
    [validationChecksApi],
  )

  const detailedValidationChecks = useMemo(() => {
    if (catalogValidationChecks.length) return catalogValidationChecks
    return composedValidationChecks
  }, [catalogValidationChecks, composedValidationChecks])

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
              publishDisabled={publishDisabled}
              modelPublished={modelPublished}
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
              onOpenModelSettings={() => setModelSettingsOpen(true)}
              onPublish={() => void runPublish()}
            />
          ) : null}

          {viewMode === "detailed" ? (
            <BuilderDetailedWorkspace
              model={model}
              leaf={selectedLeaf}
              validation={validation}
              canEdit={canEditLive}
              publishDisabled={publishDisabled}
              modelPublished={modelPublished}
              onBack={backToStructure}
              onOpenHistory={() => setHistoryOpen(true)}
              onOpenModelSettings={() => setModelSettingsOpen(true)}
              onTestCalc={() => void runTestCalc()}
              onPublish={() => void runPublish()}
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
              fyTotals={fyTotals}
              gridGrain={gridGrain}
              onGridGrainChange={(g) => {
                setGridGrain(g)
                void loadDetailedGrid({ grain: g, seedIfSparse: false })
              }}
              selectedLineItemId={selected?.id || null}
              auditRows={detailedAuditRows}
              exceptionRows={detailedExceptionRows}
              validationSummary={detailedValidationSummary}
              validationChecks={detailedValidationChecks}
              mappingRows={detailedMappingRows}
              mappedPct={detailedMappedPct}
              mappingsInferred={mappingsInferred}
              sensitivity={detailedSensitivity}
              formulaImpact={formulaImpact}
              cellMeta={cellMeta}
              cellTrace={cellTrace}
              onCellCommit={
                canEditLive
                  ? (liId, periodIndex, value) => void commitGridCell(liId, periodIndex, value)
                  : undefined
              }
              onFormulaCommit={
                canConfigureBuilder
                  ? (liId, expression) => void saveFormulaForLineItem(liId, expression)
                  : undefined
              }
              onAddLineItem={() => {
                if (!selectedLeaf?.leafId) {
                  toast.message("Select a module leaf first")
                  return
                }
                setCreateOpen(true)
              }}
              onOpenCreateMapping={(defaults) => {
                setMappingEditInitial(null)
                setMappingDialogTargetId(defaults?.targetLineItemId || selected?.id || null)
                setMappingDialogOpen(true)
              }}
              onEditMapping={(row) => {
                const status = String(row.status || "MAPPED").toUpperCase()
                const allowed = [
                  "MAPPED",
                  "UNMAPPED",
                  "SUGGESTED",
                  "TYPE_MISMATCH",
                  "STALE",
                ] as const
                setMappingEditInitial({
                  id: row.id,
                  sourceSystem: row.system,
                  sourceField: row.source,
                  targetLineItemId: row.targetLineItemId || "",
                  status: (allowed.includes(status as (typeof allowed)[number])
                    ? status
                    : "MAPPED") as (typeof allowed)[number],
                  notes: row.notes || undefined,
                })
                setMappingDialogTargetId(row.targetLineItemId || null)
                setMappingDialogOpen(true)
              }}
              onRefreshMappings={() => {
                void (async () => {
                  if (!id) return
                  try {
                    const res = await fpaApi.refreshDataMappings(id, { replaceExisting: false })
                    if (!res.success) throw new Error(res.message || "Refresh failed")
                    toast.success("Mapping catalog refreshed")
                    await loadDataMappings()
                  } catch (err) {
                    toast.error(errorMessage(err))
                    logFpaGap({
                      category: "broken",
                      path: `/v1/fpa/models/${id}/data-mappings/refresh`,
                      method: "POST",
                      message: errorMessage(err),
                      impact: "Cannot refresh mapping catalog from Detailed workspace",
                      response: err,
                    })
                  }
                })()
              }}
              onSeedMappingCatalog={() => {
                void (async () => {
                  if (!id) return
                  try {
                    const res = await fpaApi.seedDataMappingCatalog(id, {
                      moduleId: selectedLeaf?.leafId || undefined,
                      systems: [...MAPPING_SOURCE_SYSTEMS],
                    })
                    if (!res.success) throw new Error(res.message || "Seed catalog failed")
                    const created =
                      (res.data?.createdFields || 0) + (res.data?.createdMappings || 0)
                    toast.success(
                      created
                        ? `Seeded ${res.data?.createdFields || 0} fields / ${res.data?.createdMappings || 0} mappings`
                        : "Seed catalog accepted — reload mappings",
                    )
                    setMappingsInferred(false)
                    await loadDataMappings()
                  } catch (err) {
                    toast.error(errorMessage(err))
                    logFpaGap({
                      category: "missing",
                      path: `/v1/fpa/models/${id}/data-mappings/seed-catalog`,
                      method: "POST",
                      message: errorMessage(err),
                      impact: "Cannot seed connector catalog — client blocked on empty mappings",
                      response: err,
                    })
                  }
                })()
              }}
              onImportSourceFile={() => setImportSourceOpen(true)}
              onRunSensitivity={(driverLineItemId, shockPct) => {
                void loadSensitivity({ driverLineItemId, shockPct })
              }}
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

      <CreateDataMappingDialog
        open={mappingDialogOpen}
        onClose={() => {
          setMappingDialogOpen(false)
          setMappingEditInitial(null)
        }}
        lineItems={scopedItems.length ? scopedItems : lineItems}
        defaultTargetLineItemId={mappingDialogTargetId}
        initial={mappingEditInitial || undefined}
        onSubmit={async (body, mappingId) => {
          if (!id) throw new Error("No model selected")
          if (mappingId) {
            const res = await fpaApi.updateDataMapping(id, mappingId, {
              ...body,
              moduleId: selectedLeaf?.leafId || undefined,
            })
            if (!res.success || !res.data) {
              throw new Error(res.message || "Update mapping failed")
            }
            toast.success("Mapping updated")
          } else {
            const res = await fpaApi.createDataMapping(id, {
              ...body,
              moduleId: selectedLeaf?.leafId || undefined,
            })
            if (!res.success || !res.data) {
              throw new Error(res.message || "Create mapping failed")
            }
            toast.success("Mapping created")
          }
          setMappingsInferred(false)
          setMappingEditInitial(null)
          await loadDataMappings()
        }}
      />

      <BuilderModelSettingsDialog
        open={modelSettingsOpen}
        model={model}
        canEdit={canEditLive}
        onClose={() => setModelSettingsOpen(false)}
        onSaved={(next) => {
          setModel(next)
          void dispatch(fetchFpaModels())
        }}
      />

      <ImportSourceFileDialog
        open={importSourceOpen}
        modelId={id}
        onClose={() => setImportSourceOpen(false)}
        onImported={() => {
          setMappingsInferred(false)
          void loadDataMappings()
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
