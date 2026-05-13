"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  CiCirclePlus, 
  CiCalendar,
  CiUser,
  CiPaperplane,
  CiMail
} from "react-icons/ci"

import { newslettersApi, type Newsletter, type NewsletterRecipientUser } from "@/lib/api/newsletters-api"
import { useAppSelector } from "@/lib/store"
import { Pencil, Trash2, Users, Plus, X, Search, Loader2, Mail } from "lucide-react"
import { NewsletterForm, type NewsletterFormValues } from "./newsletter-form"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

type ActiveTab = "newsletters" | "recipients"

// Roles permitted to manage the newsletter recipients list (toggle members in/out).
// Permissions for this feature are hard-coded in the frontend, so add a role here
// to grant it the recipients-management switch.
const NEWSLETTER_MANAGER_ROLES = new Set<string>([
  "CFO",
  "CEO",
  "BOARD_CHAIR",
  "HR_MGR",
  "IT_MGR",
])

export function NewsletterTab() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newsletterData, setNewsletterData] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Newsletter | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAppSelector((s) => s.auth)
  const { roleCode } = useRolePermissions()
  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin"
  const canManageRecipients = isAdmin || (!!roleCode && NEWSLETTER_MANAGER_ROLES.has(roleCode))

  // Recipients state
  const [activeTab, setActiveTab] = useState<ActiveTab>("newsletters")
  const [recipientUsers, setRecipientUsers] = useState<NewsletterRecipientUser[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [recipientsSaving, setRecipientsSaving] = useState(false)
  const [excludedUserIds, setExcludedUserIds] = useState<Set<string>>(new Set())
  const [includedEmails, setIncludedEmails] = useState<string[]>([])
  const [excludedEmails, setExcludedEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [recipientSearch, setRecipientSearch] = useState("")

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

  // Load recipients when tab changes
  useEffect(() => {
    if (activeTab === "recipients") {
      loadRecipients()
    }
  }, [activeTab])

  const loadRecipients = async () => {
    setRecipientsLoading(true)
    try {
      const res = await newslettersApi.getRecipientsConfig()
      const data = res.data || (res as any)
      const users = data?.users || []
      const config = data?.config || {}
      setRecipientUsers(users)
      setExcludedUserIds(new Set(config.excludeUserIds || []))
      setIncludedEmails(config.includeEmails || [])
      setExcludedEmails(config.excludeEmails || [])
    } catch (e) {
      toast.error("Failed to load recipients configuration")
    } finally {
      setRecipientsLoading(false)
    }
  }

  const canManage = (n: Newsletter) => n.author?.email?.toLowerCase?.() === user?.email?.toLowerCase?.()

  const handleSubmit = async (values: NewsletterFormValues) => {
    try {
      if (editing) {
        const res = await newslettersApi.update(editing.id, {
          title: values.title,
          content: values.content,
          image: values.imageFile ?? null,
          imageUrl: values.imageFile ? undefined : (values.imageUrl ?? null),
        })
        if (res.success && res.data) {
          setNewsletterData(prev => prev.map(n => n.id === editing.id ? (res.data as any) : n))
          toast.success('Newsletter updated successfully')
        }
        setEditing(null)
      } else {
        const res = await newslettersApi.create({
          title: values.title,
          content: values.content,
          image: values.imageFile ?? null,
        })
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

  // Recipients handlers
  const toggleUserExclusion = (userId: string) => {
    setExcludedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const addIncludeEmail = () => {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }
    if (includedEmails.includes(email)) {
      toast.error("Email already added")
      return
    }
    setIncludedEmails(prev => [...prev, email])
    setNewEmail("")
  }

  const removeIncludeEmail = (email: string) => {
    setIncludedEmails(prev => prev.filter(e => e !== email))
  }

  const saveRecipientsConfig = async () => {
    setRecipientsSaving(true)
    try {
      // Include all non-excluded user IDs
      const includeUserIds = recipientUsers
        .filter(u => !excludedUserIds.has(u.id))
        .map(u => u.id)

      await newslettersApi.updateRecipientsConfig({
        includeUserIds,
        excludeUserIds: Array.from(excludedUserIds),
        includeEmails: includedEmails,
        excludeEmails: excludedEmails,
      })
      toast.success("Recipients configuration saved")
    } catch (e) {
      toast.error("Failed to save recipients configuration")
    } finally {
      setRecipientsSaving(false)
    }
  }

  const filteredRecipientUsers = recipientUsers.filter(u => {
    if (!recipientSearch) return true
    const search = recipientSearch.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(search) ||
      u.lastName.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.roleName.toLowerCase().includes(search)
    )
  })

  const activeRecipientCount = recipientUsers.filter(u => !excludedUserIds.has(u.id)).length + includedEmails.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-gray-200 rounded-xl p-6 mt-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-normal text-xl">
              <CiMail className="w-5 h-5" />
              Newsletter Management
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => { setEditing(null); setIsModalOpen(true) }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-6 py-2"
              >
                <CiCirclePlus className="w-4 h-4" />
                Create New Newsletter
              </Button>
            </div>
          </div>
        </CardHeader>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("newsletters")}
            className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
              activeTab === "newsletters"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CiMail className="w-4 h-4" />
            Newsletters
          </button>
          {canManageRecipients && (
            <button
              onClick={() => setActiveTab("recipients")}
              className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
                activeTab === "recipients"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Manage Recipients
              <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-700">
                {activeRecipientCount}
              </Badge>
            </button>
          )}
        </nav>
      </div>

      {/* Newsletters Tab */}
      {activeTab === "newsletters" && (
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
      )}

      {/* Recipients Tab */}
      {activeTab === "recipients" && canManageRecipients && (
        <div className="space-y-6">
          {/* Recipients Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl text-gray-900">Newsletter Recipients</h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage who receives newsletter emails. Toggle users on or off, or add external email addresses.
              </p>
            </div>
            <Button
              onClick={saveRecipientsConfig}
              disabled={recipientsSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-6"
            >
              {recipientsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CiPaperplane className="w-4 h-4" />}
              {recipientsSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {recipientsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                    <div className="h-3 w-56 bg-gray-200 rounded" />
                  </div>
                  <div className="w-10 h-5 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email or role..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>

              {/* User List */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    System Users ({filteredRecipientUsers.length})
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    {recipientUsers.filter(u => !excludedUserIds.has(u.id)).length} active
                  </Badge>
                </div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {filteredRecipientUsers.map((u) => {
                    const isExcluded = excludedUserIds.has(u.id)
                    return (
                      <div
                        key={u.id}
                        className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                          isExcluded ? "bg-gray-50/50 opacity-60" : "hover:bg-blue-50/30"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 truncate">{u.email}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200">
                              {u.roleName}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={!isExcluded}
                          onCheckedChange={() => toggleUserExclusion(u.id)}
                        />
                      </div>
                    )
                  })}
                  {filteredRecipientUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No users match your search
                    </div>
                  )}
                </div>
              </div>

              {/* External Emails */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Additional Email Recipients ({includedEmails.length})
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add external email address..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addIncludeEmail()}
                      className="rounded-full flex-1"
                    />
                    <Button
                      onClick={addIncludeEmail}
                      size="sm"
                      className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {includedEmails.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {includedEmails.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 flex items-center gap-1.5"
                        >
                          <Mail className="w-3 h-3" />
                          {email}
                          <button
                            onClick={() => removeIncludeEmail(email)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">
                      No additional email recipients added
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

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
