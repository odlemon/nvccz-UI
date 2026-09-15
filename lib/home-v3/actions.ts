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

export type Hv3ReloadingActionResult = Hv3ActionResult & { reload?: boolean }

/**
 * `wallpaper.upload.requested` -> POST /api/homepage/wallpapers (multipart)
 * On success this reloads the page: the mounted runtime has no hydrate() API (same gap noted
 * throughout this build — see priorities.task.toggled's own doc comment), so without a reload
 * an uploaded image would silently not appear in the wallpaper grid until the next unrelated
 * navigation. A full reload is the honest choice here — better than a "successful" upload the
 * user can't see.
 */
export async function uploadWallpapers(detail: { files?: File[] }): Promise<Hv3ReloadingActionResult> {
  const files = detail?.files
  if (!files?.length) return { handled: false, error: null }
  try {
    const formData = new FormData()
    for (const file of files) formData.append("images", file)
    await apiClient.postFormData("/homepage/wallpapers", formData)
    return { handled: true, error: null, reload: true }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to upload wallpaper"
    console.error("[home-v3] wallpaper.upload.requested failed:", message)
    return { handled: true, error: message }
  }
}

/** `wallpaper.delete.requested` -> DELETE /api/homepage/wallpapers/:id. Same reload reasoning as upload. */
export async function deleteWallpaper(detail: { id?: string }): Promise<Hv3ReloadingActionResult> {
  const id = detail?.id
  if (!id) return { handled: false, error: null }
  try {
    await apiClient.delete(`/homepage/wallpapers/${id}`)
    return { handled: true, error: null, reload: true }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to remove wallpaper"
    console.error("[home-v3] wallpaper.delete.requested failed:", message)
    return { handled: true, error: message }
  }
}

/** `preferences.rotation.updated` -> PUT /api/homepage/preferences */
export async function syncRotationInterval(detail: { intervalMinutes?: number }): Promise<Hv3ActionResult> {
  const intervalMinutes = detail?.intervalMinutes
  if (!intervalMinutes) return { handled: false, error: null }
  try {
    await apiClient.put("/homepage/preferences", { rotationIntervalMinutes: intervalMinutes })
    return { handled: true, error: null }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to save rotation interval"
    console.error("[home-v3] preferences.rotation.updated failed:", message)
    return { handled: true, error: message }
  }
}

/**
 * `calendar.entry.created` -> POST /api/calendar-entries
 * Same reload reasoning as wallpaper upload/delete: the mounted runtime has no hydrate() API,
 * so a new entry would silently not appear in the week grid until an unrelated navigation.
 */
export async function createCalendarEntry(detail: {
  title?: string
  startDate?: string
  endDate?: string
  description?: string | null
}): Promise<Hv3ReloadingActionResult> {
  if (!detail?.title || !detail?.startDate || !detail?.endDate) return { handled: false, error: null }
  try {
    await apiClient.post("/calendar-entries", {
      title: detail.title,
      startDate: detail.startDate,
      endDate: detail.endDate,
      description: detail.description ?? undefined,
    })
    return { handled: true, error: null, reload: true }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to create calendar entry"
    console.error("[home-v3] calendar.entry.created failed:", message)
    return { handled: true, error: message }
  }
}

/** `calendar.entry.deleted` -> DELETE /api/calendar-entries/:id. Same reload reasoning as above. */
export async function deleteCalendarEntry(detail: { id?: string }): Promise<Hv3ReloadingActionResult> {
  const id = detail?.id
  if (!id) return { handled: false, error: null }
  try {
    await apiClient.delete(`/calendar-entries/${id}`)
    return { handled: true, error: null, reload: true }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Failed to remove calendar entry"
    console.error("[home-v3] calendar.entry.deleted failed:", message)
    return { handled: true, error: message }
  }
}
