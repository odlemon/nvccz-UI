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
import { refreshUserDetails, logoutUser } from "@/lib/store/slices/authSlice"
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

  useEffect(() => {
    if (!user?.id || userDetails || isFetchingDetails) return
    void dispatch(refreshUserDetails(user.id))
  }, [user?.id, userDetails, isFetchingDetails, dispatch])

  useEffect(() => {
    if (isLoading || mountedRef.current) return

    const el = rootRef.current
    if (!el) return

    mountedRef.current = true

    const sessionUser = buildHv3SessionUser(user, userDetails)
    const base = JSON.parse(JSON.stringify(MATANHO_DATA)) as typeof MATANHO_DATA
    const data = mergeHv3DataWithSession(base, sessionUser)
    const initial = parseHv3Location(pathnameRef.current)

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
      delete window.__HOME_V3_PATH__
      apiRef.current?.destroy()
      apiRef.current = null
      document.querySelectorAll(".home-v3-toast-host").forEach((n) => n.remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

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

  if (isLoading) {
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
