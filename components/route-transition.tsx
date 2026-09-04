"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"

interface RouteTransitionProps {
  children: ReactNode
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02,
  },
}

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
}

// Reduced motion variants for accessibility
const reducedMotionVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  },
}

const reducedMotionTransition = {
  duration: 0.2,
}

const VIEWPORT_LOCKED_PREFIXES = [
  "/home-v3",
  "/payroll-v6",
  "/portfolio",
  "/investee-portal-v8",
  "/fundraising-kyc",
  "/accounting-v2",
  "/performance-v22",
]

function isViewportLockedPath(pathname: string) {
  return VIEWPORT_LOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const viewportLocked = isViewportLockedPath(pathname)
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  const variants =
    prefersReducedMotion || viewportLocked ? reducedMotionVariants : pageVariants
  const transition =
    prefersReducedMotion || viewportLocked ? reducedMotionTransition : pageTransition

  // Show a quick top loader on route change
  useEffect(() => {
    // Trigger loader on pathname change
    setIsNavigating(true)
    const timer = setTimeout(() => setIsNavigating(false), prefersReducedMotion ? 150 : 350)
    return () => clearTimeout(timer)
  }, [pathname, prefersReducedMotion])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={variants}
        transition={transition}
        className={viewportLocked ? "h-dvh overflow-hidden" : "min-h-screen"}
      >
        {/* Top loading bar */}
        {isNavigating && (
          <div className="fixed top-0 left-0 right-0 h-1 z-[60]">
            <div className="h-full w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 animate-pulse" />
          </div>
        )}
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
