"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { MATANHO_DATA } from "@/lib/home-v3-mock/matanho-data"
import {
  buildHv3Path,
  parseHv3Location,
} from "@/lib/home-v3-mock/nav"
import {
  buildHv3SessionUser,
  mergeHv3DataWithSession,
  type Hv3SessionUser,
} from "@/lib/home-v3-mock/session-user"
import { startMatanhoRuntime } from "@/components/home-v3-mock/matanho-runtime"
import { loadHomeLiveData, type Hv3CoverPreference } from "@/lib/home-v3/live-loaders"
import {
  syncPriorityTaskStage,
  syncCoverPreference,
  createServiceRequest,
  downloadPayslip,
  uploadWallpapers,
  deleteWallpaper,
  syncRotationInterval,
} from "@/lib/home-v3/actions"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { refreshUserDetails, logoutUser } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"
import "@/components/home-v3-mock/home-v3.css"
import "@/components/home-v3-mock/home-v3-overrides.css"

/**
 * `state.priorities` and `state.requests` both prefer a cached `matanho-hub-state` localStorage
 * copy over whatever is passed in as initial data (`saved.X || D.X`) — reasonable for a pure
 * client mock, wrong now that both are real. Evict just those keys so the runtime's own
 * fallback picks up the fresh data. `schedule` and `workdaySnapshot` are read directly off `D`
 * (never cached to `state`/localStorage), so they need no such eviction.
 */
function evictStaleCacheKeys(keys: string[]) {
  try {
    const raw = localStorage.getItem("matanho-hub-state")
    if (!raw) return
    const parsed = JSON.parse(raw)
    let changed = false
    for (const key of keys) {
      if (key in parsed) {
        delete parsed[key]
        changed = true
      }
    }
    if (changed) localStorage.setItem("matanho-hub-state", JSON.stringify(parsed))
  } catch {
    // Corrupt/absent cache is not this function's problem — the runtime already tolerates it.
  }
}

/**
 * Opposite direction from the eviction above: `state.cover` is built as
 * `{...hardcodedDefaults, ...(saved.cover||{})}` — it never reads the injected `data` at all, so
 * the only way to make a real preference the effective one on first mount is to seed it into the
 * same cache the runtime already treats as authoritative. Only touches `theme`/`wallpaper`,
 * leaving any other cached `cover.*` keys (style, mood, intention — not wired yet) untouched.
 */
function seedCoverPreferenceCache(pref: Hv3CoverPreference | null) {
  if (!pref) return
  try {
    const raw = localStorage.getItem("matanho-hub-state")
    const parsed = raw ? JSON.parse(raw) : {}
    parsed.cover = { ...(parsed.cover || {}), theme: pref.coverTheme, wallpaper: pref.coverWallpaper }
    localStorage.setItem("matanho-hub-state", JSON.stringify(parsed))
  } catch {
    // Same reasoning as evictStaleCacheKeys — worst case the hardcoded default renders.
  }
}

/**
 * `state.leaveBalance` (a plain number, not an object) follows the same saved-cache-wins
 * pattern. It's only used inside the "Request leave" modal's own live preview ("you have N days
 * available") — seeded from the real balance so that preview starts correct; the request-leave
 * submit flow never writes this back to the server (approval, not submission, should move a
 * real balance — see actions.ts's createServiceRequest doc comment), so no eviction is needed
 * on the write side, only this one-time seed on read.
 */
function seedLeaveBalanceCache(days: number | null) {
  if (days == null) return
  try {
    const raw = localStorage.getItem("matanho-hub-state")
    const parsed = raw ? JSON.parse(raw) : {}
    parsed.leaveBalance = days
    localStorage.setItem("matanho-hub-state", JSON.stringify(parsed))
  } catch {
    // Same reasoning as above.
  }
}

/**
 * `state.requests` follows the exact same hardcoded-literal-fallback pattern as `cover` (not
 * `saved.requests || D.requests` — the literal four SRV-/LEV- demo rows are inline in the
 * fallback itself). Evicting the key like priorities/schedule would just expose that literal
 * again; seed the real array in instead, same technique as seedCoverPreferenceCache.
 */
function seedRequestsCache(requests: unknown[] | null) {
  if (!requests) return
  try {
    const raw = localStorage.getItem("matanho-hub-state")
    const parsed = raw ? JSON.parse(raw) : {}
    parsed.requests = requests
    localStorage.setItem("matanho-hub-state", JSON.stringify(parsed))
  } catch {
    // Same reasoning as above.
  }
}

