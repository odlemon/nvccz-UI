import {
  fpaApi,
  isScenarioCopyJob,
  type FpaScenario,
  type FpaScenarioCopyResult,
} from "@/lib/api/fpa-api"

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function scenarioFromCopyResult(
  data: FpaScenarioCopyResult | null | undefined,
): FpaScenario | null {
  if (!data) return null
  if ("scenario" in data && data.scenario?.id) return data.scenario
  return null
}

/**
 * Resolve copy API payload — sync result or poll async job until done / timeout.
 * BE may return `{ scenario, cellsCopied, driversCopied }` or `{ jobId, status }`.
 */
export async function resolveScenarioCopy(
  data: FpaScenarioCopyResult,
  opts?: { maxWaitMs?: number; intervalMs?: number },
): Promise<{
  scenario: FpaScenario
  cellsCopied?: number
  driversCopied?: number
}> {
  const direct = scenarioFromCopyResult(data)
  if (direct) {
    return {
      scenario: direct,
      cellsCopied: "cellsCopied" in data ? data.cellsCopied : undefined,
      driversCopied: "driversCopied" in data ? data.driversCopied : undefined,
    }
  }

  if (!isScenarioCopyJob(data)) {
    throw new Error("Copy response missing scenario and jobId")
  }

  const maxWaitMs = opts?.maxWaitMs ?? 120_000
  const intervalMs = opts?.intervalMs ?? 1500
  const started = Date.now()
  let jobId = data.jobId

  while (Date.now() - started < maxWaitMs) {
    const res = await fpaApi.getScenarioCopyJob(jobId)
    if (!res.success || !res.data) {
      throw new Error(res.message || "Copy job poll failed")
    }
    const job = res.data
    const st = String(job.status || "").toUpperCase()
    if (st === "FAILED") {
      throw new Error(job.error || "Scenario copy job failed")
    }
    const done = scenarioFromCopyResult(job)
    if (done && (st === "COMPLETED" || st === "DONE" || st === "SUCCESS" || Boolean(job.scenario?.id))) {
      return {
        scenario: done,
        cellsCopied: job.cellsCopied,
        driversCopied: job.driversCopied,
      }
    }
    if (job.jobId) jobId = job.jobId
    await sleep(intervalMs)
  }

  throw new Error("Scenario copy is still running — try again in a moment")
}
