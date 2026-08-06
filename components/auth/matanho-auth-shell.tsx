"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

/** Matanho brand teal sampled from the login crop */
export const MATANHO_TEAL = "#14C4CE"

type MatanhoAuthShellProps = {
  children: ReactNode
  trustLine?: string
  className?: string
}

/**
 * Full-bleed mountain / glass auth layout shared by login + forgot-password.
 * Left branding matches the Matanho login crop; `/new_logo.png` is used on mobile
 * (light plate) and across app chrome.
 */
export function MatanhoAuthShell({
  children,
  trustLine = "Secure | Compliant | Trusted",
  className,
}: MatanhoAuthShellProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-[#0B1220]", className)}>
      <Image
        src="/matanho-login-bg.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[#0B1220]/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/65 via-transparent to-[#0B1220]/45" />

      <div className="relative z-10 flex min-h-screen">
        {/* Left branding — crop: white wordmark + teal underline + tagline */}
        <div className="hidden lg:flex lg:w-[42%] xl:w-[44%] flex-col justify-between px-10 xl:px-16 py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="pt-16 xl:pt-24"
          >
            <h1 className="text-[44px] xl:text-[52px] font-semibold tracking-tight text-white leading-none">
              matanho
            </h1>
            <div
              className="mt-2.5 h-[3px] w-9 rounded-full"
              style={{ backgroundColor: MATANHO_TEAL }}
              aria-hidden
            />
            <p className="mt-6 max-w-[280px] text-[16px] xl:text-[17px] leading-relaxed text-white/92 font-normal">
              The infrastructure behind every investment.
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-[13px] font-medium tracking-wide pb-6"
            style={{ color: MATANHO_TEAL }}
          >
            {trustLine}
          </motion.p>
        </div>

        <div
          className="hidden lg:block w-px self-stretch my-12 opacity-90"
          style={{ backgroundColor: MATANHO_TEAL }}
          aria-hidden
        />

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="w-full max-w-[440px]"
          >
            {/* Mobile: official logo asset */}
            <div className="lg:hidden mb-6 flex flex-col items-center text-center">
              <Image
                src="/new_logo.png"
                alt="Matanho — Investment Management ERP"
                width={200}
                height={64}
                className="h-11 w-auto object-contain mb-3 brightness-0 invert"
                priority
              />
              <p className="text-white/85 text-sm max-w-xs">
                The infrastructure behind every investment.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/15 bg-[#151C28]/75 backdrop-blur-xl shadow-2xl shadow-black/40 px-7 sm:px-9 py-9 sm:py-10">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
