"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Loader2 } from "lucide-react"

export interface PostFormValues {
  title: string
  content: string
}

interface PostFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: PostFormValues) => Promise<void> | void
  mode?: 'create' | 'edit'
  initialValues?: Partial<PostFormValues>
}

export function PostForm({ open, onClose, onSubmit, mode = 'create', initialValues }: PostFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'write' | 'preview'>("write")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ title, content })
      setTitle("")
      setContent("")
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) onClose()
  }

  // Seed form when opening in edit mode
  React.useEffect(() => {
    if (open && initialValues) {
      if (typeof initialValues.title === 'string') setTitle(initialValues.title)
      if (typeof initialValues.content === 'string') setContent(initialValues.content)
    }
    if (!open && mode === 'create') {
      // reset only for create flow when dialog closes
      setTitle("")
      setContent("")
      setTab('write')
    }
  }, [open])

  const applyWrap = (before: string, after: string = before) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement | null
    if (!textarea) return
    const start = textarea.selectionStart ?? 0
    const end = textarea.selectionEnd ?? 0
    const selected = content.substring(start, end)
    const newValue = content.substring(0, start) + before + selected + after + content.substring(end)
    setContent(newValue)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const renderPreview = () => {
    return (
      <div className="prose max-w-none whitespace-pre-wrap text-sm text-gray-800 border rounded-lg p-4 bg-white">
        {content}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">{mode === 'edit' ? 'Edit Post' : 'Create Post'}</DialogTitle>
          <DialogDescription className="text-gray-600">
            Share an update with your organisation. You can use rich formatting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Write your post..." />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={submitting || !title || !content}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Create Post'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


