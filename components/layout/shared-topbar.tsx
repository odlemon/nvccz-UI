"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CiSearch,
  CiBellOn,
  CiSettings,
  CiUser,
  CiLogout,
  CiCalendar,
  CiCircleInfo,
  CiCircleChevDown,
} from "react-icons/ci"
import { Moon, Sun } from "lucide-react"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ModuleSwitcherButton } from "./module-switcher-button"
import {
  ArcusAppSwitcherProvider,
  useArcusAppSwitcher,
} from "./arcus-app-switcher-provider"
import "@/components/layout/arcus-header-overrides.css"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setCurrency } from "@/lib/store/slices/uiSlice"
import { logoutUser } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"

/** Module root selectors that should receive the dark class for full-module theming */
const MODULE_ROOT_SELECTORS = [
  "#app",
  ".app",
  ".performance-v22-root",
  ".portfolio-v11-root",
  ".payroll-v6-root",
  ".procurement-v23-root",
  ".accounting-v52-root",
  ".home-v3-root",
  ".investments-terminal",
  ".events-root",
  ".street-rates-root",
  ".forecasting-root",
  ".fundraising-root",
  ".fundraising-kyc-root",
].join(", ")

function propagateDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark)
  document.querySelectorAll(MODULE_ROOT_SELECTORS).forEach((el) => {
    el.classList.toggle("dark", isDark)
  })
}

interface SharedTopbarProps {
  onModuleSelect: (module: string) => void
  currentModule: string
  moduleActions?: React.ReactNode
  /** When true, hide the built-in theme toggle (for modules that provide their own). */
  hideThemeToggle?: boolean
}

export function SharedTopbar(props: SharedTopbarProps) {
  const parent = useArcusAppSwitcher()
  if (parent) return <SharedTopbarInner {...props} />
  return (
    <ArcusAppSwitcherProvider currentModule={props.currentModule}>
      <SharedTopbarInner {...props} />
    </ArcusAppSwitcherProvider>
  )
}

function SharedTopbarInner({ currentModule, moduleActions, hideThemeToggle = false }: SharedTopbarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const appSwitcher = useArcusAppSwitcher()
  const dispatch = useAppDispatch()
  const currency = useAppSelector((state) => state.ui.currency)
  const { user, token, isAuthenticated, userDetails } = useAppSelector((state) => state.auth)

  // Sync theme on mount — read saved preference and apply to all roots
  useEffect(() => {
    const saved = localStorage.getItem("arcus-theme")
    const shouldBeDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDark(shouldBeDark)
    propagateDarkClass(shouldBeDark)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = !isDark
    setIsDark(next)
    propagateDarkClass(next)
    localStorage.setItem("arcus-theme", next ? "dark" : "light")
  }, [isDark])

  // Check if user is applicant
  const isApplicant = user?.role?.toLowerCase() === 'applicant'

  const handleCurrencyToggle = (newCurrency: "USD" | "ZIG") => {
    dispatch(setCurrency(newCurrency))
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await dispatch(logoutUser()).unwrap()
      toast.success("Logged out successfully!")
      window.location.href = '/login'
    } catch (error) {
      toast.error("Logout failed. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getUserInitials = () => {
    if (!user) return "U"
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <TooltipProvider>
      <>
      <header data-arcus-shared-topbar className="h-20 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-full px-6">
          {/* Left Section - spacer */}
          <div className="flex items-center gap-4">
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <CiSearch size={30} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                 placeholder="Search here..."
                className="pl-14 h-12 bg-background/50 border-border/50 focus:bg-background text-base"
              />
            </div>
          </div>

          {/* Right Section - Actions and Profile */}
          <div className="flex items-center gap-3">
            {moduleActions}

            {/* Theme Toggle — matches investments-v2 ThemeToggle */}
            {!hideThemeToggle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all hover:bg-accent hover:text-accent-foreground"
                    style={{
                      background: 'var(--secondary)',
                      color: 'var(--muted-foreground)',
                    }}
                    title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    aria-pressed={!isDark}
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Company Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-1 px-2 text-xs font-medium">
                  Matanho Capital
                  <CiCircleChevDown size={14} className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {}}>Matanho Capital</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Matanho Holdings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Matanho Advisory</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* App Switcher with Active Module - Hidden for applicants */}
            {!isApplicant && (
              <ModuleSwitcherButton
                currentModule={currentModule}
                onClick={() => appSwitcher?.openSwitcher() ?? window.__openArcusAppSwitcher?.()}
              />
            )}

            {/* Notifications */}
            {!isApplicant && <NotificationsBell />}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="p-2 h-auto cursor-pointer flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-base">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-base">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user ? `${user.firstName} ${user.lastName}` : "User"}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {userDetails?.roleCode || userDetails?.role?.name || 'User'}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <CiUser size={30} className="mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CiSettings size={30} className="mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CiCircleInfo size={30} className="mr-2" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <CiLogout size={30} className="mr-2" />
                      Sign Out
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      </>
    </TooltipProvider>
  )
}
