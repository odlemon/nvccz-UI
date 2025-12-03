"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  CiCirclePlus, 
  CiCalendar,
  CiUser,
  CiPaperplane,
  CiMail
} from "react-icons/ci"

import { newslettersApi, type Newsletter } from "@/lib/api/newsletters-api"
import { useAppSelector } from "@/lib/store"
import { Pencil, Trash2 } from "lucide-react"
import { NewsletterForm, type NewsletterFormValues } from "./newsletter-form"

export function NewsletterTab() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newsletterData, setNewsletterData] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Newsletter | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAppSelector((s) => s.auth)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await newslettersApi.getAll()
        setNewsletterData(res.data || [])
      } catch (e) {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const canManage = (n: Newsletter) => n.author?.email?.toLowerCase?.() === user?.email?.toLowerCase?.()

  const handleSubmit = async (values: NewsletterFormValues) => {
    try {
      if (editing) {
        const res = await newslettersApi.update(editing.id, { title: values.title, content: values.content, imageUrl: values.imageUrl ?? null })
        if (res.success && res.data) {
          setNewsletterData(prev => prev.map(n => n.id === editing.id ? (res.data as any) : n))
          toast.success('Newsletter updated successfully')
        }
        setEditing(null)
      } else {
        const res = await newslettersApi.create({ title: values.title, content: values.content, imageUrl: values.imageUrl ?? null })
        if (res.success && res.data) {
          setNewsletterData(prev => [res.data as any, ...prev])
          toast.success('Newsletter created successfully')
        }
      }
      setIsModalOpen(false)
    } catch (e) {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async (n: Newsletter) => {
    try {
      const res = await newslettersApi.delete(n.id)
      if (res.success) {
        setNewsletterData(prev => prev.filter(x => x.id !== n.id))
        toast.success('Newsletter deleted')
      }
    } catch (e) {
      toast.error('Delete failed')
    }
  }

  // Like/share UI removed for API-backed newsletters

  return (
    <div className="space-y-6">
      {/* Create Newsletter Section */}
      <div className="border border-gray-200 rounded-xl p-6 mt-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-normal text-xl">
              <CiMail className="w-5 h-5" />
              Newsletter Management
            </div>
            <Button 
              onClick={() => { setEditing(null); setIsModalOpen(true) }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-6 py-2"
            >
              <CiCirclePlus className="w-4 h-4" />
              Create New Newsletter
            </Button>
          </div>
        </CardHeader>
      </div>

      {/* Newsletter List */}
      <div className="space-y-4">
        <h3 className="text-xl text-gray-900">Recent Newsletters</h3>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="transition-all duration-300 border rounded-xl border-gray-200">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="space-y-2">
                        <div className="w-full h-3 bg-gray-200 rounded animate-pulse" />
                        <div className="w-11/12 h-3 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
        ) : newsletterData.map((newsletter, index) => (
          <motion.div
            key={newsletter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="transition-all duration-300 border rounded-xl border-gray-200">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {newsletter.imageUrl ? (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-200 to-indigo-200 flex-shrink-0">
                      <img
                        src={newsletter.imageUrl}
                        alt={newsletter.title}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-lg text-gray-900 mb-2">
                        {newsletter.title}
                      </h4>
                      <div className="prose max-w-none text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: newsletter.content }} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CiUser className="w-4 h-4" />
                          {newsletter.author?.firstName} {newsletter.author?.lastName}
                        </div>
                        <div className="flex items-center gap-1">
                          <CiCalendar className="w-4 h-4" />
                          {new Date(newsletter.createdAt).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {canManage(newsletter) && (
                          <>
                            <button
                              onClick={() => { setEditing(newsletter); setIsModalOpen(true) }}
                              className="p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 border border-gray-200"
                              aria-label="Edit newsletter"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(newsletter)}
                              className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 border border-red-100"
                              aria-label="Delete newsletter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </motion.div>
        ))}
      </div>

      <NewsletterForm
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        mode={editing ? 'edit' : 'create'}
        initialValues={editing ? { title: editing.title, content: editing.content, imageUrl: editing.imageUrl || undefined } : undefined}
      />
    </div>
  )
}
