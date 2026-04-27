"use client"

import { useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { fetchEventGuests } from "@/lib/store/slices/eventsSlice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, FileText, Download, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { eventsApi } from "@/lib/api/events-api"

interface BulkUploadGuestsDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
}

export function BulkUploadGuestsDialog({ isOpen, onClose, eventId }: BulkUploadGuestsDialogProps) {
  const dispatch = useAppDispatch()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null)

  const reset = () => {
    setFile(null)
    setText("")
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
    setDownloading(format)
    try {
      const blob = await eventsApi.downloadBulkUploadTemplate(format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `event-guests-template.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error("Failed to download template", { description: err.message || "Please try again" })
    } finally {
      setDownloading(null)
    }
  }

  const handleUpload = async (mode: "file" | "text") => {
    if (mode === "file" && !file) {
      toast.error("Please choose a CSV or XLSX file")
      return
    }
    if (mode === "text" && !text.trim()) {
      toast.error("Please paste guest rows")
      return
    }

    setSubmitting(true)
    try {
      const res = await eventsApi.bulkUploadGuests(
        eventId,
        mode === "file" ? { file: file! } : { text }
      )
      if (res.success) {
        toast.success("Guests uploaded successfully", {
          description: `${res.data?.length ?? 0} guests created — invitations sent`,
        })
        await dispatch(fetchEventGuests({ eventId }))
        reset()
        onClose()
      } else {
        throw new Error(res.message || "Upload failed")
      }
    } catch (err: any) {
      toast.error("Bulk upload failed", { description: err.message || "Please try again" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Guests</DialogTitle>
          <DialogDescription>
            Add many guests at once via CSV/XLSX file or pasted text. Each guest receives an invitation email with a unique RSVP link.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadTemplate("xlsx")}
            disabled={downloading !== null}
            className="rounded-full gap-2"
          >
            {downloading === "xlsx" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            Download XLSX template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadTemplate("csv")}
            disabled={downloading !== null}
            className="rounded-full gap-2"
          >
            {downloading === "csv" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download CSV template
          </Button>
        </div>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="file">Upload file</TabsTrigger>
            <TabsTrigger value="text">Paste text</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-3">
            <Label htmlFor="bulk-file">CSV or XLSX file</Label>
            <label
              htmlFor="bulk-file"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-gray-700">
                {file ? file.name : "Click to choose a file"}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Expected columns: name, email, phone (company/title optional)
              </span>
              <input
                id="bulk-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={submitting} className="rounded-full">
                Cancel
              </Button>
              <Button
                onClick={() => handleUpload("file")}
                disabled={submitting || !file}
                className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="text" className="space-y-3">
            <Label htmlFor="bulk-text">Paste guest rows</Label>
            <Textarea
              id="bulk-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={"John Doe, john@example.com, +263771234567\nJane Smith, jane@example.com, +263772345678"}
              className="font-mono text-sm rounded-xl"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="w-3 h-3" />
              One guest per line as <code className="bg-muted px-1 rounded">name, email, phone</code>
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={submitting} className="rounded-full">
                Cancel
              </Button>
              <Button
                onClick={() => handleUpload("text")}
                disabled={submitting || !text.trim()}
                className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
