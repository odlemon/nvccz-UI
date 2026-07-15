"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { fetchPortfolioFolders, createPortfolioFolder, type PortfolioFolder } from "@/lib/mock/portfolios-mock-data"
import { TerminalTopbar } from "@/components/investments/terminal/topbar"
import { TerminalCard } from "@/components/investments/terminal/card"
import { TerminalTable, TerminalThead, TerminalTr, TerminalTh, TerminalTd, TerminalEmptyRow } from "@/components/investments/terminal/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Folder as FolderIcon } from "lucide-react"
import { toast } from "sonner"

// Portfolio grouping/hierarchy config. No backend endpoint exists for this
// yet — data comes from lib/mock/portfolios-mock-data.ts, wrapped in
// createAsyncThunk so this screen is a drop-in once the real API lands.
export function FolderSetup() {
  const dispatch = useAppDispatch()
  const [folders, setFolders] = useState<PortfolioFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState<string>("none")
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    dispatch(fetchPortfolioFolders())
      .unwrap()
      .then(setFolders)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  const openAdd = () => {
    setName("")
    setDescription("")
    setParentId("none")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const folder = await dispatch(
        createPortfolioFolder({ name, description, parentId: parentId === "none" ? null : parentId }),
      ).unwrap()
      setFolders((prev) => [...prev, folder])
      toast.success(`Folder "${folder.name}" created`)
      setDialogOpen(false)
    } catch (err: any) {
      toast.error("Failed to create folder", { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <TerminalTopbar
        title="Folder Setup"
        subtitle="Group portfolios into folders for reporting and access control"
        actions={
          <Button size="pill" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> Add Folder
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding bodyClassName="overflow-x-auto">
          <TerminalTable>
            <TerminalThead>
              <TerminalTr>
                <TerminalTh>Folder</TerminalTh>
                <TerminalTh>Description</TerminalTh>
                <TerminalTh>Parent</TerminalTh>
                <TerminalTh align="right">Funds</TerminalTh>
              </TerminalTr>
            </TerminalThead>
            <tbody>
              {folders.map((f) => (
                <TerminalTr key={f.id}>
                  <TerminalTd>
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      <FolderIcon className="size-3.5 text-muted-foreground" />
                      {f.name}
                    </span>
                  </TerminalTd>
                  <TerminalTd className="text-muted-foreground">{f.description}</TerminalTd>
                  <TerminalTd className="text-muted-foreground">
                    {f.parentId ? folders.find((p) => p.id === f.parentId)?.name ?? "—" : "—"}
                  </TerminalTd>
                  <TerminalTd align="right" mono>{f.fundNames.length}</TerminalTd>
                </TerminalTr>
              ))}
              {folders.length === 0 && <TerminalEmptyRow colSpan={4}>No folders configured yet</TerminalEmptyRow>}
            </tbody>
          </TerminalTable>
        </TerminalCard>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alternatives" className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Parent Folder</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top level)</SelectItem>
                  {folders.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Saving…" : "Add Folder"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
