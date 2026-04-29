"use client"

import { useState, useRef, useCallback } from "react"
import { useAppDispatch } from "@/lib/store"
import { uploadTaskAttachments } from "@/lib/store/slices/performanceTasksSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Upload,
  Download,
  Loader2,
  Paperclip,
  FileText,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  TaskAttachment,
  getAttachmentUrl,
  getAttachmentSize,
} from "@/lib/api/performance-tasks-api"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Props {
  taskId: string
  attachments: TaskAttachment[]
  onPreview: (docs: any[], idx: number) => void
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024

export function TaskAttachmentsPanel({ taskId, attachments, onPreview }: Props) {
  const dispatch = useAppDispatch()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files)
      const tooLarge = fileArr.find((f) => f.size > MAX_SIZE_BYTES)
      if (tooLarge) {
        toast.error(`${tooLarge.name} exceeds 5MB limit`)
        return
      }
      setUploading(true)
      try {
        await dispatch(
          uploadTaskAttachments({ id: taskId, files: fileArr })
        ).unwrap()
        toast.success(`Uploaded ${fileArr.length} file(s)`)
      } catch (e: any) {
        toast.error(e?.message || "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [taskId, dispatch]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUpload(e.target.files)
              e.target.value = ""
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">Max 5MB per file</p>
            </>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="space-y-1">
            {attachments.map((a, i) => {
              const url = getAttachmentUrl(a)
              const size = getAttachmentSize(a)
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{a.fileName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        {size !== undefined && (
                          <span>{(size / 1024).toFixed(0)} KB</span>
                        )}
                        {a.uploadedAt && (
                          <span>{format(new Date(a.uploadedAt), "MMM d, HH:mm")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onPreview(attachments, i)}
                      className="h-8 w-8 p-0"
                      title="View"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </Button>
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer" download>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded p-2 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Attachments persist after page reload and are stored in
            /artifacts/{`{appId}`}/public/data/attachments
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
