/**
 * Home V3 — write actions dispatched from `matanho:*` integration events emitted by
 * components/home-v3-mock/matanho-runtime.js (see scripts/patch-home-v3-live-data.mjs for the
 * patch that added the `priorities.task.toggled` emission; workday.session.* and
 * preferences.*.updated were already emitted by the runtime as extracted).
 *
 * Each handler is best-effort: the runtime has already applied the change to its own local
 * state (optimistic), so a failure here is reported via toast rather than rolled back —
 * matching the pattern the runtime itself already uses for its other actions.
 */
import { apiClient } from "@/lib/api/api-client"

export type Hv3ActionResult = { handled: boolean; error: string | null }

/** `priorities.task.toggled` -> PUT /api/tasks/:id/stage */
export async function syncPriorityTaskStage(detail: { id?: string; done?: boolean }): Promise<Hv3ActionResult> {
  const id = detail?.id
  if (!id) return { handled: false, error: null }
  try {
    await apiClient.put(`/tasks/${id}/stage`, { stage: detail.done ? "completed" : "todo" })
    return { handled: true, error: null }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to save task"
    console.error("[home-v3] priorities.task.toggled failed:", message)
    return { handled: true, error: message }
  }
}

/**
 * `preferences.theme.updated` / `preferences.wallpaper.updated` -> PUT /api/homepage/preferences
 * Both events carry whichever of {theme, wallpaper} actually changed; `reset-daily-cover` sends
 * both. The runtime already applies the change locally (and persists it to `matanho-hub-state`)
 * before this fires, so this call only needs to make it durable server-side.
 */
export async function syncCoverPreference(detail: { theme?: string; wallpaper?: string }): Promise<Hv3ActionResult> {
  const body: { coverTheme?: string; coverWallpaper?: string } = {}
  if (detail?.theme) body.coverTheme = detail.theme
  if (detail?.wallpaper) body.coverWallpaper = detail.wallpaper
  if (!body.coverTheme && !body.coverWallpaper) return { handled: false, error: null }
  try {
    await apiClient.put("/homepage/preferences", body)
    return { handled: true, error: null }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to save your Daily Cover preference"
    console.error("[home-v3] preferences update failed:", message)
    return { handled: true, error: message }
  }
}

/**
 * `service.request.created` -> POST /api/service-requests
 * Fired by both the dedicated leave-request form and the generic service-request form (any
 * Browse-services card or Quick action other than payroll). Deliberately does not re-render the
 * "My requests" table with the real created row — the mounted runtime has no hydrate() API yet
 * (see execution-plan.md Phase 1 note on the same gap for priority toggles); the runtime's own
 * optimistic row stands until next reload, same trade-off as elsewhere in this build.
 */
export async function createServiceRequest(detail: {
  type?: string
  summary?: string
  amount?: number | null
}): Promise<Hv3ActionResult> {
  if (!detail?.type || !detail?.summary) return { handled: false, error: null }
  try {
    await apiClient.post("/service-requests", {
      type: detail.type,
      summary: detail.summary,
      amount: detail.amount ?? undefined,
    })
    return { handled: true, error: null }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to submit your request"
    console.error("[home-v3] service.request.created failed:", message)
    return { handled: true, error: message }
  }
}

/**
 * `payslip.download.requested` -> GET /api/payroll/employee/payslips/:id/download
 * Needs the Bearer token the rest of the app authenticates with, so this can't be a plain
 * `<a href>` — fetched as a blob and downloaded client-side, same shape as the mock's own
 * (fake) download it replaces.
 */
export async function downloadPayslip(detail: { payslipId?: string }): Promise<Hv3ActionResult> {
  const payslipId = detail?.payslipId
  if (!payslipId) return { handled: false, error: null }
  try {
    const blob = await apiClient.get<Blob>(`/payroll/employee/payslips/${payslipId}/download`, {
      responseType: "blob",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payslip-${payslipId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    return { handled: true, error: null }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to download payslip"
    console.error("[home-v3] payslip.download.requested failed:", message)
    return { handled: true, error: message }
  }
}
