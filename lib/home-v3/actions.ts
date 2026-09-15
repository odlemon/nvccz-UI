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
