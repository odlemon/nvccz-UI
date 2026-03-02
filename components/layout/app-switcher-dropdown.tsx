"use client"

import { useRef, useEffect, useMemo } from "react"
import { MODULE_CONFIG, ModuleConfig } from "@/lib/config/modules"
import { useRouter } from "next/navigation"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

interface AppSwitcherDropdownProps {
  isOpen: boolean
  onClose: () => void
  onModuleSelect: (module: string) => void
  currentModule: string
}

export function AppSwitcherDropdown({ isOpen, onClose, onModuleSelect, currentModule }: AppSwitcherDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { accessibleModules, hasModuleAccess, isLoading, isAuthenticated } = useRolePermissions()

  // Filter modules based on user's role permissions
  // Must be called before any conditional returns
  const modulesToDisplay = useMemo(() => {
    if (!isAuthenticated || isLoading) {
      // If not authenticated or still loading, show no modules
      return []
    }

    // Filter modules based on accessible modules from role permissions
    return MODULE_CONFIG.filter((module) => {
      // Check if module ID is in accessible modules
      // We use hasModuleAccess which is already reactive to the user's role
      return hasModuleAccess(module.id)
    })
  }, [isAuthenticated, isLoading, hasModuleAccess])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Background Blur Overlay - starts below topbar */}
      <div className="absolute top-20 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm" />

      <div
        ref={dropdownRef}
        className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 w-[90vw] max-w-4xl mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white">Select Module</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Grid of Module Cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {modulesToDisplay.map((module) => {
              const Icon = module.icon
              const isActive = currentModule === module.id

              return (
                <div
                  key={module.id}
                  onClick={(e) => {
                    window.location.href = module.path
                  }}
                  className={`
                    group relative p-4 rounded-xl cursor-pointer transition-all duration-200
                    hover:shadow-lg hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-800
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 shadow-md'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {/* Icon Container */}
                  <div
                    className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}CC 100%)`,
                      border: `2px solid ${module.color}`
                    }}
                  >
                    <Icon
                      size={32}
                      style={{
                        color: module.color,
                        filter: `drop-shadow(0 0 0 ${module.color})`
                      }}
                    />
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <span className={`
                      text-sm leading-tight text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white
                      ${isActive ? 'font-medium text-blue-700 dark:text-blue-300' : 'font-normal'}
                    `}>
                      {module.name}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {module.description}
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && modulesToDisplay.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No modules available</p>
          </div>
        )}
      </div>
    </div>
  )
}
