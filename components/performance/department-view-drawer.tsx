"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Building2, FileText } from "lucide-react"

interface DepartmentViewDrawerProps {
  department: { name: string; description: string } | null
  isOpen: boolean
  onClose: () => void
}

export function DepartmentViewDrawer({ 
  department, 
  isOpen, 
  onClose 
}: DepartmentViewDrawerProps) {
  if (!department) return null

  const getDepartmentIcon = (name: string) => {
    const icons: Record<string, any> = {
      'Finance': '💰',
      'Sales': '📈',
      'Operations': '⚙️',
      'Procurement': '🛒',
      'Human Resources': '👥',
      'Marketing': '📣',
      'Legal': '⚖️',
      'IT': '💻'
    }
    return icons[name] || '🏢'
  }

  const getDepartmentColor = (name: string) => {
    const colors: Record<string, string> = {
      'Finance': 'from-green-500 to-emerald-600',
      'Sales': 'from-blue-500 to-cyan-600',
      'Operations': 'from-purple-500 to-violet-600',
      'Procurement': 'from-orange-500 to-amber-600',
      'Human Resources': 'from-pink-500 to-rose-600',
      'Marketing': 'from-yellow-500 to-orange-500',
      'Legal': 'from-indigo-500 to-blue-600',
      'IT': 'from-teal-500 to-cyan-600'
    }
    return colors[name] || 'from-gray-500 to-gray-600'
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getDepartmentColor(department.name)} flex items-center justify-center text-2xl shadow-lg`}>
              {getDepartmentIcon(department.name)}
            </div>
            <span>{department.name}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Department Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Department Information</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
                <p className="text-sm text-gray-900 mt-1 font-medium">{department.name}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Description
                </label>
                <p className="text-sm text-gray-900 mt-1">{department.description}</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              This is a system department available for performance tracking and management.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
