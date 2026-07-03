"use client"

import { useEffect, useRef, useState } from "react"
import { animate } from "framer-motion"

// Animates a displayed number from its previous value to `target` whenever it
// changes (including the initial mount, which animates in from 0).
export function useCountUp(target: number, options?: { duration?: number }): number {
  const [value, setValue] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    if (!Number.isFinite(target)) return
    const from = prevRef.current
    const controls = animate(from, target, {
      duration: options?.duration ?? 0.8,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    })
    prevRef.current = target
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return value
}
