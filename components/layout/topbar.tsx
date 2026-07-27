"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  CiGrid41,
  CiSettings,
  CiUser,
  CiLogout,
  CiCalendar,
  CiCircleInfo,
  CiCircleChevRight
} from "react-icons/ci"
import { AppSwitcherDropdown } from "./app-switcher-dropdown"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setCurrency } from "@/lib/store/slices/uiSlice"
import { logoutUser } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"

interface TopbarProps {
  onModuleSelect: (module: string) => void
  currentModule: string
}

export function Topbar({ onModuleSelect, currentModule }: TopbarProps) {
  const [showAppSwitcher, setShowAppSwitcher] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const dispatch = useAppDispatch()
  const currency = useAppSelector((state) => state.ui.currency)
  const { user, userDetails } = useAppSelector((state) => state.auth)

  const handleCurrencyToggle = (newCurrency: "USD" | "ZIG") => {
    dispatch(setCurrency(newCurrency))
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await dispatch(logoutUser()).unwrap()
      toast.success("Logged out successfully!")
      // Redirect to login page after successful logout
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
      <header className="h-20 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-full px-6">
          {/* Left Section - Logo and Breadcrumb */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.location.href = '/'}
            >
              <img src="/new_logo.jpeg" height={40} width={140} alt="Matanho" className="h-10 w-auto object-contain" />
            </div>

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

            {/* App Switcher with Active Module */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => setShowAppSwitcher(true)}
                  className="flex items-center gap-2 px-2 py-2 rounded-full cursor-pointer transition-colors group hover:primary-200 bg-accent"
                  style={{
                    backgroundColor: 'oklch(0.60 0.18 252)20'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'oklch(0.60 0.18 252)30'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'oklch(0.60 0.18 252)20'
                  }}
                >
                  <div className="w-8 h-8 rounded-full  dark:bg-gray-800  dark:border-gray-700 flex items-center justify-center">
                    <CiGrid41 size={20} style={{ color: 'oklch(0.60 0.18 252)' }} />
                  </div>
                  {currentModule !== "homepage" && (
                    <span className="text-sm text-muted-foreground capitalize group-hover:text-gray-500  dark:group-hover:text-gray-400">
                      {currentModule.replace("-", " ")}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch Applications</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <NotificationsBell />

            {/* Calendar */}
            {/* <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 cursor-pointer h-12 w-12 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                <CiCalendar size={30} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Calendar</p>
            </TooltipContent>
          </Tooltip> */}

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
                    <span className="text-xs text-muted-foreground">
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

      <AppSwitcherDropdown
        isOpen={showAppSwitcher}
        onClose={() => setShowAppSwitcher(false)}
        onModuleSelect={(module) => {
          onModuleSelect(module)
          setShowAppSwitcher(false)
        }}
        currentModule={currentModule}
      />
      </>
    </TooltipProvider>
  )
}
