"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { useMemo } from "react"
import { useRouter } from "next/navigation"

interface AppSwitcherProps {
  isOpen: boolean
  onClose: () => void
  onModuleSelect: (module: string) => void
  currentModule: string
}

export function AppSwitcher({ isOpen, onClose, onModuleSelect, currentModule }: AppSwitcherProps) {
  const router = useRouter()
  const { hasModuleAccess, isLoading, isAuthenticated } = useRolePermissions()

  const modulesToDisplay = useMemo(() => {
    if (!isAuthenticated || isLoading) {
      return []
    }

    return MODULE_CONFIG.filter((module) => hasModuleAccess(module.id))
  }, [isAuthenticated, isLoading, hasModuleAccess])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="w-[80vw] max-w-9xl" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">Select Module</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-muted/60 hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-foreground/70" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-8 p-8">
          {isLoading && (
            <div className="col-span-full py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && modulesToDisplay.map((module) => {
            const Icon = module.icon
            const isActive = currentModule === module.id

            return (
              <Button
                key={module.id}
                variant="ghost"
                className={`h-auto p-6 flex flex-col items-center gap-5 hover:bg-accent transition-all duration-200 ${isActive ? "bg-accent border-2 border-primary shadow-lg" : ""
                  }`}
                onClick={() => {
                  window.location.href = module.path
                  onModuleSelect(module.id)
                }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: module.color }}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg leading-tight text-foreground/90 whitespace-normal text-center">
                    {module.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {module.description}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}