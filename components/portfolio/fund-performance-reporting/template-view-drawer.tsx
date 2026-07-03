"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReportTemplate } from "@/lib/api/fund-performance-reporting-api"
import { fmtDate } from "./format"

interface TemplateViewDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ReportTemplate | null
  onEdit: () => void
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}

export function TemplateViewDrawer({ open, onOpenChange, template, onEdit }: TemplateViewDrawerProps) {
  if (!template) return null
  const t = template

  const handleEdit = () => {
    onOpenChange(false)
    onEdit()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <SheetTitle className="flex items-center gap-2 flex-wrap">
              <span>{t.name}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full",
                  t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", t.isActive ? "bg-emerald-500" : "bg-gray-400")} />
                {t.isActive ? "Active" : "Inactive"}
              </span>
            </SheetTitle>
            <Button size="sm" className="rounded-full gradient-primary text-white h-8 shrink-0" onClick={handleEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Report Level" value={<Badge variant="outline">{t.reportLevel}</Badge>} />
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Description</p>
            <p className="text-sm text-gray-700">{t.description || "No description provided."}</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Section Config</p>
            {t.sectionConfig && t.sectionConfig.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {t.sectionConfig.map((section, i) => (
                  <Badge key={`${section}-${i}`} variant="secondary" className="font-normal">
                    {section}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sections configured.</p>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Metadata</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Created" value={fmtDate(t.createdAt)} />
              <InfoField label="Updated" value={fmtDate(t.updatedAt)} />
              <InfoField label="Created By ID" value={<span className="font-mono text-xs text-muted-foreground">{t.createdById ?? "—"}</span>} />
            </div>
            <InfoField label="Template ID" value={<span className="font-mono text-xs text-muted-foreground">{t.id}</span>} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
