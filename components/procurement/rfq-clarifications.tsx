'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { getRFQClarifications, postRFQClarification } from '@/lib/store/slices/procurementV2Slice'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageSquare, Send, Paperclip, ShieldCheck, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { RFQClarification } from '@/lib/api/procurement-api-v2'

interface RFQClarificationsProps {
  rfqId: string
}

const getInitials = (name?: string) => {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const getAuthorName = (c: RFQClarification): string => {
  if (c.authorType === 'STAFF') {
    const fn = c.user?.firstName || ''
    const ln = c.user?.lastName || ''
    const combined = `${fn} ${ln}`.trim()
    return combined || 'Procurement Staff'
  }
  return c.vendor?.name || 'Vendor'
}

export function RFQClarifications({ rfqId }: RFQClarificationsProps) {
  const dispatch = useAppDispatch()
  const { rfqClarifications } = useAppSelector((state) => state.procurementV2)
  const [loading, setLoading] = useState(false)
  const [staffMessage, setStaffMessage] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    setLoading(true)
    dispatch(getRFQClarifications(rfqId)).finally(() => setLoading(false))
  }, [rfqId, dispatch])

  // Display oldest-first so the thread reads chronologically.
  const orderedMessages = useMemo(() => {
    if (!rfqClarifications || rfqClarifications.length === 0) return []
    return [...rfqClarifications].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [rfqClarifications])

  const handlePost = async () => {
    if (!staffMessage.trim()) {
      toast.error('Please enter a clarification message')
      return
    }
    setPosting(true)
    try {
      await dispatch(
        postRFQClarification({
          rfqId,
          body: staffMessage.trim(),
        })
      ).unwrap()

      setStaffMessage('')
      toast.success('Clarification posted to all invited vendors')
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to post clarification'
      toast.error('Failed to post clarification', { description })
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Compose new clarification */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-normal flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Post a Clarification
          </CardTitle>
          <p className="text-xs text-gray-500">Your message will be emailed to all invited vendors.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Type a clarification or instruction for vendors..."
            value={staffMessage}
            onChange={(e) => setStaffMessage(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handlePost()
              }
            }}
            className="min-h-[80px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Tip: ⌘/Ctrl + Enter to send</span>
            <Button
              onClick={handlePost}
              disabled={posting || !staffMessage.trim()}
              className="gap-2"
            >
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Post
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} />
            Clarifications {orderedMessages.length > 0 && `(${orderedMessages.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orderedMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No clarifications yet</p>
              <p className="text-xs text-gray-400 mt-1">Post the first message above to start a thread with vendors.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedMessages.map((c) => {
                const isStaff = c.authorType === 'STAFF'
                const authorName = getAuthorName(c)
                return (
                  <div
                    key={c.id}
                    className={`flex gap-3 ${isStaff ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback
                        className={`text-xs font-semibold text-white ${isStaff ? 'bg-blue-600' : 'bg-emerald-600'}`}
                      >
                        {getInitials(authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[85%] ${isStaff ? 'flex flex-col items-end' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{authorName}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] gap-1 ${isStaff ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
                        >
                          {isStaff ? <ShieldCheck className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {isStaff ? 'Staff' : 'Vendor'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(c.createdAt), 'MMM d, yyyy · HH:mm')}
                        </span>
                      </div>
                      <div
                        className={`inline-block rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                          isStaff
                            ? 'bg-blue-50 text-blue-900 border border-blue-100'
                            : 'bg-gray-50 text-gray-800 border border-gray-100'
                        }`}
                      >
                        {c.body}
                      </div>
                      {c.attachmentUrl && (
                        <a
                          href={c.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          Attachment
                        </a>
                      )}
                      {isStaff && typeof c.emailsSent === 'number' && c.emailsSent > 0 && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Emailed to {c.emailsSent} vendor{c.emailsSent === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
