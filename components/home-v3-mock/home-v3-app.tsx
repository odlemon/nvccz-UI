"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { MATANHO_DATA } from "@/lib/home-v3-mock/matanho-data"
import {
  buildHv3Path,
  parseHv3Location,
} from "@/lib/home-v3-mock/nav"
import { startMatanhoRuntime } from "@/components/home-v3-mock/matanho-runtime"
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
  destroy: () => void
}

/**
 * Mounts the full Matanho Employee Hub Premium V17.1 suite inside Next.js.
 * All client views/modals/tabs are in the extracted runtime; Next owns URLs.
 */
export function HomeV3App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const data = JSON.parse(JSON.stringify(MATANHO_DATA)) as typeof MATANHO_DATA
    const initial = parseHv3Location(pathnameRef.current)

    apiRef.current = startMatanhoRuntime(el, {
      data,
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
    }) as RuntimeApi

    // Bidirectional path bridge for detail drill-downs
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const loc = parseHv3Location(pathname)
    apiRef.current?.setRoute(loc.route, {
      selectedNews: loc.selectedNews,
      forumThread: loc.forumThread,
      selectedNewsletter: loc.selectedNewsletter,
      newsletterMode: loc.newsletterMode,
    })
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="home-v3-root"
      data-cover-theme="porcelain"
      style={{ minHeight: "calc(100vh - 5rem)", position: "relative" }}
    />
  )
}

declare global {
  interface Window {
    __HOME_V3_NAV__?: (route: string) => void
    __HOME_V3_PATH__?: (detail: {
      route: string
      selectedNews?: number | null
      forumThread?: number | null
      selectedNewsletter?: number | null
      newsletterMode?: string
    }) => void
  }
}
