"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CiMail, CiUser, CiCircleInfo } from "react-icons/ci"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface UserAvatarDropdownProps {
  user: User
  onClick?: (e: React.MouseEvent) => void
}

export function UserAvatarDropdown({ user, onClick }: UserAvatarDropdownProps) {
  const [open, setOpen] = useState(false)

  const getInitials = () => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(e)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild onClick={handleClick}>
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500">
            <AvatarFallback className="bg-transparent text-white text-xs font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate max-w-[150px]">
            {user.firstName} {user.lastName}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">User Details</p>
            <p className="text-xs leading-none text-muted-foreground">Organizer Information</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-default focus:bg-transparent">
          <div className="flex items-start gap-3 w-full">
            <CiUser className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">Full Name</span>
              <span className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-default focus:bg-transparent">
          <div className="flex items-start gap-3 w-full">
            <CiMail className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">Email Address</span>
              <span className="text-sm break-all">{user.email}</span>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-default focus:bg-transparent">
          <div className="flex items-start gap-3 w-full">
            <CiCircleInfo className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">User ID</span>
              <span className="text-xs font-mono text-muted-foreground truncate">{user.id}</span>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
