"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  bootstrapFpaSelection,
  setSelectedScenarioId,
  setSelectedVersionId,
} from "@/lib/store/slices/fpaSlice"

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
    await dispatch(bootstrapFpaSelection(modelId))
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
