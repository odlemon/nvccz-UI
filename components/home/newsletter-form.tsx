"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

export interface NewsletterFormValues {
  title: string
  content: string
  imageFile?: File | null
  imageUrl?: string | null
}

interface NewsletterFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: NewsletterFormValues) => Promise<void> | void
  mode?: 'create' | 'edit'
  initialValues?: Partial<Pick<NewsletterFormValues, 'title' | 'content' | 'imageUrl'>>
}

export function NewsletterForm({ open, onClose, onSubmit, mode = 'create', initialValues }: NewsletterFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const fileInputId = "newsletter-image-input"

  useEffect(() => {
    if (open && initialValues) {
      if (typeof initialValues.title === 'string') setTitle(initialValues.title)
      if (typeof initialValues.content === 'string') setContent(initialValues.content)
      if (typeof initialValues.imageUrl === 'string') {
        setExistingImageUrl(initialValues.imageUrl)
        setImagePreview(initialValues.imageUrl)
      }
    }
    if (!open) {
      if (imagePreview && imageFile) {
        URL.revokeObjectURL(imagePreview)
      }
      if (mode === 'create') {
        setTitle("")
        setContent("")
      }
      setImageFile(null)
      setImagePreview("")
      setExistingImageUrl("")
    }
  }, [open])

  const handleFileChange = (file: File | null) => {
    if (imagePreview && imageFile) {
      URL.revokeObjectURL(imagePreview)
    }
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImageFile(null)
      setImagePreview(existingImageUrl)
    }
  }

  const handleRemoveImage = () => {
    if (imagePreview && imageFile) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview("")
    setExistingImageUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        title,
        content,
        imageFile,
        imageUrl: imageFile ? null : (existingImageUrl || null),
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => !submitting && onClose()}>
      <DialogContent className="max-w-3xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">{mode === 'edit' ? 'Edit Newsletter' : 'Create Newsletter'}</DialogTitle>
          <DialogDescription className="text-gray-600">
            Share important updates with your organisation. Rich formatting supported.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Newsletter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={fileInputId}>Image (optional)</Label>
            <div className="flex items-center gap-2">
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={submitting}
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </Button>
              {imagePreview ? (
                <Button type="button" variant="ghost" className="rounded-full" onClick={handleRemoveImage} disabled={submitting}>
                  Remove
                </Button>
              ) : null}
              {imageFile ? (
                <span className="text-xs text-gray-500 truncate max-w-[240px]">{imageFile.name}</span>
              ) : null}
            </div>
            {imagePreview ? (
              <div className="mt-2">
                <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-lg object-cover border" />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Write your newsletter..." />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => !submitting && onClose()} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={submitting || !title || !content}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Create Newsletter'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewsletterForm


