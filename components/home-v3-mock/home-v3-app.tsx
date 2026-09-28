"use client"

import { useEffect, useRef } from "react"
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
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { logoutUser } from "@/lib/store/slices/authSlice"
import { getAuthUser, getUserProfile } from "@/lib/utils/cookies"
import { toast } from "sonner"
import "@/components/home-v3-mock/home-v3.css"
import "@/components/home-v3-mock/home-v3-overrides.css"

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

function sessionUserKey(user: Hv3SessionUser | null): string {
  if (!user) return ""
  return [user.name, user.role, user.email, user.location, user.initials, user.image || ""].join("|")
}

function routeKey(
  route: string,
  detail: {
    selectedNews?: number | null
    forumThread?: number | null
    selectedNewsletter?: number | null
    newsletterMode?: string
  }
): string {
  return [
    route,
    detail.selectedNews ?? "",
    detail.forumThread ?? "",
    detail.selectedNewsletter ?? "",
    detail.newsletterMode ?? "",
  ].join("|")
}

/** Prefer Redux; fall back to cookies so first paint has a real identity. */
function resolveSessionUser(
  user: Parameters<typeof buildHv3SessionUser>[0],
  userDetails: Parameters<typeof buildHv3SessionUser>[1]
): Hv3SessionUser | null {
  const fromStore = buildHv3SessionUser(user, userDetails)
  if (fromStore) return fromStore
  if (typeof document === "undefined") return null
  try {
    return buildHv3SessionUser(getAuthUser(), getUserProfile())
  } catch {
    return null
  }
}

/**
 * Mounts the full Matanho Employee Hub Premium V17.1 suite inside Next.js.
 * All client views/modals/tabs are in the extracted runtime; Next owns URLs.
 *
 * Important: keep the runtime root mounted across auth background work.
 * Waiting on `isLoading` (or swapping to a spinner) destroyed the DOM ~1–2s
 * after first paint when session details settled — the visible “second reload”
 * flash on every /home page.
 */
export function HomeV3App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const sessionKeyRef = useRef<string>("")
  const routeKeyRef = useRef<string>("")
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, userDetails } = useAppSelector((state) => state.auth)
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  // Mount once; destroy only when this component leaves the tree.
  // Do not gate on auth `isLoading` — AuthProvider skips the boot gate for
  // /home, so waiting here just delays first paint until checkAuthStatus
  // finishes (~1–2s), which reads as a full reload after the topbar appears.
  useEffect(() => {
    const el = rootRef.current
    if (!el || apiRef.current) return

    const sessionUser = resolveSessionUser(user, userDetails)
    const base = JSON.parse(JSON.stringify(MATANHO_DATA)) as typeof MATANHO_DATA
    const data = mergeHv3DataWithSession(base, sessionUser)
    const initial = parseHv3Location(pathnameRef.current)
    const initialDetail = {
      selectedNews: initial.selectedNews,
      forumThread: initial.forumThread,
      selectedNewsletter: initial.selectedNewsletter,
      newsletterMode: initial.newsletterMode,
    }

    sessionKeyRef.current = sessionUserKey(sessionUser)
    routeKeyRef.current = routeKey(initial.route, initialDetail)

    apiRef.current = startMatanhoRuntime(el, {
      data,
      liveSession: !!sessionUser,
      initialRoute: initial.route,
      initialDetail,
      onNavigate: (route: string) => {
        const path = buildHv3Path({ route })
        if (pathnameRef.current !== path) router.push(path)
      },
      onSignOut: async () => {
        await dispatch(logoutUser()).unwrap()
        toast.success("Logged out successfully!")
        window.location.href = "/login"
      },
    }) as RuntimeApi

    window.__HOME_V3_PATH__ = (detail) => {
      const path = buildHv3Path(detail)
      if (pathnameRef.current !== path) router.push(path)
    }

    return () => {
      delete window.__HOME_V3_PATH__
      apiRef.current?.destroy()
      apiRef.current = null
      document.querySelectorAll(".home-v3-toast-host").forEach((n) => n.remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; session/route sync via soft updates
  }, [])

  // Soft session update — skip when identity already painted into the runtime.
  useEffect(() => {
    if (!apiRef.current) return
    const sessionUser = resolveSessionUser(user, userDetails)
    const key = sessionUserKey(sessionUser)
    if (!sessionUser || key === sessionKeyRef.current) return
    sessionKeyRef.current = key
    apiRef.current.setSessionUser(sessionUser)
  }, [user, userDetails])

  // Soft route sync — skip no-op setRoute (content rewrite).
  useEffect(() => {
    if (!apiRef.current) return
    const loc = parseHv3Location(pathname)
    const detail = {
      selectedNews: loc.selectedNews,
      forumThread: loc.forumThread,
      selectedNewsletter: loc.selectedNewsletter,
      newsletterMode: loc.newsletterMode,
    }
    const key = routeKey(loc.route, detail)
    if (key === routeKeyRef.current) return
    routeKeyRef.current = key
    apiRef.current.setRoute(loc.route, detail)
  }, [pathname])

  return (
    <div className="relative h-full min-h-[320px]">
      <div
        ref={rootRef}
        className="home-v3-root h-full"
        data-cover-theme="porcelain"
      />
    </div>
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
