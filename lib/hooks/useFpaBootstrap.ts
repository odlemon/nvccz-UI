"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  bootstrapFpaSelection,
  setSelectedModelId,
  setSelectedScenarioId,
  setSelectedVersionId,
} from "@/lib/store/slices/fpaSlice"
import { fpaApi } from "@/lib/api/fpa-api"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"

/** Bootstrap models + default scenario/version once per FP&A session. */
export function useFpaBootstrap(preferredModelId?: string) {
  const dispatch = useAppDispatch()
  const { bootstrapped, loadingModels, selectedModelId, selectedVersionId, selectedScenarioId, models, scenarios, versions, error } =
    useAppSelector((s) => s.fpa)

  useEffect(() => {
    if (!bootstrapped) {
      void dispatch(bootstrapFpaSelection(preferredModelId))
    }
  }, [bootstrapped, preferredModelId, dispatch])

  const selectModel = async (modelId: string) => {
    dispatch(setSelectedModelId(modelId))
    try {
      const res = await fpaApi.getModel(modelId)
      if (!res.success || !res.data) throw new Error(res.message || "Failed to load model")
      const scenarios = res.data.scenarios || []
      const versions = res.data.versions || []
      const scenarioId =
        res.data.defaultScenarioId ||
        scenarios.find((s) => s.scenarioType === "BASE")?.id ||
        scenarios[0]?.id ||
        null
      const versionId =
        res.data.defaultVersionId ||
        versions.find((v) => /working/i.test(v.name))?.id ||
        versions[0]?.id ||
        null
      dispatch(setSelectedScenarioId(scenarioId))
      dispatch(setSelectedVersionId(versionId))
      await dispatch(bootstrapFpaSelection(modelId))
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${modelId}`,
        method: "GET",
        message: errorMessage(err),
        impact: "Cannot switch model context",
        response: err,
      })
    }
  }

  return {
    bootstrapped,
    loading: loadingModels,
    selectedModelId,
    selectedVersionId,
    selectedScenarioId,
    models,
    scenarios,
    versions,
    error,
    selectModel,
    setScenarioId: (id: string | null) => dispatch(setSelectedScenarioId(id)),
    setVersionId: (id: string | null) => dispatch(setSelectedVersionId(id)),
  }
}
