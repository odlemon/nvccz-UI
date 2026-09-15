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
import { syncPriorityTaskStage, syncCoverPreference } from "@/lib/home-v3/actions"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { refreshUserDetails, logoutUser } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"
import "@/components/home-v3-mock/home-v3.css"
import "@/components/home-v3-mock/home-v3-overrides.css"

/**
 * `state.priorities` in the runtime prefers a cached `matanho-hub-state` localStorage copy over
 * whatever is passed in as initial data (`saved.priorities || D.priorities`) — reasonable for a
 * pure client mock, wrong now that `D.priorities` is real. Evict just that key so the runtime's
 * own fallback picks up the fresh data. `schedule` and `workdaySnapshot` are read directly off
 * `D` (never cached to `state`/localStorage), so they need no such eviction.
 */
function evictStalePrioritiesCache() {
  try {
    const raw = localStorage.getItem("matanho-hub-state")
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!("priorities" in parsed)) return
    delete parsed.priorities
    localStorage.setItem("matanho-hub-state", JSON.stringify(parsed))
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
    // Same reasoning as evictStalePrioritiesCache — worst case the hardcoded default renders.
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
    evictStalePrioritiesCache()
    seedCoverPreferenceCache(liveDataRef.current?.cover.data ?? null)

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
    }
    const initial = parseHv3Location(pathnameRef.current)

    if (live?.priorities.error) toast.error("Couldn't load your priorities", { description: live.priorities.error })
    if (live?.schedule.error) toast.error("Couldn't load your schedule", { description: live.schedule.error })
    if (live?.aum.error) toast.error("Couldn't load portfolio AUM", { description: live.aum.error })
    if (live?.cover.error) toast.error("Couldn't load your Daily Cover preference", { description: live.cover.error })

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
    window.addEventListener("matanho:priorities.task.toggled", onPriorityToggled)
    window.addEventListener("matanho:preferences.theme.updated", onCoverPreferenceUpdated)
    window.addEventListener("matanho:preferences.wallpaper.updated", onCoverPreferenceUpdated)

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
