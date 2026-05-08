"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchThemes,
  createTheme,
  tagGoalsToTheme,
} from "@/lib/store/slices/performanceConfigSlice"
import { performanceConfigApi } from "@/lib/api/performance-config-api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  Plus,
  Loader2,
  Tag,
  Layers,
  X,
  Eye,
  Search,
  Filter,
  Target,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { extractApiError, responseMessageIfFailed } from "@/lib/utils/api-error"
import {
  SearchableGoalSelector,
  GoalOption,
} from "./searchable-goal-selector"

const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#0a7c86",
]

export function StrategicThemesManager() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const { themes } = useAppSelector((s) => s.performanceConfig)

  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [creating, setCreating] = useState(false)

  const [drawerThemeId, setDrawerThemeId] = useState<string | null>(null)
  const [drawerGoals, setDrawerGoals] = useState<any[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [goalsToTag, setGoalsToTag] = useState<GoalOption[]>([])
  const [tagging, setTagging] = useState(false)

  useEffect(() => {
    dispatch(fetchThemes())
  }, [dispatch])

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Theme name is required")
      return
    }
    setCreating(true)
    try {
      const result = await dispatch(
        createTheme({ name: name.trim(), description: desc.trim() || undefined, color })
      ).unwrap()
      // Server may return { success: false } without throwing — guard
      const failMsg = responseMessageIfFailed(result as any)
      if (failMsg) {
        toast.error(failMsg)
        return
      }
      toast.success("Theme created successfully")
      setName("")
      setDesc("")
      setColor(PRESET_COLORS[0])
      setCreateOpen(false)
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to create theme"))
    } finally {
      setCreating(false)
    }
  }

  const openDrawer = async (themeId: string) => {
    setDrawerThemeId(themeId)
    setDrawerLoading(true)
    setGoalsToTag([])
    try {
      const tagged = await performanceConfigApi.getThemeGoals(themeId)
      setDrawerGoals(tagged.data || [])
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to load theme goals"))
    } finally {
      setDrawerLoading(false)
    }
  }

  const handleTag = async () => {
    if (!drawerThemeId || goalsToTag.length === 0) return
    setTagging(true)
    try {
      const result = await dispatch(
        tagGoalsToTheme({
          themeId: drawerThemeId,
          goalIds: goalsToTag.map((g) => g.id),
        })
      ).unwrap()
      const failMsg = responseMessageIfFailed(result as any)
      if (failMsg) {
        toast.error(failMsg)
        return
      }
      toast.success(`Tagged ${goalsToTag.length} goal(s) to theme`)
      const tagged = await performanceConfigApi.getThemeGoals(drawerThemeId)
      setDrawerGoals(tagged.data || [])
      setGoalsToTag([])
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to tag goals"))
    } finally {
      setTagging(false)
    }
  }

  const filteredThemes = themes.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const taggedIds = drawerGoals.map((g) => g.id)
  const activeTheme = themes.find((t) => t.id === drawerThemeId)

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> Strategic Themes
            </h2>
            <p className="text-sm text-gray-500">
              Create themes to tag goals across pillars (e.g. Digitalization).
            </p>
          </div>
          {permissions.canManageStrategicThemes && (
            <Button
              onClick={() => setCreateOpen(true)}
              variant="gradient-create"
              className="rounded-full gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> New Theme
            </Button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search themes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
          <Badge variant="outline" className="text-xs">
            <Filter className="w-3 h-3 mr-1" /> {filteredThemes.length} theme
            {filteredThemes.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Themes grid */}
        <Card>
          <CardContent className="pt-6">
            {filteredThemes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {search
                    ? `No themes match "${search}"`
                    : "No themes yet. Create one to tag goals."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredThemes.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openDrawer(t.id)}
                    className="p-4 border rounded-xl cursor-pointer hover:shadow-md transition-all bg-white group"
                    style={{ borderLeftWidth: 4, borderLeftColor: t.color || "#3b82f6" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Tag
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: t.color || "#3b82f6" }}
                        />
                        <p className="font-medium truncate">{t.name}</p>
                      </div>
                      <Eye className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    {t.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                      {(t as any).status && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {(t as any).status}
                        </Badge>
                      )}
                      {(t as any).createdAt && (
                        <span>
                          {format(new Date((t as any).createdAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Theme Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Strategic Theme</DialogTitle>
            <DialogDescription>
              Themes can be applied to goals across all pillars.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digitalization"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c ? "border-gray-900 scale-110" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              variant="gradient-create"
              disabled={creating || !name.trim()}
              className="rounded-full"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Theme Detail Drawer */}
      <Sheet open={drawerThemeId !== null} onOpenChange={(o) => !o && setDrawerThemeId(null)}>
        <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-white border-b p-6 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {activeTheme && (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: activeTheme.color || "#3b82f6" }}
                  >
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold truncate">
                    {activeTheme?.name || "Theme"}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">
                    {activeTheme?.description || "Tag goals to this theme"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {permissions.canManageStrategicThemes && goalsToTag.length > 0 && (
                  <Button
                    onClick={handleTag}
                    variant="gradient"
                    disabled={tagging}
                    className="rounded-full"
                  >
                    {tagging ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Tag {goalsToTag.length}
                  </Button>
                )}
                <Button
                  size="icon"
                  onClick={() => setDrawerThemeId(null)}
                  variant="gradient-danger"
                  className="rounded-full h-10 w-10 shadow-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {drawerLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* Tag goals to this theme */}
                {permissions.canManageStrategicThemes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Tag Goals to This Theme
                      </CardTitle>
                      <CardDescription>
                        Search and select goals to tag. Search uses live data
                        from /performance/goals.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SearchableGoalSelector
                        selectedGoals={goalsToTag}
                        onChange={setGoalsToTag}
                        excludeGoalIds={taggedIds}
                        placeholder="Search goals to tag..."
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Already-tagged goals */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="w-4 h-4" /> Tagged Goals
                      </span>
                      <Badge variant="secondary">{drawerGoals.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {drawerGoals.length === 0 ? (
                      <p className="text-center text-sm text-gray-500 py-8">
                        No goals tagged yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {drawerGoals.map((g) => (
                          <div
                            key={g.id}
                            className="p-3 border rounded-lg flex items-start justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{g.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                                {g.scorecardPillar && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {g.scorecardPillar}
                                  </Badge>
                                )}
                                {g.type && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {g.type}
                                  </Badge>
                                )}
                                {g.status && (
                                  <span
                                    className={
                                      g.status === "active"
                                        ? "text-green-600"
                                        : "text-gray-500"
                                    }
                                  >
                                    {g.status}
                                  </span>
                                )}
                              </div>
                            </div>
                            {g.progressPercentage !== undefined && (
                              <Badge className="bg-blue-100 text-blue-800">
                                {g.progressPercentage}%
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
