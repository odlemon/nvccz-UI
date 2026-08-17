"use client"

import { useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { getSwitcherModules } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import "./arcus-app-switcher.css"

interface AppSwitcherDropdownProps {
  isOpen: boolean
  onClose: () => void
  onModuleSelect: (module: string) => void
  currentModule: string
}

/** Investments-reference module picker — portaled, theme-isolated. */
export function AppSwitcherDropdown({
  isOpen,
  onClose,
  onModuleSelect,
  currentModule,
}: AppSwitcherDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { hasModuleAccess, isLoading, isAuthenticated } = useRolePermissions()

  const modulesToDisplay = useMemo(() => {
    if (!isAuthenticated || isLoading) return []
    return getSwitcherModules().filter((module) => hasModuleAccess(module.id))
  }, [isAuthenticated, isLoading, hasModuleAccess])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen || typeof document === "undefined") return null

  return createPortal(
    <div
      data-arcus-app-switcher
      className="fixed inset-0 z-[120] flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4 pb-4"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        ref={dropdownRef}
        role="dialog"
        aria-modal="true"
        aria-label="Select Module"
        data-arcus-app-switcher-panel
        className="relative z-10 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[calc(100vh-5.5rem)] sm:max-h-[calc(100vh-6.5rem)]"
      >
        <div className="flex items-center justify-between gap-3 shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
          <h2 data-arcus-app-switcher-title className="text-lg sm:text-xl">
            Select Module
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {modulesToDisplay.map((module) => {
                const Icon = module.icon
                const isActive = currentModule === module.id

                return (
                  <button
                    type="button"
                    key={module.id}
                    data-arcus-app-switcher-card
                    data-active={isActive ? "true" : "false"}
                    onClick={() => {
                      onModuleSelect(module.id)
                      window.location.href = module.path
                    }}
                    className="group relative p-3 sm:p-4 cursor-pointer transition-all duration-200"
                  >
                    <div
                      data-arcus-app-switcher-icon
                      className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2.5 sm:mb-3 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200"
                      style={{ borderColor: module.color }}
                    >
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: module.color }} />
                    </div>

                    <div className="text-center">
                      <span data-arcus-app-switcher-name className="block leading-tight">
                        {module.name}
                      </span>
                      <div data-arcus-app-switcher-desc className="mt-1 line-clamp-2">
                        {module.description}
                      </div>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {!isLoading && modulesToDisplay.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No modules available</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