type RuntimeApi = {
  setRoute: (
    route: string,
    detail?: {
      selectedNews?: number | null
      forumThread?: number | null
      selectedNewsletter?: number | null
      newsletterMode?: string
    }
  ) => void
  setSessionUser: (user: Hv3SessionUser) => void
  destroy: () => void
}

/**
 * Mounts the full Matanho Employee Hub Premium V17.1 suite inside Next.js.
 * All client views/modals/tabs are in the extracted runtime; Next owns URLs.
 */
export function HomeV3App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const mountedRef = useRef(false)
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, userDetails, isLoading, isFetchingDetails } = useAppSelector(
    (state) => state.auth
  )
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const [liveDataReady, setLiveDataReady] = useState(false)
  const liveDataRef = useRef<Awaited<ReturnType<typeof loadHomeLiveData>> | null>(null)

  useEffect(() => {
    if (!user?.id || userDetails || isFetchingDetails) return
    void dispatch(refreshUserDetails(user.id))
  }, [user?.id, userDetails, isFetchingDetails, dispatch])

  useEffect(() => {
    if (isLoading || liveDataRef.current) return
    void loadHomeLiveData().then((result) => {
      liveDataRef.current = result
      setLiveDataReady(true)
    })
  }, [isLoading])

  useEffect(() => {
    if (isLoading || !liveDataReady || mountedRef.current) return

    const el = rootRef.current
    if (!el) return

    mountedRef.current = true
    evictStaleCacheKeys(["priorities"])
    seedCoverPreferenceCache(liveDataRef.current?.cover.data ?? null)
    seedLeaveBalanceCache(liveDataRef.current?.servicesSummary.data.leaveBalanceDays ?? null)
    seedRequestsCache(liveDataRef.current?.serviceRequests.data ?? null)

    const live = liveDataRef.current
    const sessionUser = buildHv3SessionUser(user, userDetails)
    const base = JSON.parse(JSON.stringify(MATANHO_DATA)) as typeof MATANHO_DATA
    const withSession = mergeHv3DataWithSession(base, sessionUser)
    // Real (possibly empty) data always wins over the static fixtures — an honest "nothing due
    // today" is correct; quietly showing fabricated demo tasks because the real answer was zero
    // is exactly what "no hardcoded data" rules out. A load failure still uses `[]` (the safe()
    // fallback) rather than fixtures, surfaced via the toasts below instead of fake content.
    const data = {
      ...withSession,
      priorities: live?.priorities.data ?? [],
      schedule: live?.schedule.data ?? [],
      workdaySnapshot: { aum: live?.aum.data ?? null },
      servicesSummary: {
        ...(live?.servicesSummary.data ?? {}),
        pendingExpensesLabel: live?.pendingExpenses.label,
        pendingExpensesMeta: live?.pendingExpenses.meta,
      },
      // `requests` is NOT read here — unlike priorities/schedule, state.requests' fallback is a
      // hardcoded literal, not `D.requests` (see seedRequestsCache's doc comment). The real data
      // is seeded into localStorage above instead, before the runtime ever reads its cache.
      customWallpapers: live?.customWallpapers.data ?? [],
      rotationIntervalMinutes: live?.cover.data?.rotationIntervalMinutes ?? 1440,
    }
    const initial = parseHv3Location(pathnameRef.current)

    if (live?.priorities.error) toast.error("Couldn't load your priorities", { description: live.priorities.error })
    if (live?.schedule.error) toast.error("Couldn't load your schedule", { description: live.schedule.error })
    if (live?.aum.error) toast.error("Couldn't load portfolio AUM", { description: live.aum.error })
    if (live?.cover.error) toast.error("Couldn't load your Daily Cover preference", { description: live.cover.error })
    if (live?.servicesSummary.error)
      toast.error("Couldn't load your payroll summary", { description: live.servicesSummary.error })
    if (live?.serviceRequests.error)
      toast.error("Couldn't load your requests", { description: live.serviceRequests.error })
    if (live?.customWallpapers.error)
      toast.error("Couldn't load your wallpapers", { description: live.customWallpapers.error })

    const onPriorityToggled = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      void syncPriorityTaskStage(detail).then((result) => {
        if (result.error) toast.error(result.error)
      })
    }
    const onCoverPreferenceUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      void syncCoverPreference(detail).then((result) => {
        if (result.error) toast.error(result.error)
      })
    }
    const onServiceRequestCreated = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      void createServiceRequest(detail).then((result) => {
        if (result.error) toast.error(result.error)
      })
    }
    const onPayslipDownloadRequested = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      void downloadPayslip(detail).then((result) => {
        if (result.error) toast.error(result.error)
      })
    }
    const onWallpaperUploadRequested = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      void uploadWallpapers(detail).then((result) => {
        if (result.error) toast.error(result.error)
        else if (result.reload) {
          toast.success("Wallpaper uploaded")
          setTimeout(() => window.location.reload(), 800)
        }
      })
    }
    const onWallpaperDeleteRequested = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      void deleteWallpaper(detail).then((result) => {
        if (result.error) toast.error(result.error)
        else if (result.reload) {
          toast.success("Wallpaper removed")
          setTimeout(() => window.location.reload(), 800)
        }
      })
    }
    const onRotationIntervalUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      void syncRotationInterval(detail).then((result) => {
        if (result.error) toast.error(result.error)
      })
    }
    window.addEventListener("matanho:priorities.task.toggled", onPriorityToggled)
    window.addEventListener("matanho:preferences.theme.updated", onCoverPreferenceUpdated)
    window.addEventListener("matanho:preferences.wallpaper.updated", onCoverPreferenceUpdated)
    window.addEventListener("matanho:service.request.created", onServiceRequestCreated)
    window.addEventListener("matanho:payslip.download.requested", onPayslipDownloadRequested)
    window.addEventListener("matanho:wallpaper.upload.requested", onWallpaperUploadRequested)
    window.addEventListener("matanho:wallpaper.delete.requested", onWallpaperDeleteRequested)
    window.addEventListener("matanho:preferences.rotation.updated", onRotationIntervalUpdated)

    apiRef.current = startMatanhoRuntime(el, {
      data,
      liveSession: !!sessionUser,
      initialRoute: initial.route,
      initialDetail: {
        selectedNews: initial.selectedNews,
        forumThread: initial.forumThread,
        selectedNewsletter: initial.selectedNewsletter,
        newsletterMode: initial.newsletterMode,
      },
      onNavigate: (route: string) => {
        const path = buildHv3Path({ route })
        if (pathnameRef.current !== path) router.push(path)
      },
      onSignOut: async () => {
        await dispatch(logoutUser()).unwrap()
        toast.success("Logged out successfully!")
        window.location.href = '/login'
      },
    }) as RuntimeApi

    window.__HOME_V3_PATH__ = (detail) => {
      const path = buildHv3Path(detail)
      if (pathnameRef.current !== path) router.push(path)
    }

    return () => {
      mountedRef.current = false
      window.removeEventListener("matanho:priorities.task.toggled", onPriorityToggled)
      window.removeEventListener("matanho:preferences.theme.updated", onCoverPreferenceUpdated)
      window.removeEventListener("matanho:preferences.wallpaper.updated", onCoverPreferenceUpdated)
      window.removeEventListener("matanho:service.request.created", onServiceRequestCreated)
      window.removeEventListener("matanho:payslip.download.requested", onPayslipDownloadRequested)
      window.removeEventListener("matanho:wallpaper.upload.requested", onWallpaperUploadRequested)
      window.removeEventListener("matanho:wallpaper.delete.requested", onWallpaperDeleteRequested)
      window.removeEventListener("matanho:preferences.rotation.updated", onRotationIntervalUpdated)
      delete window.__HOME_V3_PATH__
      apiRef.current?.destroy()
      apiRef.current = null
      document.querySelectorAll(".home-v3-toast-host").forEach((n) => n.remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, liveDataReady])

  useEffect(() => {
    const sessionUser = buildHv3SessionUser(user, userDetails)
    if (sessionUser) apiRef.current?.setSessionUser(sessionUser)
  }, [user, userDetails])

  useEffect(() => {
    const loc = parseHv3Location(pathname)
    apiRef.current?.setRoute(loc.route, {
      selectedNews: loc.selectedNews,
      forumThread: loc.forumThread,
      selectedNewsletter: loc.selectedNewsletter,
      newsletterMode: loc.newsletterMode,
    })
  }, [pathname])

  if (isLoading || !liveDataReady) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-[#64748B]">
        Loading your workspace…
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="home-v3-root h-full"
      data-cover-theme="porcelain"
    />
  )
}

declare global {
  interface Window {
    __HOME_V3_NAV__?: (route: string) => void
    __HOME_V3_SIGN_OUT__?: (() => void | Promise<void>) | null
    __HOME_V3_PATH__?: (detail: {
      route: string
      selectedNews?: number | null
      forumThread?: number | null
      selectedNewsletter?: number | null
      newsletterMode?: string
    }) => void
  }
}
